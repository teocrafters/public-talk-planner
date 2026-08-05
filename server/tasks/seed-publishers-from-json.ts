import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { publishers } from "../database/schema"
import { organization } from "../database/auth-schema"

const PublisherSchema = z.object({
  id: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  sex: z.enum(["male", "female"]),
  user_id: z.string().nullable(),
  is_elder: z.union([z.number(), z.boolean()]).transform(val => Boolean(val)),
  is_ministerial_servant: z.union([z.number(), z.boolean()]).transform(val => Boolean(val)),
  is_regular_pioneer: z.union([z.number(), z.boolean()]).transform(val => Boolean(val)),
  can_chair_weekend_meeting: z.union([z.number(), z.boolean()]).transform(val => Boolean(val)),
  conducts_watchtower_study: z.union([z.number(), z.boolean()]).transform(val => Boolean(val)),
  backup_watchtower_conductor: z.union([z.number(), z.boolean()]).transform(val => Boolean(val)),
  is_reader: z.union([z.number(), z.boolean()]).transform(val => Boolean(val)),
  offers_public_prayer: z.union([z.number(), z.boolean()]).transform(val => Boolean(val)),
  delivers_public_talks: z.union([z.number(), z.boolean()]).transform(val => Boolean(val)),
  is_circuit_overseer: z.union([z.number(), z.boolean()]).transform(val => Boolean(val)),
  created_at: z.number().int().positive(), // Unix timestamp from JSON
  updated_at: z.number().int().positive(), // Unix timestamp from JSON
})

const PublishersArraySchema = z.array(PublisherSchema)

// AGENT-NOTE: Żychlin congregation ID from congregation.json
const ZYCHLIN_CONGREGATION_SLUG = "zychlin"

export default defineTask({
  meta: {
    name: "db:seed-publishers-from-json",
    description: "Seed publishers (Żychlin congregation members) from JSON file",
  },
  async run() {
    logger.info("Starting publishers seeding from JSON...")

    try {
      const dataPath = join(process.cwd(), "server", "tasks", "seed", "publishers.json")
      const data = await readFile(dataPath, "utf-8")
      const publishersList = JSON.parse(data)

      logger.info("Validating publisher data with Zod...")
      logger.info(`Found ${publishersList.length} publishers in JSON file`)
      const validatedPublishers = PublishersArraySchema.parse(publishersList)
      logger.info(`Validation passed for ${validatedPublishers.length} publishers`)

      const db = useDrizzle()

      // Verify Żychlin congregation exists (publishers belong to Żychlin)
      const zychlinCongregation = await db
        .select()
        .from(organization)
        .where(eq(organization.slug, ZYCHLIN_CONGREGATION_SLUG))
        .then(rows => rows[0])

      if (!zychlinCongregation) {
        throw new Error(
          `Żychlin congregation not found. Please run seed-congregations-from-json first.`
        )
      }

      logger.info(`✅ Found Żychlin congregation (ID: ${zychlinCongregation.id})`)

      let seededCount = 0
      let skippedCount = 0

      for (const publisher of validatedPublishers) {
        const existing = await db
          .select()
          .from(publishers)
          .where(eq(publishers.id, publisher.id))
          .then(rows => rows[0])

        if (!existing) {
          await db.insert(publishers).values({
            id: publisher.id,
            firstName: publisher.first_name,
            lastName: publisher.last_name,
            sex: publisher.sex,
            userId: publisher.user_id,
            isElder: publisher.is_elder,
            isMinisterialServant: publisher.is_ministerial_servant,
            isRegularPioneer: publisher.is_regular_pioneer,
            canChairWeekendMeeting: publisher.can_chair_weekend_meeting,
            conductsWatchtowerStudy: publisher.conducts_watchtower_study,
            backupWatchtowerConductor: publisher.backup_watchtower_conductor,
            isReader: publisher.is_reader,
            offersPublicPrayer: publisher.offers_public_prayer,
            deliversPublicTalks: publisher.delivers_public_talks,
            isCircuitOverseer: publisher.is_circuit_overseer,
            createdAt: new Date(publisher.created_at * 1000),
            updatedAt: new Date(publisher.updated_at * 1000),
          })
          logger.info(`✅ Seeded publisher: ${publisher.first_name} ${publisher.last_name}`)
          seededCount++
        } else {
          logger.info(
            `⏭️  Publisher already exists: ${publisher.first_name} ${publisher.last_name}`
          )
          skippedCount++
        }
      }

      logger.info("=".repeat(60))
      logger.info(`✅ Publishers seeding completed`)
      logger.info(`   - Seeded:  ${seededCount}`)
      logger.info(`   - Skipped: ${skippedCount}`)
      logger.info("=".repeat(60))

      return {
        result: "success",
        seededCount,
        skippedCount,
      }
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const issues = error.issues || []
        logger.error("Validation errors", { issues })
        throw new Error(`Zod validation failed: ${issues.length} errors found`)
      }

      if (error instanceof SyntaxError) {
        logger.error("JSON parsing failed", { error })
        throw new Error("Invalid JSON in publishers.json file")
      }

      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        logger.error("File not found: server/tasks/seed/publishers.json")
        throw new Error("publishers.json not found in server/tasks/seed/ directory")
      }

      logger.error("Unexpected error during seeding", { error })
      throw error
    }
  },
})
