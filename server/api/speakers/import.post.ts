import { createError } from "h3"
import { generateObject } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { eq, sql, and, gt } from "drizzle-orm"
import {
  organization,
  publicTalks,
  speakers,
  speakerTalks,
  scheduledPublicTalks,
} from "../../database/schema"
import { createJob, updateJob } from "../../utils/import-jobs"

export default defineEventHandler(async event => {
  await requirePermission({ speakers: ["create"] })(event)

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.noFileUploaded" },
    })
  }

  const file = formData[0]
  if (!file || !file.data) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "errors.invalidFile" },
    })
  }

  if (file.data.length > 20 * 1024 * 1024) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "validation.fileTooLarge" },
    })
  }

  const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
  if (!allowedTypes.includes(file.type || "")) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "validation.invalidFileType" },
    })
  }

  const jobId = crypto.randomUUID()
  createJob(jobId)

  processFileAsync(jobId, file.data, file.type || "application/pdf")

  return { jobId }
})

interface MatchedSpeaker {
  id: string
  firstName: string
  lastName: string
  phone: string
  congregationId: string
  congregationName: string
  archived: boolean
  archivedAt: Date | null
  talkIds: number[]
}

interface SpeakerDiff {
  phone?: {
    old: string
    new: string
  }
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

type MatchStatus = "new" | "update" | "no-change" | "restore"

async function findMatchingSpeaker(
  firstName: string,
  lastName: string,
  congregationId: string
): Promise<MatchedSpeaker | null> {
  const db = useDrizzle()

  const matches = await db
    .select()
    .from(speakers)
    .innerJoin(organization, eq(speakers.congregationId, organization.id))
    .where(
      and(
        eq(speakers.firstName, firstName),
        eq(speakers.lastName, lastName),
        eq(speakers.congregationId, congregationId)
      )
    )
    .limit(1)

  if (matches.length === 0) return null

  const match = matches[0]
  if (!match) return null

  const speaker = match.speakers
  const congregation = match.organization

  const talks = await db
    .select({ talkId: speakerTalks.talkId })
    .from(speakerTalks)
    .where(eq(speakerTalks.speakerId, speaker.id))

  return {
    id: speaker.id,
    firstName: speaker.firstName,
    lastName: speaker.lastName,
    phone: speaker.phone,
    congregationId: speaker.congregationId,
    congregationName: congregation.name,
    archived: speaker.archived,
    archivedAt: speaker.archivedAt,
    talkIds: talks.map(t => t.talkId),
  }
}

function calculateDiff(
  extractedTalkIds: number[],
  extractedPhone: string,
  extractedCongregationId: string,
  extractedCongregationName: string,
  existing: MatchedSpeaker
): SpeakerDiff | null {
  const diff: SpeakerDiff = {}

  if (extractedPhone !== existing.phone) {
    diff.phone = {
      old: existing.phone,
      new: extractedPhone,
    }
  }

  const added = extractedTalkIds.filter(id => !existing.talkIds.includes(id))
  const removed = existing.talkIds.filter(id => !extractedTalkIds.includes(id))
  const unchanged = extractedTalkIds.filter(id => existing.talkIds.includes(id))

  if (added.length > 0 || removed.length > 0) {
    diff.talks = { added, removed, unchanged }
  }

  if (existing.archived && existing.congregationId !== extractedCongregationId) {
    diff.congregation = {
      oldId: existing.congregationId,
      oldName: existing.congregationName,
      newId: extractedCongregationId,
      newName: extractedCongregationName,
    }
  }

  return Object.keys(diff).length > 0 ? diff : null
}

function determineMatchStatus(match: MatchedSpeaker | null, diff: SpeakerDiff | null): MatchStatus {
  if (!match) return "new"

  if (match.archived) {
    return "restore"
  }

  if (!diff) return "no-change"

  return "update"
}

async function matchCongregationWithAI(
  extractedName: string,
  congregations: Array<{ id: string; name: string }>
): Promise<{ id: string; name: string } | null> {
  const schema = z.object({
    congregationId: z.string().nullable(),
    confidence: z.number().min(0).max(1),
  })

  const result = await generateObject({
    model: anthropic("claude-sonnet-4-5-20250929"),
    schema,
    messages: [
      {
        role: "user",
        content: `Match the extracted congregation name with the best matching congregation from the database.

Extracted congregation name: "${extractedName}"

Available congregations:
${congregations.map(c => `- ${c.id}: ${c.name}`).join("\n")}

Rules:
- Match based on name similarity (ignore case, prefixes like "Zbór", formatting)
- Return the congregation ID if confidence is >= 0.999
- Return null if no confident match can be made

Return JSON with:
- congregationId: string (or null if no match)
- confidence: number (0-1)`,
      },
    ],
  })

  if (result.object.confidence >= 0.999 && result.object.congregationId) {
    const matched = congregations.find(c => c.id === result.object.congregationId)
    return matched || null
  }

  return null
}

async function processFileAsync(jobId: string, fileData: Buffer, mimeType: string): Promise<void> {
  try {
    updateJob(jobId, { status: "processing" })

    const schema = z.object({
      congregation: z.string(),
      speakers: z.array(
        z.object({
          firstName: z.string(),
          lastName: z.string(),
          phone: z.string(),
          talkNumbers: z.array(z.string()),
        })
      ),
    })

    const base64Image = fileData.toString("base64")
    const imageDataUrl = `data:${mimeType};base64,${base64Image}`

    const result = await generateObject({
      model: anthropic("claude-sonnet-4-5-20250929"),
      schema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract speaker information from this file. Return a JSON object with:
- congregation: name of the congregation
- speakers: array of objects with firstName, lastName, phone (9 digits), talkNumbers (array of strings)

Format phone numbers as 9 digits only (remove any formatting).
Talk numbers should be strings (e.g., ["12", "45", "78"]).`,
            },
            {
              type: "image",
              image: imageDataUrl,
            },
          ],
        },
      ],
    })

    const db = useDrizzle()

    const allCongregations = await db
      .select({
        id: organization.id,
        name: organization.name,
      })
      .from(organization)
      .orderBy(organization.name)

    const aiMatch = await matchCongregationWithAI(result.object.congregation, allCongregations)

    const congregation = aiMatch
      ? aiMatch
      : await db
          .select()
          .from(organization)
          .where(sql`LOWER(${organization.name}) = LOWER(${result.object.congregation})`)
          .limit(1)
          .then(rows => (rows[0] ? { id: rows[0].id, name: rows[0].name } : null))

    const congregationId = congregation?.id || null

    const enrichedSpeakers = await Promise.all(
      result.object.speakers.map(async speaker => {
        const talkIds: number[] = []
        for (const talkNo of speaker.talkNumbers) {
          const talk = await db
            .select()
            .from(publicTalks)
            .where(eq(publicTalks.no, talkNo))
            .limit(1)

          if (talk[0]) {
            talkIds.push(talk[0].id)
          }
        }

        if (!congregationId) {
          return {
            ...speaker,
            congregationId: null,
            congregation: result.object.congregation,
            talkIds,
            selected: false,
            matchStatus: "new" as MatchStatus,
          }
        }

        const match = await findMatchingSpeaker(speaker.firstName, speaker.lastName, congregationId)

        const diff = match
          ? calculateDiff(
              talkIds,
              speaker.phone,
              congregationId,
              congregation?.name || result.object.congregation,
              match
            )
          : null

        const matchStatus = determineMatchStatus(match, diff)

        return {
          ...speaker,
          congregationId,
          congregation: congregation?.name || result.object.congregation,
          talkIds,
          selected: false,
          matchStatus,
          matchedSpeakerId: match?.id,
          existingSpeaker: match
            ? {
                id: match.id,
                phone: match.phone,
                congregationId: match.congregationId,
                congregationName: match.congregationName,
                talkIds: match.talkIds,
              }
            : undefined,
          diff: diff || undefined,
        }
      })
    )

    // Detect missing speakers (speakers in DB but not on the import list)
    let missingSpeakers: Array<{
      id: string
      firstName: string
      lastName: string
      congregationName: string
      assignedTalks: string[]
      scheduledTalksCount: number
      selected: boolean
    }> = []

    if (congregationId) {
      // 1. Fetch all active speakers from this congregation
      const activeSpeakers = await db
        .select({
          id: speakers.id,
          firstName: speakers.firstName,
          lastName: speakers.lastName,
          phone: speakers.phone,
          congregationId: speakers.congregationId,
          congregationName: organization.name,
        })
        .from(speakers)
        .leftJoin(organization, eq(speakers.congregationId, organization.id))
        .where(and(eq(speakers.congregationId, congregationId), eq(speakers.archived, false)))

      // 2. Create Set of imported names for O(n) lookup
      const importedNames = new Set(enrichedSpeakers.map(s => `${s.firstName}|${s.lastName}`))

      // 3. Find missing speakers (in DB but not in import)
      const missing = activeSpeakers.filter(s => !importedNames.has(`${s.firstName}|${s.lastName}`))

      // 4. Enrich with talk assignments and scheduled count
      missingSpeakers = await Promise.all(
        missing.map(async speaker => {
          // Fetch assigned talks
          const assignedTalks = await db
            .select({
              talkId: speakerTalks.talkId,
              talkNo: publicTalks.no,
            })
            .from(speakerTalks)
            .innerJoin(publicTalks, eq(speakerTalks.talkId, publicTalks.id))
            .where(eq(speakerTalks.speakerId, speaker.id))

          // Count scheduled future talks
          const scheduledCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(scheduledPublicTalks)
            .where(
              and(
                eq(scheduledPublicTalks.speakerId, speaker.id),
                gt(scheduledPublicTalks.date, new Date())
              )
            )

          return {
            id: speaker.id,
            firstName: speaker.firstName,
            lastName: speaker.lastName,
            congregationName: speaker.congregationName || "",
            assignedTalks: assignedTalks.map(t => t.talkNo),
            scheduledTalksCount: scheduledCount[0]?.count || 0,
            selected: true, // Default selected for archiving
          }
        })
      )
    }

    updateJob(jobId, {
      status: "completed",
      data: {
        congregation: congregation?.name || result.object.congregation,
        congregationId,
        speakers: enrichedSpeakers,
        missingSpeakers,
      },
    })
  } catch (error) {
    console.error("File processing error:", error)
    updateJob(jobId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
