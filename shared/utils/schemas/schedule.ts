import { z } from "zod"

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

			meetingProgramId: z.number().int().positive({ message: t("validation.meetingProgramRequired") }),

			partId: z.number().int().positive({ message: t("validation.partRequired") }),

			speakerId: z.string().min(1, t("validation.speakerRequired")),

			talkId: z.number().int().positive().optional(),

			customTalkTitle: z
				.string()
				.max(200, t("validation.customTalkTitleTooLong"))
				.optional(),

			isCircuitOverseerVisit: z.boolean().default(false),

			overrideValidation: z.boolean().default(false),
		})
		.refine(
			data => {
				return data.talkId !== undefined || (data.customTalkTitle && data.customTalkTitle.trim().length > 0)
			},
			{
				message: t("validation.talkIdOrCustomTitleRequired"),
				path: ["talkId"],
			}
		)
}

export const updateScheduleSchema = (t: (key: string) => string) => {
	return createScheduleSchema(t).partial().omit({ date: true, meetingProgramId: true, partId: true })
}

export type ScheduleInput = z.infer<ReturnType<typeof createScheduleSchema>>
export type ScheduleUpdateInput = z.infer<ReturnType<typeof updateScheduleSchema>>
