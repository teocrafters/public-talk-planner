import { like, or, eq, and } from "drizzle-orm"
import { schema } from "hub:db"

export default defineEventHandler(async (event): Promise<Publisher[]> => {
  await requirePermission({ publishers: ["list"] })(event)

  const query = getQuery(event)

  // Build where conditions
  const whereConditions = []

  // Search filter
  if (query.search && typeof query.search === "string") {
    const searchTerm = `%${query.search.toLowerCase()}%`
    whereConditions.push(
      or(like(schema.publishers.firstName, searchTerm), like(schema.publishers.lastName, searchTerm))
    )
  }

  // Boolean filters
  if (query.isElder === "true") {
    whereConditions.push(eq(schema.publishers.isElder, true))
  }
  if (query.isMinisterialServant === "true") {
    whereConditions.push(eq(schema.publishers.isMinisterialServant, true))
  }
  if (query.canChairWeekendMeeting === "true") {
    whereConditions.push(eq(schema.publishers.canChairWeekendMeeting, true))
  }
  if (query.conductsWatchtowerStudy === "true") {
    whereConditions.push(eq(schema.publishers.conductsWatchtowerStudy, true))
  }
  if (query.isReader === "true") {
    whereConditions.push(eq(schema.publishers.isReader, true))
  }
  if (query.offersPublicPrayer === "true") {
    whereConditions.push(eq(schema.publishers.offersPublicPrayer, true))
  }
  if (query.isCircuitOverseer === "true") {
    whereConditions.push(eq(schema.publishers.isCircuitOverseer, true))
  }

  const publishersData =
    whereConditions.length > 0
      ? await db
          .select()
          .from(schema.publishers)
          .where(and(...whereConditions))
          .orderBy(schema.publishers.lastName, schema.publishers.firstName)
      : await db.select().from(schema.publishers).orderBy(schema.publishers.lastName, schema.publishers.firstName)

  return publishersData
})
