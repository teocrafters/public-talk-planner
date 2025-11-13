/**
 * API validation error structure returned from server-side createError()
 * Used when server responds with validation errors (e.g., 422 Unprocessable Entity)
 */
export interface ApiValidationError {
	data: {
		statusCode: number
		statusMessage: string
		message: string
	}
}

/**
 * Type guard to check if an unknown error is an API validation error
 * This allows TypeScript to narrow the error type and safely access error.data.message
 *
 * @param error - Unknown error object to check
 * @returns true if error matches ApiValidationError structure
 *
 * @example
 * ```typescript
 * try {
 *   await $fetch('/api/endpoint')
 * } catch (error: unknown) {
 *   if (isApiValidationError(error)) {
 *     // TypeScript now knows error.data.message exists
 *     console.log(error.data.message)
 *   }
 * }
 * ```
 */
export function isApiValidationError(error: unknown): error is ApiValidationError {
	return (
		error !== null &&
		typeof error === "object" &&
		"data" in error &&
		error.data !== null &&
		typeof error.data === "object" &&
		"message" in error.data &&
		typeof error.data.message === "string"
	)
}
