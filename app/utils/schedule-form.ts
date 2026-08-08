import { SPEAKER_SOURCE_TYPES, type SpeakerSourceType } from "#shared/constants/speaker-sources"
import type { YYYYMMDD } from "#shared/types/date"

interface ScheduleState {
  date: YYYYMMDD
  meetingProgramId?: string
  partId?: string
  speakerSourceType: SpeakerSourceType
  speakerId?: string
  publisherId?: string
  talkId?: string
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
  // The program and its public-talk part are resolved server-side from the date, so a new schedule
  // carries no ids of its own.
  return {
    date,
    speakerSourceType: SPEAKER_SOURCE_TYPES.VISITING_SPEAKER,
    speakerId: "",
    publisherId: "",
    talkId: undefined,
    customTalkTitle: "",
    overrideValidation: false,
  }
}
