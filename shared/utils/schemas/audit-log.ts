import { z } from "zod"
import { AUDIT_EVENTS } from "../audit-events"

export const clientAuditEventSchema = (t: (key: string) => string) => {
  return z.object({
    action: z.enum(AUDIT_EVENTS, { message: t("validation.required") }),

    resourceType: z.string().min(1, t("validation.required")),

    resourceId: z.string().optional(),

    details: z.record(z.string(), z.unknown()).optional(),
  })
}

export type ClientAuditEventInput = z.infer<ReturnType<typeof clientAuditEventSchema>>
