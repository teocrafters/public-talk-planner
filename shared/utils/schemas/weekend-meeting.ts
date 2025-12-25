import { z } from "zod"
import { dayjs } from "#shared/utils/date"
// dayjs is auto-imported from shared/utils/date.ts with UTC plugin

export const planWeekendMeetingSchema = (t: (key: string) => string) => {
  return z.object({
    date: z
      .number({ message: t("validation.dateRequired") })
      .int({ message: t("validation.dateRequired") })
      .positive({ message: t("validation.dateRequired") })
      .refine(
        timestamp => {
          return dayjs.unix(timestamp).day() === 0
        },
        { message: t("validation.dateMustBeSunday") }
      )
      .refine(
        timestamp => {
          return dayjs.unix(timestamp).isAfter(dayjs(), "day")
        },
        { message: t("validation.dateMustBeFuture") }
      ),

    isCircuitOverseerVisit: z.boolean().default(false),

    parts: z.object({
      chairman: z.string().uuid(t("validation.publisherRequired")),
      watchtowerStudy: z.string().uuid(t("validation.publisherRequired")),
      reader: z.string().uuid(t("validation.publisherRequired")).optional(),
      prayer: z.string().uuid(t("validation.publisherRequired")).optional(),
      publicTalk: z
        .object({
          title: z
            .string()
            .min(1, t("validation.publicTalkTitleRequired"))
            .max(200, t("validation.titleTooLong")),
        })
        .optional(),
      circuitOverseerTalk: z
        .object({
          publisherId: z.string().uuid(t("validation.publisherRequired")),
          title: z
            .string()
            .min(1, t("validation.serviceTalkTitleRequired"))
            .max(200, t("validation.titleTooLong")),
        })
        .optional(),
    }),

    overrideDuplicates: z.boolean().default(false),
  })
}

export const updateWeekendMeetingSchema = (t: (key: string) => string) => {
  return planWeekendMeetingSchema(t).partial().omit({ date: true })
}

export type WeekendMeetingInput = z.infer<ReturnType<typeof planWeekendMeetingSchema>>
export type WeekendMeetingUpdateInput = z.infer<ReturnType<typeof updateWeekendMeetingSchema>>
