import { createError } from "h3"
import { eq, and, gte, lte, inArray } from "drizzle-orm"
import {
	meetingExceptions,
	meetingPrograms,
	meetingProgramParts,
	meetingScheduledParts,
	scheduledPublicTalks,
} from "../../database/schema"
import { validateBody } from "../../utils/validation"
import { createMeetingExceptionSchema } from "#shared/utils/schemas/meeting-exception"

export default defineEventHandler(async event => {
	await requirePermission({ weekend_meetings: ["manage_exceptions"] })(event)

	const body = await validateBody(event, createMeetingExceptionSchema)
	const db = useDrizzle()

	// Check if exception already exists for this date
	const existingException = await db.query.meetingExceptions.findFirst({
		where: eq(meetingExceptions.date, body.date),
	})

	if (existingException) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			data: { message: "errors.exceptionAlreadyExists" },
		})
	}

	// Check if meeting program exists for this date (any time during the day)
	const requestDate = new Date(body.date * 1000)
	const dayStart = new Date(
		Date.UTC(requestDate.getUTCFullYear(), requestDate.getUTCMonth(), requestDate.getUTCDate(), 0, 0, 0)
	)
	const dayEnd = new Date(
		Date.UTC(
			requestDate.getUTCFullYear(),
			requestDate.getUTCMonth(),
			requestDate.getUTCDate(),
			23,
			59,
			59
		)
	)
	const dayStartUnix = Math.floor(dayStart.getTime() / 1000)
	const dayEndUnix = Math.floor(dayEnd.getTime() / 1000)

	const existingProgram = await db.query.meetingPrograms.findFirst({
		where: and(
			eq(meetingPrograms.type, "weekend"),
			gte(meetingPrograms.date, dayStartUnix),
			lte(meetingPrograms.date, dayEndUnix)
		),
		with: {
			parts: {
				with: {
					meetingScheduledParts: {
						with: {
							publisher: true,
						},
					},
				},
			},
		},
	})

	let deletedMeetingId: number | undefined

	if (existingProgram) {
		if (!body.confirmDeleteExisting) {
			// Return 409 with meeting details for user confirmation
			const parts = existingProgram.parts.flatMap(part =>
				part.meetingScheduledParts.map(scheduled => ({
					type: part.type,
					personName: `${scheduled.publisher.firstName} ${scheduled.publisher.lastName}`,
				}))
			)

			throw createError({
				statusCode: 409,
				statusMessage: "Conflict",
				data: {
					message: "errors.meetingAlreadyScheduledOnException",
					meeting: {
						id: existingProgram.id,
						date: existingProgram.date,
						isCircuitOverseerVisit: existingProgram.isCircuitOverseerVisit,
						parts,
					},
				},
			})
		}

		// User confirmed deletion - manually delete in correct order due to RESTRICT constraints
		deletedMeetingId = existingProgram.id

		// Step 1: Delete scheduled public talks (has RESTRICT constraint on meetingProgramId)
		await db
			.delete(scheduledPublicTalks)
			.where(eq(scheduledPublicTalks.meetingProgramId, existingProgram.id))

		// Step 2: Delete meeting scheduled parts (needs to be deleted before program parts)
		const partIds = await db
			.select({ id: meetingProgramParts.id })
			.from(meetingProgramParts)
			.where(eq(meetingProgramParts.meetingProgramId, existingProgram.id))

		if (partIds.length > 0) {
			await db
				.delete(meetingScheduledParts)
				.where(
					inArray(
						meetingScheduledParts.meetingProgramPartId,
						partIds.map(p => p.id)
					)
				)
		}

		// Step 3: Delete meeting program parts
		await db
			.delete(meetingProgramParts)
			.where(eq(meetingProgramParts.meetingProgramId, existingProgram.id))

		// Step 4: Finally delete the meeting program itself
		await db.delete(meetingPrograms).where(eq(meetingPrograms.id, existingProgram.id))
	}

	// Create the exception
	const exceptionId = crypto.randomUUID()
	const now = new Date()

	await db.insert(meetingExceptions).values({
		id: exceptionId,
		date: body.date,
		exceptionType: body.exceptionType,
		description: body.description || null,
		createdAt: now,
		updatedAt: now,
	})

	// Log audit event
	await logAuditEvent(event, {
		action: AUDIT_EVENTS.MEETING_EXCEPTION_CREATED,
		resourceType: "meeting_exception",
		resourceId: exceptionId,
		details: {
			exceptionId,
			date: body.date,
			exceptionType: body.exceptionType,
			description: body.description || null,
			deletedExistingMeeting: !!deletedMeetingId,
			deletedMeetingId,
		} satisfies AuditEventDetails[typeof AUDIT_EVENTS.MEETING_EXCEPTION_CREATED],
	})

	return {
		success: true,
		exception: {
			id: exceptionId,
			date: body.date,
			exceptionType: body.exceptionType,
		},
	}
})
