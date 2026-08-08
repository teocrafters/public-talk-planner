import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { speakerTalks, speakers } from "../database/schema"

const SpeakerTalkSchema = z.object({
  id: z.number().int().positive().optional(), // Ignore id from JSON, let DB auto-increment
  speaker_id: z.string().min(1),
  talk_id: z.number().int().positive(),
  created_at: z.number().int().positive(), // Unix timestamp from JSON
})

const SpeakerTalksArraySchema = z.array(SpeakerTalkSchema)

export default defineTask({
  meta: {
    name: "db:seed-speaker-talks-from-json",
    description: "Seed speaker-to-talk relationships from JSON file",
  },
  async run() {
    logger.info("Starting speaker-talks seeding from JSON...")

    try {
      const dataPath = join(process.cwd(), "server", "tasks", "seed", "speaker_talks.json")
      const data = await readFile(dataPath, "utf-8")
      const speakerTalksList = JSON.parse(data)

      logger.info("Validating speaker-talk data with Zod...")
      logger.info(`Found ${speakerTalksList.length} speaker-talk relationships in JSON file`)
      const validatedSpeakerTalks = SpeakerTalksArraySchema.parse(speakerTalksList)
      logger.info(`Validation passed for ${validatedSpeakerTalks.length} relationships`)

      const db = useDrizzle()
      const talkIdsByLegacyId = await loadTalkIdsByLegacyId()

      let seededCount = 0
      let skippedCount = 0
      const missingSpeakers: Set<string> = new Set()
      const missingTalks: Set<number> = new Set()

      for (const speakerTalk of validatedSpeakerTalks) {
        // Verify speaker exists
        const speaker = await db
          .select()
          .from(speakers)
          .where(eq(speakers.id, speakerTalk.speaker_id))
          .then(rows => rows[0])

        if (!speaker) {
          missingSpeakers.add(speakerTalk.speaker_id)
          skippedCount++
          continue
        }

        // Verify talk exists
        const talkId = talkIdsByLegacyId.get(speakerTalk.talk_id)

        if (!talkId) {
          missingTalks.add(speakerTalk.talk_id)
          skippedCount++
          continue
        }

        // Check if relationship already exists (unique constraint on speakerId + talkId)
        const existing = await db
          .select()
          .from(speakerTalks)
          .where(
            and(
              eq(speakerTalks.speakerId, speakerTalk.speaker_id),
              eq(speakerTalks.talkId, talkId)
            )
          )
          .then(rows => rows[0])

        if (!existing) {
          await db.insert(speakerTalks).values({
            speakerId: speakerTalk.speaker_id,
            talkId,
            createdAt: new Date(speakerTalk.created_at * 1000),
          })
          seededCount++

          // Log every 100th relationship to avoid spam
          if (seededCount % 100 === 0) {
            logger.info(`✅ Seeded ${seededCount} relationships...`)
          }
        } else {
          skippedCount++
        }
      }

      logger.info("=".repeat(60))
      logger.info(`✅ Speaker-talks seeding completed`)
      logger.info(`   - Seeded:  ${seededCount}`)
      logger.info(`   - Skipped: ${skippedCount}`)
      if (missingSpeakers.size > 0) {
        logger.info(`   - Missing speakers: ${missingSpeakers.size}`)
        logger.info(`     Sample IDs: ${Array.from(missingSpeakers).slice(0, 5).join(", ")}`)
      }
      if (missingTalks.size > 0) {
        logger.info(`   - Missing talks: ${missingTalks.size}`)
        logger.info(`     Sample IDs: ${Array.from(missingTalks).slice(0, 5).join(", ")}`)
      }
      logger.info("=".repeat(60))

      return {
        result: missingSpeakers.size > 0 || missingTalks.size > 0 ? "partial_success" : "success",
        seededCount,
        skippedCount,
        missingSpeakers: Array.from(missingSpeakers),
        missingTalks: Array.from(missingTalks),
      }
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const issues = error.issues || []
        logger.error("Validation errors", { issues })
        throw new Error(`Zod validation failed: ${issues.length} errors found`)
      }

      if (error instanceof SyntaxError) {
        logger.error("JSON parsing failed", { error })
        throw new Error("Invalid JSON in speaker_talks.json file")
      }

      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        logger.error("File not found: server/tasks/seed/speaker_talks.json")
        throw new Error("speaker_talks.json not found in server/tasks/seed/ directory")
      }

      logger.error("Unexpected error during seeding", { error })
      throw error
    }
  },
})
