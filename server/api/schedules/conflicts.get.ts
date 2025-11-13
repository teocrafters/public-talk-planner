import { createError } from "h3"
import { eq, and } from "drizzle-orm"
import { scheduledMeetings } from "../../database/schema"

export default defineEventHandler(async event => {
	await requirePermission({ weekend_meetings: ["schedule_public_talks"] })(event)

	const query = getQuery(event)
	const dateStr = query.date as string
	const meetingProgramId = query.meetingProgramId
		? Number.parseInt(query.meetingProgramId as string, 10)
		: undefined
	const partId = query.partId ? Number.parseInt(query.partId as string, 10) : undefined

	if (!dateStr || !meetingProgramId || !partId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			message: "errors.dateAndProgramAndPartRequired",
		})
	}

	const parsedDate = dayjs(dateStr)

	if (!parsedDate.isValid()) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			message: "errors.invalidDateFormat",
		})
	}

	const date = parsedDate.startOf("day").toDate()

	const db = useDrizzle()

	const existingSchedule = await db.query.scheduledMeetings.findFirst({
		where: and(
			eq(scheduledMeetings.date, date),
			eq(scheduledMeetings.meetingProgramId, meetingProgramId),
			eq(scheduledMeetings.partId, partId)
		),
		with: {
			speaker: true,
			talk: true,
			meetingProgram: true,
			part: true,
		},
	})

	if (existingSchedule) {
		return {
			hasConflict: true,
			existingSchedule: {
				...existingSchedule,
				speakerName: `${existingSchedule.speaker.firstName} ${existingSchedule.speaker.lastName}`,
				talkNumber: existingSchedule.talk?.no,
				talkTitle: existingSchedule.customTalkTitle || existingSchedule.talk?.title,
			},
		}
	}

	return {
		hasConflict: false,
		existingSchedule: null,
	}
})
