import { gte, lte, and } from "drizzle-orm"
import { meetingExceptions } from "../../database/schema"
import { defineEndpoint } from "../../utils/define-endpoint"
import { dateRangeQuerySchema } from "#shared/utils/schemas/query-params"
import type { MeetingExceptionListItem } from "#shared/types/api-meeting-exceptions"

export default defineEndpoint({
  permissions: { weekend_meetings: ["list"] },
  query: dateRangeQuerySchema,
  handler: async (event, { query }): Promise<MeetingExceptionListItem[]> => {
    const db = useDrizzle()

    // Build where conditions
    const whereConditions = []

    // Date range filter (dates are YYYYMMDD strings, string comparison works correctly)
    if (query.startDate) {
      whereConditions.push(gte(meetingExceptions.date, toYYYYMMDD(query.startDate)))
    }

    if (query.endDate) {
      whereConditions.push(lte(meetingExceptions.date, toYYYYMMDD(query.endDate)))
    }

    // Fetch exceptions
    const exceptions = await db.query.meetingExceptions.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      orderBy: (exceptions, { asc }) => [asc(exceptions.date)],
    })

    // Transform to response format
    const result: MeetingExceptionListItem[] = exceptions.map(exception => ({
      id: exception.id,
      date: exception.date,
      exceptionType: exception.exceptionType,
      description: exception.description,
      createdAt: exception.createdAt,
      updatedAt: exception.updatedAt,
    }))

    return result
  },
})
