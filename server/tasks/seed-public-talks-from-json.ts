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
    console.log("Starting public talks seeding from JSON...")

    try {
      const dataPath = join(process.cwd(), "server", "tasks", "seed", "public_talks.json")
      const data = await readFile(dataPath, "utf-8")
      const talks = JSON.parse(data)

      console.log("Validating talk data with Zod...")
      console.log(`Found ${talks.length} talks in JSON file`)
      const validatedTalks = PublicTalksArraySchema.parse(talks)
      console.log(`Validation passed for ${validatedTalks.length} talks`)

      const db = useDrizzle()

      console.log("Deleting existing public talks...")
      await db.delete(publicTalks)
      console.log("Deleted existing public talks")

      console.log(`Inserting ${validatedTalks.length} talks...`)
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

      console.log(`✅ Seeded ${validatedTalks.length} public talks successfully`)

      return { result: "success", count: validatedTalks.length }
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const issues = error.issues || []
        console.error("Validation errors:", JSON.stringify(issues, null, 2))
        throw new Error(`Zod validation failed: ${issues.length} errors found`)
      }

      if (error instanceof SyntaxError) {
        console.error("JSON parsing failed:", error.message)
        throw new Error("Invalid JSON in public_talks.json file")
      }

      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        console.error("File not found: server/tasks/seed/public_talks.json")
        throw new Error("public_talks.json not found in server/tasks/seed/ directory")
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
