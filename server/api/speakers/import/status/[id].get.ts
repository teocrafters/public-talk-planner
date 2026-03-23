import { createError } from "h3"
import { z } from "zod"
import { getJob } from "../../../../utils/import-jobs"
import { defineEndpoint } from "../../../../utils/define-endpoint"

// UUID params schema
const uuidParamsSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().uuid(t("validation.invalidUuid")),
  })

export default defineEndpoint({
  permissions: { speakers: ["create"] },
  params: uuidParamsSchema,
  handler: async (event, { params }) => {
  const jobId = params.id

  const job = getJob(jobId)
  if (!job) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      data: { message: "errors.jobNotFound" },
    })
  }

  return {
    status: job.status,
    data: job.data,
    error: job.error,
  }
  },
})
