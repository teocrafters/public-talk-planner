import { eq, and } from "drizzle-orm"
import type { publishers } from "../database/schema"
import {
  meetingPrograms,
  meetingProgramParts,
  meetingScheduledParts,
  scheduledPublicTalks,
  speakers,
} from "../database/schema"
import { MEETING_PART_TYPES } from "#shared/constants/meetings"

/**
 * Helper function to randomly select an element from array
 */
function randomFromArray<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Circuit Overseer talk titles - theocratic themes
 */
const CIRCUIT_OVERSEER_TALK_TITLES = [
  "Wierność Jehowie w trudnych czasach",
  "Duchowe cele w służbie Bogu",
  "Radość w pełnoczasowej służbie",
  "Budowanie wiary w rodzinie",
  "Naśladowanie wiary starszych",
  "Służba Bogu z całego serca",
  "Błogosławieństwa płynące z posłuszeństwa",
  "Przygotowanie do Królestwa Bożego",
]

export default defineTask({
  meta: {
    name: "db:seed-weekend-meetings",
    description: "Seed complete weekend meeting programs with publishers and assignments",
  },
  async run() {
    console.log("Starting weekend meetings seeding...")

    try {
      const db = useDrizzle()

      // Step 1: Get all publishers from database
      console.log("Fetching publishers from database...")
      const samplePublishers = await db.query.publishers.findMany()

      if (samplePublishers.length === 0) {
        console.warn("⚠️  No publishers found. Run seed-publishers first.")
        return {
          result: "success",
          publishersCount: 0,
          programsCount: 0,
        }
      }

      console.log(`✅ Found ${samplePublishers.length} publishers`)

      // Step 2: Get all active speakers for public talk assignments
      const speakersWithTalks = await db.query.speakers.findMany({
        where: eq(speakers.archived, false),
        with: {
          speakerTalks: {
            with: {
              talk: true,
            },
          },
        },
      })

      if (speakersWithTalks.length === 0) {
        console.warn("⚠️  No speakers found. Run seed-speakers first for public talks.")
      } else {
        console.log(`Found ${speakersWithTalks.length} active speakers`)
      }

      // Step 3: Calculate next 12 Sundays
      const sundays = calculateSundays(12)
      console.log(`Will create programs for ${sundays.length} Sundays`)

      // Step 4: Create weekend meeting programs for each Sunday
      let programsCreated = 0
      for (let i = 0; i < sundays.length; i++) {
        const sunday = sundays[i]
        const isCircuitOverseerVisit = i === 3 // Make the 4th Sunday a CO visit

        // Check if program already exists for this date
        const existingProgram = await db
          .select()
          .from(meetingPrograms)
          .where(
            and(eq(meetingPrograms.type, "weekend"), eq(meetingPrograms.date, dayjs(sunday).unix()))
          )
          .get()

        if (existingProgram) {
          console.log(`⏭️  Program already exists for ${sunday.toLocaleDateString()}`)
          continue
        }

        await createWeekendMeetingProgram({
          db,
          date: sunday,
          isCircuitOverseerVisit,
          publishers: samplePublishers,
          speakers: speakersWithTalks,
        })

        programsCreated++
        console.log(
          `✅ Created program for ${sunday.toLocaleDateString()}${isCircuitOverseerVisit ? " (CO Visit)" : ""}`
        )
      }

      console.log(`\n✅ Weekend meetings seeding completed successfully`)
      console.log(`   - Publishers: ${samplePublishers.length}`)
      console.log(`   - Programs created: ${programsCreated}`)

      return {
        result: "success",
        publishersCount: samplePublishers.length,
        programsCount: programsCreated,
      }
    } catch (error: unknown) {
      console.error("Unexpected error during seeding:", error)
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      throw error
    }
  },
})

function calculateSundays(count: number): Date[] {
  // Start from today at noon UTC to avoid timezone boundary issues
  const todayAtNoon = dayjs().hour(12).minute(0).second(0).millisecond(0)

  const currentDayOfWeek = todayAtNoon.day()
  const daysUntilSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek

  const sundays: Date[] = []
  let currentSunday = todayAtNoon.add(daysUntilSunday, "day")

  for (let i = 0; i < count; i++) {
    sundays.push(currentSunday.toDate())
    currentSunday = currentSunday.add(7, "day")
  }

  return sundays
}

interface CreateProgramOptions {
  db: ReturnType<typeof useDrizzle>
  date: Date
  isCircuitOverseerVisit: boolean
  publishers: Array<typeof publishers.$inferSelect>
  speakers: Array<{
    id: string
    firstName: string
    lastName: string
    speakerTalks?: Array<{ talkId: number }>
  }>
}

async function createWeekendMeetingProgram(options: CreateProgramOptions): Promise<void> {
  const { db, date, isCircuitOverseerVisit, publishers, speakers } = options

  // Create the meeting program
  const [program] = await db
    .insert(meetingPrograms)
    .values({
      type: "weekend",
      date: dayjs(date).unix(), // Unix timestamp in seconds
      isCircuitOverseerVisit,
      name: null,
      createdAt: new Date(),
    })
    .returning()

  // Create parts for this program
  // Note: name is null for most parts to avoid duplication with part type
  // Only CO talk gets a custom title from predefined list
  const partTypes: Array<{ type: string; name: string | null; order: number }> = [
    { type: MEETING_PART_TYPES.CHAIRMAN, name: null, order: 1 },
    { type: MEETING_PART_TYPES.PUBLIC_TALK, name: null, order: 2 },
  ]

  // If CO visit, add CIRCUIT_OVERSEER_TALK with random title
  if (isCircuitOverseerVisit) {
    const coTalkTitle =
      randomFromArray(CIRCUIT_OVERSEER_TALK_TITLES) || "Przemówienie służbowe nadzorcy obwodu"
    partTypes.push({
      type: MEETING_PART_TYPES.CIRCUIT_OVERSEER_TALK,
      name: coTalkTitle,
      order: 3,
    })
  }

  // Add remaining parts with adjusted orders
  partTypes.push(
    {
      type: MEETING_PART_TYPES.WATCHTOWER_STUDY,
      name: null,
      order: isCircuitOverseerVisit ? 4 : 3,
    },
    {
      type: MEETING_PART_TYPES.READER,
      name: null,
      order: isCircuitOverseerVisit ? 5 : 4,
    },
    {
      type: MEETING_PART_TYPES.CLOSING_PRAYER,
      name: null,
      order: isCircuitOverseerVisit ? 6 : 5,
    }
  )

  const createdParts = await db
    .insert(meetingProgramParts)
    .values(
      partTypes.map(part => ({
        meetingProgramId: program.id,
        type: part.type,
        name: part.name,
        order: part.order,
        createdAt: new Date(),
      }))
    )
    .returning()

  // Assign publishers to parts
  const chairmanPart = createdParts.find(p => p.type === MEETING_PART_TYPES.CHAIRMAN)
  const publicTalkPart = createdParts.find(p => p.type === MEETING_PART_TYPES.PUBLIC_TALK)
  const circuitOverseerTalkPart = createdParts.find(
    p => p.type === MEETING_PART_TYPES.CIRCUIT_OVERSEER_TALK
  )
  const watchtowerPart = createdParts.find(p => p.type === MEETING_PART_TYPES.WATCHTOWER_STUDY)
  const readerPart = createdParts.find(p => p.type === MEETING_PART_TYPES.READER)
  const prayerPart = createdParts.find(p => p.type === MEETING_PART_TYPES.CLOSING_PRAYER)

  // Assign chairman - randomly select from eligible publishers
  if (chairmanPart) {
    const eligibleChairmen = publishers.filter(p => p.canChairWeekendMeeting)
    const chairman = randomFromArray(eligibleChairmen)
    if (chairman) {
      await db.insert(meetingScheduledParts).values({
        id: crypto.randomUUID(),
        meetingProgramPartId: chairmanPart.id,
        publisherId: chairman.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }

  // Assign public talk speaker
  if (publicTalkPart) {
    if (isCircuitOverseerVisit) {
      // CO visit: Assign CO to PUBLIC_TALK via scheduledPublicTalks as local_publisher
      const circuitOverseer = publishers.find(p => p.isCircuitOverseer)
      if (circuitOverseer) {
        await db.insert(scheduledPublicTalks).values({
          id: crypto.randomUUID(),
          date,
          meetingProgramId: program.id,
          partId: publicTalkPart.id,
          speakerSourceType: "local_publisher", // CO is a local publisher
          speakerId: null, // No external speaker
          publisherId: circuitOverseer.id, // Use publisher ID for local CO
          talkId: null, // CO talks don't have standard talk numbers
          customTalkTitle: "Wykład publiczny nadzorcy obwodu",
          overrideValidation: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    } else {
      // Regular meeting: 50% chance for local speaker, 50% for visiting speaker
      const useLocalSpeaker = Math.random() < 0.5

      if (useLocalSpeaker) {
        // Use local publisher who delivers public talks
        const localSpeakers = publishers.filter(p => p.deliversPublicTalks)
        const localSpeaker = randomFromArray(localSpeakers)

        if (localSpeaker) {
          await db.insert(scheduledPublicTalks).values({
            id: crypto.randomUUID(),
            date,
            meetingProgramId: program.id,
            partId: publicTalkPart.id,
            speakerSourceType: "local_publisher",
            speakerId: null, // No external speaker
            publisherId: localSpeaker.id, // Use local publisher
            talkId: null, // Local speakers may not have specific talk numbers
            customTalkTitle: null,
            overrideValidation: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
      } else {
        // Use visiting speaker - randomly select from eligible speakers with talks
        const eligibleSpeakers = speakers.filter(s => s.speakerTalks && s.speakerTalks.length > 0)
        const speaker = randomFromArray(eligibleSpeakers)

        if (speaker && speaker.speakerTalks) {
          const speakerTalk = randomFromArray(speaker.speakerTalks)

          if (speakerTalk) {
            await db.insert(scheduledPublicTalks).values({
              id: crypto.randomUUID(),
              date,
              meetingProgramId: program.id,
              partId: publicTalkPart.id,
              speakerSourceType: "visiting_speaker", // External speaker
              speakerId: speaker.id, // Use speaker ID for visiting speaker
              publisherId: null, // No local publisher
              talkId: speakerTalk.talkId,
              customTalkTitle: null,
              overrideValidation: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          }
        }
      }
    }
  }

  // Assign CIRCUIT_OVERSEER_TALK during CO visit
  if (isCircuitOverseerVisit && circuitOverseerTalkPart) {
    const circuitOverseer = publishers.find(p => p.isCircuitOverseer)
    if (circuitOverseer) {
      await db.insert(meetingScheduledParts).values({
        id: crypto.randomUUID(),
        meetingProgramPartId: circuitOverseerTalkPart.id,
        publisherId: circuitOverseer.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }

  // Assign watchtower conductor - randomly select from eligible publishers
  if (watchtowerPart) {
    const eligibleConductors = publishers.filter(p => p.conductsWatchtowerStudy)
    const conductor = randomFromArray(eligibleConductors)
    if (conductor) {
      await db.insert(meetingScheduledParts).values({
        id: crypto.randomUUID(),
        meetingProgramPartId: watchtowerPart.id,
        publisherId: conductor.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }

  // Assign reader - randomly select from eligible publishers (excluding Watchtower conductor)
  if (readerPart) {
    const eligibleReaders = publishers.filter(p => p.isReader && !p.conductsWatchtowerStudy)
    const reader = randomFromArray(eligibleReaders)
    if (reader) {
      await db.insert(meetingScheduledParts).values({
        id: crypto.randomUUID(),
        meetingProgramPartId: readerPart.id,
        publisherId: reader.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }

  // Assign prayer - randomly select from eligible publishers
  // (excluding chairman and Watchtower conductor)
  if (prayerPart) {
    const eligibleForPrayer = publishers.filter(
      p => p.offersPublicPrayer && !p.canChairWeekendMeeting && !p.conductsWatchtowerStudy
    )
    const prayerPublisher = randomFromArray(eligibleForPrayer)
    if (prayerPublisher) {
      await db.insert(meetingScheduledParts).values({
        id: crypto.randomUUID(),
        meetingProgramPartId: prayerPart.id,
        publisherId: prayerPublisher.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }
}
