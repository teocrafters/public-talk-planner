import { createError } from "h3"
import { eq } from "drizzle-orm"
import { meetingExceptions } from "../../database/schema"
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

  // Build update object
  const updates: Partial<typeof meetingExceptions.$inferInsert> = {
    updatedAt: new Date(),
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
