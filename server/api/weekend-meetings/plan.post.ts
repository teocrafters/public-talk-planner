import { createError } from "h3"
import { eq, and, gte, lte } from "drizzle-orm"
import {
  meetingPrograms,
  meetingProgramParts,
  meetingScheduledParts,
  publishers,
  scheduledPublicTalks,
  meetingExceptions,
} from "../../database/schema"
import { validateBody } from "../../utils/validation"
import { planWeekendMeetingSchema } from "#shared/utils/schemas"
import { MEETING_PART_TYPES } from "#shared/constants/meetings"

export default defineEventHandler(async event => {
  await requirePermission({ weekend_meetings: ["schedule_rest"] })(event)

  const body = await validateBody(event, planWeekendMeetingSchema)
  const db = useDrizzle()

  const date = dayjs.unix(body.date)

  // Validate date is Sunday and future
  if (date.day() !== 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.dateMustBeSunday" },
    })
  }

  if (!date.isAfter(dayjs(), "day")) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.dateMustBeFuture" },
    })
  }

  // Check if date has an exception (using day-range check for consistency)
  const requestDate = dayjs.unix(body.date)
  const dayStartUnix = requestDate.startOf("day").unix()
  const dayEndUnix = requestDate.endOf("day").unix()

  const exception = await db.query.meetingExceptions.findFirst({
    where: and(gte(meetingExceptions.date, dayStartUnix), lte(meetingExceptions.date, dayEndUnix)),
  })

  if (exception) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        message: "errors.meetingDateHasException",
        exceptionType: exception.exceptionType,
      },
    })
  }

  // Check if meeting program already exists for this date
  const existingProgram = await db.query.meetingPrograms.findFirst({
    where: and(eq(meetingPrograms.type, "weekend"), eq(meetingPrograms.date, body.date)),
  })

  if (existingProgram && !body.overrideDuplicates) {
    throw createError({
      statusCode: 409,
      statusMessage: "Conflict",
      data: { message: "errors.meetingAlreadyScheduled" },
    })
  }

  // Validate all publishers exist and have required capabilities
  const publisherIds = [
    body.parts.chairman,
    body.parts.watchtowerStudy,
    body.parts.reader,
    body.parts.prayer,
    body.parts.circuitOverseerTalk?.publisherId,
  ].filter(Boolean) as string[]

  // Fetch all publishers
  const allPublishers = new Map<string, typeof publishers.$inferSelect>()
  for (const id of publisherIds) {
    const publisher = await db.query.publishers.findFirst({
      where: eq(publishers.id, id),
    })
    if (!publisher) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "errors.publisherNotFound" },
      })
    }
    allPublishers.set(id, publisher)
  }

  // Validate capabilities
  const chairman = allPublishers.get(body.parts.chairman)!
  if (!chairman.isElder && !chairman.canChairWeekendMeeting) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.publisherCannotChair" },
    })
  }

  const watchtowerConductor = allPublishers.get(body.parts.watchtowerStudy)!
  if (
    !watchtowerConductor.conductsWatchtowerStudy &&
    !watchtowerConductor.backupWatchtowerConductor
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.publisherCannotConductWatchtower" },
    })
  }

  if (body.parts.reader) {
    const reader = allPublishers.get(body.parts.reader)!
    if (!reader.isReader) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "errors.publisherCannotRead" },
      })
    }
  }

  const prayerPublisher = allPublishers.get(body.parts.prayer)!
  if (!prayerPublisher.offersPublicPrayer) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.publisherCannotPray" },
    })
  }

  if (body.parts.circuitOverseerTalk) {
    const coPublisher = allPublishers.get(body.parts.circuitOverseerTalk.publisherId)!
    if (!coPublisher.isCircuitOverseer) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message: "errors.publisherNotCircuitOverseer" },
      })
    }
  }

  // Check for duplicate assignments on same date (unless override)
  if (!body.overrideDuplicates) {
    const existingAssignments = await db.query.meetingScheduledParts.findMany({
      with: {
        part: {
          with: {
            meetingProgram: true,
          },
        },
      },
    })

    const conflictingPublishers = existingAssignments
      .filter(
        assignment =>
          assignment.part.meetingProgram.date === body.date &&
          publisherIds.includes(assignment.publisherId)
      )
      .map(a => a.publisherId)

    if (conflictingPublishers.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: "Conflict",
        data: {
          message: "errors.publishersAlreadyAssigned",
          conflictingPublishers,
        },
      })
    }
  }

  // Create meeting program
  const programResult = await db
    .insert(meetingPrograms)
    .values({
      type: "weekend",
      date: body.date,
      isCircuitOverseerVisit: body.isCircuitOverseerVisit,
      name: null,
      createdAt: new Date(),
    })
    .returning()

  const program = programResult[0]
  if (!program) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: { message: "errors.programCreateFailed" },
    })
  }

  // Create meeting program parts
  let currentOrder = 1
  const partsToCreate: Array<{ type: string; order: number; name?: string }> = [
    { type: MEETING_PART_TYPES.CHAIRMAN, order: currentOrder++ },
  ]

  // For Circuit Overseer visits: add CIRCUIT_OVERSEER_TALK (with title) + PUBLIC_TALK
  if (body.isCircuitOverseerVisit) {
    partsToCreate.push(
      {
        type: MEETING_PART_TYPES.PUBLIC_TALK,
        order: currentOrder++,
        name: undefined,
      },
      {
        type: MEETING_PART_TYPES.CIRCUIT_OVERSEER_TALK,
        order: currentOrder++,
        name: body.parts.circuitOverseerTalk?.title,
      }
    )
  }
  // For regular meetings: PUBLIC_TALK will be added later by talks coordinator

  partsToCreate.push({ type: MEETING_PART_TYPES.WATCHTOWER_STUDY, order: currentOrder++ })

  if (body.parts.reader) {
    partsToCreate.push({ type: MEETING_PART_TYPES.READER, order: currentOrder++ })
  }

  partsToCreate.push({ type: MEETING_PART_TYPES.CLOSING_PRAYER, order: currentOrder++ })

  const createdParts = new Map<string, number>()
  for (const part of partsToCreate) {
    const partResult = await db
      .insert(meetingProgramParts)
      .values({
        meetingProgramId: program.id,
        type: part.type,
        name: part.name || null,
        order: part.order,
        createdAt: new Date(),
      })
      .returning()

    const createdPart = partResult[0]
    if (!createdPart) {
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
        data: { message: "errors.partCreateFailed" },
      })
    }
    createdParts.set(part.type, createdPart.id)
  }

  // Create scheduled parts (publisher assignments)
  // Note: PUBLIC_TALK assignments are created via /api/schedules endpoint
  const assignmentsToCreate: Array<{ partId: number; publisherId: string }> = [
    {
      partId: createdParts.get(MEETING_PART_TYPES.CHAIRMAN)!,
      publisherId: body.parts.chairman,
    },
    {
      partId: createdParts.get(MEETING_PART_TYPES.WATCHTOWER_STUDY)!,
      publisherId: body.parts.watchtowerStudy,
    },
    {
      partId: createdParts.get(MEETING_PART_TYPES.CLOSING_PRAYER)!,
      publisherId: body.parts.prayer,
    },
  ]

  if (body.parts.reader) {
    assignmentsToCreate.push({
      partId: createdParts.get(MEETING_PART_TYPES.READER)!,
      publisherId: body.parts.reader,
    })
  }

  if (body.parts.circuitOverseerTalk) {
    assignmentsToCreate.push({
      partId: createdParts.get(MEETING_PART_TYPES.CIRCUIT_OVERSEER_TALK)!,
      publisherId: body.parts.circuitOverseerTalk.publisherId,
    })
  }

  for (const assignment of assignmentsToCreate) {
    await db.insert(meetingScheduledParts).values({
      id: crypto.randomUUID(),
      meetingProgramPartId: assignment.partId,
      publisherId: assignment.publisherId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // For Circuit Overseer visits: create scheduledPublicTalks entry for PUBLIC_TALK
  // This allows talks coordinator to see that this meeting already has a talk scheduled
  if (body.isCircuitOverseerVisit) {
    const publicTalkPartId = createdParts.get(MEETING_PART_TYPES.PUBLIC_TALK)

    if (publicTalkPartId) {
      await db.insert(scheduledPublicTalks).values({
        id: crypto.randomUUID(),
        date: date.toDate(),
        meetingProgramId: program.id,
        partId: publicTalkPartId,
        speakerSourceType: "local_publisher", // CO is a local publisher
        speakerId: null, // No external speaker
        publisherId: body.parts.circuitOverseerTalk!.publisherId, // Use publisher ID for local CO
        talkId: null, // CO talks don't have standard talk numbers
        customTalkTitle: body.parts.publicTalk?.title ?? null, // Public talk title for CO visit
        overrideValidation: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }

  // Log audit event
  await logAuditEvent(event, {
    action: AUDIT_EVENTS.WEEKEND_MEETING_PLANNED,
    resourceType: "meeting_program",
    resourceId: program.id.toString(),
    details: {
      programId: program.id,
      date: body.date,
      isCircuitOverseerVisit: body.isCircuitOverseerVisit,
      parts: body.parts,
    } satisfies AuditEventDetails[typeof AUDIT_EVENTS.WEEKEND_MEETING_PLANNED],
  })

  return {
    success: true,
    program: {
      id: program.id,
      date: program.date,
      isCircuitOverseerVisit: program.isCircuitOverseerVisit,
    },
  }
})
