import type { YYYYMMDD } from "./date"

export interface WeekendMeetingListItem {
  id: number
  date: YYYYMMDD
  isCircuitOverseerVisit: boolean
  parts: Array<{
    id: number
    type: string
    name: string | null
    order: number
    talkNumber?: string
    assignment?: {
      personId: string
      personName: string
      personType: "speaker" | "publisher"
    }
  }>
}
