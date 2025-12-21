import { eq, desc, asc, sql } from "drizzle-orm"
import {
  speakers,
  speakerTalks,
  organization,
  publicTalks,
  scheduledPublicTalks,
} from "../../database/schema"

export default defineEventHandler(async event => {
  await requirePermission({ speakers: ["list"] })(event)

  const query = getQuery(event)
  const db = useDrizzle()

  // Extract sorting parameters
  const sortBy = (query.sortBy as string) || "name" // Default: sort by name
  const sortOrder = (query.sortOrder as string) || "asc" // Default: ascending

  // Optimized single query with JSON aggregation using speakerTalks relationship
  let speakersQuery = db
    .select({
      id: speakers.id,
      firstName: speakers.firstName,
      lastName: speakers.lastName,
      phone: speakers.phone,
      congregationId: speakers.congregationId,
      congregationName: organization.name,
      archived: speakers.archived,
      archivedAt: speakers.archivedAt,
      createdAt: speakers.createdAt,
      updatedAt: speakers.updatedAt,
      // Include last talk date from scheduled talks
      lastTalkDate: sql<number | null>`MAX(${scheduledPublicTalks.date})`.as("lastTalkDate"),
      // Aggregate talks using JSON aggregation through speakerTalks relationship
      talks: sql<string>`
        JSON_GROUP_ARRAY(
          DISTINCT JSON_OBJECT(
            'id', ${publicTalks.id},
            'no', ${publicTalks.no},
            'title', ${publicTalks.title}
          )
        ) FILTER (WHERE ${publicTalks.id} IS NOT NULL)
      `.as("talks"),
    })
    .from(speakers)
    .leftJoin(organization, eq(speakers.congregationId, organization.id))
    .leftJoin(scheduledPublicTalks, eq(speakers.id, scheduledPublicTalks.speakerId))
    .leftJoin(speakerTalks, eq(speakers.id, speakerTalks.speakerId))
    .leftJoin(publicTalks, eq(speakerTalks.talkId, publicTalks.id))
    .groupBy(speakers.id, organization.id)
    .$dynamic()

  // Add sorting based on the sortBy parameter
  switch (sortBy) {
    case "name":
      // Sort by last name first, then first name
      speakersQuery =
        sortOrder === "desc"
          ? speakersQuery.orderBy(desc(speakers.lastName), desc(speakers.firstName))
          : speakersQuery.orderBy(asc(speakers.lastName), asc(speakers.firstName))
      break

    case "congregation":
      // Sort by congregation name, then by speaker name
      speakersQuery =
        sortOrder === "desc"
          ? speakersQuery.orderBy(
              desc(organization.name),
              desc(speakers.lastName),
              desc(speakers.firstName)
            )
          : speakersQuery.orderBy(
              asc(organization.name),
              asc(speakers.lastName),
              asc(speakers.firstName)
            )
      break

    default:
      // Sort by last talk date
      speakersQuery =
        sortOrder === "desc"
          ? speakersQuery.orderBy(desc(sql`MAX(${scheduledPublicTalks.date})`))
          : speakersQuery.orderBy(asc(sql`MAX(${scheduledPublicTalks.date})`))
  }

  const speakersList = await speakersQuery

  // Parse JSON talks and handle empty arrays
  const speakersWithTalks = speakersList.map(speaker => ({
    ...speaker,
    talks: speaker.talks ? JSON.parse(speaker.talks) : [],
  }))

  // Additional sorting for lastTalk when SQL sort needs special handling for nulls
  if (sortBy === "lastTalk") {
    speakersWithTalks.sort((a, b) => {
      const aHasDate = a.lastTalkDate !== null
      const bHasDate = b.lastTalkDate !== null

      if (sortOrder === "desc") {
        // Newest first, then those without dates
        if (!aHasDate && !bHasDate) return 0
        if (!aHasDate) return 1
        if (!bHasDate) return -1
        return (b.lastTalkDate || 0) - (a.lastTalkDate || 0)
      } else {
        // Oldest first, then those without dates
        if (!aHasDate && !bHasDate) return 0
        if (!aHasDate) return -1
        if (!bHasDate) return 1
        return (a.lastTalkDate || 0) - (b.lastTalkDate || 0)
      }
    })
  }

  // Return the complete data including lastTalkDate
  return speakersWithTalks
})
