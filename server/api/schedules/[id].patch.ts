import { createError } from "h3"
import { eq, and } from "drizzle-orm"
import {
  speakers,
  publishers,
  publicTalks,
  scheduledPublicTalks,
  speakerTalks,
} from "../../database/schema"
import { updateScheduleSchema } from "#shared/utils/schemas"
import { SPEAKER_SOURCE_TYPES } from "#shared/constants/speaker-sources"

export default defineEventHandler(async event => {
  await requirePermission({ weekend_meetings: ["schedule_public_talks"] })(event)

  const scheduleId = getRouterParam(event, "id")
  if (!scheduleId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.scheduleIdRequired" },
    })
  }

  const body = await validateBody(event, updateScheduleSchema)

  const db = useDrizzle()

  const existingSchedule = await db.query.scheduledPublicTalks.findFirst({
    where: eq(scheduledPublicTalks.id, scheduleId),
  })

  if (!existingSchedule) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      data: { message: "errors.scheduleNotFound" },
    })
  }

  const today = dayjs().startOf("day").toDate()

  if (existingSchedule.date < today) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: { message: "errors.cannotEditPastSchedule" },
    })
  }

  // Determine which source type to use for validation
  const sourceType = body.speakerSourceType || existingSchedule.speakerSourceType

  // Validate speaker or publisher based on source type
  if (sourceType === SPEAKER_SOURCE_TYPES.VISITING_SPEAKER) {
    const speakerIdToValidate = body.speakerId || existingSchedule.speakerId

    if (!speakerIdToValidate) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "validation.speakerRequired" },
      })
    }

    if (body.speakerId) {
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
    }
  } else if (sourceType === SPEAKER_SOURCE_TYPES.LOCAL_PUBLISHER) {
    const publisherIdToValidate = body.publisherId || existingSchedule.publisherId

    if (!publisherIdToValidate) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "validation.publisherRequired" },
      })
    }

    if (body.publisherId) {
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
    if (sourceType === SPEAKER_SOURCE_TYPES.VISITING_SPEAKER && !body.overrideValidation) {
      const speakerIdToCheck = body.speakerId || existingSchedule.speakerId

      if (speakerIdToCheck) {
        const speakerHasTalk = await db.query.speakerTalks.findFirst({
          where: and(
            eq(speakerTalks.speakerId, speakerIdToCheck),
            eq(speakerTalks.talkId, body.talkId)
          ),
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
  }

  const updateData: Partial<typeof scheduledPublicTalks.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (body.speakerSourceType !== undefined) {
    updateData.speakerSourceType = body.speakerSourceType
  }
  if (body.speakerId !== undefined) {
    updateData.speakerId = body.speakerId
  }
  if (body.publisherId !== undefined) {
    updateData.publisherId = body.publisherId
  }
  if (body.talkId !== undefined) {
    updateData.talkId = body.talkId
  }
  if (body.customTalkTitle !== undefined) {
    updateData.customTalkTitle = body.customTalkTitle
  }
  // NOTE: isCircuitOverseerVisit moved to meetingPrograms table
  if (body.overrideValidation !== undefined) {
    updateData.overrideValidation = body.overrideValidation
  }

  await db
    .update(scheduledPublicTalks)
    .set(updateData)
    .where(eq(scheduledPublicTalks.id, scheduleId))

  await logAuditEvent(event, {
    action: AUDIT_EVENTS.SCHEDULE_UPDATED,
    resourceType: "schedule",
    resourceId: scheduleId,
    details: {
      scheduleId,
      date: existingSchedule.date,
      meetingProgramId: existingSchedule.meetingProgramId,
      partId: existingSchedule.partId,
      changes: body,
    } satisfies AuditEventDetails[typeof AUDIT_EVENTS.SCHEDULE_UPDATED],
  })

  const updatedSchedule = await db.query.scheduledPublicTalks.findFirst({
    where: eq(scheduledPublicTalks.id, scheduleId),
    with: {
      speaker: true,
      publisher: true,
      talk: true,
      meetingProgram: true,
      part: true,
    },
  })

  if (!updatedSchedule) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: { message: "errors.scheduleUpdateFailed" },
    })
  }

  // Determine speaker name based on source type
  let speakerName = ""
  if (
    updatedSchedule.speakerSourceType === SPEAKER_SOURCE_TYPES.VISITING_SPEAKER &&
    updatedSchedule.speaker
  ) {
    speakerName = `${updatedSchedule.speaker.firstName} ${updatedSchedule.speaker.lastName}`
  } else if (
    updatedSchedule.speakerSourceType === SPEAKER_SOURCE_TYPES.LOCAL_PUBLISHER &&
    updatedSchedule.publisher
  ) {
    speakerName = `${updatedSchedule.publisher.firstName} ${updatedSchedule.publisher.lastName}`
  }

  return {
    success: true,
    schedule: {
      ...updatedSchedule,
      speakerName,
      talkNumber: updatedSchedule.talk?.no,
      talkTitle: updatedSchedule.customTalkTitle || updatedSchedule.talk?.title,
    },
  }
})
