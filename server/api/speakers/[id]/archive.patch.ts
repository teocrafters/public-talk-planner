import { createError } from "h3"
import { eq } from "drizzle-orm"
import { speakers, organization, speakerTalks, publicTalks } from "../../../database/schema"
import { archiveSpeakerSchema } from "../../../../app/schemas/speaker"
import { validateBody } from "../../../utils/validation"

export default defineEventHandler(async (event) => {
	await requirePermission({ speakers: ["archive"] })(event)

	const speakerId = getRouterParam(event, "id")
	if (!speakerId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			message: "errors.speakerIdRequired",
		})
	}

	const body = await validateBody(event, archiveSpeakerSchema)

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
			message: "errors.speakerNotFound",
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
			message: "errors.speakerUpdateFailed",
		})
	}

	const auditAction = body.archived
		? AUDIT_EVENTS.SPEAKER_ARCHIVED
		: AUDIT_EVENTS.SPEAKER_RESTORED

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
})
