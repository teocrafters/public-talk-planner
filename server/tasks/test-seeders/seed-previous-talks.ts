import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { generateId } from "better-auth"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { organization, speakers } from "../../database/schema"

// Extend dayjs with customParseFormat plugin for DD.MM.YYYY format support
dayjs.extend(customParseFormat)

const UNKNOWN_CONGREGATION_SLUG = "nieznany-zbor"
const UNKNOWN_SPEAKER_ID = "9652b967-25b4-4b60-9458-657f2c1e1cc6"

const PreviousTalkSchema = z.object({
  talkNo: z.number().int().positive(),
  dates: z.array(z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/)),
})

const PreviousTalksArraySchema = z.array(PreviousTalkSchema)

export default defineTask({
  meta: {
    name: "db:seed-previous-talks",
    description: "Seed previous talks from JSON file with unknown speaker",
  },
  async run() {
    logger.info("Starting previous talks seeding...")

    try {
      const db = useDrizzle()

      // Step 1: Ensure "Nieznany zbor" exists
      logger.info("Ensuring 'Nieznany zbor' exists...")
      let unknownCongregation = await db.query.organization.findFirst({
        where: eq(organization.slug, UNKNOWN_CONGREGATION_SLUG),
      })

      if (!unknownCongregation) {
        const [newCongregation] = await db
          .insert(organization)
          .values({
            id: generateId(),
            name: "Nieznany zbor",
            slug: UNKNOWN_CONGREGATION_SLUG,
            logo: null,
            metadata: null,
            createdAt: new Date(),
          })
          .returning()
        unknownCongregation = newCongregation
        logger.info("✅ Created 'Nieznany zbor'")
      } else {
        logger.info("✅ 'Nieznany zbor' already exists")
      }

      // Step 2: Ensure "Nieznany mówca" exists
      logger.info("Ensuring 'Nieznany mówca' exists...")
      let unknownSpeaker = await db.query.speakers.findFirst({
        where: eq(speakers.id, UNKNOWN_SPEAKER_ID),
      })

      if (!unknownSpeaker) {
        const [newSpeaker] = await db
          .insert(speakers)
          .values({
            id: UNKNOWN_SPEAKER_ID,
            firstName: "Nieznany",
            lastName: "mówca",
            phone: "000000000",
            congregationId: unknownCongregation.id,
            archived: false,
            archivedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning()
        unknownSpeaker = newSpeaker
        logger.info("✅ Created 'Nieznany mówca'")
      } else {
        logger.info("✅ 'Nieznany mówca' already exists")
      }

      // Step 3: Read and validate JSON file
      logger.info("Reading previous-talks.json...")
      const dataPath = join(process.cwd(), "server", "tasks", "seed", "previous-talks.json")
      const data = await readFile(dataPath, "utf-8")
      const previousTalks = PreviousTalksArraySchema.parse(JSON.parse(data))
      logger.info(`✅ Found ${previousTalks.length} talks in JSON file`)

      // Step 4: Process each talk and its dates
      const scheduledCount = 0
      const skippedCount = 0
      const notFoundCount = 0

      // Track invalid dates
      const invalidDateCount = 0

      // for (const { talkNo, dates } of previousTalks) {
      //   // Find the talk in database by talk number (publicTalks.no field)
      //   const talk = await db.query.publicTalks.findFirst({
      //     where: eq(publicTalks.no, String(talkNo)),
      //   })

      //   if (!talk) {
      //     logger.warn(`⚠️  Talk #${talkNo} not found in database, skipping`)
      //     notFoundCount++
      //     continue
      //   }

      //   for (const dateStr of dates) {
      //     // Parse date from DD.MM.YYYY format
      //     // Use hour(12) for consistency with seed-weekend-meetings.ts
      //     const dateDayjs = dayjs(dateStr, "DD.MM.YYYY").hour(12).minute(0).second(0).millisecond(0)

      //     // Validate date parsing
      //     if (!dateDayjs.isValid()) {
      //       logger.warn(`⚠️  Invalid date format: ${dateStr}, skipping`)
      //       invalidDateCount++
      //       continue
      //     }

      //     const date = dateDayjs.toDate()
      //     const dateUnix = dateDayjs.unix()

      //     // Calculate day boundaries for range query (resilient to timestamp inconsistencies)
      //     const startOfDay = dateDayjs.startOf("day").unix()
      //     const endOfDay = dateDayjs.endOf("day").unix()

      //     // Check if meeting program already exists for this date (using day range)
      //     const existingProgram = await db.query.meetingPrograms.findFirst({
      //       where: and(
      //         eq(meetingPrograms.type, "weekend"),
      //         gte(meetingPrograms.date, startOfDay),
      //         lte(meetingPrograms.date, endOfDay)
      //       ),
      //     })

      //     let programId: number
      //     let partId: number
      //     let logMessage: string

      //     if (existingProgram) {
      //       // Check if a public talk already exists for this program
      //       const existingTalk = await db.query.scheduledPublicTalks.findFirst({
      //         where: eq(scheduledPublicTalks.meetingProgramId, existingProgram.id),
      //       })

      //       if (existingTalk) {
      //         logger.info(`⏭️  Talk #${talkNo} on ${dateStr} already scheduled`)
      //         skippedCount++
      //         continue
      //       }

      //       // Find or create PUBLIC_TALK part for existing program
      //       let publicTalkPart = await db.query.meetingProgramParts.findFirst({
      //         where: and(
      //           eq(meetingProgramParts.meetingProgramId, existingProgram.id),
      //           eq(meetingProgramParts.type, MEETING_PART_TYPES.PUBLIC_TALK)
      //         ),
      //       })

      //       if (!publicTalkPart) {
      //         const [createdPart] = await db
      //           .insert(meetingProgramParts)
      //           .values({
      //             meetingProgramId: existingProgram.id,
      //             type: MEETING_PART_TYPES.PUBLIC_TALK,
      //             name: null,
      //             order: MEETING_PART_ORDER.indexOf(MEETING_PART_TYPES.PUBLIC_TALK) + 1,
      //             createdAt: new Date(),
      //           })
      //           .returning()
      //         publicTalkPart = createdPart
      //       }

      //       programId = existingProgram.id
      //       partId = publicTalkPart.id
      //       logMessage = `✅ Scheduled talk #${talkNo} on ${dateStr} (existing program)`
      //     } else {
      //       // Create new meeting program
      //       const [program] = await db
      //         .insert(meetingPrograms)
      //         .values({
      //           type: "weekend",
      //           date: dateUnix,
      //           isCircuitOverseerVisit: false,
      //           name: null,
      //           createdAt: new Date(),
      //         })
      //         .returning()

      //       // Create PUBLIC_TALK part
      //       const [part] = await db
      //         .insert(meetingProgramParts)
      //         .values({
      //           meetingProgramId: program.id,
      //           type: MEETING_PART_TYPES.PUBLIC_TALK,
      //           name: null,
      //           order: MEETING_PART_ORDER.indexOf(MEETING_PART_TYPES.PUBLIC_TALK) + 1,
      //           createdAt: new Date(),
      //         })
      //         .returning()

      //       programId = program.id
      //       partId = part.id
      //       logMessage = `✅ Scheduled talk #${talkNo} on ${dateStr} (new program)`
      //     }

      //     // Create scheduledPublicTalk (common for both cases)
      //     await db.insert(scheduledPublicTalks).values({
      //       id: crypto.randomUUID(),
      //       date,
      //       meetingProgramId: programId,
      //       partId: partId,
      //       speakerSourceType: "visiting_speaker",
      //       speakerId: UNKNOWN_SPEAKER_ID,
      //       publisherId: null,
      //       talkId: talk.id,
      //       customTalkTitle: null,
      //       overrideValidation: false,
      //       createdAt: new Date(),
      //       updatedAt: new Date(),
      //     })

      //     logger.info(logMessage)
      //     scheduledCount++
      //   }
      // }

      logger.info("\n" + "=".repeat(60))
      logger.info("✅ Previous talks seeding completed")
      logger.info("=".repeat(60))
      logger.info(`   - Scheduled:     ${scheduledCount}`)
      logger.info(`   - Skipped:       ${skippedCount}`)
      logger.info(`   - Not found:     ${notFoundCount}`)
      if (invalidDateCount > 0) {
        logger.info(`   - Invalid dates: ${invalidDateCount}`)
      }
      logger.info("=".repeat(60))

      return {
        result: "success",
        scheduledCount,
        skippedCount,
        notFoundCount,
        invalidDateCount,
      }
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const issues = error.issues || []
        logger.error("Validation errors", { issues })
        throw new Error(`Zod validation failed: ${issues.length} errors found`)
      }

      if (error instanceof SyntaxError) {
        logger.error("JSON parsing failed", { error })
        throw new Error("Invalid JSON in previous-talks.json file")
      }

      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        logger.error("File not found: server/tasks/seed/previous-talks.json")
        throw new Error("previous-talks.json not found in server/tasks/seed/ directory")
      }

      logger.error("Unexpected error during seeding", { error })
      throw error
    }
  },
})
