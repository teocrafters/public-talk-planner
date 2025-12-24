import type { MeetingExceptionType } from "#shared/constants/meeting-exceptions"

export interface MeetingException {
  id: string
  date: number
  exceptionType: MeetingExceptionType
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateMeetingExceptionInput {
  date: number
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
  date: number
  exceptionType: MeetingExceptionType
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ExistingMeetingConflict {
  id: number
  date: number
  isCircuitOverseerVisit: boolean
  parts: Array<{
    type: string
    personName: string
  }>
}
