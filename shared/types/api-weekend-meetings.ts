export interface WeekendMeetingListItem {
  id: number
  date: number
  isCircuitOverseerVisit: boolean
  parts: Array<{
    id: number
    type: string
    name: string | null
    order: number
    assignment?: {
      personId: string
      personName: string
      personType: "speaker" | "publisher"
    }
  }>
}
