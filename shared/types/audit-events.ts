import type { AUDIT_EVENTS } from "../utils/audit-events"
import type { TalkUpdateInput } from "../../app/schemas/talk"
import type { SpeakerEditInput } from "../../app/schemas/speaker"

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
  [AUDIT_EVENTS.PERMISSION_DENIED]: {
    attemptedAction: string
    requiredPermissions?: Record<string, string[]>
    requiredRole?: string
    userRole: string
  }
  [AUDIT_EVENTS.UNAUTHORIZED_ACCESS]: {
    attemptedAction: string
    path: string
  }
}
