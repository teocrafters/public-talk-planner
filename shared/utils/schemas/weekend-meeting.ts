import { z } from "zod"
import type { YYYYMMDD } from "#shared/types/date"
import { toYYYYMMDD, isYYYYMMDD } from "#shared/types/date"
import { isSunday, isFutureDate } from "#shared/utils/date-yyyymmdd"

export const planWeekendMeetingSchema = (t: (key: string) => string) => {
  return z.object({
    date: z
      .string({ message: t("validation.dateRequired") })
      .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
        message: t("validation.invalidDateFormat"),
      })
      .refine(isYYYYMMDD, { message: t("validation.invalidDateFormat") })
      .refine(dateStr => isSunday(dateStr as YYYYMMDD), {
        message: t("validation.dateMustBeSunday"),
      })
      .refine(dateStr => isFutureDate(dateStr as YYYYMMDD), {
        message: t("validation.dateMustBeFuture"),
      })
      .transform(dateStr => toYYYYMMDD(dateStr)),

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
