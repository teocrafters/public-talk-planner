import { createError } from "h3"
import { eq } from "drizzle-orm"
import { publishers } from "../../database/schema"
import { validateBody } from "../../utils/validation"
import { updatePublisherSchema } from "#shared/utils/schemas"

export default defineEventHandler(async event => {
  await requirePermission({ publishers: ["update"] })(event)

  const publisherId = getRouterParam(event, "id")
  if (!publisherId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.publisherIdRequired" },
    })
  }

  const body = await validateBody(event, updatePublisherSchema)

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
})
