import { createError } from "h3"
import { eq, and } from "drizzle-orm"
import {
  speakers,
  publishers,
  meetingPrograms,
  meetingProgramParts,
  publicTalks,
  scheduledPublicTalks,
  speakerTalks,
} from "../../database/schema"
import { createScheduleSchema } from "#shared/utils/schemas"
import { MEETING_PART_TYPES } from "#shared/constants/meetings"
import { SPEAKER_SOURCE_TYPES } from "#shared/constants/speaker-sources"

export default defineEventHandler(async event => {
  await requirePermission({
    weekend_meetings: ["schedule_public_talks", "schedule_public_talks"],
  })(event)

  const body = await validateBody(event, createScheduleSchema)

  const db = useDrizzle()

  const date = dayjs.unix(body.date).toDate()

  if (date.getDay() !== 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.dateMustBeSunday" },
    })
  }

  // Validate speaker or publisher based on source type
  if (body.speakerSourceType === SPEAKER_SOURCE_TYPES.VISITING_SPEAKER) {
    if (!body.speakerId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "validation.speakerRequired" },
      })
    }

    const speaker = await db.query.speakers.findFirst({
      where: eq(speakers.id, body.speakerId),
    })

    if (!speaker || speaker.archived) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "errors.speakerNotFoundOrArchived" },
      })
    }
  } else if (body.speakerSourceType === SPEAKER_SOURCE_TYPES.LOCAL_PUBLISHER) {
    if (!body.publisherId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "validation.publisherRequired" },
      })
    }

    const publisher = await db.query.publishers.findFirst({
      where: eq(publishers.id, body.publisherId),
    })

    if (!publisher) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "errors.publisherNotFound" },
      })
    }

    if (!publisher.deliversPublicTalks) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "errors.publisherCannotDeliverPublicTalks" },
      })
    }
  }

  // Find or create meetingPrograms entry for this date
  let meetingProgram = await db.query.meetingPrograms.findFirst({
    where: and(eq(meetingPrograms.type, "weekend"), eq(meetingPrograms.date, body.date)),
  })

  if (!meetingProgram) {
    const programResult = await db
      .insert(meetingPrograms)
      .values({
        type: "weekend",
        date: body.date,
        isCircuitOverseerVisit: false,
        name: null,
        createdAt: new Date(),
      })
      .returning()

    meetingProgram = programResult[0]
    if (!meetingProgram) {
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
        data: { message: "errors.meetingProgramCreateFailed" },
      })
    }
  }

  // Find or create PUBLIC_TALK part for this meeting
  let part = await db.query.meetingProgramParts.findFirst({
    where: and(
      eq(meetingProgramParts.meetingProgramId, meetingProgram.id),
      eq(meetingProgramParts.type, MEETING_PART_TYPES.PUBLIC_TALK)
    ),
  })

  if (!part) {
    const partResult = await db
      .insert(meetingProgramParts)
      .values({
        meetingProgramId: meetingProgram.id,
        type: MEETING_PART_TYPES.PUBLIC_TALK,
        name: null,
        order: 2,
        createdAt: new Date(),
      })
      .returning()

    part = partResult[0]
    if (!part) {
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
        data: { message: "errors.partCreateFailed" },
      })
    }
  }

  const existing = await db.query.scheduledPublicTalks.findFirst({
    where: and(
      eq(scheduledPublicTalks.date, date),
      eq(scheduledPublicTalks.meetingProgramId, meetingProgram.id),
      eq(scheduledPublicTalks.partId, part.id)
    ),
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: "Conflict",
      data: { message: "errors.scheduleAlreadyExists" },
    })
  }

  if (body.talkId) {
    const talk = await db.query.publicTalks.findFirst({
      where: eq(publicTalks.id, body.talkId),
    })

    if (!talk) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "errors.talkNotFound" },
      })
    }

    // Validate speaker has talk assignment (only for visiting speakers)
    if (
      body.speakerSourceType === SPEAKER_SOURCE_TYPES.VISITING_SPEAKER &&
      !body.overrideValidation
    ) {
      const speakerHasTalk = await db.query.speakerTalks.findFirst({
        where: and(eq(speakerTalks.speakerId, body.speakerId!), eq(speakerTalks.talkId, body.talkId)),
      })

      if (!speakerHasTalk) {
        throw createError({
          statusCode: 422,
          statusMessage: "Unprocessable Entity",
          data: { message: "errors.speakerDoesntHaveTalk" },
        })
      }
    }
  }

  const scheduleId = crypto.randomUUID()
  const now = dayjs().toDate()

  await db.insert(scheduledPublicTalks).values({
    id: scheduleId,
    date: date,
    meetingProgramId: meetingProgram.id,
    partId: part.id,
    speakerSourceType: body.speakerSourceType,
    speakerId: body.speakerId || null,
    publisherId: body.publisherId || null,
    talkId: body.talkId || null,
    customTalkTitle: body.customTalkTitle || null,
    overrideValidation: body.overrideValidation || false,
    createdAt: now,
    updatedAt: now,
  })

  // Note: PUBLIC_TALK assignments are handled via scheduledPublicTalks table only
  // Do NOT create meetingScheduledParts for public talks

  await logAuditEvent(event, {
    action: AUDIT_EVENTS.SCHEDULE_CREATED,
    resourceType: "schedule",
    resourceId: scheduleId,
    details: {
      scheduleId,
      date: date,
      meetingProgramId: meetingProgram.id,
      partId: part.id,
      speakerSourceType: body.speakerSourceType,
      speakerId: body.speakerId || null,
      publisherId: body.publisherId || null,
      talkId: body.talkId || null,
      customTalkTitle: body.customTalkTitle || null,
      isCircuitOverseerVisit: false,
    } satisfies AuditEventDetails[typeof AUDIT_EVENTS.SCHEDULE_CREATED],
  })

  const schedule = await db.query.scheduledPublicTalks.findFirst({
    where: eq(scheduledPublicTalks.id, scheduleId),
    with: {
      speaker: true,
      publisher: true,
      talk: true,
      meetingProgram: true,
      part: true,
    },
  })

  if (!schedule) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: { message: "errors.scheduleCreateFailed" },
    })
  }

  // Determine speaker name based on source type
  let speakerName = ""
  if (schedule.speakerSourceType === SPEAKER_SOURCE_TYPES.VISITING_SPEAKER && schedule.speaker) {
    speakerName = `${schedule.speaker.firstName} ${schedule.speaker.lastName}`
  } else if (
    schedule.speakerSourceType === SPEAKER_SOURCE_TYPES.LOCAL_PUBLISHER &&
    schedule.publisher
  ) {
    speakerName = `${schedule.publisher.firstName} ${schedule.publisher.lastName}`
  }

  return {
    success: true,
    schedule: {
      ...schedule,
      speakerName,
      talkNumber: schedule.talk?.no,
      talkTitle: schedule.customTalkTitle || schedule.talk?.title,
    },
  }
})
