import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { publicTalks } from "../database/schema"

interface LegacyTalk {
  id: number
  no: string | number
}

/**
 * Seed files still reference public talks by the integer primary key the SQLite schema used, which
 * no uuid key can reproduce. The talk number survived the migration, so it carries the mapping.
 */
export async function loadTalkIdsByLegacyId(): Promise<Map<number, string>> {
  const legacyTalks = await readLegacyTalks()
  const talkIdByNo = await loadTalkIdsByNo()

  const talkIdByLegacyId = new Map<number, string>()

  for (const legacyTalk of legacyTalks) {
    const talkId = talkIdByNo.get(String(legacyTalk.no))

    if (talkId) {
      talkIdByLegacyId.set(legacyTalk.id, talkId)
    }
  }

  return talkIdByLegacyId
}

async function readLegacyTalks(): Promise<LegacyTalk[]> {
  const path = join(process.cwd(), "server", "tasks", "seed", "public_talks.json")

  return JSON.parse(await readFile(path, "utf-8")) as LegacyTalk[]
}

async function loadTalkIdsByNo(): Promise<Map<string, string>> {
  const talks = await useDrizzle()
    .select({ id: publicTalks.id, no: publicTalks.no })
    .from(publicTalks)

  return new Map(talks.map(talk => [talk.no, talk.id]))
}
