import { createError } from "h3"
import { z } from "zod"
import type { JobWithMetadata } from "pg-boss"

import { defineEndpoint } from "../../../../utils/define-endpoint"
import type { SpeakerImportPayload, SpeakerImportResult } from "../../../../utils/speaker-import"

type ClientStatus = "pending" | "processing" | "completed" | "failed"

// A job in `retry` is waiting out a backoff window, not lost, so it must keep the client polling
// instead of reading as a failure.
const CLIENT_STATUSES: Record<JobWithMetadata["state"], ClientStatus> = {
  created: "pending",
  retry: "processing",
  active: "processing",
  completed: "completed",
  cancelled: "failed",
  failed: "failed",
}

const uuidParamsSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().uuid(t("validation.invalidUuid")),
  })

export default defineEndpoint({
  permissions: { speakers: ["create"] },
  params: uuidParamsSchema,
  handler: async (event, { params }) => {
    const boss = await usePgBoss()
    const [job] = await boss.findJobs<SpeakerImportPayload>(QUEUE_NAMES.SPEAKER_LIST_EXTRACTION, {
      id: params.id,
    })

    if (!job) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: { message: "errors.jobNotFound" },
      })
    }

    const status = CLIENT_STATUSES[job.state]

    return {
      status,
      data: status === "completed" ? (job.output as SpeakerImportResult) : undefined,
      error: status === "failed" ? failureMessage(job.output) : undefined,
    }
  },
})

/** pg-boss stores a failed job's serialized error as its output. */
function failureMessage(output: object | null): string | undefined {
  if (!output || !("message" in output) || typeof output.message !== "string") return undefined

  return output.message
}
