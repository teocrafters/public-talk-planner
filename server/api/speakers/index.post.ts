import { createError } from "h3"
import { eq, sql } from "drizzle-orm"
import { schema } from "hub:db"
import { validateBody } from "../../utils/validation"
import { createSpeakerSchema } from "#shared/utils/schemas"

export default defineEventHandler(async event => {
  await requirePermission({ speakers: ["create"] })(event)

  const body = await validateBody(event, createSpeakerSchema)


  const congregationExists = await db
    .select()
    .from(schema.organization)
    .where(eq(schema.organization.id, body.congregationId))
    .limit(1)

  if (!congregationExists || congregationExists.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.congregationNotFound" },
    })
  }

  if (body.talkIds && body.talkIds.length > 0) {
    const talksExist = await db
      .select()
      .from(schema.publicTalks)
      .where(sql`${schema.publicTalks.id} IN ${body.talkIds}`)

    if (talksExist.length !== body.talkIds.length) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "errors.talksInvalid" },
      })
    }
  }

  const speakerId = crypto.randomUUID()

  const result = await db
    .insert(schema.speakers)
    .values({
      id: speakerId,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      congregationId: body.congregationId,
      archived: false,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  const newSpeaker = result[0]
  if (!newSpeaker) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: { message: "errors.speakerCreateFailed" },
    })
  }

  if (body.talkIds && body.talkIds.length > 0) {
    const talkAssignments = body.talkIds.map((talkId: number) => ({
      speakerId,
      talkId,
      createdAt: new Date(),
    }))

    await db.insert(schema.speakerTalks).values(talkAssignments)
  }

  await logAuditEvent(event, {
    action: AUDIT_EVENTS.SPEAKER_CREATED,
    resourceType: "speaker",
    resourceId: speakerId,
    details: {
      speakerId,
      firstName: newSpeaker.firstName,
      lastName: newSpeaker.lastName,
      congregationId: newSpeaker.congregationId,
      talkCount: body.talkIds?.length || 0,
    } satisfies AuditEventDetails[typeof AUDIT_EVENTS.SPEAKER_CREATED],
  })

  const congregation = await db
    .select()
    .from(schema.organization)
    .where(eq(schema.organization.id, newSpeaker.congregationId))
    .limit(1)

  const talks =
    body.talkIds && body.talkIds.length > 0
      ? await db
          .select({
            id: schema.publicTalks.id,
            no: schema.publicTalks.no,
            title: schema.publicTalks.title,
          })
          .from(schema.publicTalks)
          .where(sql`${schema.publicTalks.id} IN ${body.talkIds}`)
      : []

  return {
    success: true,
    speaker: {
      ...newSpeaker,
      congregationName: congregation[0]?.name || "",
      talks,
    },
  }
})
