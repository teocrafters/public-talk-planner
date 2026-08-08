import type { YYYYMMDD } from "./date"

export interface WeekendMeetingListItem {
  id: string
  date: YYYYMMDD
  isCircuitOverseerVisit: boolean
  parts: Array<{
    id: string
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
