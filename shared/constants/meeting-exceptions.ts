export const MEETING_EXCEPTION_TYPES = {
  CIRCUIT_ASSEMBLY: "circuit_assembly",
  REGIONAL_CONVENTION: "regional_convention",
  MEMORIAL: "memorial",
} as const

export type MeetingExceptionType =
  (typeof MEETING_EXCEPTION_TYPES)[keyof typeof MEETING_EXCEPTION_TYPES]
