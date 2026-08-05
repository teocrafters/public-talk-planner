import { setResponseStatus } from "h3"
import { defineEndpoint } from "../utils/define-endpoint"
import { clientAuditEventSchema } from "#shared/utils/schemas/audit-log"

export default defineEndpoint({
  auth: true,
  body: clientAuditEventSchema,
  handler: async (event, { body }): Promise<{ ok: true }> => {
    await logAuditEvent(event, {
      action: body.action,
      resourceType: body.resourceType,
      resourceId: body.resourceId ?? "",
      // Detail shape varies per action, so it stays opaque JSON across the client boundary.
      details: (body.details ?? {}) as AuditEventDetails[keyof AuditEventDetails],
    })

    setResponseStatus(event, 201)

    return { ok: true }
  },
})
