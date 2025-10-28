import { createError } from "h3"
import { eq } from "drizzle-orm"
import { publicTalks } from "../../../database/schema"

export default defineEventHandler(async event => {
  await requirePermission({ talks: ["flag"] })(event)

  const id = parseInt(getRouterParam(event, "id") || "")
  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Invalid talk ID",
    })
  }

  const body = await readBody(event)

  if (!body || typeof body.status === "undefined") {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Status is required",
    })
  }

  const validStatuses = ["circuit_overseer", "will_be_replaced", null]
  if (body.status !== null && !validStatuses.includes(body.status)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Invalid status value. Must be 'circuit_overseer', 'will_be_replaced', or null",
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

  const oldStatus = talk.status
  const newStatus = body.status

  await db.update(publicTalks).set({ status: newStatus }).where(eq(publicTalks.id, id))

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
    action: AUDIT_EVENTS.TALK_STATUS_CHANGED,
    resourceType: "public_talk",
    resourceId: id.toString(),
    details: {
      talkId: id,
      talkNo: talk.no,
      oldStatus,
      newStatus,
    } satisfies AuditEventDetails[typeof AUDIT_EVENTS.TALK_STATUS_CHANGED],
  })

  return {
    success: true,
    talk: updated,
  }
})
