export const AUDIT_EVENTS = {
  TALK_STATUS_CHANGED: "talk_status_changed",
  TALK_EDITED: "talk_edited",
  TALK_CREATED: "talk_created",
  TALK_DELETED: "talk_deleted",
  PERMISSION_DENIED: "permission_denied",
  UNAUTHORIZED_ACCESS: "unauthorized_access",
} as const

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
    changes: Record<string, { old: any; new: any }>
  }
  [AUDIT_EVENTS.TALK_CREATED]: {
    talkId: number
    talkNo: string
    title: string
    multimediaCount: number
    videoCount: number
  }
  [AUDIT_EVENTS.PERMISSION_DENIED]: {
    attemptedAction: string
    requiredRole: string
    userRole: string
  }
  [AUDIT_EVENTS.UNAUTHORIZED_ACCESS]: {
    attemptedAction: string
    path: string
  }
}
