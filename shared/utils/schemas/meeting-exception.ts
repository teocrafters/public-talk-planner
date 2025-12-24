import { z } from "zod"
import { dayjs } from "#shared/utils/date"
import { MEETING_EXCEPTION_TYPES } from "#shared/constants/meeting-exceptions"

export const createMeetingExceptionSchema = (t: (key: string) => string) => {
  return z.object({
    date: z
      .number({ message: t("validation.dateRequired") })
      .int({ message: t("validation.dateRequired") })
      .positive({ message: t("validation.dateRequired") })
      .refine(timestamp => dayjs.unix(timestamp).day() === 0, {
        message: t("validation.dateMustBeSunday"),
      })
      .refine(timestamp => dayjs.unix(timestamp).isAfter(dayjs(), "day"), {
        message: t("validation.dateMustBeFuture"),
      }),

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
      exceptionType: z
        .enum([
          MEETING_EXCEPTION_TYPES.CIRCUIT_ASSEMBLY,
          MEETING_EXCEPTION_TYPES.REGIONAL_CONVENTION,
          MEETING_EXCEPTION_TYPES.MEMORIAL,
        ])
        .optional(),

      description: z.string().max(500, t("validation.descriptionTooLong")).optional().nullable(),
    })
    .refine(data => data.exceptionType !== undefined || data.description !== undefined, {
      message: t("validation.atLeastOneFieldRequired"),
    })
}

export type CreateMeetingExceptionInput = z.infer<ReturnType<typeof createMeetingExceptionSchema>>
export type UpdateMeetingExceptionInput = z.infer<ReturnType<typeof updateMeetingExceptionSchema>>
