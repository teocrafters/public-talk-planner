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
