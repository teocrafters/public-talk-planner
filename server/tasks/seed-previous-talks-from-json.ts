import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { generateId } from "better-auth"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import {
  organization,
  speakers,
  publicTalks,
  meetingPrograms,
  meetingProgramParts,
  scheduledPublicTalks,
} from "../database/schema"
import { MEETING_PART_TYPES, MEETING_PART_ORDER } from "#shared/constants/meetings"

// Extend dayjs with customParseFormat plugin for DD.MM.YYYY format support
dayjs.extend(customParseFormat)

const UNKNOWN_CONGREGATION_SLUG = "nieznany-zbor"
const UNKNOWN_SPEAKER_ID = "9652b967-25b4-4b60-9458-657f2c1e1cc6"

const PreviousTalkSchema = z.object({
  date: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/),
  talkNo: z.number().int().positive(),
  speakerId: z.string().min(1),
})

const PreviousTalksArraySchema = z.array(PreviousTalkSchema)

export default defineTask({
  meta: {
    name: "db:seed-previous-talks-from-json",
    description: "Seed previous talks from both JSON files (with and without speaker info)",
  },
  async run() {
    logger.info("Starting previous talks seeding from JSON...")

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

      // Step 3: Read and validate both JSON files
      let previousTalks: z.infer<typeof PreviousTalksArraySchema> = []

      // Read previous-talks.json (without speaker info)
      const previousTalksPath = join(
        process.cwd(),
        "server",
        "tasks",
        "seed",
        "previous-talks.json"
      )
      try {
        const previousTalksData = await readFile(previousTalksPath, "utf-8")
        const parsedPreviousTalks = PreviousTalksArraySchema.parse(JSON.parse(previousTalksData))
        previousTalks = [...previousTalks, ...parsedPreviousTalks]
        logger.info(`✅ Found ${parsedPreviousTalks.length} talks in previous-talks.json`)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          logger.info("⏭️  previous-talks.json not found, skipping")
        } else {
          throw error
        }
      }

      // Read previous-talks-with-speakers.json (with speaker info)
      const previousTalksWithSpeakersPath = join(
        process.cwd(),
        "server",
        "tasks",
        "seed",
        "previous-talks-with-speakers.json"
      )
      try {
        const previousTalksWithSpeakersData = await readFile(previousTalksWithSpeakersPath, "utf-8")
        const parsedPreviousTalksWithSpeakers = PreviousTalksArraySchema.parse(
          JSON.parse(previousTalksWithSpeakersData)
        )
        previousTalks = [...previousTalks, ...parsedPreviousTalksWithSpeakers]
        logger.info(
          `✅ Found ${parsedPreviousTalksWithSpeakers.length} talks in previous-talks-with-speakers.json`
        )
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          logger.info("⏭️  previous-talks-with-speakers.json not found, skipping")
        } else {
          throw error
        }
      }

      logger.info(`Total talks to process: ${previousTalks.length}`)

      // Step 4: Process each talk and its dates
      let scheduledCount = 0
      let skippedCount = 0
      let notFoundCount = 0
      let invalidDateCount = 0
      let missingSpeakerCount = 0

      for (const { talkNo, date: dateStr, speakerId } of previousTalks) {
        // Find the talk in database by talk number (publicTalks.no field)
        const talk = await db.query.publicTalks.findFirst({
          where: eq(publicTalks.no, String(talkNo)),
        })

        if (!talk) {
          logger.warn(`⚠️  Talk #${talkNo} not found in database, skipping`)
          notFoundCount++
          continue
        }

        // Parse date from DD.MM.YYYY format
        const dateDayjs = dayjs(dateStr, "DD.MM.YYYY")

        // Validate date parsing
        if (!dateDayjs.isValid()) {
          logger.warn(`⚠️  Invalid date format: ${dateStr}, skipping`)
          invalidDateCount++
          continue
        }

        // Convert to YYYY-MM-DD format
        const dateYYYYMMDD = formatToYYYYMMDD(dateDayjs.toDate())

        // CRITICAL: Validate Sunday before database insert
        if (!isSunday(dateYYYYMMDD)) {
          const dayOfWeek = dateDayjs.day()
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
            `Invalid date in seed data: ${dateYYYYMMDD} is not a Sunday (actual day: ${dayNames[dayOfWeek]}). ` +
              `Seed data must contain only Sunday dates for meeting programs.`
          )
        }

        // Determine which speaker to use
        let finalSpeakerId = speakerId

        // If speaker is not the unknown speaker, verify they exist
        if (speakerId !== UNKNOWN_SPEAKER_ID) {
          const speaker = await db.query.speakers.findFirst({
            where: eq(speakers.id, speakerId),
          })

          if (!speaker) {
            logger.warn(
              `⚠️  Speaker not found for talk #${talkNo} on ${dateStr} (speaker ID: ${speakerId}), using unknown speaker`
            )
            finalSpeakerId = UNKNOWN_SPEAKER_ID
            missingSpeakerCount++
          }
        }

        // Check if meeting program already exists for this date (direct equality)
        const existingProgram = await db.query.meetingPrograms.findFirst({
          where: and(eq(meetingPrograms.type, "weekend"), eq(meetingPrograms.date, dateYYYYMMDD)),
        })

        let programId: number
        let partId: number

        if (existingProgram) {
          // Check if a public talk already exists for this program
          const existingTalk = await db.query.scheduledPublicTalks.findFirst({
            where: eq(scheduledPublicTalks.meetingProgramId, existingProgram.id),
          })

          if (existingTalk) {
            logger.info(`⏭️  Talk #${talkNo} on ${dateStr} already scheduled`)
            skippedCount++
            continue
          }

          // Find or create PUBLIC_TALK part for existing program
          let publicTalkPart = await db.query.meetingProgramParts.findFirst({
            where: and(
              eq(meetingProgramParts.meetingProgramId, existingProgram.id),
              eq(meetingProgramParts.type, MEETING_PART_TYPES.PUBLIC_TALK)
            ),
          })

          if (!publicTalkPart) {
            const [createdPart] = await db
              .insert(meetingProgramParts)
              .values({
                meetingProgramId: existingProgram.id,
                type: MEETING_PART_TYPES.PUBLIC_TALK,
                name: null,
                order: MEETING_PART_ORDER.indexOf(MEETING_PART_TYPES.PUBLIC_TALK) + 1,
                createdAt: new Date(),
              })
              .returning()
            publicTalkPart = createdPart
          }

          programId = existingProgram.id
          partId = publicTalkPart.id
        } else {
          // Create new meeting program
          const [program] = await db
            .insert(meetingPrograms)
            .values({
              type: "weekend",
              date: dateYYYYMMDD,
              isCircuitOverseerVisit: false,
              name: null,
              createdAt: new Date(),
            })
            .returning()

          // Create PUBLIC_TALK part
          const [part] = await db
            .insert(meetingProgramParts)
            .values({
              meetingProgramId: program.id,
              type: MEETING_PART_TYPES.PUBLIC_TALK,
              name: null,
              order: MEETING_PART_ORDER.indexOf(MEETING_PART_TYPES.PUBLIC_TALK) + 1,
              createdAt: new Date(),
            })
            .returning()

          programId = program.id
          partId = part.id
        }

        // Create scheduledPublicTalk (common for both cases)
        await db.insert(scheduledPublicTalks).values({
          id: crypto.randomUUID(),
          date: dateYYYYMMDD,
          meetingProgramId: programId,
          partId: partId,
          speakerSourceType: "visiting_speaker",
          speakerId: finalSpeakerId,
          publisherId: null,
          talkId: talk.id,
          customTalkTitle: null,
          overrideValidation: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        scheduledCount++

        // Log progress every 50 talks
        if (scheduledCount % 50 === 0) {
          logger.info(`✅ Scheduled ${scheduledCount} talks...`)
        }
      }

      logger.info("\n" + "=".repeat(60))
      logger.info("✅ Previous talks seeding completed")
      logger.info("=".repeat(60))
      logger.info(`   - Scheduled:         ${scheduledCount}`)
      logger.info(`   - Skipped:           ${skippedCount}`)
      logger.info(`   - Not found:         ${notFoundCount}`)
      if (invalidDateCount > 0) {
        logger.info(`   - Invalid dates:     ${invalidDateCount}`)
      }
      if (missingSpeakerCount > 0) {
        logger.info(`   - Missing speakers:  ${missingSpeakerCount}`)
      }
      logger.info("=".repeat(60))

      return {
        result: "success",
        scheduledCount,
        skippedCount,
        notFoundCount,
        invalidDateCount,
        missingSpeakerCount,
      }
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const issues = error.issues || []
        logger.error("Validation errors", { issues })
        throw new Error(`Zod validation failed: ${issues.length} errors found`)
      }

      if (error instanceof SyntaxError) {
        logger.error("JSON parsing failed", { error })
        throw new Error("Invalid JSON in previous-talks JSON files")
      }

      logger.error("Unexpected error during seeding", { error })
      throw error
    }
  },
})
