import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { organization } from "../database/auth-schema"

const CongregationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  logo: z.string().nullable(),
  created_at: z.number().int().positive(), // Unix timestamp from JSON
  metadata: z.string().nullable(),
})

const CongregationsArraySchema = z.array(CongregationSchema)

export default defineTask({
  meta: {
    name: "db:seed-congregations-from-json",
    description: "Seed congregations from JSON file",
  },
  async run() {
    console.log("Starting congregations seeding from JSON...")

    try {
      const dataPath = join(process.cwd(), "server", "tasks", "seed", "congregation.json")
      const data = await readFile(dataPath, "utf-8")
      const congregations = JSON.parse(data)

      console.log("Validating congregation data with Zod...")
      console.log(`Found ${congregations.length} congregations in JSON file`)
      const validatedCongregations = CongregationsArraySchema.parse(congregations)
      console.log(`Validation passed for ${validatedCongregations.length} congregations`)

      const db = useDrizzle()

      let seededCount = 0
      let skippedCount = 0

      for (const congregation of validatedCongregations) {
        const existing = await db
          .select()
          .from(organization)
          .where(eq(organization.slug, congregation.slug))
          .get()

        if (!existing) {
          await db.insert(organization).values({
            id: congregation.id,
            name: congregation.name,
            slug: congregation.slug,
            logo: congregation.logo,
            metadata: congregation.metadata,
            createdAt: new Date(congregation.created_at),
          })
          console.log(`✅ Seeded congregation: ${congregation.name}`)
          seededCount++
        } else {
          console.log(`⏭️  Congregation already exists: ${congregation.name}`)
          skippedCount++
        }
      }

      console.log("=".repeat(60))
      console.log(`✅ Congregations seeding completed`)
      console.log(`   - Seeded:  ${seededCount}`)
      console.log(`   - Skipped: ${skippedCount}`)
      console.log("=".repeat(60))

      return {
        result: "success",
        seededCount,
        skippedCount,
      }
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const issues = error.issues || []
        console.error("Validation errors:", JSON.stringify(issues, null, 2))
        throw new Error(`Zod validation failed: ${issues.length} errors found`)
      }

      if (error instanceof SyntaxError) {
        console.error("JSON parsing failed:", error.message)
        throw new Error("Invalid JSON in congregation.json file")
      }

      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        console.error("File not found: server/tasks/seed/congregation.json")
        throw new Error("congregation.json not found in server/tasks/seed/ directory")
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
