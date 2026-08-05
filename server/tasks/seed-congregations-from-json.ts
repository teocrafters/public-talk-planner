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
    logger.info("Starting congregations seeding from JSON...")

    try {
      const dataPath = join(process.cwd(), "server", "tasks", "seed", "congregation.json")
      const data = await readFile(dataPath, "utf-8")
      const congregations = JSON.parse(data)

      logger.info("Validating congregation data with Zod...")
      logger.info(`Found ${congregations.length} congregations in JSON file`)
      const validatedCongregations = CongregationsArraySchema.parse(congregations)
      logger.info(`Validation passed for ${validatedCongregations.length} congregations`)

      const db = useDrizzle()

      let seededCount = 0
      let skippedCount = 0

      for (const congregation of validatedCongregations) {
        const existing = await db
          .select()
          .from(organization)
          .where(eq(organization.slug, congregation.slug))
          .then(rows => rows[0])

        if (!existing) {
          await db.insert(organization).values({
            id: congregation.id,
            name: congregation.name,
            slug: congregation.slug,
            logo: congregation.logo,
            metadata: congregation.metadata,
            createdAt: new Date(congregation.created_at),
          })
          logger.info(`✅ Seeded congregation: ${congregation.name}`)
          seededCount++
        } else {
          logger.info(`⏭️  Congregation already exists: ${congregation.name}`)
          skippedCount++
        }
      }

      logger.info("=".repeat(60))
      logger.info(`✅ Congregations seeding completed`)
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
        throw new Error("Invalid JSON in congregation.json file")
      }

      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        logger.error("File not found: server/tasks/seed/congregation.json")
        throw new Error("congregation.json not found in server/tasks/seed/ directory")
      }

      logger.error("Unexpected error during seeding", { error })
      throw error
    }
  },
})
