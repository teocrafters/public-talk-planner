import { createError } from "h3"
import { eq, and } from "drizzle-orm"
import { speakers, publicTalks, scheduledMeetings, speakerTalks } from "../../database/schema"
import { updateScheduleSchema } from "#shared/utils/schemas"

export default defineEventHandler(async event => {
	await requirePermission({ weekend_meetings: ["schedule_public_talks"] })(event)

	const scheduleId = getRouterParam(event, "id")
	if (!scheduleId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			message: "errors.scheduleIdRequired",
		})
	}

	const body = await validateBody(event, updateScheduleSchema)

	const db = useDrizzle()

	const existingSchedule = await db.query.scheduledMeetings.findFirst({
		where: eq(scheduledMeetings.id, scheduleId),
	})

	if (!existingSchedule) {
		throw createError({
			statusCode: 404,
			statusMessage: "Not Found",
			message: "errors.scheduleNotFound",
		})
	}

	const today = dayjs().startOf("day").toDate()

	if (existingSchedule.date < today) {
		throw createError({
			statusCode: 403,
			statusMessage: "Forbidden",
			message: "errors.cannotEditPastSchedule",
		})
	}

	if (body.speakerId) {
		const speaker = await db.query.speakers.findFirst({
			where: eq(speakers.id, body.speakerId),
		})

		if (!speaker || speaker.archived) {
			throw createError({
				statusCode: 400,
				statusMessage: "Bad Request",
				message: "errors.speakerNotFoundOrArchived",
			})
		}
	}

	if (body.talkId) {
		const talk = await db.query.publicTalks.findFirst({
			where: eq(publicTalks.id, body.talkId),
		})

		if (!talk) {
			throw createError({
				statusCode: 400,
				statusMessage: "Bad Request",
				message: "errors.talkNotFound",
			})
		}

		const speakerIdToCheck = body.speakerId || existingSchedule.speakerId

		if (!body.overrideValidation) {
			const speakerHasTalk = await db.query.speakerTalks.findFirst({
				where: and(eq(speakerTalks.speakerId, speakerIdToCheck), eq(speakerTalks.talkId, body.talkId)),
			})

			if (!speakerHasTalk) {
				throw createError({
					statusCode: 422,
					statusMessage: "Unprocessable Entity",
					message: "errors.speakerDoesntHaveTalk",
				})
			}
		}
	}

	const updateData: Partial<typeof scheduledMeetings.$inferInsert> = {
		updatedAt: new Date(),
	}

	if (body.speakerId !== undefined) {
		updateData.speakerId = body.speakerId
	}
	if (body.talkId !== undefined) {
		updateData.talkId = body.talkId
	}
	if (body.customTalkTitle !== undefined) {
		updateData.customTalkTitle = body.customTalkTitle
	}
	if (body.isCircuitOverseerVisit !== undefined) {
		updateData.isCircuitOverseerVisit = body.isCircuitOverseerVisit
	}
	if (body.overrideValidation !== undefined) {
		updateData.overrideValidation = body.overrideValidation
	}

	await db.update(scheduledMeetings).set(updateData).where(eq(scheduledMeetings.id, scheduleId))

	await logAuditEvent(event, {
		action: AUDIT_EVENTS.SCHEDULE_UPDATED,
		resourceType: "schedule",
		resourceId: scheduleId,
		details: {
			scheduleId,
			date: existingSchedule.date,
			meetingProgramId: existingSchedule.meetingProgramId,
			partId: existingSchedule.partId,
			changes: body,
		} satisfies AuditEventDetails[typeof AUDIT_EVENTS.SCHEDULE_UPDATED],
	})

	const updatedSchedule = await db.query.scheduledMeetings.findFirst({
		where: eq(scheduledMeetings.id, scheduleId),
		with: {
			speaker: true,
			talk: true,
			meetingProgram: true,
			part: true,
		},
	})

	if (!updatedSchedule) {
		throw createError({
			statusCode: 500,
			statusMessage: "Internal Server Error",
			message: "errors.scheduleUpdateFailed",
		})
	}

	return {
		success: true,
		schedule: {
			...updatedSchedule,
			speakerName: `${updatedSchedule.speaker.firstName} ${updatedSchedule.speaker.lastName}`,
			talkNumber: updatedSchedule.talk?.no,
			talkTitle: updatedSchedule.customTalkTitle || updatedSchedule.talk?.title,
		},
	}
})
