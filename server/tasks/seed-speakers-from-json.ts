import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { speakers } from "../database/schema"
import { organization } from "../database/auth-schema"

const SpeakerSchema = z.object({
  id: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().min(1),
  congregation_id: z.string().min(1),
  archived: z.union([z.number(), z.boolean()]).transform(val => Boolean(val)),
  archived_at: z
    .union([z.number(), z.undefined(), z.null()])
    .transform(val => (val ? new Date(val * 1000) : null)),
  created_at: z.number().int().positive(), // Unix timestamp from JSON
  updated_at: z.number().int().positive(), // Unix timestamp from JSON
})

const SpeakersArraySchema = z.array(SpeakerSchema)

export default defineTask({
  meta: {
    name: "db:seed-speakers-from-json",
    description: "Seed visiting speakers from JSON file",
  },
  async run() {
    logger.info("Starting speakers seeding from JSON...")

    try {
      const dataPath = join(process.cwd(), "server", "tasks", "seed", "speakers.json")
      const data = await readFile(dataPath, "utf-8")
      const speakersList = JSON.parse(data)

      logger.info("Validating speaker data with Zod...")
      logger.info(`Found ${speakersList.length} speakers in JSON file`)
      const validatedSpeakers = SpeakersArraySchema.parse(speakersList)
      logger.info(`Validation passed for ${validatedSpeakers.length} speakers`)

      const db = useDrizzle()

      let seededCount = 0
      let skippedCount = 0
      const missingCongregations: Set<string> = new Set()

      for (const speaker of validatedSpeakers) {
        // Verify congregation exists
        const congregation = await db
          .select()
          .from(organization)
          .where(eq(organization.id, speaker.congregation_id))
          .then(rows => rows[0])

        if (!congregation) {
          logger.warn(
            `⚠️  Congregation not found for speaker ${speaker.first_name} ${speaker.last_name} (congregation ID: ${speaker.congregation_id})`
          )
          missingCongregations.add(speaker.congregation_id)
          skippedCount++
          continue
        }

        const existing = await db
          .select()
          .from(speakers)
          .where(eq(speakers.id, speaker.id))
          .then(rows => rows[0])

        if (!existing) {
          await db.insert(speakers).values({
            id: speaker.id,
            firstName: speaker.first_name,
            lastName: speaker.last_name,
            phone: speaker.phone,
            congregationId: speaker.congregation_id,
            archived: speaker.archived,
            archivedAt: speaker.archived_at,
            createdAt: new Date(speaker.created_at * 1000),
            updatedAt: new Date(speaker.updated_at * 1000),
          })
          logger.info(`✅ Seeded speaker: ${speaker.first_name} ${speaker.last_name}`)
          seededCount++
        } else {
          logger.info(`⏭️  Speaker already exists: ${speaker.first_name} ${speaker.last_name}`)
          skippedCount++
        }
      }

      logger.info("=".repeat(60))
      logger.info(`✅ Speakers seeding completed`)
      logger.info(`   - Seeded:  ${seededCount}`)
      logger.info(`   - Skipped: ${skippedCount}`)
      if (missingCongregations.size > 0) {
        logger.info(`   - Missing congregations: ${missingCongregations.size}`)
        logger.info(`     IDs: ${Array.from(missingCongregations).join(", ")}`)
      }
      logger.info("=".repeat(60))

      return {
        result: missingCongregations.size > 0 ? "partial_success" : "success",
        seededCount,
        skippedCount,
        missingCongregations: Array.from(missingCongregations),
      }
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const issues = error.issues || []
        logger.error("Validation errors", { issues })
        throw new Error(`Zod validation failed: ${issues.length} errors found`)
      }

      if (error instanceof SyntaxError) {
        logger.error("JSON parsing failed", { error })
        throw new Error("Invalid JSON in speakers.json file")
      }

      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        logger.error("File not found: server/tasks/seed/speakers.json")
        throw new Error(
          "speakers.json not found in server/tasks/seed/ directory - user should provide this file"
        )
      }

      logger.error("Unexpected error during seeding", { error })
      throw error
    }
  },
})
