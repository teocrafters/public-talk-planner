import { eq, gte, lt, between, asc, desc } from "drizzle-orm"
import {
	scheduledMeetings,
	speakers,
	publicTalks,
	organization,
	meetingPrograms,
	meetingProgramParts,
} from "../../database/schema"

interface ScheduleWithRelations {
	id: string
	date: Date
	meetingProgramId: number
	meetingProgramName: string
	partId: number
	partName: string
	speakerId: string
	speakerFirstName: string
	speakerLastName: string
	speakerPhone: string
	congregationId: string
	congregationName: string
	talkId: number | null
	talkNumber: string | null
	talkTitle: string | null
	customTalkTitle: string | null
	isCircuitOverseerVisit: boolean
	overrideValidation: boolean
	createdAt: Date
	updatedAt: Date
}

export default defineEventHandler(async event => {
	const query = getQuery(event)
	const history = query.history === "true" || query.history === true
	const startDate = query.startDate ? dayjs(query.startDate as string).toDate() : undefined
	const endDate = query.endDate ? dayjs(query.endDate as string).toDate() : undefined

	if (history) {
		await requirePermission({ weekend_meetings: ["list_history"] })(event)
	} else {
		await requirePermission({ weekend_meetings: ["list"] })(event)
	}

	const db = useDrizzle()
	const today = dayjs().startOf("day").toDate()

	let dateCondition
	if (startDate && endDate) {
		dateCondition = between(scheduledMeetings.date, startDate, endDate)
	} else if (startDate) {
		dateCondition = gte(scheduledMeetings.date, startDate)
	} else if (endDate) {
		dateCondition = lt(scheduledMeetings.date, endDate)
	} else if (history) {
		dateCondition = lt(scheduledMeetings.date, today)
	} else {
		dateCondition = gte(scheduledMeetings.date, today)
	}

	const schedules = await db
		.select({
			id: scheduledMeetings.id,
			date: scheduledMeetings.date,
			meetingProgramId: scheduledMeetings.meetingProgramId,
			meetingProgramName: meetingPrograms.name,
			partId: scheduledMeetings.partId,
			partName: meetingProgramParts.name,
			speakerId: scheduledMeetings.speakerId,
			speakerFirstName: speakers.firstName,
			speakerLastName: speakers.lastName,
			speakerPhone: speakers.phone,
			congregationId: speakers.congregationId,
			congregationName: organization.name,
			talkId: scheduledMeetings.talkId,
			talkNumber: publicTalks.no,
			talkTitle: publicTalks.title,
			customTalkTitle: scheduledMeetings.customTalkTitle,
			isCircuitOverseerVisit: scheduledMeetings.isCircuitOverseerVisit,
			overrideValidation: scheduledMeetings.overrideValidation,
			createdAt: scheduledMeetings.createdAt,
			updatedAt: scheduledMeetings.updatedAt,
		})
		.from(scheduledMeetings)
		.leftJoin(speakers, eq(scheduledMeetings.speakerId, speakers.id))
		.leftJoin(publicTalks, eq(scheduledMeetings.talkId, publicTalks.id))
		.leftJoin(organization, eq(speakers.congregationId, organization.id))
		.leftJoin(meetingPrograms, eq(scheduledMeetings.meetingProgramId, meetingPrograms.id))
		.leftJoin(meetingProgramParts, eq(scheduledMeetings.partId, meetingProgramParts.id))
		.where(dateCondition)
		.orderBy(history ? desc(scheduledMeetings.date) : asc(scheduledMeetings.date))

	return schedules.map(schedule => ({
		...schedule,
		congregationName: schedule.congregationName || "",
		meetingProgramName: schedule.meetingProgramName || "",
		partName: schedule.partName || "",
		talkNumber: schedule.talkNumber || null,
		talkTitle: schedule.customTalkTitle || schedule.talkTitle || null,
	})) as ScheduleWithRelations[]
})
