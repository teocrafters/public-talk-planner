import { createError } from "h3"
import { eq } from "drizzle-orm"
import { publishers } from "../../database/schema"
import { defineEndpoint } from "../../utils/define-endpoint"
import { updatePublisherSchema, uuidParamsSchema } from "#shared/utils/schemas"
import { logAuditEvent } from "../../utils/audit-log"
import { AUDIT_EVENTS } from "#shared/utils/audit-events"
import type { AuditEventDetails } from "#shared/types/audit-events"

export default defineEndpoint({
  permissions: { publishers: ["update"] },
  params: uuidParamsSchema,
  body: updatePublisherSchema,
  handler: async (event, { params, body }) => {
    const publisherId = params.id

  const db = useDrizzle()

  // Check if publisher exists
  const existingPublisher = await db
    .select()
    .from(publishers)
    .where(eq(publishers.id, publisherId))
    .limit(1)

  if (!existingPublisher || existingPublisher.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      data: { message: "errors.publisherNotFound" },
    })
  }

  // Update publisher
  const result = await db
    .update(publishers)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(eq(publishers.id, publisherId))
    .returning()

  const updatedPublisher = result[0]
  if (!updatedPublisher) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: { message: "errors.publisherUpdateFailed" },
    })
  }

  await logAuditEvent(event, {
    action: AUDIT_EVENTS.PUBLISHER_UPDATED,
    resourceType: "publisher",
    resourceId: publisherId,
    details: {
      publisherId,
      changes: body,
    } satisfies AuditEventDetails[typeof AUDIT_EVENTS.PUBLISHER_UPDATED],
  })

  return {
    success: true,
    publisher: updatedPublisher,
  }
  }
})
