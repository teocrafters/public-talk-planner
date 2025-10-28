import { createError } from "h3"
import { eq } from "drizzle-orm"
import { publicTalks } from "../../database/schema"

export default defineEventHandler(async event => {
  await requirePermission({ talks: ["update"] })(event)

  const id = parseInt(getRouterParam(event, "id") || "")
  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Invalid talk ID",
    })
  }

  const body = await readBody(event)

  if (!body || Object.keys(body).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Request body is required",
    })
  }

  const db = useDrizzle()

  const existingTalk = await db.select().from(publicTalks).where(eq(publicTalks.id, id)).limit(1)

  if (!existingTalk || existingTalk.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      message: "Talk not found",
    })
  }

  const talk = existingTalk[0]
  if (!talk) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      message: "Talk not found",
    })
  }

  const allowedFields = ["no", "title", "multimediaCount", "videoCount"]
  const updateData: Record<string, any> = {}
  const changes: Record<string, { old: any; new: any }> = {}

  for (const [key, value] of Object.entries(body)) {
    if (allowedFields.includes(key)) {
      const oldValue = talk[key as keyof typeof talk]
      if (oldValue !== value) {
        updateData[key] = value
        changes[key] = { old: oldValue, new: value }
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    return {
      success: true,
      talk,
    }
  }

  if (updateData.no && typeof updateData.no !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Talk number must be a string",
    })
  }

  if (updateData.title && typeof updateData.title !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Title must be a string",
    })
  }

  if (updateData.multimediaCount !== undefined && typeof updateData.multimediaCount !== "number") {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Multimedia count must be a number",
    })
  }

  if (updateData.videoCount !== undefined && typeof updateData.videoCount !== "number") {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Video count must be a number",
    })
  }

  await db.update(publicTalks).set(updateData).where(eq(publicTalks.id, id))

  const updatedTalk = await db.select().from(publicTalks).where(eq(publicTalks.id, id)).limit(1)

  const updated = updatedTalk[0]
  if (!updated) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: "Failed to retrieve updated talk",
    })
  }

  await logAuditEvent(event, {
    action: AUDIT_EVENTS.TALK_EDITED,
    resourceType: "public_talk",
    resourceId: id.toString(),
    details: {
      talkId: id,
      talkNo: talk.no,
      changes,
    } satisfies AuditEventDetails[typeof AUDIT_EVENTS.TALK_EDITED],
  })

  return {
    success: true,
    talk: updated,
  }
})
