import { createError } from "h3"
import { eq } from "drizzle-orm"
import { speakers, speakerTalks, organization, publicTalks } from "../../database/schema"

interface CreateSpeakerRequest {
	firstName: string
	lastName: string
	phone: string
	congregationId: string
	talkIds?: number[]
}

export default defineEventHandler(async (event) => {
	await requireRole("speakers_manager")(event)

	const body = (await readBody(event)) as CreateSpeakerRequest

	if (!body || !body.firstName || !body.lastName || !body.phone || !body.congregationId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			message: "First name, last name, phone, and congregation are required",
		})
	}

	if (!/^\d{9}$/.test(body.phone)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			message: "Phone number must be exactly 9 digits",
		})
	}

	const db = useDrizzle()

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

	const speakerId = crypto.randomUUID()

	const result = await db
		.insert(speakers)
		.values({
			id: speakerId,
			firstName: body.firstName.trim(),
			lastName: body.lastName.trim(),
			phone: body.phone,
			congregationId: body.congregationId,
			archived: false,
			archivedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		.returning()

	const newSpeaker = result[0]
	if (!newSpeaker) {
		throw createError({
			statusCode: 500,
			statusMessage: "Internal Server Error",
			message: "Failed to create speaker",
		})
	}

	if (body.talkIds && body.talkIds.length > 0) {
		const talkAssignments = body.talkIds.map((talkId) => ({
			speakerId,
			talkId,
			createdAt: new Date(),
		}))

		await db.insert(speakerTalks).values(talkAssignments)
	}

	await logAuditEvent(event, {
		action: AUDIT_EVENTS.SPEAKER_CREATED,
		resourceType: "speaker",
		resourceId: speakerId,
		details: {
			speakerId,
			firstName: newSpeaker.firstName,
			lastName: newSpeaker.lastName,
			congregationId: newSpeaker.congregationId,
			talkCount: body.talkIds?.length || 0,
		} satisfies AuditEventDetails[typeof AUDIT_EVENTS.SPEAKER_CREATED],
	})

	const congregation = await db
		.select()
		.from(organization)
		.where(eq(organization.id, newSpeaker.congregationId))
		.limit(1)

	const talks =
		body.talkIds && body.talkIds.length > 0
			? await db
					.select({
						id: publicTalks.id,
						no: publicTalks.no,
						title: publicTalks.title,
					})
					.from(publicTalks)
					.where(sql`${publicTalks.id} IN ${body.talkIds}`)
			: []

	return {
		success: true,
		speaker: {
			...newSpeaker,
			congregationName: congregation[0]?.name || "",
			talks,
		},
	}
})
