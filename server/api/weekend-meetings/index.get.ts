import type { H3Event } from "h3"
import { eq, gte, lte, and, asc as ascHelper } from "drizzle-orm"
import { schema } from "hub:db"
import { MEETING_PART_TYPES } from "#shared/constants/meetings"

export default defineEventHandler(async (event: H3Event): Promise<WeekendMeetingListItem[]> => {
  await requirePermission({ weekend_meetings: ["list"] })(event)

  const query = getQuery(event)

  // Build where conditions
  const whereConditions = [eq(schema.meetingPrograms.type, "weekend")]

  // Date range filter
  if (query.startDate && typeof query.startDate === "string") {
    const startTimestamp = parseInt(query.startDate)
    whereConditions.push(gte(schema.meetingPrograms.date, startTimestamp))
  }

  if (query.endDate && typeof query.endDate === "string") {
    const endTimestamp = parseInt(query.endDate)
    whereConditions.push(lte(schema.meetingPrograms.date, endTimestamp))
  }

  // Fetch programs with parts and assignments
  const programs = await db.query.schema.meetingPrograms.findMany({
    where: and(...whereConditions),
    with: {
      parts: {
        orderBy: [ascHelper(schema.meetingProgramParts.order)],
        with: {
          meetingScheduledParts: {
            with: {
              publisher: true,
            },
          },
          scheduledPublicTalks: {
            with: {
              speaker: true,
              publisher: true,
              talk: true,
            },
          },
        },
      },
    },
    orderBy: [ascHelper(schema.meetingPrograms.date)],
  })

  // Type helpers for query results
  type ProgramResult = NonNullable<typeof programs[number]>
  type PartResult = ProgramResult["parts"][number]

  // Transform to response format
  const result: WeekendMeetingListItem[] = programs.map((program: ProgramResult) => ({
    id: program.id,
    date: program.date,
    isCircuitOverseerVisit: program.isCircuitOverseerVisit,
    parts: program.parts.map((part: PartResult) => {
      let assignment: WeekendMeetingListItem["parts"][number]["assignment"] = undefined
      let talkName: string | null = part.name

      // For public talks, use scheduledPublicTalks (can be speaker or publisher)
      if (part.type === MEETING_PART_TYPES.PUBLIC_TALK) {
        const publicTalk = part.scheduledPublicTalks[0]
        if (publicTalk) {
          // Get talk title: customTalkTitle takes precedence, fallback to talk.title
          talkName = publicTalk.customTalkTitle || publicTalk.talk?.title || null

          // Check speaker source type to determine which data to use
          if (publicTalk.speakerSourceType === "visiting_speaker" && publicTalk.speaker) {
            assignment = {
              personId: publicTalk.speakerId!,
              personName: `${publicTalk.speaker.firstName} ${publicTalk.speaker.lastName}`,
              personType: "speaker",
            }
          } else if (publicTalk.speakerSourceType === "local_publisher" && publicTalk.publisher) {
            assignment = {
              personId: publicTalk.publisherId!,
              personName: `${publicTalk.publisher.firstName} ${publicTalk.publisher.lastName}`,
              personType: "publisher",
            }
          }
        }
      } else if (part.type === MEETING_PART_TYPES.CIRCUIT_OVERSEER_TALK) {
        // For circuit overseer talks, also check if there's a talk with number
        const scheduledPart = part.meetingScheduledParts[0]
        if (scheduledPart?.publisher) {
          assignment = {
            personId: scheduledPart.publisherId,
            personName: `${scheduledPart.publisher.firstName} ${scheduledPart.publisher.lastName}`,
            personType: "publisher",
          }
        }
      } else {
        // For all other parts, use meetingScheduledParts (schema.publishers)
        const scheduledPart = part.meetingScheduledParts[0]
        if (scheduledPart?.publisher) {
          assignment = {
            personId: scheduledPart.publisherId,
            personName: `${scheduledPart.publisher.firstName} ${scheduledPart.publisher.lastName}`,
            personType: "publisher",
          }
        }
      }

      // Extract talk number for public talks and circuit overseer talks
      let talkNumber: string | undefined
      if (part.type === MEETING_PART_TYPES.PUBLIC_TALK) {
        const publicTalk = part.scheduledPublicTalks[0]
        talkNumber = publicTalk?.talk?.no || undefined
      }

      return {
        id: part.id,
        type: part.type,
        name: talkName,
        order: part.order,
        talkNumber,
        assignment,
      }
    }),
  }))

  return result
})
