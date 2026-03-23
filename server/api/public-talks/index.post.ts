import { createError } from "h3"
import { publicTalks } from "../../database/schema"
import { defineEndpoint } from "../../utils/define-endpoint"
import { createTalkSchema } from "#shared/utils/schemas"
import { logAuditEvent } from "../../utils/audit-log"
import { AUDIT_EVENTS } from "#shared/utils/audit-events"
import type { AuditEventDetails } from "#shared/types/audit-events"

export default defineEndpoint({
  permissions: { talks: ["create"] },
  body: createTalkSchema,
  handler: async (event, { body }) => {
    const db = useDrizzle()

    const result = await db
      .insert(publicTalks)
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
  },
})
