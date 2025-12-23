import { eq, gte, lt, between, asc, desc } from "drizzle-orm"
import { schema } from "hub:db"

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

  const today = dayjs().startOf("day").toDate()

  let dateCondition
  if (startDate && endDate) {
    dateCondition = between(schema.scheduledPublicTalks.date, startDate, endDate)
  } else if (startDate) {
    dateCondition = gte(schema.scheduledPublicTalks.date, startDate)
  } else if (endDate) {
    dateCondition = lt(schema.scheduledPublicTalks.date, endDate)
  } else if (history) {
    dateCondition = lt(schema.scheduledPublicTalks.date, today)
  } else {
    dateCondition = gte(schema.scheduledPublicTalks.date, today)
  }

  const schedules = await db
    .select({
      id: schema.scheduledPublicTalks.id,
      date: schema.scheduledPublicTalks.date,
      meetingProgramId: schema.scheduledPublicTalks.meetingProgramId,
      meetingProgramName: schema.meetingPrograms.name,
      partId: schema.scheduledPublicTalks.partId,
      partName: schema.meetingProgramParts.name,
      speakerSourceType: schema.scheduledPublicTalks.speakerSourceType,
      speakerId: schema.scheduledPublicTalks.speakerId,
      publisherId: schema.scheduledPublicTalks.publisherId,
      // Speaker fields (for visiting speakers)
      visitingSpeakerFirstName: schema.speakers.firstName,
      visitingSpeakerLastName: schema.speakers.lastName,
      visitingSpeakerPhone: schema.speakers.phone,
      visitingSpeakerCongregationId: schema.speakers.congregationId,
      // Publisher fields (for local publishers)
      localPublisherFirstName: schema.publishers.firstName,
      localPublisherLastName: schema.publishers.lastName,
      // Shared fields
      congregationName: schema.organization.name,
      talkId: schema.scheduledPublicTalks.talkId,
      talkNumber: schema.publicTalks.no,
      talkTitle: schema.publicTalks.title,
      customTalkTitle: schema.scheduledPublicTalks.customTalkTitle,
      overrideValidation: schema.scheduledPublicTalks.overrideValidation,
      createdAt: schema.scheduledPublicTalks.createdAt,
      updatedAt: schema.scheduledPublicTalks.updatedAt,
    })
    .from(schema.scheduledPublicTalks)
    .leftJoin(schema.speakers, eq(schema.scheduledPublicTalks.speakerId, schema.speakers.id))
    .leftJoin(schema.publishers, eq(schema.scheduledPublicTalks.publisherId, schema.publishers.id))
    .leftJoin(schema.publicTalks, eq(schema.scheduledPublicTalks.talkId, schema.publicTalks.id))
    .leftJoin(schema.organization, eq(schema.speakers.congregationId, schema.organization.id))
    .leftJoin(schema.meetingPrograms, eq(schema.scheduledPublicTalks.meetingProgramId, schema.meetingPrograms.id))
    .leftJoin(schema.meetingProgramParts, eq(schema.scheduledPublicTalks.partId, schema.meetingProgramParts.id))
    .where(dateCondition)
    .orderBy(history ? desc(schema.scheduledPublicTalks.date) : asc(schema.scheduledPublicTalks.date))

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
