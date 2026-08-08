import { createError } from "h3"

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]

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

  if (file.data.length > MAX_UPLOAD_BYTES) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "validation.fileTooLarge" },
    })
  }

  const mimeType = file.type || ""
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { message: "validation.invalidFileType" },
    })
  }

  const filePath = await writeJobFile(file.data)

  const boss = await usePgBoss()
  const jobId = await boss.send(QUEUE_NAMES.SPEAKER_LIST_EXTRACTION, { filePath, mimeType })

  if (!jobId) {
    logger.error("Speaker import job was not enqueued", { filePath, mimeType })
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: { message: "errors.importJobNotQueued" },
    })
  }

  return { jobId }
})
