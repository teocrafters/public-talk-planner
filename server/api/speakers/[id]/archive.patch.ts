import { createError } from "h3"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { speakers, organization, speakerTalks, publicTalks } from "../../../database/schema"
import { defineEndpoint } from "../../../utils/define-endpoint"
import { archiveSpeakerSchema } from "#shared/utils/schemas"
import { logAuditEvent } from "../../../utils/audit-log"
import { AUDIT_EVENTS } from "#shared/utils/audit-events"
import type { AuditEventDetails } from "#shared/types/audit-events"

// UUID params schema
const uuidParamsSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().uuid(t("validation.invalidUuid")),
  })

export default defineEndpoint({
  permissions: { speakers: ["archive"] },
  params: uuidParamsSchema,
  body: archiveSpeakerSchema,
  handler: async (event, { params, body }) => {
    const speakerId = params.id

    const db = useDrizzle()

  const existingSpeaker = await db
    .select()
    .from(speakers)
    .where(eq(speakers.id, speakerId))
    .limit(1)

  if (!existingSpeaker || existingSpeaker.length === 0 || !existingSpeaker[0]) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      data: { message: "errors.speakerNotFound" },
    })
  }

  const result = await db
    .update(speakers)
    .set({
      archived: body.archived,
      archivedAt: body.archived ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(speakers.id, speakerId))
    .returning()

  const updatedSpeaker = result[0]
  if (!updatedSpeaker) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: { message: "errors.speakerUpdateFailed" },
    })
  }

  const auditAction = body.archived ? AUDIT_EVENTS.SPEAKER_ARCHIVED : AUDIT_EVENTS.SPEAKER_RESTORED

  await logAuditEvent(event, {
    action: auditAction,
    resourceType: "speaker",
    resourceId: speakerId,
    details: {
      speakerId,
      firstName: updatedSpeaker.firstName,
      lastName: updatedSpeaker.lastName,
    } satisfies AuditEventDetails[typeof auditAction],
  })

  const congregation = await db
    .select()
    .from(organization)
    .where(eq(organization.id, updatedSpeaker.congregationId))
    .limit(1)

  const talks = await db
    .select({
      id: publicTalks.id,
      no: publicTalks.no,
      title: publicTalks.title,
    })
    .from(speakerTalks)
    .innerJoin(publicTalks, eq(speakerTalks.talkId, publicTalks.id))
    .where(eq(speakerTalks.speakerId, speakerId))

  return {
    success: true,
    speaker: {
      ...updatedSpeaker,
      congregationName: congregation[0]?.name || "",
      talks,
    },
  }
  },
})
