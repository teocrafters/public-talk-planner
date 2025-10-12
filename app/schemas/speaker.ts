import { z } from "zod"
import { unformatPhoneNumber } from "../utils/phone"

export const createSpeakerSchema = (t: (key: string) => string) => {
	return z.object({
		firstName: z
			.string()
			.min(1, t("validation.firstNameRequired"))
			.max(100, t("validation.firstNameTooLong"))
			.transform((s) => s.trim()),

		lastName: z
			.string()
			.min(1, t("validation.lastNameRequired"))
			.max(100, t("validation.lastNameTooLong"))
			.transform((s) => s.trim()),

		phone: z
			.string()
			.regex(/^\d{9}$/, t("validation.phoneInvalid"))
			.or(
				z
					.string()
					.regex(/^\d{3}-\d{3}-\d{3}$/, t("validation.phoneInvalid"))
					.transform(unformatPhoneNumber),
			),

		congregationId: z.string().min(1, t("validation.congregationRequired")),

		talkIds: z.array(z.number().int().positive()).optional().default([]),
	})
}

export const editSpeakerSchema = (t: (key: string) => string) => {
	return createSpeakerSchema(t).partial()
}

export type SpeakerInput = z.infer<ReturnType<typeof createSpeakerSchema>>
export type SpeakerEditInput = z.infer<ReturnType<typeof editSpeakerSchema>>
