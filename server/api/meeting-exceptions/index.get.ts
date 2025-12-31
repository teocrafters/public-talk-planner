import { gte, lte, and } from "drizzle-orm"
import { meetingExceptions } from "../../database/schema"
import type { MeetingExceptionListItem } from "#shared/types/api-meeting-exceptions"

export default defineEventHandler(async (event): Promise<MeetingExceptionListItem[]> => {
  await requirePermission({ weekend_meetings: ["list"] })(event)

  const db = useDrizzle()
  const query = getQuery(event)

  // Build where conditions
  const whereConditions = []

  // Date range filter (dates are YYYYMMDD strings, string comparison works correctly)
  if (query.startDate && typeof query.startDate === "string") {
    whereConditions.push(gte(meetingExceptions.date, toYYYYMMDD(query.startDate)))
  }

  if (query.endDate && typeof query.endDate === "string") {
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
})
