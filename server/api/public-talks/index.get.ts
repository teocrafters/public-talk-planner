import { eq, desc, asc, sql } from "drizzle-orm"
import { publicTalks, scheduledPublicTalks } from "../../database/schema"
import { defineEndpoint } from "../../utils/define-endpoint"
import { sortQuerySchema } from "#shared/utils/schemas/query-params"
import { compareNullableDates } from "#shared/utils/date-yyyymmdd"
import type { YYYYMMDD } from "#shared/types/date"

// `no` is free text, so a whole-value cast raises in PostgreSQL where SQLite silently yielded 0;
// taking the leading digits keeps that 0 for values that start with none.
const talkNumberOrder = sql`COALESCE(SUBSTRING(${publicTalks.no} FROM '^[0-9]+')::INTEGER, 0)`

export default defineEndpoint({
  auth: false,
  query: sortQuerySchema,
  handler: async (event, { query }): Promise<unknown> => {
    // Reading public talks doesn't require special permissions - they're public data

    const db = useDrizzle()

    // Extract sorting parameters
    const sortBy = query.sortBy || "number" // Default: sort by number
    const sortOrder = query.sortOrder || "asc" // Default: ascending

    // Base query with last given date in a single query
    let talksQuery = db
      .select({
        id: publicTalks.id,
        no: publicTalks.no,
        title: publicTalks.title,
        multimediaCount: publicTalks.multimediaCount,
        videoCount: publicTalks.videoCount,
        status: publicTalks.status,
        createdAt: publicTalks.createdAt,
        // Include last given date from scheduled talks
        lastGivenDate: sql<YYYYMMDD | null>`MAX(${scheduledPublicTalks.date})`.as("lastGivenDate"),
      })
      .from(publicTalks)
      .leftJoin(scheduledPublicTalks, eq(publicTalks.id, scheduledPublicTalks.talkId))
      .groupBy(publicTalks.id)
      .$dynamic()

    // Add sorting based on the sortBy parameter
    switch (sortBy) {
      case "title":
        // Sort by title alphabetically
        talksQuery =
          sortOrder === "desc"
            ? talksQuery.orderBy(desc(publicTalks.title))
            : talksQuery.orderBy(asc(publicTalks.title))
        break

      case "number":
        // Sort by talk number numerically
        talksQuery =
          sortOrder === "desc"
            ? talksQuery.orderBy(desc(talkNumberOrder))
            : talksQuery.orderBy(asc(talkNumberOrder))
        break

      default:
        // Sort by last given date
        talksQuery =
          sortOrder === "desc"
            ? talksQuery.orderBy(desc(sql`MAX(${scheduledPublicTalks.date})`))
            : talksQuery.orderBy(asc(sql`MAX(${scheduledPublicTalks.date})`))
        break
    }

    const talksList = await talksQuery

    // Additional sorting for lastGiven when SQL sort needs special handling for nulls
    if (sortBy === "lastGiven") {
      const direction = sortOrder === "desc" ? -1 : 1

      talksList.sort((a, b) => direction * compareNullableDates(a.lastGivenDate, b.lastGivenDate))
    }

    // Return the complete data including lastGivenDate
    return talksList
  },
})
