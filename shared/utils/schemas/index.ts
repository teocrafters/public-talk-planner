// Speaker schemas
export {
	createSpeakerSchema,
	editSpeakerSchema,
	archiveSpeakerSchema,
	type SpeakerInput,
	type SpeakerEditInput,
	type SpeakerArchiveInput,
} from "./speaker"

// Talk schemas
export {
	createTalkSchema,
	createTalkEditSchema,
	updateTalkSchema,
	talkSchema,
	talkEditSchema,
	talkStatusSchema,
	type TalkInput,
	type TalkEditInput,
	type TalkUpdateInput,
	type TalkStatusInput,
} from "./talk"

// Schedule schemas
export {
	createScheduleSchema,
	updateScheduleSchema,
	type ScheduleInput,
	type ScheduleUpdateInput,
} from "./schedule"

// Registration schemas
export {
	createRegistrationFormSchema,
	type RegistrationFormSchema,
} from "./registration"
