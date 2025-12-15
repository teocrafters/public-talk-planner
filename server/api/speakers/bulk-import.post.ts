import { createError } from "h3"
import { eq } from "drizzle-orm"
import { speakers, speakerTalks, organization } from "../../database/schema"

export default defineEventHandler(async event => {
	await requirePermission({ speakers: ["create"] })(event)

	const body = await readBody(event)
	if (!body.speakers || !Array.isArray(body.speakers)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			data: { message: "errors.invalidRequestBody" },
		})
	}

	const db = useDrizzle()
	let importedCount = 0

	for (const speaker of body.speakers) {
		if (!speaker.congregationId) {
			throw createError({
				statusCode: 400,
				statusMessage: "Bad Request",
				data: { message: "validation.congregationRequired" },
			})
		}

		const congregationExists = await db
			.select()
			.from(organization)
			.where(eq(organization.id, speaker.congregationId))
			.limit(1)

		if (!congregationExists || congregationExists.length === 0) {
			throw createError({
				statusCode: 400,
				statusMessage: "Bad Request",
				data: { message: "errors.congregationNotFound" },
			})
		}

		const speakerId = crypto.randomUUID()
		await db.insert(speakers).values({
			id: speakerId,
			firstName: speaker.firstName.trim(),
			lastName: speaker.lastName.trim(),
			phone: speaker.phone.replace(/\D/g, ""),
			congregationId: speaker.congregationId,
			archived: false,
			archivedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		})

		if (speaker.talkIds && speaker.talkIds.length > 0) {
			await db.insert(speakerTalks).values(
				speaker.talkIds.map((talkId: number) => ({
					speakerId,
					talkId,
					createdAt: new Date(),
				}))
			)
		}

		await logAuditEvent(event, {
			action: AUDIT_EVENTS.SPEAKER_CREATED,
			resourceType: "speaker",
			resourceId: speakerId,
			details: {
				speakerId,
				firstName: speaker.firstName,
				lastName: speaker.lastName,
				congregationId: speaker.congregationId,
				talkCount: speaker.talkIds?.length || 0,
			},
		})

		importedCount++
	}

	return {
		success: true,
		count: importedCount,
	}
})
