import { eq, gte, lte, and } from "drizzle-orm"
import { meetingPrograms } from "../../database/schema"
import { MEETING_PART_TYPES } from "#shared/constants/meetings"

export default defineEventHandler(async (event): Promise<WeekendMeetingListItem[]> => {
  await requirePermission({ weekend_meetings: ["list"] })(event)

  const db = useDrizzle()
  const query = getQuery(event)

  // Build where conditions
  const whereConditions = [eq(meetingPrograms.type, "weekend")]

  // Date range filter
  if (query.startDate && typeof query.startDate === "string") {
    const startTimestamp = parseInt(query.startDate)
    whereConditions.push(gte(meetingPrograms.date, startTimestamp))
  }

  if (query.endDate && typeof query.endDate === "string") {
    const endTimestamp = parseInt(query.endDate)
    whereConditions.push(lte(meetingPrograms.date, endTimestamp))
  }

  // Fetch programs with parts and assignments
  const programs = await db.query.meetingPrograms.findMany({
    where: and(...whereConditions),
    with: {
      parts: {
        orderBy: (parts, { asc }) => [asc(parts.order)],
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
    orderBy: (programs, { asc }) => [asc(programs.date)],
  })

  // Transform to response format
  const result: WeekendMeetingListItem[] = programs.map(program => ({
    id: program.id,
    date: program.date,
    isCircuitOverseerVisit: program.isCircuitOverseerVisit,
    parts: program.parts.map(part => {
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
      } else {
        // For all other parts (including circuit_overseer_talk), use meetingScheduledParts (publishers)
        const scheduledPart = part.meetingScheduledParts[0]
        if (scheduledPart?.publisher) {
          assignment = {
            personId: scheduledPart.publisherId,
            personName: `${scheduledPart.publisher.firstName} ${scheduledPart.publisher.lastName}`,
            personType: "publisher",
          }
        }
      }

      return {
        id: part.id,
        type: part.type,
        name: talkName,
        order: part.order,
        assignment,
      }
    }),
  }))

  return result
})
