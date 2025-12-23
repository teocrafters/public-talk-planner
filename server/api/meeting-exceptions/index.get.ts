import type { H3Event } from "h3"
import { gte, lte, and, asc as ascHelper } from "drizzle-orm"
import { schema } from "hub:db"
import type { MeetingExceptionListItem } from "#shared/types/api-meeting-exceptions"

export default defineEventHandler(async (event: H3Event): Promise<MeetingExceptionListItem[]> => {
	await requirePermission({ weekend_meetings: ["list"] })(event)

	const query = getQuery(event)

	// Build where conditions
	const whereConditions = []

	// Date range filter
	if (query.startDate && typeof query.startDate === "string") {
		const startTimestamp = parseInt(query.startDate)
		whereConditions.push(gte(schema.meetingExceptions.date, startTimestamp))
	}

	if (query.endDate && typeof query.endDate === "string") {
		const endTimestamp = parseInt(query.endDate)
		whereConditions.push(lte(schema.meetingExceptions.date, endTimestamp))
	}

	// Fetch exceptions
	const exceptions: Array<typeof schema.meetingExceptions.$inferSelect> =
		await db.query.meetingExceptions.findMany({
			where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
			orderBy: [ascHelper(schema.meetingExceptions.date)],
		})

	// Transform to response format
	const result: MeetingExceptionListItem[] = exceptions.map((exception) => ({
		id: exception.id,
		date: exception.date,
		exceptionType: exception.exceptionType,
		description: exception.description,
		createdAt: exception.createdAt,
		updatedAt: exception.updatedAt,
	}))

	return result
})
