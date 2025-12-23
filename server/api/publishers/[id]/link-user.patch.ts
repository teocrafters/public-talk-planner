import { createError } from "h3"
import { eq } from "drizzle-orm"
import { schema } from "hub:db"
import { validateBody } from "../../../utils/validation"
import { linkUserSchema } from "#shared/utils/schemas"

export default defineEventHandler(async event => {
  await requirePermission({ publishers: ["link_to_user"] })(event)

  const publisherId = getRouterParam(event, "id")
  if (!publisherId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.publisherIdRequired" },
    })
  }
  const body = await validateBody(event, linkUserSchema)


  // Check if publisher exists
  const existingPublisher = await db
    .select()
    .from(schema.publishers)
    .where(eq(schema.publishers.id, publisherId))
    .limit(1)

  if (!existingPublisher || existingPublisher.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      data: { message: "errors.publisherNotFound" },
    })
  }

  // If linking to a user (not unlinking)
  if (body.userId) {
    // Validate user exists
    const userExists = await db.select().from(schema.user).where(eq(schema.user.id, body.userId)).limit(1)

    if (!userExists || userExists.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "errors.userNotFound" },
      })
    }

    // Check if user is already linked to another publisher
    const existingLink = await db
      .select()
      .from(schema.publishers)
      .where(eq(schema.publishers.userId, body.userId))
      .limit(1)

    if (existingLink.length > 0 && existingLink[0]!.id !== publisherId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "errors.userAlreadyLinked" },
      })
    }
  }

  // Update publisher with new userId (or null to unlink)
  const result = await db
    .update(schema.publishers)
    .set({
      userId: body.userId,
      updatedAt: new Date(),
    })
    .where(eq(schema.publishers.id, publisherId))
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
    action: body.userId ? AUDIT_EVENTS.PUBLISHER_USER_LINKED : AUDIT_EVENTS.PUBLISHER_USER_UNLINKED,
    resourceType: "publisher",
    resourceId: publisherId,
    details: {
      publisherId,
      userId: body.userId,
    } satisfies
      | AuditEventDetails[typeof AUDIT_EVENTS.PUBLISHER_USER_LINKED]
      | AuditEventDetails[typeof AUDIT_EVENTS.PUBLISHER_USER_UNLINKED],
  })

  return {
    success: true,
    publisher: updatedPublisher,
  }
})
