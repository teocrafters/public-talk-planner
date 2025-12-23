import { createError } from "h3"
import { schema } from "hub:db"
import { validateBody } from "../../utils/validation"
import { createTalkSchema } from "#shared/utils/schemas"

export default defineEventHandler(async event => {
  await requirePermission({ talks: ["create"] })(event)

  const body = await validateBody(event, createTalkSchema)

  const result = await db
    .insert(schema.publicTalks)
    .values({
      no: body.no,
      title: body.title,
      multimediaCount: body.multimediaCount,
      videoCount: body.videoCount,
      status: null,
      createdAt: new Date(),
    })
    .returning()

  const newTalk = result[0]
  if (!newTalk) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: { message: "errors.talkCreateFailed" },
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
