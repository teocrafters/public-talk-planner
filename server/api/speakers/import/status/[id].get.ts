import { createError } from "h3"
import { getJob } from "../../../../utils/import-jobs"

export default defineEventHandler(async event => {
	await requirePermission({ speakers: ["create"] })(event)

	const jobId = getRouterParam(event, "id")
	if (!jobId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			data: { message: "errors.invalidJobId" },
		})
	}

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
})
