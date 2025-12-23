import { createError } from "h3"
import { eq, sql } from "drizzle-orm"
import { schema } from "hub:db"
import { validateBody } from "../../utils/validation"
import { editSpeakerSchema } from "#shared/utils/schemas"

export default defineEventHandler(async event => {
  await requirePermission({ speakers: ["update"] })(event)

  const speakerId = getRouterParam(event, "id")
  if (!speakerId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.speakerIdRequired" },
    })
  }

  const body = await validateBody(event, editSpeakerSchema)


  const existingSpeaker = await db
    .select()
    .from(schema.speakers)
    .where(eq(schema.speakers.id, speakerId))
    .limit(1)

  if (!existingSpeaker || existingSpeaker.length === 0 || !existingSpeaker[0]) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      data: { message: "errors.speakerNotFound" },
    })
  }

  if (body.congregationId) {
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

  const updateData: Partial<typeof schema.speakers.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (body.firstName !== undefined) {
    updateData.firstName = body.firstName
  }

  if (body.lastName !== undefined) {
    updateData.lastName = body.lastName
  }

  if (body.phone !== undefined) {
    updateData.phone = body.phone
  }

  if (body.congregationId !== undefined) {
    updateData.congregationId = body.congregationId
  }

  const result = await db
    .update(schema.speakers)
    .set(updateData)
    .where(eq(schema.speakers.id, speakerId))
    .returning()

  const updatedSpeaker = result[0]
  if (!updatedSpeaker) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: { message: "errors.speakerUpdateFailed" },
    })
  }

  if (body.talkIds !== undefined) {
    await db.delete(schema.speakerTalks).where(eq(schema.speakerTalks.speakerId, speakerId))

    if (body.talkIds.length > 0) {
      const talkAssignments = body.talkIds.map((talkId: number) => ({
        speakerId,
        talkId,
        createdAt: new Date(),
      }))

      await db.insert(schema.speakerTalks).values(talkAssignments)
    }
  }

  if (Object.keys(body).length > 0) {
    await logAuditEvent(event, {
      action: AUDIT_EVENTS.SPEAKER_EDITED,
      resourceType: "speaker",
      resourceId: speakerId,
      details: {
        speakerId,
        updates: body,
      } satisfies AuditEventDetails[typeof AUDIT_EVENTS.SPEAKER_EDITED],
    })
  }

  const congregation = await db
    .select()
    .from(schema.organization)
    .where(eq(schema.organization.id, updatedSpeaker.congregationId))
    .limit(1)

  const talks = await db
    .select({
      id: schema.publicTalks.id,
      no: schema.publicTalks.no,
      title: schema.publicTalks.title,
    })
    .from(schema.speakerTalks)
    .innerJoin(schema.publicTalks, eq(schema.speakerTalks.talkId, schema.publicTalks.id))
    .where(eq(schema.speakerTalks.speakerId, speakerId))

  return {
    success: true,
    speaker: {
      ...updatedSpeaker,
      congregationName: congregation[0]?.name || "",
      talks,
    },
  }
})
