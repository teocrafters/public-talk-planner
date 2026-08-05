import { eq, desc, asc, sql } from "drizzle-orm"
import { z } from "zod"
import {
  speakers,
  speakerTalks,
  organization,
  publicTalks,
  scheduledPublicTalks,
} from "../../database/schema"
import { defineEndpoint } from "../../utils/define-endpoint"
import { sortQuerySchema } from "#shared/utils/schemas/query-params"
import { compareNullableDates } from "#shared/utils/date-yyyymmdd"
import type { YYYYMMDD } from "#shared/types/date"

const speakerListQuerySchema = () =>
  sortQuerySchema().extend({
    search: z.string().optional(),
  })

type TalkSummary = {
  id: string
  no: string
  title: string
}

export default defineEndpoint({
  permissions: { speakers: ["list"] },
  query: speakerListQuerySchema,
  handler: async (event, { query }): Promise<unknown> => {
  const db = useDrizzle()

  // Extract sorting parameters
  const sortBy = query.sortBy || "name" // Default: sort by name
  const sortOrder = query.sortOrder || "asc" // Default: ascending

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
      lastTalkDate: sql<YYYYMMDD | null>`MAX(${scheduledPublicTalks.date})`.as("lastTalkDate"),
      // Aggregate talks using JSON aggregation through speakerTalks relationship
      // JSONB_BUILD_OBJECT rather than JSON_BUILD_OBJECT: DISTINCT needs an equality operator,
      // which json lacks and jsonb has.
      talks: sql<TalkSummary[]>`
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', ${publicTalks.id},
              'no', ${publicTalks.no},
              'title', ${publicTalks.title}
            )
          ) FILTER (WHERE ${publicTalks.id} IS NOT NULL),
          '[]'::JSON
        )
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

  // Additional sorting for lastTalk when SQL sort needs special handling for nulls
  if (sortBy === "lastTalk") {
    const direction = sortOrder === "desc" ? -1 : 1

    speakersList.sort((a, b) => direction * compareNullableDates(a.lastTalkDate, b.lastTalkDate))
  }

  // Return the complete data including lastTalkDate
  return speakersList
  },
})
