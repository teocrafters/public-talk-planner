import { eq, gte, lt, between, asc, desc } from "drizzle-orm"
import { z } from "zod"
import {
  scheduledPublicTalks,
  speakers,
  publishers,
  publicTalks,
  organization,
  meetingPrograms,
  meetingProgramParts,
} from "../../database/schema"
import { defineEndpoint } from "../../utils/define-endpoint"
import { dateRangeQuerySchema } from "#shared/utils/schemas/query-params"
import { formatToYYYYMMDD, getTodayYYYYMMDD } from "#shared/utils/date-yyyymmdd"

const scheduleQuerySchema = (t: (key: string) => string) =>
  dateRangeQuerySchema(t).extend({
    history: z.enum(["true", "false"]).default("false"),
  })

export default defineEndpoint({
  permissions: { weekend_meetings: ["list", "list_history"] },
  query: scheduleQuerySchema,
  handler: async (event, { query }): Promise<unknown> => {
  const history = query.history === "true"
  const startDate = query.startDate ? formatToYYYYMMDD(query.startDate) : undefined
  const endDate = query.endDate ? formatToYYYYMMDD(query.endDate) : undefined

  const db = useDrizzle()
  const today = getTodayYYYYMMDD()

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
  },
})
