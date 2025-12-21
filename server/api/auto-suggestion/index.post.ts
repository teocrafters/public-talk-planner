import { createError } from "h3"
import { eq, and, inArray, asc, sql, notInArray } from "drizzle-orm"
import {
  speakers,
  publishers,
  scheduledPublicTalks,
  speakerTalks,
  publicTalks,
  organization,
} from "../../database/schema"
import { autoSuggestionSchema } from "#shared/utils/schemas"

export default defineEventHandler(async event => {
  await requirePermission({
    weekend_meetings: ["list"],
  })(event)

  const body = await validateBody(event, autoSuggestionSchema)

  const db = useDrizzle()

  // Set 20-second timeout
  const timeoutMs = 20000
  const startTime = Date.now()

  const checkTimeout = () => {
    if (Date.now() - startTime > timeoutMs) {
      throw createError({
        statusCode: 408,
        statusMessage: "Request Timeout",
        data: { message: "errors.autoSuggestionTimeout" },
      })
    }
  }

  try {
    // Step 1: Create Talk Pool - Select 10 talks with oldest lastGivenDate from visiting speakers
    checkTimeout()

    // Get all non-archived visiting speakers
    const visitingSpeakers = await db
      .select({
        id: speakers.id,
      })
      .from(speakers)
      .where(eq(speakers.archived, false))

    if (visitingSpeakers.length === 0) {
      // Fallback: No visiting speakers available, suggest local publisher
      return await getFallbackSuggestion(db)
    }

    const visitingSpeakerIds = visitingSpeakers.map(s => s.id)

    checkTimeout()

    // Get talks with their last given dates for visiting speakers
    // Note: scheduledPublicTalks.date is timestamp mode (Date), need to extract as integer
    const talkPoolQuery = db
      .select({
        talkId: publicTalks.id,
        talkNo: publicTalks.no,
        talkTitle: publicTalks.title,
        lastGivenDate: sql<Date | null>`MAX(${scheduledPublicTalks.date})`.as("last_given_date"),
      })
      .from(speakerTalks)
      .innerJoin(publicTalks, eq(speakerTalks.talkId, publicTalks.id))
      .innerJoin(speakers, eq(speakerTalks.speakerId, speakers.id))
      .leftJoin(
        scheduledPublicTalks,
        and(
          eq(scheduledPublicTalks.talkId, publicTalks.id),
          eq(scheduledPublicTalks.speakerId, speakers.id)
        )
      )
      .where(and(eq(speakers.archived, false), inArray(speakers.id, visitingSpeakerIds)))
      .groupBy(publicTalks.id, publicTalks.no, publicTalks.title)
      .orderBy(asc(sql`last_given_date`))
      .limit(10)

    const talkPool = await talkPoolQuery

    if (talkPool.length === 0) {
      // No talks available from visiting speakers, fallback to local publisher
      return await getFallbackSuggestion(db)
    }

    const talkPoolIds = talkPool.map(t => t.talkId)

    checkTimeout()

    // Step 2: Filter eligible speakers who can deliver pool talks
    // Exclude archived and session-excluded speakers
    const eligibleSpeakersQuery = db
      .select({
        speakerId: speakers.id,
      })
      .from(speakerTalks)
      .innerJoin(speakers, eq(speakerTalks.speakerId, speakers.id))
      .where(
        and(
          inArray(speakerTalks.talkId, talkPoolIds),
          eq(speakers.archived, false),
          body.excludedSpeakerIds.length > 0
            ? notInArray(speakers.id, body.excludedSpeakerIds)
            : undefined
        )
      )
      .groupBy(speakers.id)

    const eligibleSpeakers = await eligibleSpeakersQuery

    if (eligibleSpeakers.length === 0) {
      // No more eligible speakers after exclusions
      return {
        speaker: null,
        availableTalks: [],
        hasMoreSuggestions: false,
      }
    }

    const eligibleSpeakerIds = eligibleSpeakers.map(s => s.speakerId)

    checkTimeout()

    // Step 3: Select oldest-speaking speaker from eligible speakers
    // Calculate last scheduled talk date for each eligible speaker
    const speakerLastTalkQuery = db
      .select({
        speakerId: speakers.id,
        firstName: speakers.firstName,
        lastName: speakers.lastName,
        phone: speakers.phone,
        congregationId: speakers.congregationId,
        lastTalkDate: sql<Date | null>`MAX(${scheduledPublicTalks.date})`.as("last_talk_date"),
      })
      .from(speakers)
      .leftJoin(scheduledPublicTalks, eq(scheduledPublicTalks.speakerId, speakers.id))
      .where(inArray(speakers.id, eligibleSpeakerIds))
      .groupBy(
        speakers.id,
        speakers.firstName,
        speakers.lastName,
        speakers.phone,
        speakers.congregationId
      )
      .orderBy(asc(sql`last_talk_date`))
      .limit(1)

    const selectedSpeakerData = await speakerLastTalkQuery

    if (!selectedSpeakerData[0]) {
      // Unexpected error: no speaker selected
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
        data: { message: "errors.noSpeakerSelected" },
      })
    }

    const selectedSpeaker = selectedSpeakerData[0]

    checkTimeout()

    // Get congregation name
    const congregationData = await db
      .select({
        name: organization.name,
      })
      .from(organization)
      .where(eq(organization.id, selectedSpeaker.congregationId))
      .limit(1)

    const congregationName = congregationData[0]?.name || ""

    checkTimeout()

    // Step 4: Filter available talks that selected speaker can deliver from the pool
    const availableTalksQuery = db
      .select({
        talkId: publicTalks.id,
        talkNo: publicTalks.no,
        talkTitle: publicTalks.title,
        lastGivenDate: sql<Date | null>`MAX(${scheduledPublicTalks.date})`.as("last_given_date"),
      })
      .from(speakerTalks)
      .innerJoin(publicTalks, eq(speakerTalks.talkId, publicTalks.id))
      .leftJoin(
        scheduledPublicTalks,
        and(
          eq(scheduledPublicTalks.talkId, publicTalks.id),
          eq(scheduledPublicTalks.speakerId, selectedSpeaker.speakerId)
        )
      )
      .where(
        and(
          eq(speakerTalks.speakerId, selectedSpeaker.speakerId),
          inArray(publicTalks.id, talkPoolIds)
        )
      )
      .groupBy(publicTalks.id, publicTalks.no, publicTalks.title)
      .orderBy(asc(sql`last_given_date`))

    const availableTalks = await availableTalksQuery

    checkTimeout()

    // Step 5: Calculate hasMoreSuggestions
    // Count remaining eligible speakers excluding current selection and already excluded
    const allExcluded = [...body.excludedSpeakerIds, selectedSpeaker.speakerId]

    const remainingSpeakersQuery = db
      .select({
        speakerId: speakers.id,
      })
      .from(speakerTalks)
      .innerJoin(speakers, eq(speakerTalks.speakerId, speakers.id))
      .where(
        and(
          inArray(speakerTalks.talkId, talkPoolIds),
          eq(speakers.archived, false),
          notInArray(speakers.id, allExcluded)
        )
      )
      .groupBy(speakers.id)

    const remainingSpeakers = await remainingSpeakersQuery

    checkTimeout()

    return {
      speaker: {
        id: selectedSpeaker.speakerId,
        firstName: selectedSpeaker.firstName,
        lastName: selectedSpeaker.lastName,
        phone: selectedSpeaker.phone,
        congregationName: congregationName,
        lastTalkDate: selectedSpeaker.lastTalkDate
          ? dayjs(selectedSpeaker.lastTalkDate).unix()
          : null,
        isVisiting: true,
      },
      availableTalks: availableTalks.map(talk => ({
        id: talk.talkId,
        no: talk.talkNo,
        title: talk.talkTitle,
        lastGivenDate: talk.lastGivenDate ? dayjs(talk.lastGivenDate).unix() : null,
      })),
      hasMoreSuggestions: remainingSpeakers.length > 0,
    }
  } catch (error) {
    // Handle timeout with simplified fallback
    if (error instanceof Error && error.message.includes("timeout")) {
      return await getFallbackSuggestion(db)
    }
    throw error
  }
})

/**
 * Get fallback suggestion when no visiting speakers available
 * Suggests local publisher who hasn't given public talk longest
 */
async function getFallbackSuggestion(db: ReturnType<typeof useDrizzle>) {
  // Find local publishers who can deliver public talks
  const localPublishersQuery = db
    .select({
      publisherId: publishers.id,
      firstName: publishers.firstName,
      lastName: publishers.lastName,
      lastTalkDate: sql<Date | null>`MAX(${scheduledPublicTalks.date})`.as("last_talk_date"),
    })
    .from(publishers)
    .leftJoin(scheduledPublicTalks, eq(scheduledPublicTalks.publisherId, publishers.id))
    .where(eq(publishers.deliversPublicTalks, true))
    .groupBy(publishers.id, publishers.firstName, publishers.lastName)
    .orderBy(asc(sql`last_talk_date`))
    .limit(1)

  const localPublisher = await localPublishersQuery

  if (!localPublisher[0]) {
    // No local publishers available
    return {
      speaker: null,
      availableTalks: [],
      hasMoreSuggestions: false,
    }
  }

  const publisher = localPublisher[0]

  // Get all public talks for local publisher suggestions
  const allTalks = await db
    .select({
      talkId: publicTalks.id,
      talkNo: publicTalks.no,
      talkTitle: publicTalks.title,
    })
    .from(publicTalks)
    .orderBy(asc(publicTalks.no))

  return {
    speaker: {
      id: publisher.publisherId,
      firstName: publisher.firstName,
      lastName: publisher.lastName,
      phone: "",
      congregationName: "Local",
      lastTalkDate: publisher.lastTalkDate ? dayjs(publisher.lastTalkDate).unix() : null,
      isVisiting: false,
    },
    availableTalks: allTalks.map(talk => ({
      id: talk.talkId,
      no: talk.talkNo,
      title: talk.talkTitle,
      lastGivenDate: null,
    })),
    hasMoreSuggestions: false,
  }
}
