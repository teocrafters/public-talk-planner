import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { publicTalks } from "../database/schema"

const PublicTalkSchema = z.object({
	no: z.number().int().positive(),
	title: z.string().min(1),
	hasMultimedia: z.boolean(),
	hasVideo: z.boolean(),
	status: z.enum(["circuit_overseer", "will_be_replaced"]).nullable(),
})

const PublicTalksArraySchema = z.array(PublicTalkSchema)

export default defineTask({
	meta: {
		name: "db:seed-public-talks",
		description: "Seed public talks from JSON data file",
	},
	async run() {
		console.log("Starting public talks seeding...")

		try {
			const dataPath = join(process.cwd(), "server", "data", "public-talks.json")
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
					hasMultimedia: talk.hasMultimedia,
					hasVideo: talk.hasVideo,
					status: talk.status,
					createdAt: new Date(),
				})
			}

			console.log(`✅ Seeded ${validatedTalks.length} public talks successfully`)

			return { result: "success", count: validatedTalks.length }
		} catch (error: unknown) {
			if (error instanceof z.ZodError) {
				const issues = (error as any).issues || []
				console.error("Validation errors:", JSON.stringify(issues, null, 2))
				throw new Error(`Zod validation failed: ${issues.length} errors found`)
			}

			if (error instanceof SyntaxError) {
				console.error("JSON parsing failed:", error.message)
				throw new Error("Invalid JSON in public-talks.json file")
			}

			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				console.error("File not found: server/data/public-talks.json")
				throw new Error(
					"public-talks.json not found. Run the analysis script first: node scripts/analyze-jwpub.cjs",
				)
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
