import { createError } from "h3"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { publicTalks } from "../../database/schema"
import { defineEndpoint } from "../../utils/define-endpoint"
import { updateTalkSchema } from "#shared/utils/schemas"
import { logAuditEvent } from "../../utils/audit-log"
import { AUDIT_EVENTS } from "#shared/utils/audit-events"
import type { AuditEventDetails } from "#shared/types/audit-events"

// Numeric ID params schema
const numericIdParamsSchema = (t: (key: string) => string) =>
  z.object({
    id: z.coerce.number().int().positive(t("validation.invalidId")),
  })

export default defineEndpoint({
  permissions: { talks: ["update"] },
  params: numericIdParamsSchema,
  body: updateTalkSchema,
  handler: async (event, { params, body }) => {
    const id = params.id

    const db = useDrizzle()

    const existingTalk = await db.select().from(publicTalks).where(eq(publicTalks.id, id)).limit(1)

    if (!existingTalk || existingTalk.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: { message: "errors.talkNotFound" },
      })
    }

    const talk = existingTalk[0]
    if (!talk) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: { message: "errors.talkNotFound" },
      })
    }

    if (Object.keys(body).length === 0) {
      return {
        success: true,
        talk,
      }
    }

    await db.update(publicTalks).set(body).where(eq(publicTalks.id, id))

    const updatedTalk = await db.select().from(publicTalks).where(eq(publicTalks.id, id)).limit(1)

    const updated = updatedTalk[0]
    if (!updated) {
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
        data: { message: "errors.talkUpdateFailed" },
      })
    }

    await logAuditEvent(event, {
      action: AUDIT_EVENTS.TALK_EDITED,
      resourceType: "public_talk",
      resourceId: id.toString(),
      details: {
        talkId: id,
        talkNo: talk.no,
        updates: body,
      } satisfies AuditEventDetails[typeof AUDIT_EVENTS.TALK_EDITED],
    })

    return {
      success: true,
      talk: updated,
    }
  },
})
