export interface ScheduleWithRelations {
  id: string
  date: Date
  meetingProgramId: number
  meetingProgramName: string
  partId: number
  partName: string
  speakerSourceType: string
  speakerId: string | null
  publisherId: string | null
  speakerFirstName: string | null
  speakerLastName: string | null
  speakerPhone: string | null
  congregationId: string | null
  congregationName: string | null
  talkId: number | null
  talkNumber: string | null
  talkTitle: string | null
  customTalkTitle: string | null
  overrideValidation: boolean
  createdAt: Date
  updatedAt: Date
}
