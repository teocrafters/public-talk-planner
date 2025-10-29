import { createError } from "h3"
import { eq, sql } from "drizzle-orm"
import { speakers, speakerTalks, organization, publicTalks } from "../../database/schema"
import { editSpeakerSchema } from "../../../app/schemas/speaker"
import { validateBody } from "../../utils/validation"

export default defineEventHandler(async (event) => {
	await requirePermission({ speakers: ["update"] })(event)

	const speakerId = getRouterParam(event, "id")
	if (!speakerId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			message: "errors.speakerIdRequired",
		})
	}

	const body = await validateBody(event, editSpeakerSchema)

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

	if (body.congregationId) {
		const congregationExists = await db
			.select()
			.from(organization)
			.where(eq(organization.id, body.congregationId))
			.limit(1)

		if (!congregationExists || congregationExists.length === 0) {
			throw createError({
				statusCode: 400,
				statusMessage: "Bad Request",
				message: "errors.congregationNotFound",
			})
		}
	}

	if (body.talkIds && body.talkIds.length > 0) {
		const talksExist = await db
			.select()
			.from(publicTalks)
			.where(sql`${publicTalks.id} IN ${body.talkIds}`)

		if (talksExist.length !== body.talkIds.length) {
			throw createError({
				statusCode: 400,
				statusMessage: "Bad Request",
				message: "errors.talksInvalid",
			})
		}
	}

	const updateData: Partial<typeof speakers.$inferInsert> = {
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
		.update(speakers)
		.set(updateData)
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

	if (body.talkIds !== undefined) {
		await db.delete(speakerTalks).where(eq(speakerTalks.speakerId, speakerId))

		if (body.talkIds.length > 0) {
			const talkAssignments = body.talkIds.map((talkId: number) => ({
				speakerId,
				talkId,
				createdAt: new Date(),
			}))

			await db.insert(speakerTalks).values(talkAssignments)
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
