import type { Dirent } from "node:fs"
import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises"
import { join } from "node:path"

import { PgBoss } from "pg-boss"
import type { Queue } from "pg-boss"

export const QUEUE_NAMES = {
  SPEAKER_LIST_EXTRACTION: "speaker-list-extraction",
  SEND_VERIFICATION_EMAIL: "send-verification-email",
  JOB_FILES_CLEANUP: "job-files-cleanup",
} as const

const DEAD_LETTER_QUEUE_NAMES = {
  SPEAKER_LIST_EXTRACTION: "speaker-list-extraction-dead-letter",
  SEND_VERIFICATION_EMAIL: "send-verification-email-dead-letter",
} as const

// pg-boss defaults to two attempts spaced by a fixed delay; the Anthropic and email calls behind
// these queues fail transiently, so a growing gap is what makes the extra attempt worth having.
const RETRY_OPTIONS = {
  retryLimit: 3,
  retryBackoff: true,
} as const

export const DEAD_LETTER_QUEUES: readonly string[] = Object.values(DEAD_LETTER_QUEUE_NAMES)

export const WORK_QUEUES: ReadonlyArray<readonly [string, Omit<Queue, "name">]> = [
  [
    QUEUE_NAMES.SPEAKER_LIST_EXTRACTION,
    { ...RETRY_OPTIONS, deadLetter: DEAD_LETTER_QUEUE_NAMES.SPEAKER_LIST_EXTRACTION },
  ],
  [
    QUEUE_NAMES.SEND_VERIFICATION_EMAIL,
    { ...RETRY_OPTIONS, deadLetter: DEAD_LETTER_QUEUE_NAMES.SEND_VERIFICATION_EMAIL },
  ],
  // A missed nightly run is repaired by the next one, so this queue keeps the defaults and has no
  // dead-letter copy.
  [QUEUE_NAMES.JOB_FILES_CLEANUP, {}],
]

// Schedules are evaluated every 30 seconds, so a five-placeholder expression is the finest
// precision pg-boss actually honours.
export const JOB_FILES_CLEANUP_CRON = "0 3 * * *"

const JOB_FILE_MAX_AGE_MS = 24 * 60 * 60 * 1000

let connection: Promise<PgBoss> | undefined

export function usePgBoss(): Promise<PgBoss> {
  connection ??= startPgBoss()

  return connection
}

export async function stopPgBoss(): Promise<void> {
  const starting = connection
  if (!starting) return

  connection = undefined
  const boss = await starting

  await boss.stop()
}

// A job payload carries the path this returns rather than the bytes: base64 of a 20 MB upload
// would be roughly 27 MB in a single queue row.
export async function writeJobFile(contents: Buffer): Promise<string> {
  const directory = useRuntimeConfig().jobFilesDir
  await mkdir(directory, { recursive: true })

  const path = join(directory, crypto.randomUUID())
  await writeFile(path, contents)

  return path
}

/** Removes job files left behind by finished, abandoned or dead-lettered imports. */
export async function cleanupJobFiles(): Promise<number> {
  const expiredBefore = Date.now() - JOB_FILE_MAX_AGE_MS
  let removed = 0

  for (const file of await listJobFiles()) {
    if (!(await isExpired(file, expiredBefore))) continue

    await rm(file, { force: true })
    removed += 1
  }

  return removed
}

async function startPgBoss(): Promise<PgBoss> {
  const boss = new PgBoss({ connectionString: useRuntimeConfig().databaseUrl })

  // pg-boss is an EventEmitter: an unhandled "error" event would take the whole process down
  boss.on("error", error => logger.error("pg-boss reported an error", { error }))

  return boss.start()
}

async function listJobFiles(): Promise<string[]> {
  const directory = useRuntimeConfig().jobFilesDir
  const entries = await readDirectory(directory)

  return entries.filter(entry => entry.isFile()).map(entry => join(directory, entry.name))
}

async function readDirectory(directory: string): Promise<Dirent[]> {
  try {
    return await readdir(directory, { withFileTypes: true })
  } catch (error) {
    // the volume holds nothing until the first upload lands, so an absent directory is not a fault
    if (isMissingPath(error)) return []

    throw error
  }
}

function isMissingPath(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT"
}

async function isExpired(file: string, expiredBefore: number): Promise<boolean> {
  const { mtimeMs } = await stat(file)

  return mtimeMs < expiredBefore
}
