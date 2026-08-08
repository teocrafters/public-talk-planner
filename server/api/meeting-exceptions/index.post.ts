import { createError } from "h3"
import { eq, inArray } from "drizzle-orm"
import {
  meetingExceptions,
  meetingPrograms,
  meetingProgramParts,
  meetingScheduledParts,
  scheduledPublicTalks,
} from "../../database/schema"
import { defineEndpoint } from "../../utils/define-endpoint"
import { createMeetingExceptionSchema } from "#shared/utils/schemas/meeting-exception"

export default defineEndpoint({
  permissions: { weekend_meetings: ["manage_exceptions"] },
  body: createMeetingExceptionSchema,
  handler: async (event, { body }): Promise<unknown> => {
    const db = useDrizzle()

    // Check if exception already exists for this date (direct string comparison)
    const existingException = await db.query.meetingExceptions.findFirst({
      where: eq(meetingExceptions.date, body.date),
    })

    if (existingException) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "errors.exceptionAlreadyExists" },
      })
    }

    // Check if meeting program exists for this date (direct string comparison)
    const existingProgram = await db.query.meetingPrograms.findFirst({
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

    // Validate confirmation before proceeding
    if (existingProgram && !body.confirmDeleteExisting) {
      // Return 409 with meeting details for user confirmation
      const parts = existingProgram.parts.flatMap(part =>
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
            id: existingProgram.id,
            date: existingProgram.date,
            isCircuitOverseerVisit: existingProgram.isCircuitOverseerVisit,
            parts,
          },
        },
      })
    }

    const deletedMeetingId = existingProgram?.id
    const exceptionId = crypto.randomUUID()
    const now = new Date()

    await db.transaction(async tx => {
      if (existingProgram) {
        // Deletion order is dictated by the RESTRICT constraints, not by cascade
        await tx
          .delete(scheduledPublicTalks)
          .where(eq(scheduledPublicTalks.meetingProgramId, existingProgram.id))

        const parts = await tx
          .select({ id: meetingProgramParts.id })
          .from(meetingProgramParts)
          .where(eq(meetingProgramParts.meetingProgramId, existingProgram.id))

        if (parts.length > 0) {
          await tx.delete(meetingScheduledParts).where(
            inArray(
              meetingScheduledParts.meetingProgramPartId,
              parts.map(part => part.id)
            )
          )
        }

        await tx
          .delete(meetingProgramParts)
          .where(eq(meetingProgramParts.meetingProgramId, existingProgram.id))

        await tx.delete(meetingPrograms).where(eq(meetingPrograms.id, existingProgram.id))
      }

      await tx.insert(meetingExceptions).values({
        id: exceptionId,
        date: body.date,
        exceptionType: body.exceptionType,
        description: body.description || null,
        createdAt: now,
        updatedAt: now,
      })
    })

    // Log audit event
    await logAuditEvent(event, {
      action: AUDIT_EVENTS.MEETING_EXCEPTION_CREATED,
      resourceType: "meeting_exception",
      resourceId: exceptionId,
      details: {
        exceptionId,
        date: body.date,
        exceptionType: body.exceptionType,
        description: body.description || null,
        deletedExistingMeeting: !!deletedMeetingId,
        deletedMeetingId,
      } satisfies AuditEventDetails[typeof AUDIT_EVENTS.MEETING_EXCEPTION_CREATED],
    })

    return {
      success: true,
      exception: {
        id: exceptionId,
        date: body.date,
        exceptionType: body.exceptionType,
      },
    }
  },
})
