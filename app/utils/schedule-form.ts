import { DEFAULT_MEETING_PROGRAM_ID, DEFAULT_PUBLIC_TALK_PART_ID } from "~~/shared/constants/meetings"

/**
 * Creates default schedule form state
 * Used to initialize form state and reset it after operations
 *
 * @param date - Unix timestamp for the scheduled date (default: 0)
 * @returns Default form state object
 */
export function createDefaultScheduleFormState(date: number = 0) {
	return {
		date,
		meetingProgramId: DEFAULT_MEETING_PROGRAM_ID,
		partId: DEFAULT_PUBLIC_TALK_PART_ID,
		speakerId: "",
		talkId: undefined as number | undefined,
		customTalkTitle: "",
		isCircuitOverseerVisit: false,
		overrideValidation: false,
	}
}
