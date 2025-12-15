import { z } from "zod"

export const extractedSpeakerSchema = (t: (key: string) => string) => {
	return z.object({
		firstName: z
			.string()
			.min(1, t("validation.firstNameRequired"))
			.max(100, t("validation.firstNameTooLong")),

		lastName: z
			.string()
			.min(1, t("validation.lastNameRequired"))
			.max(100, t("validation.lastNameTooLong")),

		phone: z
			.string()
			.regex(/^\d{9}$/, t("validation.phoneInvalid"))
			.or(z.string().regex(/^\d{3}-\d{3}-\d{3}$/, t("validation.phoneInvalid"))),

		congregation: z.string().optional(),

		congregationId: z.string().min(1, t("validation.congregationRequired")).nullable(),

		talkNumbers: z.array(z.string()).optional(),

		talkIds: z.array(z.number().int().positive()).optional(),
	})
}

export const bulkImportSchema = (t: (key: string) => string) => {
	return z.object({
		speakers: z
			.array(extractedSpeakerSchema(t))
			.min(1, t("validation.atLeastOneSpeaker")),
	})
}

export type ExtractedSpeaker = z.infer<ReturnType<typeof extractedSpeakerSchema>>
export type BulkImport = z.infer<ReturnType<typeof bulkImportSchema>>
