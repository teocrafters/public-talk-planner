import { createError } from "h3"
import { publicTalks } from "../../database/schema"
import { AUDIT_EVENTS } from "../../../types/audit-events"
import type { AuditEventDetails } from "../../../types/audit-events"

export default defineEventHandler(async event => {
  await requireRole("editor")(event)

  const body = await readBody(event)

  if (!body || !body.no || !body.title) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Talk number and title are required",
    })
  }

  if (typeof body.no !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Talk number must be a string",
    })
  }

  if (typeof body.title !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Title must be a string",
    })
  }

  const multimediaCount = body.multimediaCount ?? 0
  const videoCount = body.videoCount ?? 0

  if (typeof multimediaCount !== "number" || multimediaCount < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Multimedia count must be a non-negative number",
    })
  }

  if (typeof videoCount !== "number" || videoCount < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Video count must be a non-negative number",
    })
  }

  const db = useDrizzle()

  const result = await db
    .insert(publicTalks)
    .values({
      no: body.no,
      title: body.title,
      multimediaCount,
      videoCount,
      status: body.status || null,
      createdAt: new Date(),
    })
    .returning()

  const newTalk = result[0]
  if (!newTalk) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: "Failed to create talk",
    })
  }

  await logAuditEvent(event, {
    action: AUDIT_EVENTS.TALK_CREATED,
    resourceType: "public_talk",
    resourceId: newTalk.id.toString(),
    details: {
      talkId: newTalk.id,
      talkNo: newTalk.no,
      title: newTalk.title,
      multimediaCount: newTalk.multimediaCount,
      videoCount: newTalk.videoCount,
    } satisfies AuditEventDetails[typeof AUDIT_EVENTS.TALK_CREATED],
  })

  return {
    success: true,
    talk: newTalk,
  }
})
