import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { dayjs } from "../../shared/utils/date"
import { toYYYYMMDD } from "../../shared/types/date"
import { meetingPrograms, meetingProgramParts, meetingScheduledParts } from "../database/schema"

const ScheduledMeetingPartSchema = z.object({
  type: z.enum(["chairman", "watchtower_study", "reader", "closing_prayer"]),
  publisherId: z.string().uuid(),
  order: z.number().int().positive(),
})

const ScheduledMeetingSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid YYYY-MM-DD format")
    .refine(isYYYYMMDD, "Invalid date format")
    .transform(toYYYYMMDD),
  parts: z.array(ScheduledMeetingPartSchema).length(4),
})

const ScheduledMeetingsArraySchema = z.array(ScheduledMeetingSchema)

export default defineTask({
  meta: {
    name: "db:seed-scheduled-meetings-from-json",
    description: "Seed scheduled weekend meetings from JSON file",
  },
  async run() {
    logger.info("Starting scheduled meetings seeding from JSON...")

    try {
      const db = useDrizzle()

      const dataPath = join(process.cwd(), "server", "tasks", "seed", "scheduled-meetings.json")

      logger.info(`Reading data from: ${dataPath}`)

      const data = await readFile(dataPath, "utf-8")
      const validatedMeetings = ScheduledMeetingsArraySchema.parse(JSON.parse(data))

      logger.info(`✅ Validated ${validatedMeetings.length} meetings from JSON`)

      let programsFound = 0
      let partsCreated = 0
      let assignmentsCreated = 0

      for (const meeting of validatedMeetings) {
        // CRITICAL: Validate Sunday before processing
        if (!isSunday(meeting.date)) {
          const dayOfWeek = dayjs(meeting.date).day()
          const dayNames = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ]
          throw new Error(
            `Invalid date in seed data: ${meeting.date} is not a Sunday (actual day: ${dayNames[dayOfWeek]}). ` +
              `Seed data must contain only Sunday dates for meeting programs.`
          )
        }

        // Find existing meeting program by date
        const program = await db.query.meetingPrograms.findFirst({
          where: eq(meetingPrograms.date, meeting.date),
        })

        if (!program) {
          logger.warn(`⚠️  Meeting program not found for date ${meeting.date} - skipping`)
          continue
        }

        programsFound++

        const createdParts = await db
          .insert(meetingProgramParts)
          .values(
            meeting.parts.map(part => ({
              meetingProgramId: program.id,
              type: part.type,
              name: null,
              order: part.order,
              createdAt: new Date(),
            }))
          )
          .returning()

        partsCreated += createdParts.length

        for (let i = 0; i < meeting.parts.length; i++) {
          await db.insert(meetingScheduledParts).values({
            id: crypto.randomUUID(),
            meetingProgramPartId: createdParts[i].id,
            publisherId: meeting.parts[i].publisherId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })

          assignmentsCreated++
        }
      }

      logger.info("✅ Scheduled meetings seeding completed successfully")
      logger.info(`   - Meeting programs found: ${programsFound}`)
      logger.info(`   - Program parts created: ${partsCreated}`)
      logger.info(`   - Publisher assignments created: ${assignmentsCreated}`)

      return {
        result: "success",
        programsFound,
        partsCreated,
        assignmentsCreated,
      }
    } catch (error: unknown) {
      logger.error("❌ Scheduled meetings seeding failed")

      if (error instanceof z.ZodError) {
        logger.error("Zod validation failed", { issues: error.issues })
        throw new Error(`Validation failed: ${error.issues.length} errors found in JSON data`)
      }

      if (error instanceof SyntaxError) {
        logger.error("JSON parsing failed", { error })
        throw new Error(`Invalid JSON in scheduled-meetings.json: ${error.message}`)
      }

      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        logger.error("File not found: server/tasks/seed/scheduled-meetings.json")
        throw new Error(
          "scheduled-meetings.json file not found. Please ensure it exists in server/tasks/seed/"
        )
      }

      logger.error("Unexpected error during seeding", { error })

      throw error
    }
  },
})
