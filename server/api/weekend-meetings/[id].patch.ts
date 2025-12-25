import { createError } from "h3"
import { eq } from "drizzle-orm"
import {
  meetingPrograms,
  meetingProgramParts,
  meetingScheduledParts,
  publishers,
} from "../../database/schema"
import { validateBody } from "../../utils/validation"
import { updateWeekendMeetingSchema } from "#shared/utils/schemas"
import type { MeetingPartType } from "#shared/constants/meetings"
import { MEETING_PART_TYPES, MEETING_PART_ORDER } from "#shared/constants/meetings"

/**
 * Helper function to ensure a meeting part exists and has an assignment
 * Creates the part if it doesn't exist, then creates or updates the assignment
 */
async function ensurePartAndAssignment(
  db: ReturnType<typeof useDrizzle>,
  program: {
    id: number
    parts: Array<{
      id: number
      type: string
      meetingScheduledParts: Array<{ id: string; publisherId: string }>
    }>
  },
  partType: string,
  publisherId: string,
  partName?: string
): Promise<void> {
  let part = program.parts.find(p => p.type === partType)

  // Create part if it doesn't exist
  if (!part) {
    const order = MEETING_PART_ORDER.indexOf(partType as MeetingPartType) + 1
    const createdParts = await db
      .insert(meetingProgramParts)
      .values({
        meetingProgramId: program.id,
        type: partType,
        name: partName || null,
        order,
        createdAt: new Date(),
      })
      .returning()

    const createdPart = createdParts[0]
    if (!createdPart) {
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
        data: { message: "errors.partCreateFailed" },
      })
    }

    part = {
      id: createdPart.id,
      type: createdPart.type,
      meetingScheduledParts: [],
    }
  } else if (partName !== undefined) {
    // Update part name if provided (for CO Talk)
    await db
      .update(meetingProgramParts)
      .set({ name: partName })
      .where(eq(meetingProgramParts.id, part.id))
  }

  // Update or create assignment
  const existingAssignment = part.meetingScheduledParts[0]
  if (existingAssignment) {
    await db
      .update(meetingScheduledParts)
      .set({
        publisherId,
        updatedAt: new Date(),
      })
      .where(eq(meetingScheduledParts.id, existingAssignment.id))
  } else {
    await db.insert(meetingScheduledParts).values({
      id: crypto.randomUUID(),
      meetingProgramPartId: part.id,
      publisherId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
}

export default defineEventHandler(async event => {
  await requirePermission({ weekend_meetings: ["schedule_rest"] })(event)

  const programId = getRouterParam(event, "id")
  if (!programId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.programIdRequired" },
    })
  }

  const body = await validateBody(event, updateWeekendMeetingSchema)
  const db = useDrizzle()

  // Check if program exists
  const program = await db.query.meetingPrograms.findFirst({
    where: eq(meetingPrograms.id, parseInt(programId)),
    with: {
      parts: {
        with: {
          meetingScheduledParts: true,
        },
      },
    },
  })

  if (!program || program.type !== "weekend") {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      data: { message: "errors.programNotFound" },
    })
  }

  // Update CO visit flag if provided
  if (body.isCircuitOverseerVisit !== undefined) {
    await db
      .update(meetingPrograms)
      .set({ isCircuitOverseerVisit: body.isCircuitOverseerVisit })
      .where(eq(meetingPrograms.id, parseInt(programId)))
  }

  // Update parts if provided
  if (body.parts) {
    const publisherIds = [
      body.parts.chairman,
      body.parts.watchtowerStudy,
      body.parts.reader,
      body.parts.prayer,
      body.parts.circuitOverseerTalk?.publisherId,
    ].filter(Boolean) as string[]

    // Validate all publishers exist and have capabilities
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
    }

    // Update chairman
    if (body.parts.chairman) {
      await ensurePartAndAssignment(db, program, MEETING_PART_TYPES.CHAIRMAN, body.parts.chairman)
    }

    // Update watchtower study
    if (body.parts.watchtowerStudy) {
      await ensurePartAndAssignment(
        db,
        program,
        MEETING_PART_TYPES.WATCHTOWER_STUDY,
        body.parts.watchtowerStudy
      )
    }

    // Update reader
    if (body.parts.reader) {
      await ensurePartAndAssignment(db, program, MEETING_PART_TYPES.READER, body.parts.reader)
    }

    // Update prayer
    if (body.parts.prayer) {
      await ensurePartAndAssignment(
        db,
        program,
        MEETING_PART_TYPES.CLOSING_PRAYER,
        body.parts.prayer
      )
    }

    // Update circuit overseer talk
    if (body.parts.circuitOverseerTalk) {
      await ensurePartAndAssignment(
        db,
        program,
        MEETING_PART_TYPES.CIRCUIT_OVERSEER_TALK,
        body.parts.circuitOverseerTalk.publisherId,
        body.parts.circuitOverseerTalk.title
      )
    }
  }

  // Log audit event
  await logAuditEvent(event, {
    action: AUDIT_EVENTS.WEEKEND_MEETING_UPDATED,
    resourceType: "meeting_program",
    resourceId: programId,
    details: {
      programId: parseInt(programId),
      changes: body,
    } satisfies AuditEventDetails[typeof AUDIT_EVENTS.WEEKEND_MEETING_UPDATED],
  })

  // Fetch updated program
  const updatedProgram = await db.query.meetingPrograms.findFirst({
    where: eq(meetingPrograms.id, parseInt(programId)),
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

  return {
    success: true,
    program: updatedProgram,
  }
})
