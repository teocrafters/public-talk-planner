import type { SpeakerImportPayload } from "../utils/speaker-import"

export default defineNitroPlugin(async nitroApp => {
  if (import.meta.prerender) return

  const boss = await usePgBoss()

  // a dead-letter queue must exist before the queue naming it can be created
  for (const name of DEAD_LETTER_QUEUES) await boss.createQueue(name)
  for (const [name, options] of WORK_QUEUES) await boss.createQueue(name, options)

  // the handler is given a batch; the default batch size of one makes it a single job
  await boss.work<SpeakerImportPayload>(QUEUE_NAMES.SPEAKER_LIST_EXTRACTION, async ([job]) => {
    if (!job) return

    return await handleSpeakerImport(job)
  })

  await boss.work(QUEUE_NAMES.JOB_FILES_CLEANUP, async () => {
    logger.info("job files cleanup removed stale files", { removed: await cleanupJobFiles() })
  })
  await boss.schedule(QUEUE_NAMES.JOB_FILES_CLEANUP, JOB_FILES_CLEANUP_CRON)

  nitroApp.hooks.hookOnce("close", () => stopPgBoss())
})
