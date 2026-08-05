import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { speakers, speakerTalks, organization } from "../../database/schema"

const SpeakerSeedSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().regex(/^\d{9}$/),
  talkIds: z.array(z.number().int().positive()),
  archived: z.boolean(),
})

const SpeakersSeedArraySchema = z.array(SpeakerSeedSchema)

export default defineTask({
  meta: {
    name: "db:seed-speakers",
    description: "Seed test speakers with talk assignments",
  },
  async run() {
    logger.info("Starting speakers seeding...")

    try {
      const dataPath = join(process.cwd(), "server", "data", "speakers.json")
      const data = await readFile(dataPath, "utf-8")
      const speakersData = JSON.parse(data)

      logger.info("Validating speaker data with Zod...")
      logger.info(`Found ${speakersData.length} speakers in JSON file`)
      const validated = SpeakersSeedArraySchema.parse(speakersData)
      logger.info(`Validation passed for ${validated.length} speakers`)

      const db = useDrizzle()

      // Get the test organization ID
      logger.info("Finding test organization...")
      const testOrg = await db.query.organization.findFirst({
        where: eq(organization.slug, "zychlin"),
      })

      if (!testOrg) {
        throw new Error("Test organization not found. Run seed-test-accounts first.")
      }

      logger.info(`Using organization: ${testOrg.name} (${testOrg.id})`)

      // Clear existing speaker data
      logger.info("Deleting existing speakers and talk assignments...")
      await db.delete(speakerTalks)
      await db.delete(speakers)
      logger.info("Deleted existing speakers")

      // Verify talk IDs exist
      logger.info("Verifying talk IDs exist...")
      const talkIdsByLegacyId = await loadTalkIdsByLegacyId()
      const allTalkIds = new Set<number>()
      for (const speaker of validated) {
        speaker.talkIds.forEach(id => allTalkIds.add(id))
      }

      const missingTalkIds = Array.from(allTalkIds).filter(id => !talkIdsByLegacyId.has(id))

      if (missingTalkIds.length > 0) {
        logger.warn(`Warning: Some talk IDs don't exist: ${missingTalkIds.join(", ")}`)
        logger.warn("These talk assignments will be skipped")
      }

      // Insert speakers and their talk assignments
      logger.info(`Inserting ${validated.length} speakers...`)
      for (const speaker of validated) {
        await db.insert(speakers).values({
          id: speaker.id,
          firstName: speaker.firstName,
          lastName: speaker.lastName,
          phone: speaker.phone,
          congregationId: testOrg.id,
          archived: speaker.archived,
          archivedAt: speaker.archived ? new Date() : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        // Insert talk assignments
        if (speaker.talkIds.length > 0) {
          const validTalkIds = speaker.talkIds
            .map(legacyId => talkIdsByLegacyId.get(legacyId))
            .filter((talkId): talkId is string => talkId !== undefined)

          if (validTalkIds.length > 0) {
            const talkAssignments = validTalkIds.map(talkId => ({
              speakerId: speaker.id,
              talkId,
              createdAt: new Date(),
            }))

            await db.insert(speakerTalks).values(talkAssignments)
          }
        }

        logger.info(
          `✅ Seeded: ${speaker.firstName} ${speaker.lastName} (${speaker.talkIds.length} talks${speaker.archived ? ", archived" : ""})`
        )
      }

      logger.info(`✅ Seeded ${validated.length} speakers successfully`)

      return { result: "success", count: validated.length }
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
        logger.error("File not found: server/data/speakers.json")
        throw new Error("speakers.json not found in server/data/ directory")
      }

      logger.error("Unexpected error during seeding", { error })
      throw error
    }
  },
})
