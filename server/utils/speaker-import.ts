import { readFile } from "node:fs/promises"

import { generateObject } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { eq, sql, and, gt } from "drizzle-orm"
import type { Job } from "pg-boss"

import {
  organization,
  publicTalks,
  speakers,
  speakerTalks,
  scheduledPublicTalks,
} from "../database/schema"

export interface SpeakerImportPayload {
  filePath: string
  mimeType: string
}

type MatchStatus = "new" | "update" | "no-change" | "restore"

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

interface ExistingSpeaker {
  id: string
  phone: string
  congregationId: string
  congregationName: string
  talkIds: number[]
}

interface ImportedSpeaker {
  firstName: string
  lastName: string
  phone: string
  talkNumbers: string[]
  congregationId: string | null
  congregation: string
  talkIds: number[]
  selected: boolean
  matchStatus: MatchStatus
  matchedSpeakerId?: string
  existingSpeaker?: ExistingSpeaker
  diff?: SpeakerDiff
}

interface MissingSpeaker {
  id: string
  firstName: string
  lastName: string
  congregationName: string
  assignedTalks: string[]
  scheduledTalksCount: number
  selected: boolean
}

export interface SpeakerImportResult {
  congregation: string
  congregationId: string | null
  speakers: ImportedSpeaker[]
  missingSpeakers: MissingSpeaker[]
}

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

const extractionSchema = z.object({
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

type Extraction = z.infer<typeof extractionSchema>

/**
 * Runs one queued speaker-list extraction. It throws rather than recording a failure itself, so a
 * transient Anthropic error is retried by the queue instead of being frozen into a job result.
 */
export async function handleSpeakerImport(
  job: Job<SpeakerImportPayload>
): Promise<SpeakerImportResult> {
  const { filePath, mimeType } = job.data

  const extraction = await extractSpeakerList(await readFile(filePath), mimeType)
  const congregation = await resolveCongregation(extraction.congregation)
  const congregationId = congregation?.id ?? null
  const congregationName = congregation?.name ?? extraction.congregation

  const importedSpeakers = await Promise.all(
    extraction.speakers.map(speaker => enrichSpeaker(speaker, congregationId, congregationName))
  )

  return {
    congregation: congregationName,
    congregationId,
    speakers: importedSpeakers,
    missingSpeakers: await findMissingSpeakers(congregationId, importedSpeakers),
  }
}

async function extractSpeakerList(fileData: Buffer, mimeType: string): Promise<Extraction> {
  const result = await generateObject({
    model: anthropic("claude-sonnet-4-5-20250929"),
    schema: extractionSchema,
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
            image: `data:${mimeType};base64,${fileData.toString("base64")}`,
          },
        ],
      },
    ],
  })

  return result.object
}

async function resolveCongregation(
  extractedName: string
): Promise<{ id: string; name: string } | null> {
  const db = useDrizzle()

  const allCongregations = await db
    .select({
      id: organization.id,
      name: organization.name,
    })
    .from(organization)
    .orderBy(organization.name)

  const aiMatch = await matchCongregationWithAI(extractedName, allCongregations)
  if (aiMatch) return aiMatch

  return await db
    .select()
    .from(organization)
    .where(sql`LOWER(${organization.name}) = LOWER(${extractedName})`)
    .limit(1)
    .then(rows => (rows[0] ? { id: rows[0].id, name: rows[0].name } : null))
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

async function enrichSpeaker(
  speaker: Extraction["speakers"][number],
  congregationId: string | null,
  congregationName: string
): Promise<ImportedSpeaker> {
  const talkIds = await resolveTalkIds(speaker.talkNumbers)

  if (!congregationId) {
    return {
      ...speaker,
      congregationId: null,
      congregation: congregationName,
      talkIds,
      selected: false,
      matchStatus: "new",
    }
  }

  const match = await findMatchingSpeaker(speaker.firstName, speaker.lastName, congregationId)

  const diff = match
    ? calculateDiff(talkIds, speaker.phone, congregationId, congregationName, match)
    : null

  return {
    ...speaker,
    congregationId,
    congregation: congregationName,
    talkIds,
    selected: false,
    matchStatus: determineMatchStatus(match, diff),
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
}

async function resolveTalkIds(talkNumbers: string[]): Promise<number[]> {
  const db = useDrizzle()
  const talkIds: number[] = []

  for (const talkNo of talkNumbers) {
    const talk = await db.select().from(publicTalks).where(eq(publicTalks.no, talkNo)).limit(1)

    if (talk[0]) {
      talkIds.push(talk[0].id)
    }
  }

  return talkIds
}

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

/** Active speakers of the congregation that the uploaded list no longer mentions. */
async function findMissingSpeakers(
  congregationId: string | null,
  importedSpeakers: ImportedSpeaker[]
): Promise<MissingSpeaker[]> {
  if (!congregationId) return []

  const db = useDrizzle()

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

  const importedNames = new Set(importedSpeakers.map(s => `${s.firstName}|${s.lastName}`))
  const missing = activeSpeakers.filter(s => !importedNames.has(`${s.firstName}|${s.lastName}`))

  return await Promise.all(
    missing.map(async speaker => {
      const assignedTalks = await db
        .select({
          talkId: speakerTalks.talkId,
          talkNo: publicTalks.no,
        })
        .from(speakerTalks)
        .innerJoin(publicTalks, eq(speakerTalks.talkId, publicTalks.id))
        .where(eq(speakerTalks.speakerId, speaker.id))

      const scheduledCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(scheduledPublicTalks)
        .where(
          and(
            eq(scheduledPublicTalks.speakerId, speaker.id),
            gt(scheduledPublicTalks.date, getTodayYYYYMMDD())
          )
        )

      return {
        id: speaker.id,
        firstName: speaker.firstName,
        lastName: speaker.lastName,
        congregationName: speaker.congregationName || "",
        assignedTalks: assignedTalks.map(t => t.talkNo),
        scheduledTalksCount: scheduledCount[0]?.count || 0,
        selected: true,
      }
    })
  )
}
