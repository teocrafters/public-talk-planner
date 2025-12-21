import { eq, desc, asc, sql } from "drizzle-orm"
import { publicTalks, scheduledPublicTalks } from "../../database/schema"

export default defineEventHandler(async event => {
  // Reading public talks doesn't require special permissions - they're public data

  const query = getQuery(event)
  const db = useDrizzle()

  // Extract sorting parameters
  const sortBy = (query.sortBy as string) || "number" // Default: sort by number
  const sortOrder = (query.sortOrder as string) || "asc" // Default: ascending

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
      lastGivenDate: sql<number | null>`MAX(${scheduledPublicTalks.date})`.as("lastGivenDate"),
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
          ? talksQuery.orderBy(desc(sql`CAST(${publicTalks.no} AS INTEGER)`))
          : talksQuery.orderBy(asc(sql`CAST(${publicTalks.no} AS INTEGER)`))
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
    talksList.sort((a, b) => {
      const aHasDate = a.lastGivenDate !== null
      const bHasDate = b.lastGivenDate !== null

      if (sortOrder === "desc") {
        // Newest first, then those without dates
        if (!aHasDate && !bHasDate) return 0
        if (!aHasDate) return 1
        if (!bHasDate) return -1
        return (b.lastGivenDate || 0) - (a.lastGivenDate || 0)
      } else {
        // Oldest first, then those without dates
        if (!aHasDate && !bHasDate) return 0
        if (!aHasDate) return -1
        if (!bHasDate) return 1
        return (a.lastGivenDate || 0) - (b.lastGivenDate || 0)
      }
    })
  }

  // Return the complete data including lastGivenDate
  return talksList
})
