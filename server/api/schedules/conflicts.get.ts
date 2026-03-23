import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { scheduledPublicTalks } from "../../database/schema"
import { defineEndpoint } from "../../utils/define-endpoint"
import { formatToYYYYMMDD } from "#shared/utils/date-yyyymmdd"

const conflictsQuerySchema = (t: (key: string) => string) =>
  z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t("validation.invalidDateFormat")),
    meetingProgramId: z.coerce.number().int().positive(t("validation.invalidId")),
    partId: z.coerce.number().int().positive(t("validation.invalidId")),
  })

export default defineEndpoint({
  permissions: { weekend_meetings: ["schedule_public_talks"] },
  query: conflictsQuerySchema,
  handler: async (event, { query }) => {
  const { date: dateStr, meetingProgramId, partId } = query

  // Parse and validate date format
  const date = formatToYYYYMMDD(dateStr)

  const db = useDrizzle()

  const existingSchedule = await db.query.scheduledPublicTalks.findFirst({
    where: and(
      eq(scheduledPublicTalks.date, date),
      eq(scheduledPublicTalks.meetingProgramId, meetingProgramId),
      eq(scheduledPublicTalks.partId, partId)
    ),
    with: {
      speaker: true,
      publisher: true,
      talk: true,
      meetingProgram: true,
      part: true,
    },
  })

  if (existingSchedule) {
    // Determine speaker name based on source type
    let speakerName = ""
    if (existingSchedule.speakerSourceType === "visiting_speaker" && existingSchedule.speaker) {
      speakerName = `${existingSchedule.speaker.firstName} ${existingSchedule.speaker.lastName}`
    } else if (
      existingSchedule.speakerSourceType === "local_publisher" &&
      existingSchedule.publisher
    ) {
      speakerName = `${existingSchedule.publisher.firstName} ${existingSchedule.publisher.lastName}`
    }

    return {
      hasConflict: true,
      existingSchedule: {
        ...existingSchedule,
        speakerName,
        talkNumber: existingSchedule.talk?.no,
        talkTitle: existingSchedule.customTalkTitle || existingSchedule.talk?.title,
      },
    }
  }

  return {
    hasConflict: false,
    existingSchedule: null,
  }
  },
})
