import { createError } from "h3"
import { eq } from "drizzle-orm"
import { schema } from "hub:db"
import { validateBody } from "../../utils/validation"
import { createPublisherSchema } from "#shared/utils/schemas"

export default defineEventHandler(async event => {
  await requirePermission({ publishers: ["create"] })(event)

  const body = await validateBody(event, createPublisherSchema)


  // Validate userId if provided
  if (body.userId) {
    const userExists = await db.select().from(schema.user).where(eq(schema.user.id, body.userId)).limit(1)

    if (!userExists || userExists.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "errors.userNotFound" },
      })
    }

    // Check if user is already linked to another publisher
    const existingPublisher = await db
      .select()
      .from(schema.publishers)
      .where(eq(schema.publishers.userId, body.userId))
      .limit(1)

    if (existingPublisher && existingPublisher.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "errors.userAlreadyLinked" },
      })
    }
  }

  const publisherId = crypto.randomUUID()

  const result = await db
    .insert(schema.publishers)
    .values({
      id: publisherId,
      firstName: body.firstName,
      lastName: body.lastName,
      userId: body.userId || null,
      isElder: body.isElder || false,
      isMinisterialServant: body.isMinisterialServant || false,
      isRegularPioneer: body.isRegularPioneer || false,
      canChairWeekendMeeting: body.canChairWeekendMeeting || false,
      conductsWatchtowerStudy: body.conductsWatchtowerStudy || false,
      backupWatchtowerConductor: body.backupWatchtowerConductor || false,
      isReader: body.isReader || false,
      offersPublicPrayer: body.offersPublicPrayer || false,
      isCircuitOverseer: body.isCircuitOverseer || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  const newPublisher = result[0]
  if (!newPublisher) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: { message: "errors.publisherCreateFailed" },
    })
  }

  await logAuditEvent(event, {
    action: AUDIT_EVENTS.PUBLISHER_CREATED,
    resourceType: "publisher",
    resourceId: publisherId,
    details: {
      publisherId,
      firstName: newPublisher.firstName,
      lastName: newPublisher.lastName,
      userId: newPublisher.userId,
    } satisfies AuditEventDetails[typeof AUDIT_EVENTS.PUBLISHER_CREATED],
  })

  return {
    success: true,
    publisher: newPublisher,
  }
})
