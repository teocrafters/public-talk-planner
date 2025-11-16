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
import { MEETING_PART_TYPES } from "#shared/constants/meetings"

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
      const chairmanPart = program.parts.find(p => p.type === MEETING_PART_TYPES.CHAIRMAN)
      if (chairmanPart) {
        const existingAssignment = chairmanPart.meetingScheduledParts[0]
        if (existingAssignment) {
          await db
            .update(meetingScheduledParts)
            .set({
              publisherId: body.parts.chairman,
              updatedAt: new Date(),
            })
            .where(eq(meetingScheduledParts.id, existingAssignment.id))
        }
      }
    }

    // Update watchtower study
    if (body.parts.watchtowerStudy) {
      const watchtowerPart = program.parts.find(p => p.type === MEETING_PART_TYPES.WATCHTOWER_STUDY)
      if (watchtowerPart) {
        const existingAssignment = watchtowerPart.meetingScheduledParts[0]
        if (existingAssignment) {
          await db
            .update(meetingScheduledParts)
            .set({
              publisherId: body.parts.watchtowerStudy,
              updatedAt: new Date(),
            })
            .where(eq(meetingScheduledParts.id, existingAssignment.id))
        }
      }
    }

    // Update reader
    if (body.parts.reader) {
      const readerPart = program.parts.find(p => p.type === MEETING_PART_TYPES.READER)
      if (readerPart) {
        const existingAssignment = readerPart.meetingScheduledParts[0]
        if (existingAssignment) {
          await db
            .update(meetingScheduledParts)
            .set({
              publisherId: body.parts.reader,
              updatedAt: new Date(),
            })
            .where(eq(meetingScheduledParts.id, existingAssignment.id))
        }
      }
    }

    // Update prayer
    if (body.parts.prayer) {
      const prayerPart = program.parts.find(p => p.type === MEETING_PART_TYPES.CLOSING_PRAYER)
      if (prayerPart) {
        const existingAssignment = prayerPart.meetingScheduledParts[0]
        if (existingAssignment) {
          await db
            .update(meetingScheduledParts)
            .set({
              publisherId: body.parts.prayer,
              updatedAt: new Date(),
            })
            .where(eq(meetingScheduledParts.id, existingAssignment.id))
        }
      }
    }

    // Update circuit overseer talk
    if (body.parts.circuitOverseerTalk) {
      const coTalkPart = program.parts.find(
        p => p.type === MEETING_PART_TYPES.CIRCUIT_OVERSEER_TALK
      )
      if (coTalkPart) {
        // Update part name (title)
        await db
          .update(meetingProgramParts)
          .set({ name: body.parts.circuitOverseerTalk.title })
          .where(eq(meetingProgramParts.id, coTalkPart.id))

        // Update publisher assignment
        const existingAssignment = coTalkPart.meetingScheduledParts[0]
        if (existingAssignment) {
          await db
            .update(meetingScheduledParts)
            .set({
              publisherId: body.parts.circuitOverseerTalk.publisherId,
              updatedAt: new Date(),
            })
            .where(eq(meetingScheduledParts.id, existingAssignment.id))
        }
      }
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
