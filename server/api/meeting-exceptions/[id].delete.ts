import { createError } from "h3"
import { eq } from "drizzle-orm"
import { meetingExceptions } from "../../database/schema"

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

  const db = useDrizzle()

  const existingException = await db.query.meetingExceptions.findFirst({
    where: eq(meetingExceptions.id, exceptionId),
  })

  if (!existingException) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      data: { message: "errors.exceptionNotFound" },
    })
  }

  await db.delete(meetingExceptions).where(eq(meetingExceptions.id, exceptionId))

  await logAuditEvent(event, {
    action: AUDIT_EVENTS.MEETING_EXCEPTION_DELETED,
    resourceType: "meeting_exception",
    resourceId: exceptionId,
    details: {
      exceptionId,
      date: existingException.date,
      exceptionType: existingException.exceptionType,
    } satisfies AuditEventDetails[typeof AUDIT_EVENTS.MEETING_EXCEPTION_DELETED],
  })

  return {
    success: true,
  }
})
