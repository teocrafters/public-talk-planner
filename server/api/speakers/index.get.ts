import { eq, desc, asc, sql } from "drizzle-orm"
import { schema } from "hub:db"

export default defineEventHandler(async event => {
  await requirePermission({ speakers: ["list"] })(event)

  const query = getQuery(event)

  // Extract sorting parameters
  const sortBy = (query.sortBy as string) || "name" // Default: sort by name
  const sortOrder = (query.sortOrder as string) || "asc" // Default: ascending

  // Optimized single query with JSON aggregation using speakerTalks relationship
  let speakersQuery = db
    .select({
      id: schema.speakers.id,
      firstName: schema.speakers.firstName,
      lastName: schema.speakers.lastName,
      phone: schema.speakers.phone,
      congregationId: schema.speakers.congregationId,
      congregationName: schema.organization.name,
      archived: schema.speakers.archived,
      archivedAt: schema.speakers.archivedAt,
      createdAt: schema.speakers.createdAt,
      updatedAt: schema.speakers.updatedAt,
      // Include last talk date from scheduled talks
      lastTalkDate: sql<number | null>`MAX(${schema.scheduledPublicTalks.date})`.as("lastTalkDate"),
      // Aggregate talks using JSON aggregation through speakerTalks relationship
      talks: sql<string>`
        JSON_GROUP_ARRAY(
          DISTINCT JSON_OBJECT(
            'id', ${schema.publicTalks.id},
            'no', ${schema.publicTalks.no},
            'title', ${schema.publicTalks.title}
          )
        ) FILTER (WHERE ${schema.publicTalks.id} IS NOT NULL)
      `.as("talks"),
    })
    .from(schema.speakers)
    .leftJoin(schema.organization, eq(schema.speakers.congregationId, schema.organization.id))
    .leftJoin(schema.scheduledPublicTalks, eq(schema.speakers.id, schema.scheduledPublicTalks.speakerId))
    .leftJoin(schema.speakerTalks, eq(schema.speakers.id, schema.speakerTalks.speakerId))
    .leftJoin(schema.publicTalks, eq(schema.speakerTalks.talkId, schema.publicTalks.id))
    .groupBy(schema.speakers.id, schema.organization.id)
    .$dynamic()

  // Add sorting based on the sortBy parameter
  switch (sortBy) {
    case "name":
      // Sort by last name first, then first name
      speakersQuery =
        sortOrder === "desc"
          ? speakersQuery.orderBy(desc(schema.speakers.lastName), desc(schema.speakers.firstName))
          : speakersQuery.orderBy(asc(schema.speakers.lastName), asc(schema.speakers.firstName))
      break

    case "congregation":
      // Sort by congregation name, then by speaker name
      speakersQuery =
        sortOrder === "desc"
          ? speakersQuery.orderBy(
              desc(schema.organization.name),
              desc(schema.speakers.lastName),
              desc(schema.speakers.firstName)
            )
          : speakersQuery.orderBy(
              asc(schema.organization.name),
              asc(schema.speakers.lastName),
              asc(schema.speakers.firstName)
            )
      break

    default:
      // Sort by last talk date
      speakersQuery =
        sortOrder === "desc"
          ? speakersQuery.orderBy(desc(sql`MAX(${schema.scheduledPublicTalks.date})`))
          : speakersQuery.orderBy(asc(sql`MAX(${schema.scheduledPublicTalks.date})`))
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
