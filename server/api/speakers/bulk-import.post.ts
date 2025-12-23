import { createError, type H3Event } from "h3"
import { eq } from "drizzle-orm"
import { schema } from "hub:db"

interface EnhancedSpeakerImportInput {
  firstName: string
  lastName: string
  phone: string
  congregationId: string
  talkIds?: number[]
  operation: "create" | "update" | "restore" | "skip" | "archive"
  existingSpeakerId?: string
  manuallySelected?: boolean
  diff?: {
    phone?: { old: string; new: string }
    talks?: {
      added: number[]
      removed: number[]
      unchanged: number[]
    }
    congregation?: {
      oldId: string
      oldName: string
      newId: string
      newName: string
    }
  }
}

interface BulkImportCounts {
  created: number
  updated: number
  restored: number
  skipped: number
  archived: number
}

export default defineEventHandler(async event => {
  await requirePermission({ speakers: ["create", "update", "archive"] })(event)

  const body = await readBody(event)
  if (!body.speakers || !Array.isArray(body.speakers)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.invalidRequestBody" },
    })
  }

  const speakersToArchive: string[] = body.speakersToArchive || []

  const counts: BulkImportCounts = {
    created: 0,
    updated: 0,
    restored: 0,
    skipped: 0,
    archived: 0,
  }
  const errors: string[] = []

  for (const speaker of body.speakers as EnhancedSpeakerImportInput[]) {
    try {
      // Validate congregation exists
      if (!speaker.congregationId) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: { message: "validation.congregationRequired" },
        })
      }

      const congregationExists = await db
        .select()
        .from(schema.organization)
        .where(eq(schema.organization.id, speaker.congregationId))
        .limit(1)

      if (!congregationExists || congregationExists.length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: { message: "errors.congregationNotFound" },
        })
      }

      // Handle operation based on type
      switch (speaker.operation) {
        case "create":
          await createSpeaker(db, event, speaker)
          counts.created++
          break

        case "update":
          await updateSpeaker(db, event, speaker)
          counts.updated++
          break

        case "restore":
          await restoreSpeaker(db, event, speaker)
          counts.restored++
          break

        case "skip":
          counts.skipped++
          break

        default:
          errors.push(
            `Unknown operation "${speaker.operation}" for ${speaker.firstName} ${speaker.lastName}`
          )
      }
    } catch (error) {
      errors.push(
        `Failed to process ${speaker.firstName} ${speaker.lastName}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    }
  }

  // Process speakers to archive
  for (const speakerId of speakersToArchive) {
    try {
      await archiveSpeaker(db, event, speakerId)
      counts.archived++
    } catch (error) {
      console.error(`Failed to archive speaker ${speakerId}:`, error)
      errors.push(`Failed to archive speaker: ${speakerId}`)
    }
  }

  return {
    success: true,
    counts,
    errors: errors.length > 0 ? errors : undefined,
  }
})

async function createSpeaker(
  db: ReturnType<typeof useDrizzle>,
  event: H3Event,
  speaker: EnhancedSpeakerImportInput
) {
  const speakerId = crypto.randomUUID()

  await db.insert(schema.speakers).values({
    id: speakerId,
    firstName: speaker.firstName.trim(),
    lastName: speaker.lastName.trim(),
    phone: speaker.phone.replace(/\D/g, ""),
    congregationId: speaker.congregationId,
    archived: false,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  if (speaker.talkIds && speaker.talkIds.length > 0) {
    await db.insert(schema.speakerTalks).values(
      speaker.talkIds.map((talkId: number) => ({
        speakerId,
        talkId,
        createdAt: new Date(),
      }))
    )
  }

  await logAuditEvent(event, {
    action: AUDIT_EVENTS.SPEAKER_CREATED,
    resourceType: "speaker",
    resourceId: speakerId,
    details: {
      speakerId,
      firstName: speaker.firstName,
      lastName: speaker.lastName,
      congregationId: speaker.congregationId,
      talkCount: speaker.talkIds?.length || 0,
    },
  })
}

async function updateSpeaker(
  db: ReturnType<typeof useDrizzle>,
  event: H3Event,
  speaker: EnhancedSpeakerImportInput
) {
  if (!speaker.existingSpeakerId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.speakerIdRequired" },
    })
  }

  const existingSpeaker = await db
    .select()
    .from(schema.speakers)
    .where(eq(schema.speakers.id, speaker.existingSpeakerId))
    .limit(1)

  if (!existingSpeaker || existingSpeaker.length === 0 || !existingSpeaker[0]) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      data: { message: "errors.speakerNotFound" },
    })
  }

  // Update speaker record
  await db
    .update(schema.speakers)
    .set({
      phone: speaker.phone.replace(/\D/g, ""),
      updatedAt: new Date(),
    })
    .where(eq(schema.speakers.id, speaker.existingSpeakerId))

  // Update talks: delete all existing and insert new ones
  await db.delete(schema.speakerTalks).where(eq(schema.speakerTalks.speakerId, speaker.existingSpeakerId))

  if (speaker.talkIds && speaker.talkIds.length > 0) {
    await db.insert(schema.speakerTalks).values(
      speaker.talkIds.map((talkId: number) => ({
        speakerId: speaker.existingSpeakerId!,
        talkId,
        createdAt: new Date(),
      }))
    )
  }

  // Build audit log changes
  const changes: AuditEventDetails[typeof AUDIT_EVENTS.SPEAKER_UPDATED_FROM_IMPORT]["changes"] = {}

  if (speaker.diff?.phone) {
    changes.phone = {
      old: speaker.diff.phone.old,
      new: speaker.diff.phone.new,
    }
  }

  if (speaker.diff?.talks) {
    if (speaker.diff.talks.added.length > 0) {
      changes.talksAdded = speaker.diff.talks.added
    }
    if (speaker.diff.talks.removed.length > 0) {
      changes.talksRemoved = speaker.diff.talks.removed
    }
  }

  // Log audit event
  await logAuditEvent(event, {
    action: AUDIT_EVENTS.SPEAKER_UPDATED_FROM_IMPORT,
    resourceType: "speaker",
    resourceId: speaker.existingSpeakerId,
    details: {
      speakerId: speaker.existingSpeakerId,
      changes,
    },
  })
}

async function restoreSpeaker(
  db: ReturnType<typeof useDrizzle>,
  event: H3Event,
  speaker: EnhancedSpeakerImportInput
) {
  if (!speaker.existingSpeakerId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.speakerIdRequired" },
    })
  }

  const existingSpeaker = await db
    .select()
    .from(schema.speakers)
    .where(eq(schema.speakers.id, speaker.existingSpeakerId))
    .limit(1)

  if (!existingSpeaker || existingSpeaker.length === 0 || !existingSpeaker[0]) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      data: { message: "errors.speakerNotFound" },
    })
  }

  const oldSpeaker = existingSpeaker[0]
  const congregationChanged = oldSpeaker.congregationId !== speaker.congregationId

  // Update speaker: unarchive and update data
  await db
    .update(schema.speakers)
    .set({
      archived: false,
      archivedAt: null,
      congregationId: speaker.congregationId,
      phone: speaker.phone.replace(/\D/g, ""),
      updatedAt: new Date(),
    })
    .where(eq(schema.speakers.id, speaker.existingSpeakerId))

  // Update talks: delete all existing and insert new ones
  await db.delete(schema.speakerTalks).where(eq(schema.speakerTalks.speakerId, speaker.existingSpeakerId))

  if (speaker.talkIds && speaker.talkIds.length > 0) {
    await db.insert(schema.speakerTalks).values(
      speaker.talkIds.map((talkId: number) => ({
        speakerId: speaker.existingSpeakerId!,
        talkId,
        createdAt: new Date(),
      }))
    )
  }

  // Log congregation transfer if changed
  if (congregationChanged && speaker.diff?.congregation) {
    await logAuditEvent(event, {
      action: AUDIT_EVENTS.SPEAKER_CONGREGATION_TRANSFERRED,
      resourceType: "speaker",
      resourceId: speaker.existingSpeakerId,
      details: {
        speakerId: speaker.existingSpeakerId,
        firstName: speaker.firstName,
        lastName: speaker.lastName,
        oldCongregationId: speaker.diff.congregation.oldId,
        oldCongregationName: speaker.diff.congregation.oldName,
        newCongregationId: speaker.diff.congregation.newId,
        newCongregationName: speaker.diff.congregation.newName,
        wasArchived: oldSpeaker.archived,
      },
    })
  }

  // Log updates (phone/talks)
  const changes: AuditEventDetails[typeof AUDIT_EVENTS.SPEAKER_UPDATED_FROM_IMPORT]["changes"] = {}

  if (speaker.diff?.phone) {
    changes.phone = {
      old: speaker.diff.phone.old,
      new: speaker.diff.phone.new,
    }
  }

  if (speaker.diff?.talks) {
    if (speaker.diff.talks.added.length > 0) {
      changes.talksAdded = speaker.diff.talks.added
    }
    if (speaker.diff.talks.removed.length > 0) {
      changes.talksRemoved = speaker.diff.talks.removed
    }
  }

  if (Object.keys(changes).length > 0) {
    await logAuditEvent(event, {
      action: AUDIT_EVENTS.SPEAKER_UPDATED_FROM_IMPORT,
      resourceType: "speaker",
      resourceId: speaker.existingSpeakerId,
      details: {
        speakerId: speaker.existingSpeakerId,
        changes,
      },
    })
  }
}

async function archiveSpeaker(
  db: ReturnType<typeof useDrizzle>,
  event: H3Event,
  speakerId: string
): Promise<void> {
  // Fetch speaker data for audit log
  const [speaker] = await db
    .select({
      firstName: schema.speakers.firstName,
      lastName: schema.speakers.lastName,
    })
    .from(schema.speakers)
    .where(eq(schema.speakers.id, speakerId))
    .limit(1)

  if (!speaker) {
    throw new Error(`Speaker ${speakerId} not found`)
  }

  // Archive speaker
  await db
    .update(schema.speakers)
    .set({
      archived: true,
      archivedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.speakers.id, speakerId))

  // Log audit event
  await logAuditEvent(event, {
    action: AUDIT_EVENTS.SPEAKER_ARCHIVED,
    resourceType: "speaker",
    resourceId: speakerId,
    details: {
      speakerId,
      firstName: speaker.firstName,
      lastName: speaker.lastName,
    },
  })
}
