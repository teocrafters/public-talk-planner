import { createError, type H3Event } from "h3"
import { eq, and, gte, lte, inArray } from "drizzle-orm"
import { schema } from "hub:db"
import { validateBody } from "../../utils/validation"
import { createMeetingExceptionSchema } from "#shared/utils/schemas/meeting-exception"

export default defineEventHandler(async (event: H3Event) => {
  await requirePermission({ weekend_meetings: ["manage_exceptions"] })(event)

  const body = await validateBody(event, createMeetingExceptionSchema)

  // Check if exception already exists for this date (any time during the day)
  const requestDate = dayjs.unix(body.date)
  const dayStartUnix = requestDate.startOf("day").unix()
  const dayEndUnix = requestDate.endOf("day").unix()

  const existingException = await db.query.meetingExceptions.findFirst({
    where: and(gte(schema.meetingExceptions.date, dayStartUnix), lte(schema.meetingExceptions.date, dayEndUnix)),
  })

  if (existingException) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.exceptionAlreadyExists" },
    })
  }

  // Check if meeting program exists for this date (any time during the day)
  const existingProgram = await db.query.meetingPrograms.findFirst({
    where: and(
      eq(schema.meetingPrograms.type, "weekend"),
      gte(schema.meetingPrograms.date, dayStartUnix),
      lte(schema.meetingPrograms.date, dayEndUnix)
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

  // Validate confirmation before proceeding
  if (existingProgram && !body.confirmDeleteExisting) {
    // Return 409 with meeting details for user confirmation
    type ProgramPart = NonNullable<typeof existingProgram>["parts"][number]
    type ScheduledPart = ProgramPart["meetingScheduledParts"][number]

    const parts = existingProgram.parts.flatMap((part: ProgramPart) =>
      part.meetingScheduledParts.map((scheduled: ScheduledPart) => ({
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

  // Build batch operations array
  // AGENT-NOTE: Using conditional spread to build array of operations for D1 batch API
  // All operations must be independent - dependent queries (like partIds) are fetched beforehand
  // AGENT-NOTE: Using 'any[]' because TypeScript cannot properly infer mixed Drizzle operation types
  const operations = [
    // Step 1: Delete scheduled public talks (has RESTRICT constraint on meetingProgramId)
    ...(existingProgram
      ? [
          db
            .delete(schema.scheduledPublicTalks)
            .where(eq(schema.scheduledPublicTalks.meetingProgramId, existingProgram.id)),
        ]
      : []),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any[]

  if (existingProgram) {
    // User confirmed deletion - manually delete in correct order due to RESTRICT constraints
    deletedMeetingId = existingProgram.id

    // Step 2: Fetch meeting program part IDs BEFORE batch (dependent query - must be outside batch)
    const partIds = await db
      .select({ id: schema.meetingProgramParts.id })
      .from(schema.meetingProgramParts)
      .where(eq(schema.meetingProgramParts.meetingProgramId, existingProgram.id))

    // Step 3: Delete meeting scheduled parts (needs to be deleted before program parts)
    if (partIds.length > 0) {
      operations.push(
        db.delete(schema.meetingScheduledParts).where(
          inArray(
            schema.meetingScheduledParts.meetingProgramPartId,
            partIds.map(p => p.id)
          )
        )
      )
    }

    // Step 4: Delete meeting program parts
    operations.push(
      db
        .delete(schema.meetingProgramParts)
        .where(eq(schema.meetingProgramParts.meetingProgramId, existingProgram.id))
    )

    // Step 5: Finally delete the meeting program itself
    operations.push(db.delete(schema.meetingPrograms).where(eq(schema.meetingPrograms.id, existingProgram.id)))
  }

  // Create the exception (within the same batch)
  const exceptionId = crypto.randomUUID()
  const now = new Date()

  operations.push(
    db.insert(schema.meetingExceptions).values({
      id: exceptionId,
      date: body.date,
      exceptionType: body.exceptionType,
      description: body.description || null,
      createdAt: now,
      updatedAt: now,
    })
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.batch(operations as any)

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
