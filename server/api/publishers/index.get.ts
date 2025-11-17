import { like, or, eq, and } from "drizzle-orm"
import { publishers, type Publisher } from "../../database/schema"

export default defineEventHandler(async (event): Promise<Publisher[]> => {
  await requirePermission({ publishers: ["list"] })(event)

  const db = useDrizzle()
  const query = getQuery(event)

  // Build where conditions
  const whereConditions = []

  // Search filter
  if (query.search && typeof query.search === "string") {
    const searchTerm = `%${query.search.toLowerCase()}%`
    whereConditions.push(
      or(like(publishers.firstName, searchTerm), like(publishers.lastName, searchTerm))
    )
  }

  // Boolean filters
  if (query.isElder === "true") {
    whereConditions.push(eq(publishers.isElder, true))
  }
  if (query.isMinisterialServant === "true") {
    whereConditions.push(eq(publishers.isMinisterialServant, true))
  }
  if (query.canChairWeekendMeeting === "true") {
    whereConditions.push(eq(publishers.canChairWeekendMeeting, true))
  }
  if (query.conductsWatchtowerStudy === "true") {
    whereConditions.push(eq(publishers.conductsWatchtowerStudy, true))
  }
  if (query.isReader === "true") {
    whereConditions.push(eq(publishers.isReader, true))
  }
  if (query.offersPublicPrayer === "true") {
    whereConditions.push(eq(publishers.offersPublicPrayer, true))
  }
  if (query.isCircuitOverseer === "true") {
    whereConditions.push(eq(publishers.isCircuitOverseer, true))
  }

  const publishersData =
    whereConditions.length > 0
      ? await db
          .select()
          .from(publishers)
          .where(and(...whereConditions))
          .orderBy(publishers.lastName, publishers.firstName)
      : await db.select().from(publishers).orderBy(publishers.lastName, publishers.firstName)

  return publishersData
})
