import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { speakerTalks, speakers, publicTalks } from "../database/schema"

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
    console.log("Starting speaker-talks seeding from JSON...")

    try {
      const dataPath = join(process.cwd(), "server", "tasks", "seed", "speaker_talks.json")
      const data = await readFile(dataPath, "utf-8")
      const speakerTalksList = JSON.parse(data)

      console.log("Validating speaker-talk data with Zod...")
      console.log(`Found ${speakerTalksList.length} speaker-talk relationships in JSON file`)
      const validatedSpeakerTalks = SpeakerTalksArraySchema.parse(speakerTalksList)
      console.log(`Validation passed for ${validatedSpeakerTalks.length} relationships`)

      const db = useDrizzle()

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
          .get()

        if (!speaker) {
          missingSpeakers.add(speakerTalk.speaker_id)
          skippedCount++
          continue
        }

        // Verify talk exists
        const talk = await db
          .select()
          .from(publicTalks)
          .where(eq(publicTalks.id, speakerTalk.talk_id))
          .get()

        if (!talk) {
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
              eq(speakerTalks.talkId, speakerTalk.talk_id)
            )
          )
          .get()

        if (!existing) {
          await db.insert(speakerTalks).values({
            speakerId: speakerTalk.speaker_id,
            talkId: speakerTalk.talk_id,
            createdAt: new Date(speakerTalk.created_at * 1000),
          })
          seededCount++

          // Log every 100th relationship to avoid spam
          if (seededCount % 100 === 0) {
            console.log(`✅ Seeded ${seededCount} relationships...`)
          }
        } else {
          skippedCount++
        }
      }

      console.log("=".repeat(60))
      console.log(`✅ Speaker-talks seeding completed`)
      console.log(`   - Seeded:  ${seededCount}`)
      console.log(`   - Skipped: ${skippedCount}`)
      if (missingSpeakers.size > 0) {
        console.log(`   - Missing speakers: ${missingSpeakers.size}`)
        console.log(`     Sample IDs: ${Array.from(missingSpeakers).slice(0, 5).join(", ")}`)
      }
      if (missingTalks.size > 0) {
        console.log(`   - Missing talks: ${missingTalks.size}`)
        console.log(`     Sample IDs: ${Array.from(missingTalks).slice(0, 5).join(", ")}`)
      }
      console.log("=".repeat(60))

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
        console.error("Validation errors:", JSON.stringify(issues, null, 2))
        throw new Error(`Zod validation failed: ${issues.length} errors found`)
      }

      if (error instanceof SyntaxError) {
        console.error("JSON parsing failed:", error.message)
        throw new Error("Invalid JSON in speaker_talks.json file")
      }

      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        console.error("File not found: server/tasks/seed/speaker_talks.json")
        throw new Error("speaker_talks.json not found in server/tasks/seed/ directory")
      }

      console.error("Unexpected error during seeding:", error)
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      throw error
    }
  },
})
