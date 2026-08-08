import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { publicTalks } from "../database/schema"

const PublicTalkSchema = z.object({
  id: z.number().int().positive().optional(), // Ignore id from JSON, let DB auto-increment
  no: z.union([z.number(), z.string()]).transform(val => String(val)),
  title: z.string().min(1),
  multimedia_count: z.number().int().min(0),
  video_count: z.number().int().min(0),
  status: z.enum(["circuit_overseer", "will_be_replaced"]).nullable(),
  created_at: z.number().int().positive(), // Unix timestamp from JSON
})

const PublicTalksArraySchema = z.array(PublicTalkSchema)

export default defineTask({
  meta: {
    name: "db:seed-public-talks-from-json",
    description: "Seed public talks from JSON file (shared by test and real data)",
  },
  async run() {
    logger.info("Starting public talks seeding from JSON...")

    try {
      const dataPath = join(process.cwd(), "server", "tasks", "seed", "public_talks.json")
      const data = await readFile(dataPath, "utf-8")
      const talks = JSON.parse(data)

      logger.info("Validating talk data with Zod...")
      logger.info(`Found ${talks.length} talks in JSON file`)
      const validatedTalks = PublicTalksArraySchema.parse(talks)
      logger.info(`Validation passed for ${validatedTalks.length} talks`)

      const db = useDrizzle()

      logger.info("Deleting existing public talks...")
      await db.delete(publicTalks)
      logger.info("Deleted existing public talks")

      logger.info(`Inserting ${validatedTalks.length} talks...`)
      for (const talk of validatedTalks) {
        await db.insert(publicTalks).values({
          no: talk.no,
          title: talk.title,
          multimediaCount: talk.multimedia_count,
          videoCount: talk.video_count,
          status: talk.status,
          createdAt: new Date(talk.created_at * 1000), // Convert Unix timestamp to Date
        })
      }

      logger.info(`✅ Seeded ${validatedTalks.length} public talks successfully`)

      return { result: "success", count: validatedTalks.length }
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const issues = error.issues || []
        logger.error("Validation errors", { issues })
        throw new Error(`Zod validation failed: ${issues.length} errors found`)
      }

      if (error instanceof SyntaxError) {
        logger.error("JSON parsing failed", { error })
        throw new Error("Invalid JSON in public_talks.json file")
      }

      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        logger.error("File not found: server/tasks/seed/public_talks.json")
        throw new Error("public_talks.json not found in server/tasks/seed/ directory")
      }

      logger.error("Unexpected error during seeding", { error })
      throw error
    }
  },
})
