import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { schema } from "hub:db"

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
    console.log("Starting speakers seeding...")

    try {
      const dataPath = join(process.cwd(), "server", "data", "speakers.json")
      const data = await readFile(dataPath, "utf-8")
      const speakersData = JSON.parse(data)

      console.log("Validating speaker data with Zod...")
      console.log(`Found ${speakersData.length} speakers in JSON file`)
      const validated = SpeakersSeedArraySchema.parse(speakersData)
      console.log(`Validation passed for ${validated.length} speakers`)

      // Get the test organization ID
      console.log("Finding test organization...")
      const testOrg = await db.query.organization.findFirst({
        where: eq(schema.organization.slug, "zychlin"),
      })

      if (!testOrg) {
        throw new Error("Test organization not found. Run seed-test-accounts first.")
      }

      console.log(`Using organization: ${testOrg.name} (${testOrg.id})`)

      // Clear existing speaker data
      console.log("Deleting existing speakers and talk assignments...")
      await db.delete(schema.speakerTalks)
      await db.delete(schema.speakers)
      console.log("Deleted existing speakers")

      // Verify talk IDs exist
      console.log("Verifying talk IDs exist...")
      const allTalkIds = new Set<number>()
      for (const speaker of validated) {
        speaker.talkIds.forEach(id => allTalkIds.add(id))
      }

      if (allTalkIds.size > 0) {
        const existingTalks = await db.select({ id: schema.publicTalks.id }).from(schema.publicTalks)

        const existingTalkIds = new Set(existingTalks.map(t => t.id))
        const missingTalkIds = Array.from(allTalkIds).filter(id => !existingTalkIds.has(id))

        if (missingTalkIds.length > 0) {
          console.warn(`Warning: Some talk IDs don't exist: ${missingTalkIds.join(", ")}`)
          console.warn("These talk assignments will be skipped")
        }
      }

      // Insert speakers and their talk assignments
      console.log(`Inserting ${validated.length} speakers...`)
      for (const speaker of validated) {
        await db.insert(schema.speakers).values({
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
          // Verify talk IDs before inserting
          const validTalkIds: number[] = []
          for (const talkId of speaker.talkIds) {
            const talkExists = await db
              .select({ id: schema.publicTalks.id })
              .from(schema.publicTalks)
              .where(eq(schema.publicTalks.id, talkId))
              .limit(1)

            if (talkExists.length > 0) {
              validTalkIds.push(talkId)
            }
          }

          if (validTalkIds.length > 0) {
            const talkAssignments = validTalkIds.map(talkId => ({
              speakerId: speaker.id,
              talkId,
              createdAt: new Date(),
            }))

            await db.insert(schema.speakerTalks).values(talkAssignments)
          }
        }

        console.log(
          `✅ Seeded: ${speaker.firstName} ${speaker.lastName} (${speaker.talkIds.length} talks${speaker.archived ? ", archived" : ""})`
        )
      }

      console.log(`✅ Seeded ${validated.length} speakers successfully`)

      return { result: "success", count: validated.length }
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const issues = error.issues || []
        console.error("Validation errors:", JSON.stringify(issues, null, 2))
        throw new Error(`Zod validation failed: ${issues.length} errors found`)
      }

      if (error instanceof SyntaxError) {
        console.error("JSON parsing failed:", error.message)
        throw new Error("Invalid JSON in speakers.json file")
      }

      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        console.error("File not found: server/data/speakers.json")
        throw new Error("speakers.json not found in server/data/ directory")
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
