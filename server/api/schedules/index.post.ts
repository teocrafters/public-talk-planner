import { createError } from "h3"
import { eq, and } from "drizzle-orm"
import {
	speakers,
	meetingPrograms,
	meetingProgramParts,
	publicTalks,
	scheduledMeetings,
	speakerTalks,
} from "../../database/schema"
import { createScheduleSchema } from "#shared/utils/schemas"

export default defineEventHandler(async event => {
	await requirePermission({
		weekend_meetings: ["schedule_public_talks", "schedule_public_talks"],
	})(event)

	const body = await validateBody(event, createScheduleSchema)

	const db = useDrizzle()

	const date = dayjs.unix(body.date).toDate()

	if (date.getDay() !== 0) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			message: "errors.dateMustBeSunday",
		})
	}

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

	const meetingProgram = await db.query.meetingPrograms.findFirst({
		where: eq(meetingPrograms.id, body.meetingProgramId),
	})

	if (!meetingProgram) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			message: "errors.meetingProgramNotFound",
		})
	}

	const part = await db.query.meetingProgramParts.findFirst({
		where: and(
			eq(meetingProgramParts.id, body.partId),
			eq(meetingProgramParts.meetingProgramId, body.meetingProgramId)
		),
	})

	if (!part) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			message: "errors.partNotFound",
		})
	}

	const existing = await db.query.scheduledMeetings.findFirst({
		where: and(
			eq(scheduledMeetings.date, date),
			eq(scheduledMeetings.meetingProgramId, body.meetingProgramId),
			eq(scheduledMeetings.partId, body.partId)
		),
	})

	if (existing) {
		throw createError({
			statusCode: 409,
			statusMessage: "Conflict",
			message: "errors.scheduleAlreadyExists",
		})
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

		if (!body.overrideValidation) {
			const speakerHasTalk = await db.query.speakerTalks.findFirst({
				where: and(eq(speakerTalks.speakerId, body.speakerId), eq(speakerTalks.talkId, body.talkId)),
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

	const scheduleId = crypto.randomUUID()
	const now = dayjs().toDate()

	await db.insert(scheduledMeetings).values({
		id: scheduleId,
		date: date,
		meetingProgramId: body.meetingProgramId,
		partId: body.partId,
		speakerId: body.speakerId,
		talkId: body.talkId || null,
		customTalkTitle: body.customTalkTitle || null,
		isCircuitOverseerVisit: body.isCircuitOverseerVisit,
		overrideValidation: body.overrideValidation || false,
		createdAt: now,
		updatedAt: now,
	})

	await logAuditEvent(event, {
		action: AUDIT_EVENTS.SCHEDULE_CREATED,
		resourceType: "schedule",
		resourceId: scheduleId,
		details: {
			scheduleId,
			date: date,
			meetingProgramId: body.meetingProgramId,
			partId: body.partId,
			speakerId: body.speakerId,
			talkId: body.talkId || null,
			customTalkTitle: body.customTalkTitle || null,
			isCircuitOverseerVisit: body.isCircuitOverseerVisit,
		} satisfies AuditEventDetails[typeof AUDIT_EVENTS.SCHEDULE_CREATED],
	})

	const schedule = await db.query.scheduledMeetings.findFirst({
		where: eq(scheduledMeetings.id, scheduleId),
		with: {
			speaker: true,
			talk: true,
			meetingProgram: true,
			part: true,
		},
	})

	if (!schedule) {
		throw createError({
			statusCode: 500,
			statusMessage: "Internal Server Error",
			message: "errors.scheduleCreateFailed",
		})
	}

	return {
		success: true,
		schedule: {
			...schedule,
			speakerName: `${schedule.speaker.firstName} ${schedule.speaker.lastName}`,
			talkNumber: schedule.talk?.no,
			talkTitle: schedule.customTalkTitle || schedule.talk?.title,
		},
	}
})
