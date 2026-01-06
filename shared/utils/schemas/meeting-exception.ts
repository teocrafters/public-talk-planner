import { z } from "zod"
import type { YYYYMMDD } from "#shared/types/date"
import { toYYYYMMDD, isYYYYMMDD } from "#shared/types/date"
import { isSunday, isFutureDate } from "#shared/utils/date-yyyymmdd"
import { MEETING_EXCEPTION_TYPES } from "#shared/constants/meeting-exceptions"

export const createMeetingExceptionSchema = (t: (key: string) => string) => {
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

    exceptionType: z.enum(
      [
        MEETING_EXCEPTION_TYPES.CIRCUIT_ASSEMBLY,
        MEETING_EXCEPTION_TYPES.REGIONAL_CONVENTION,
        MEETING_EXCEPTION_TYPES.MEMORIAL,
      ],
      {
        message: t("validation.exceptionTypeRequired"),
      }
    ),

    description: z.string().max(500, t("validation.descriptionTooLong")).optional().nullable(),

    confirmDeleteExisting: z.boolean().default(false),
  })
}

export const updateMeetingExceptionSchema = (t: (key: string) => string) => {
  return z
    .object({
      date: z
        .string()
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
        .transform(dateStr => toYYYYMMDD(dateStr))
        .optional(),

      exceptionType: z
        .enum([
          MEETING_EXCEPTION_TYPES.CIRCUIT_ASSEMBLY,
          MEETING_EXCEPTION_TYPES.REGIONAL_CONVENTION,
          MEETING_EXCEPTION_TYPES.MEMORIAL,
        ])
        .optional(),

      description: z.string().max(500, t("validation.descriptionTooLong")).optional().nullable(),

      confirmDeleteExisting: z.boolean().default(false),
    })
    .refine(
      data => data.date !== undefined || data.exceptionType !== undefined || data.description !== undefined,
      {
        message: t("validation.atLeastOneFieldRequired"),
      }
    )
}

export type CreateMeetingExceptionInput = z.infer<ReturnType<typeof createMeetingExceptionSchema>>
export type UpdateMeetingExceptionInput = z.infer<ReturnType<typeof updateMeetingExceptionSchema>>
