import { eq, gte, lt, between, asc, desc } from "drizzle-orm"
import {
  scheduledPublicTalks,
  speakers,
  publishers,
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
  speakerSourceType: string
  speakerId: string | null
  publisherId: string | null
  speakerFirstName: string | null
  speakerLastName: string | null
  speakerPhone: string | null
  congregationId: string | null
  congregationName: string | null
  talkId: number | null
  talkNumber: string | null
  talkTitle: string | null
  customTalkTitle: string | null
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
    dateCondition = between(scheduledPublicTalks.date, startDate, endDate)
  } else if (startDate) {
    dateCondition = gte(scheduledPublicTalks.date, startDate)
  } else if (endDate) {
    dateCondition = lt(scheduledPublicTalks.date, endDate)
  } else if (history) {
    dateCondition = lt(scheduledPublicTalks.date, today)
  } else {
    dateCondition = gte(scheduledPublicTalks.date, today)
  }

  const schedules = await db
    .select({
      id: scheduledPublicTalks.id,
      date: scheduledPublicTalks.date,
      meetingProgramId: scheduledPublicTalks.meetingProgramId,
      meetingProgramName: meetingPrograms.name,
      partId: scheduledPublicTalks.partId,
      partName: meetingProgramParts.name,
      speakerSourceType: scheduledPublicTalks.speakerSourceType,
      speakerId: scheduledPublicTalks.speakerId,
      publisherId: scheduledPublicTalks.publisherId,
      // Speaker fields (for visiting speakers)
      visitingSpeakerFirstName: speakers.firstName,
      visitingSpeakerLastName: speakers.lastName,
      visitingSpeakerPhone: speakers.phone,
      visitingSpeakerCongregationId: speakers.congregationId,
      // Publisher fields (for local publishers)
      localPublisherFirstName: publishers.firstName,
      localPublisherLastName: publishers.lastName,
      // Shared fields
      congregationName: organization.name,
      talkId: scheduledPublicTalks.talkId,
      talkNumber: publicTalks.no,
      talkTitle: publicTalks.title,
      customTalkTitle: scheduledPublicTalks.customTalkTitle,
      overrideValidation: scheduledPublicTalks.overrideValidation,
      createdAt: scheduledPublicTalks.createdAt,
      updatedAt: scheduledPublicTalks.updatedAt,
    })
    .from(scheduledPublicTalks)
    .leftJoin(speakers, eq(scheduledPublicTalks.speakerId, speakers.id))
    .leftJoin(publishers, eq(scheduledPublicTalks.publisherId, publishers.id))
    .leftJoin(publicTalks, eq(scheduledPublicTalks.talkId, publicTalks.id))
    .leftJoin(organization, eq(speakers.congregationId, organization.id))
    .leftJoin(meetingPrograms, eq(scheduledPublicTalks.meetingProgramId, meetingPrograms.id))
    .leftJoin(meetingProgramParts, eq(scheduledPublicTalks.partId, meetingProgramParts.id))
    .where(dateCondition)
    .orderBy(history ? desc(scheduledPublicTalks.date) : asc(scheduledPublicTalks.date))

  return schedules.map(schedule => ({
    id: schedule.id,
    date: schedule.date,
    meetingProgramId: schedule.meetingProgramId,
    meetingProgramName: schedule.meetingProgramName || "",
    partId: schedule.partId,
    partName: schedule.partName || "",
    speakerSourceType: schedule.speakerSourceType,
    speakerId: schedule.speakerId,
    publisherId: schedule.publisherId,
    // Use speaker or publisher data based on source type
    speakerFirstName:
      schedule.speakerSourceType === "visiting_speaker"
        ? schedule.visitingSpeakerFirstName
        : schedule.localPublisherFirstName,
    speakerLastName:
      schedule.speakerSourceType === "visiting_speaker"
        ? schedule.visitingSpeakerLastName
        : schedule.localPublisherLastName,
    speakerPhone:
      schedule.speakerSourceType === "visiting_speaker" ? schedule.visitingSpeakerPhone : null,
    congregationId:
      schedule.speakerSourceType === "visiting_speaker"
        ? schedule.visitingSpeakerCongregationId
        : null,
    congregationName:
      schedule.speakerSourceType === "visiting_speaker" ? schedule.congregationName || "" : "",
    talkId: schedule.talkId,
    talkNumber: schedule.talkNumber || null,
    talkTitle: schedule.customTalkTitle || schedule.talkTitle || null,
    customTalkTitle: schedule.customTalkTitle,
    overrideValidation: schedule.overrideValidation,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
  })) as ScheduleWithRelations[]
})
