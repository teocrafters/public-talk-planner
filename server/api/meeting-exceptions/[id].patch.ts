import { createError } from "h3"
import { eq, and, not, inArray } from "drizzle-orm"
import {
	meetingExceptions,
	meetingPrograms,
	meetingProgramParts,
	meetingScheduledParts,
	scheduledPublicTalks,
} from "../../database/schema"
import { validateBody } from "../../utils/validation"
import { updateMeetingExceptionSchema } from "#shared/utils/schemas/meeting-exception"

export default defineEventHandler(async event => {
  await requirePermission({ weekend_meetings: ["manage_exceptions"] })(event)

  const exceptionId = getRouterParam(event, "id")
  if (!exceptionId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.exceptionIdRequired" },
    })
  }

  const body = await validateBody(event, updateMeetingExceptionSchema)
  const db = useDrizzle()

  // Check if exception exists
  const exception = await db.query.meetingExceptions.findFirst({
    where: eq(meetingExceptions.id, exceptionId),
  })

  if (!exception) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      data: { message: "errors.exceptionNotFound" },
    })
  }

  // If date is being changed, validate it
  if (body.date && body.date !== exception.date) {
    // Check if another exception exists on new date (excluding current exception)
    const existingExceptionOnNewDate = await db.query.meetingExceptions.findFirst({
      where: and(eq(meetingExceptions.date, body.date), not(eq(meetingExceptions.id, exceptionId))),
    })

    if (existingExceptionOnNewDate) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "errors.exceptionAlreadyExists" },
      })
    }

    // Check if meeting program exists on new date
    const existingProgramOnNewDate = await db.query.meetingPrograms.findFirst({
      where: and(eq(meetingPrograms.type, "weekend"), eq(meetingPrograms.date, body.date)),
      with: {
        parts: {
          with: {
            meetingScheduledParts: {
              with: {
                publisher: true,
              },
            },
          },
        },
      },
    })

    // If meeting exists on new date and user hasn't confirmed deletion
    if (existingProgramOnNewDate && !body.confirmDeleteExisting) {
      const parts = existingProgramOnNewDate.parts.flatMap(part =>
        part.meetingScheduledParts.map(scheduled => ({
          type: part.type,
          personName: `${scheduled.publisher.firstName} ${scheduled.publisher.lastName}`,
        }))
      )

      throw createError({
        statusCode: 409,
        statusMessage: "Conflict",
        data: {
          message: "errors.meetingAlreadyScheduledOnException",
          meeting: {
            id: existingProgramOnNewDate.id,
            date: existingProgramOnNewDate.date,
            isCircuitOverseerVisit: existingProgramOnNewDate.isCircuitOverseerVisit,
            parts,
          },
        },
      })
    }

    // If confirmed and meeting exists, delete it (cascade)
    if (existingProgramOnNewDate && body.confirmDeleteExisting) {
      const partIds = existingProgramOnNewDate.parts.map(p => p.id)

      const operations = [
        // Delete scheduled public talks
        ...(existingProgramOnNewDate.id
          ? [
              db
                .delete(scheduledPublicTalks)
                .where(eq(scheduledPublicTalks.meetingProgramId, existingProgramOnNewDate.id)),
            ]
          : []),
        // Delete scheduled parts
        ...(partIds.length > 0
          ? [
              db
                .delete(meetingScheduledParts)
                .where(inArray(meetingScheduledParts.meetingProgramPartId, partIds)),
            ]
          : []),
        // Delete program parts
        ...(partIds.length > 0
          ? [db.delete(meetingProgramParts).where(inArray(meetingProgramParts.id, partIds))]
          : []),
        // Delete program
        db.delete(meetingPrograms).where(eq(meetingPrograms.id, existingProgramOnNewDate.id)),
      ]

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.batch(operations as any)
    }
  }

  // Build update object
  const updates: Partial<typeof meetingExceptions.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (body.date !== undefined) {
    updates.date = body.date
  }

  if (body.exceptionType !== undefined) {
    updates.exceptionType = body.exceptionType
  }

  if (body.description !== undefined) {
    updates.description = body.description
  }

  // Update exception
  await db.update(meetingExceptions).set(updates).where(eq(meetingExceptions.id, exceptionId))

  // Log audit event
  await logAuditEvent(event, {
    action: AUDIT_EVENTS.MEETING_EXCEPTION_UPDATED,
    resourceType: "meeting_exception",
    resourceId: exceptionId,
    details: {
      exceptionId,
      date: exception.date,
      changes: {
        date: body.date,
        exceptionType: body.exceptionType,
        description: body.description,
      },
    } satisfies AuditEventDetails[typeof AUDIT_EVENTS.MEETING_EXCEPTION_UPDATED],
  })

  // Fetch updated exception
  const updatedException = await db.query.meetingExceptions.findFirst({
    where: eq(meetingExceptions.id, exceptionId),
  })

  return {
    success: true,
    exception: updatedException,
  }
})
