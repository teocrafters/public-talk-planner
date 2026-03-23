import { createError } from "h3"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { scheduledPublicTalks } from "../../database/schema"
import { defineEndpoint } from "../../utils/define-endpoint"
import { logAuditEvent } from "../../utils/audit-log"
import { AUDIT_EVENTS } from "#shared/utils/audit-events"
import type { AuditEventDetails } from "#shared/types/audit-events"
import { isPastDate } from "#shared/utils/date-yyyymmdd"

// UUID params schema
const uuidParamsSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().uuid(t("validation.invalidUuid")),
  })

export default defineEndpoint({
  permissions: { weekend_meetings: ["schedule_public_talks"] },
  params: uuidParamsSchema,
  handler: async (event, { params }) => {
    const scheduleId = params.id

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

  if (isPastDate(existingSchedule.date)) {
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
  },
})
