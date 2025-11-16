/**
 * Shared constants for meeting management
 * Used by both frontend and backend to ensure consistency
 */

/**
 * Default meeting program ID for weekend meetings
 * References the "Weekend Meeting" program in the database
 */
export const DEFAULT_MEETING_PROGRAM_ID = 1

/**
 * Default part ID for public talk in weekend meetings
 * References the "Public Talk" part in the meeting program
 */
export const DEFAULT_PUBLIC_TALK_PART_ID = 1

/**
 * Meeting part type constants
 * Defines all possible part types in weekend meetings
 */
export const MEETING_PART_TYPES = {
  CHAIRMAN: "chairman",
  PUBLIC_TALK: "public_talk",
  WATCHTOWER_STUDY: "watchtower_study",
  READER: "reader",
  CLOSING_PRAYER: "closing_prayer",
  CIRCUIT_OVERSEER_TALK: "circuit_overseer_talk",
} as const

export type MeetingPartType = (typeof MEETING_PART_TYPES)[keyof typeof MEETING_PART_TYPES]

/**
 * Meeting part order for consistent display
 * Order: Chairman → Public Talk → Watchtower Study → Reader → Circuit Overseer Talk → Closing Prayer
 */
export const MEETING_PART_ORDER = [
  MEETING_PART_TYPES.CHAIRMAN,
  MEETING_PART_TYPES.PUBLIC_TALK,
  MEETING_PART_TYPES.WATCHTOWER_STUDY,
  MEETING_PART_TYPES.READER,
  MEETING_PART_TYPES.CIRCUIT_OVERSEER_TALK,
  MEETING_PART_TYPES.CLOSING_PRAYER,
] as const
