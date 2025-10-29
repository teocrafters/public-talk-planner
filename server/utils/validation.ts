import type { z } from "zod"
import { ZodError } from "zod"
import type { H3Event } from "h3"

export async function validateBody<TSchema extends z.ZodType>(
	event: H3Event,
	schemaFactory: (t: (key: string) => string) => TSchema,
): Promise<z.infer<TSchema>> {
	const body = await readBody(event)

	const t = (key: string): string => key
	const schema = schemaFactory(t)

	try {
		return schema.parse(body)
	} catch (error) {
		if (error instanceof ZodError) {
			const errors = error.issues.map((issue) => ({
				field: issue.path.join("."),
				messageKey: issue.message,
			}))

			throw createError({
				statusCode: 400,
				statusMessage: "Validation Error",
				data: { errors },
			})
		}
		throw error
	}
}
