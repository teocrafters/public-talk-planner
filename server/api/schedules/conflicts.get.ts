import { createError } from "h3"
import { eq, and } from "drizzle-orm"
import { schema } from "hub:db"

export default defineEventHandler(async event => {
  await requirePermission({ weekend_meetings: ["schedule_public_talks"] })(event)

  const query = getQuery(event)
  const dateStr = query.date as string
  const meetingProgramId = query.meetingProgramId
    ? Number.parseInt(query.meetingProgramId as string, 10)
    : undefined
  const partId = query.partId ? Number.parseInt(query.partId as string, 10) : undefined

  if (!dateStr || !meetingProgramId || !partId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.dateAndProgramAndPartRequired" },
    })
  }

  const parsedDate = dayjs(dateStr)

  if (!parsedDate.isValid()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.invalidDateFormat" },
    })
  }

  const date = parsedDate.startOf("day").toDate()


  const existingSchedule = await db.query.schema.scheduledPublicTalks.findFirst({
    where: and(
      eq(schema.scheduledPublicTalks.date, date),
      eq(schema.scheduledPublicTalks.meetingProgramId, meetingProgramId),
      eq(schema.scheduledPublicTalks.partId, partId)
    ),
    with: {
      speaker: true,
      publisher: true,
      talk: true,
      meetingProgram: true,
      part: true,
    },
  })

  if (existingSchedule) {
    // Determine speaker name based on source type
    let speakerName = ""
    if (existingSchedule.speakerSourceType === "visiting_speaker" && existingSchedule.speaker) {
      speakerName = `${existingSchedule.speaker.firstName} ${existingSchedule.speaker.lastName}`
    } else if (
      existingSchedule.speakerSourceType === "local_publisher" &&
      existingSchedule.publisher
    ) {
      speakerName = `${existingSchedule.publisher.firstName} ${existingSchedule.publisher.lastName}`
    }

    return {
      hasConflict: true,
      existingSchedule: {
        ...existingSchedule,
        speakerName,
        talkNumber: existingSchedule.talk?.no,
        talkTitle: existingSchedule.customTalkTitle || existingSchedule.talk?.title,
      },
    }
  }

  return {
    hasConflict: false,
    existingSchedule: null,
  }
})
