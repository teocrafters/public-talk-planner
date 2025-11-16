import { z } from "zod"
import { dayjs } from "../date"
import { SPEAKER_SOURCE_TYPE_VALUES } from "#shared/constants/speaker-sources"

export const createScheduleSchema = (t: (key: string) => string) => {
  return z
    .object({
      date: z
        .number({ message: t("validation.dateRequired") })
        .int({ message: t("validation.dateRequired") })
        .positive({ message: t("validation.dateRequired") })
        .refine(
          timestamp => {
            const date = dayjs.unix(timestamp)
            return date.day() === 0
          },
          { message: t("validation.dateMustBeSunday") }
        ),

      meetingProgramId: z
        .number()
        .int()
        .positive({ message: t("validation.meetingProgramRequired") })
        .optional(),

      partId: z
        .number()
        .int()
        .positive({ message: t("validation.partRequired") })
        .optional(),

      // Speaker source type: visiting_speaker or local_publisher
      speakerSourceType: z.enum(SPEAKER_SOURCE_TYPE_VALUES, {
        message: t("validation.speakerSourceTypeInvalid"),
      }),

      // Visiting speaker ID (external congregation)
      speakerId: z.string().min(1, t("validation.speakerRequired")).optional(),

      // Local publisher ID (from congregation)
      publisherId: z.string().min(1, t("validation.publisherRequired")).optional(),

      talkId: z.number().int().positive().optional(),

      customTalkTitle: z.string().max(200, t("validation.customTalkTitleTooLong")).optional(),

      isCircuitOverseerVisit: z.boolean().default(false),

      overrideValidation: z.boolean().default(false),
    })
    .refine(
      data => {
        // Ensure exactly one of speakerId or publisherId is provided
        const hasSpeakerId = !!data.speakerId
        const hasPublisherId = !!data.publisherId
        return (hasSpeakerId && !hasPublisherId) || (!hasSpeakerId && hasPublisherId)
      },
      {
        message: t("validation.speakerOrPublisherRequired"),
        path: ["speakerId"],
      }
    )
    .refine(
      data => {
        return (
          data.talkId !== undefined ||
          (data.customTalkTitle && data.customTalkTitle.trim().length > 0)
        )
      },
      {
        message: t("validation.talkIdOrCustomTitleRequired"),
        path: ["talkId"],
      }
    )
}

export const updateScheduleSchema = (t: (key: string) => string) => {
  return z
    .object({
      speakerSourceType: z
        .enum(SPEAKER_SOURCE_TYPE_VALUES, {
          message: t("validation.speakerSourceTypeInvalid"),
        })
        .optional(),

      speakerId: z.string().min(1, t("validation.speakerRequired")).optional(),

      publisherId: z.string().min(1, t("validation.publisherRequired")).optional(),

      talkId: z.number().int().positive().optional(),

      customTalkTitle: z.string().max(200, t("validation.customTalkTitleTooLong")).optional(),

      isCircuitOverseerVisit: z.boolean().optional(),

      overrideValidation: z.boolean().optional(),
    })
    .refine(
      data => {
        // If either speakerId or publisherId is being updated, ensure mutual exclusivity
        const hasSpeakerId = data.speakerId !== undefined
        const hasPublisherId = data.publisherId !== undefined

        // If neither is provided, validation passes (other fields might be updated)
        if (!hasSpeakerId && !hasPublisherId) {
          return true
        }

        // If one is provided, the other should not be
        return (hasSpeakerId && !hasPublisherId) || (!hasSpeakerId && hasPublisherId)
      },
      {
        message: t("validation.speakerOrPublisherRequired"),
        path: ["speakerId"],
      }
    )
}

export type ScheduleInput = z.infer<ReturnType<typeof createScheduleSchema>>
export type ScheduleUpdateInput = z.infer<ReturnType<typeof updateScheduleSchema>>
