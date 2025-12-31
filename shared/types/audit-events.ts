import type { SpeakerSourceType } from "#shared/constants/speaker-sources"
import type { MeetingExceptionType } from "#shared/constants/meeting-exceptions"
import type { AUDIT_EVENTS } from "../utils/audit-events"
import type { YYYYMMDD } from "./date"
import type {
  TalkUpdateInput,
  SpeakerEditInput,
  PublisherUpdateInput,
  WeekendMeetingUpdateInput,
} from "../utils/schemas"

export type AuditEventType = (typeof AUDIT_EVENTS)[keyof typeof AUDIT_EVENTS]

export interface AuditEventDetails {
  [AUDIT_EVENTS.TALK_STATUS_CHANGED]: {
    talkId: number
    talkNo: string
    oldStatus: string | null
    newStatus: string | null
  }
  [AUDIT_EVENTS.TALK_EDITED]: {
    talkId: number
    talkNo: string
    updates: TalkUpdateInput
  }
  [AUDIT_EVENTS.TALK_CREATED]: {
    talkId: number
    talkNo: string
    title: string
    multimediaCount: number
    videoCount: number
  }
  [AUDIT_EVENTS.SPEAKER_CREATED]: {
    speakerId: string
    firstName: string
    lastName: string
    congregationId: string
    talkCount: number
  }
  [AUDIT_EVENTS.SPEAKER_EDITED]: {
    speakerId: string
    updates: SpeakerEditInput
  }
  [AUDIT_EVENTS.SPEAKER_ARCHIVED]: {
    speakerId: string
    firstName: string
    lastName: string
  }
  [AUDIT_EVENTS.SPEAKER_RESTORED]: {
    speakerId: string
    firstName: string
    lastName: string
  }
  [AUDIT_EVENTS.SPEAKER_UPDATED_FROM_IMPORT]: {
    speakerId: string
    changes: {
      phone?: {
        old: string
        new: string
      }
      talksAdded?: number[]
      talksRemoved?: number[]
    }
  }
  [AUDIT_EVENTS.SPEAKER_CONGREGATION_TRANSFERRED]: {
    speakerId: string
    firstName: string
    lastName: string
    oldCongregationId: string
    oldCongregationName: string
    newCongregationId: string
    newCongregationName: string
    wasArchived: boolean
  }
  [AUDIT_EVENTS.PERMISSION_DENIED]: {
    attemptedAction: string
    requiredPermissions?: Record<string, string[]>
    requiredRole?: string
    userRole: string
  }
  [AUDIT_EVENTS.SCHEDULE_CREATED]: {
    scheduleId: string
    date: YYYYMMDD
    meetingProgramId: number
    partId: number
    speakerSourceType: SpeakerSourceType
    speakerId: string | null
    publisherId: string | null
    talkId: number | null
    customTalkTitle: string | null
    isCircuitOverseerVisit: boolean
  }
  [AUDIT_EVENTS.SCHEDULE_UPDATED]: {
    scheduleId: string
    date: YYYYMMDD
    meetingProgramId: number
    partId: number
    changes: Record<string, unknown>
  }
  [AUDIT_EVENTS.SCHEDULE_DELETED]: {
    scheduleId: string
    date: YYYYMMDD
    meetingProgramId: number
    partId: number
  }
  [AUDIT_EVENTS.SCHEDULE_VALIDATION_OVERRIDDEN]: {
    scheduleId: string
    date: YYYYMMDD
    validationReason: string
    overriddenBy: string
  }
  [AUDIT_EVENTS.UNAUTHORIZED_ACCESS]: {
    attemptedAction: string
    path: string
  }
  [AUDIT_EVENTS.PUBLISHER_CREATED]: {
    publisherId: string
    firstName: string
    lastName: string
    userId: string | null
  }
  [AUDIT_EVENTS.PUBLISHER_UPDATED]: {
    publisherId: string
    changes: PublisherUpdateInput
  }
  [AUDIT_EVENTS.PUBLISHER_USER_LINKED]: {
    publisherId: string
    userId: string | null
  }
  [AUDIT_EVENTS.PUBLISHER_USER_UNLINKED]: {
    publisherId: string
    userId: string | null
  }
  [AUDIT_EVENTS.WEEKEND_MEETING_PLANNED]: {
    programId: number
    date: YYYYMMDD
    isCircuitOverseerVisit: boolean
    parts: Record<string, unknown>
  }
  [AUDIT_EVENTS.WEEKEND_MEETING_UPDATED]: {
    programId: number
    changes: WeekendMeetingUpdateInput
  }
  [AUDIT_EVENTS.MEETING_EXCEPTION_CREATED]: {
    exceptionId: string
    date: YYYYMMDD
    exceptionType: MeetingExceptionType
    description: string | null
    deletedExistingMeeting: boolean
    deletedMeetingId?: number
  }
  [AUDIT_EVENTS.MEETING_EXCEPTION_UPDATED]: {
    exceptionId: string
    date: YYYYMMDD
    changes: {
      exceptionType?: MeetingExceptionType
      description?: string | null
    }
  }
  [AUDIT_EVENTS.MEETING_EXCEPTION_DELETED]: {
    exceptionId: string
    date: YYYYMMDD
    exceptionType: MeetingExceptionType
  }
}
