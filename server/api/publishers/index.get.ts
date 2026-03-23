import { like, or, eq, and } from "drizzle-orm"
import { z } from "zod"
import { publishers, type Publisher } from "../../database/schema"
import { defineEndpoint } from "../../utils/define-endpoint"

const publisherListQuerySchema = () =>
  z.object({
    search: z.string().optional(),
    isElder: z.enum(["true", "false"]).optional(),
    isMinisterialServant: z.enum(["true", "false"]).optional(),
    canChairWeekendMeeting: z.enum(["true", "false"]).optional(),
    conductsWatchtowerStudy: z.enum(["true", "false"]).optional(),
    isReader: z.enum(["true", "false"]).optional(),
    offersPublicPrayer: z.enum(["true", "false"]).optional(),
    isCircuitOverseer: z.enum(["true", "false"]).optional(),
  })

export default defineEndpoint({
  permissions: { publishers: ["list"] },
  query: publisherListQuerySchema,
  handler: async (event, { query }): Promise<Publisher[]> => {
  const db = useDrizzle()

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
  }
})
