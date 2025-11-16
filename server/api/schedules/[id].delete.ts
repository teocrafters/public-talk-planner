import { createError } from "h3"
import { eq } from "drizzle-orm"
import { scheduledPublicTalks } from "../../database/schema"
import { logAuditEvent } from "../../utils/audit-log"

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
      data: { message: "errors.cannotDeletePastSchedule" },
    })
  }

  await db.delete(scheduledPublicTalks).where(eq(scheduledPublicTalks.id, scheduleId))

  await logAuditEvent(event, {
    action: AUDIT_EVENTS.SCHEDULE_DELETED,
    resourceType: "schedule",
    resourceId: scheduleId,
    details: {
      scheduleId,
      date: existingSchedule.date,
      meetingProgramId: existingSchedule.meetingProgramId,
      partId: existingSchedule.partId,
    } satisfies AuditEventDetails[typeof AUDIT_EVENTS.SCHEDULE_DELETED],
  })

  return {
    success: true,
    message: "Schedule deleted successfully",
  }
})
