import { createError } from "h3"
import { publicTalks } from "../../database/schema"
import { createTalkSchema } from "../../../app/schemas/talk"
import { validateBody } from "../../utils/validation"

export default defineEventHandler(async (event) => {
	await requirePermission({ talks: ["create"] })(event)

	const body = await validateBody(event, createTalkSchema)

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
			message: "errors.talkCreateFailed",
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
