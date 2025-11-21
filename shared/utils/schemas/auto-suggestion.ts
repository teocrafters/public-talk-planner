import { z } from "zod"

export const autoSuggestionSchema = (t: (key: string) => string) => {
	return z.object({
		excludedSpeakerIds: z
			.array(z.string().min(1, t("validation.speakerIdInvalid")))
			.optional()
			.default([]),
	})
}

export type AutoSuggestionInput = z.infer<ReturnType<typeof autoSuggestionSchema>>

// Response schema for auto-suggestion API
export const speakerSuggestionSchema = z.object({
	id: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	phone: z.string(),
	congregationName: z.string(),
	lastTalkDate: z.number().nullable(),
	isVisiting: z.boolean(),
})

export const talkSuggestionSchema = z.object({
	id: z.number(),
	no: z.string(),
	title: z.string(),
	lastGivenDate: z.number().nullable(),
})

export const autoSuggestionResponseSchema = z.object({
	speaker: speakerSuggestionSchema.nullable(),
	availableTalks: z.array(talkSuggestionSchema),
	hasMoreSuggestions: z.boolean(),
})

export type SpeakerSuggestion = z.infer<typeof speakerSuggestionSchema>
export type TalkSuggestion = z.infer<typeof talkSuggestionSchema>
export type AutoSuggestionResponse = z.infer<typeof autoSuggestionResponseSchema>
