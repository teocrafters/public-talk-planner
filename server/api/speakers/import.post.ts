import { createError } from "h3"
import { generateObject } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { eq, sql } from "drizzle-orm"
import { organization, publicTalks } from "../../database/schema"
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

		const congregation = await db
			.select()
			.from(organization)
			.where(sql`LOWER(${organization.name}) = LOWER(${result.object.congregation})`)
			.limit(1)

		const congregationId = congregation[0]?.id || null

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

				return {
					...speaker,
					congregationId,
					congregation: result.object.congregation,
					talkIds,
				}
			})
		)

		updateJob(jobId, {
			status: "completed",
			data: {
				congregation: result.object.congregation,
				congregationId,
				speakers: enrichedSpeakers,
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
