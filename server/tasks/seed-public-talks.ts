import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { publicTalks } from "../database/schema"

const PublicTalkSchema = z.object({
  no: z.union([z.number().int().positive(), z.string().min(1)]).transform(val => String(val)),
  title: z.string().min(1),
  multimediaCount: z.number().int().min(0),
  videoCount: z.number().int().min(0),
  status: z.enum(["circuit_overseer", "will_be_replaced"]).nullable(),
})

const PublicTalksArraySchema = z.array(PublicTalkSchema)

export default defineTask({
  meta: {
    name: "db:seed-public-talks",
    description: "Seed public talks from JSON data file",
  },
  async run() {
    logger.info("Starting public talks seeding...")

    try {
      const dataPath = join(process.cwd(), "server", "data", "public-talks.json")
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
          multimediaCount: talk.multimediaCount,
          videoCount: talk.videoCount,
          status: talk.status,
          createdAt: new Date(),
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
        throw new Error("Invalid JSON in public-talks.json file")
      }

      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        logger.error("File not found: server/data/public-talks.json")
        throw new Error(
          "public-talks.json not found. Run the analysis script first: node scripts/analyze-jwpub.cjs"
        )
      }

      logger.error("Unexpected error during seeding", { error })
      throw error
    }
  },
})
