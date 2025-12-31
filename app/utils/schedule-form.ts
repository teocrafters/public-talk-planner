import { DEFAULT_MEETING_PROGRAM_ID, DEFAULT_PUBLIC_TALK_PART_ID } from "#shared/constants/meetings"
import { SPEAKER_SOURCE_TYPES, type SpeakerSourceType } from "#shared/constants/speaker-sources"
import type { YYYYMMDD } from "#shared/types/date"

interface ScheduleState {
  date: YYYYMMDD
  meetingProgramId: number
  partId: number
  speakerSourceType: SpeakerSourceType
  speakerId?: string
  publisherId?: string
  talkId?: number
  customTalkTitle?: string
  overrideValidation: boolean
}

/**
 * Creates default schedule form state
 * Used to initialize form state and reset it after operations
 *
 * @param date - YYYYMMDD string for the scheduled date (default: empty string)
 * @returns Default form state object
 */
export function createDefaultScheduleFormState(date: YYYYMMDD = "" as YYYYMMDD): ScheduleState {
  return {
    date,
    meetingProgramId: DEFAULT_MEETING_PROGRAM_ID,
    partId: DEFAULT_PUBLIC_TALK_PART_ID,
    speakerSourceType: SPEAKER_SOURCE_TYPES.VISITING_SPEAKER,
    speakerId: "",
    publisherId: "",
    talkId: undefined as number | undefined,
    customTalkTitle: "",
    overrideValidation: false,
  }
}
