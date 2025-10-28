import { createError } from "h3"
import { eq, sql } from "drizzle-orm"
import { speakers, speakerTalks, organization, publicTalks } from "../../database/schema"

interface UpdateSpeakerRequest {
	firstName?: string
	lastName?: string
	phone?: string
	congregationId?: string
	talkIds?: number[]
}

export default defineEventHandler(async (event) => {
	await requirePermission({ speakers: ["update"] })(event)

	const speakerId = getRouterParam(event, "id")
	if (!speakerId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			message: "Speaker ID is required",
		})
	}

	const body = (await readBody(event)) as UpdateSpeakerRequest

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
			message: "Speaker not found",
		})
	}

	if (body.phone && !/^\d{9}$/.test(body.phone)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			message: "Phone number must be exactly 9 digits",
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
				message: "Invalid congregation ID",
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
				message: "One or more talk IDs are invalid",
			})
		}
	}

	const changes: Record<string, { old: any; new: any }> = {}
	const updateData: Partial<typeof speakers.$inferInsert> = {
		updatedAt: new Date(),
	}

	if (body.firstName !== undefined && body.firstName !== existingSpeaker[0].firstName) {
		changes.firstName = { old: existingSpeaker[0].firstName, new: body.firstName }
		updateData.firstName = body.firstName.trim()
	}

	if (body.lastName !== undefined && body.lastName !== existingSpeaker[0].lastName) {
		changes.lastName = { old: existingSpeaker[0].lastName, new: body.lastName }
		updateData.lastName = body.lastName.trim()
	}

	if (body.phone !== undefined && body.phone !== existingSpeaker[0].phone) {
		changes.phone = { old: existingSpeaker[0].phone, new: body.phone }
		updateData.phone = body.phone
	}

	if (
		body.congregationId !== undefined &&
		body.congregationId !== existingSpeaker[0].congregationId
	) {
		changes.congregationId = {
			old: existingSpeaker[0].congregationId,
			new: body.congregationId,
		}
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
			message: "Failed to update speaker",
		})
	}

	if (body.talkIds !== undefined) {
		await db.delete(speakerTalks).where(eq(speakerTalks.speakerId, speakerId))

		if (body.talkIds.length > 0) {
			const talkAssignments = body.talkIds.map((talkId) => ({
				speakerId,
				talkId,
				createdAt: new Date(),
			}))

			await db.insert(speakerTalks).values(talkAssignments)
		}

		changes.talkIds = {
			old: "talks updated",
			new: `${body.talkIds.length} talks assigned`,
		}
	}

	if (Object.keys(changes).length > 0) {
		await logAuditEvent(event, {
			action: AUDIT_EVENTS.SPEAKER_EDITED,
			resourceType: "speaker",
			resourceId: speakerId,
			details: {
				speakerId,
				changes,
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
