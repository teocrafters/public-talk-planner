import type { YYYYMMDD } from "./date"
import type { MeetingExceptionType } from "#shared/constants/meeting-exceptions"

export interface MeetingException {
  id: string
  date: YYYYMMDD
  exceptionType: MeetingExceptionType
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateMeetingExceptionInput {
  date: YYYYMMDD
  exceptionType: MeetingExceptionType
  description?: string
  confirmDeleteExisting: boolean
}

export interface UpdateMeetingExceptionInput {
  exceptionType?: MeetingExceptionType
  description?: string | null
}

export interface MeetingExceptionListItem {
  id: string
  date: YYYYMMDD
  exceptionType: MeetingExceptionType
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ExistingMeetingConflict {
  id: number
  date: YYYYMMDD
  isCircuitOverseerVisit: boolean
  parts: Array<{
    type: string
    personName: string
  }>
}
