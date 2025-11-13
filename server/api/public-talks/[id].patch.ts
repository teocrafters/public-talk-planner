import { createError } from "h3"
import { eq } from "drizzle-orm"
import { publicTalks } from "../../database/schema"
import { validateBody } from "../../utils/validation"
import { updateTalkSchema } from "#shared/utils/schemas"

export default defineEventHandler(async (event) => {
	await requirePermission({ talks: ["update"] })(event)

	const id = parseInt(getRouterParam(event, "id") || "")
	if (isNaN(id)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			message: "errors.talkIdInvalid",
		})
	}

	const body = await validateBody(event, updateTalkSchema)

	const db = useDrizzle()

	const existingTalk = await db.select().from(publicTalks).where(eq(publicTalks.id, id)).limit(1)

	if (!existingTalk || existingTalk.length === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: "Not Found",
			message: "errors.talkNotFound",
		})
	}

	const talk = existingTalk[0]
	if (!talk) {
		throw createError({
			statusCode: 404,
			statusMessage: "Not Found",
			message: "errors.talkNotFound",
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
			message: "errors.talkUpdateFailed",
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
})
