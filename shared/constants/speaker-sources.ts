/**
 * Speaker Source Types
 *
 * Defines the source of speakers for scheduled public talks.
 * - VISITING_SPEAKER: External speaker from speakers table
 * - LOCAL_PUBLISHER: Local congregation publisher from publishers table
 */
export const SPEAKER_SOURCE_TYPES = {
	VISITING_SPEAKER: "visiting_speaker",
	LOCAL_PUBLISHER: "local_publisher",
} as const

/**
 * Type representing speaker source type values
 */
export type SpeakerSourceType =
	(typeof SPEAKER_SOURCE_TYPES)[keyof typeof SPEAKER_SOURCE_TYPES]

/**
 * Array of all valid speaker source type values (for Zod enum validation)
 */
export const SPEAKER_SOURCE_TYPE_VALUES = Object.values(
	SPEAKER_SOURCE_TYPES
) as [SpeakerSourceType, ...SpeakerSourceType[]]
