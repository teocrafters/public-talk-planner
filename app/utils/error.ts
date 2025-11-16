/**
 * API validation error structure returned from server-side createError()
 * Used when server responds with single validation error (e.g., 400 Bad Request, 422 Unprocessable Entity)
 *
 * Note: $fetch wraps h3 error responses, creating double-nested data structure:
 * error.data contains the H3 response, and error.data.data contains the actual error details
 */
export interface ApiValidationError {
  data: {
    statusCode: number
    statusMessage: string
    data: {
      message: string
    }
  }
}

/**
 * API Zod validation error structure returned from validateBody()
 * Used when Zod schema validation fails with multiple field errors
 *
 * Note: $fetch wraps h3 error responses, creating nested data structure:
 * error.data.data.errors contains the actual Zod validation errors
 */
export interface ApiZodValidationError {
  data: {
    statusCode: number
    statusMessage: string
    data: {
      errors: Array<{
        field: string
        messageKey: string
      }>
    }
  }
}

/**
 * Type guard to check if an unknown error is an API validation error with single message
 * This allows TypeScript to narrow the error type and safely access error.data.data.message
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
 *     // TypeScript now knows error.data.data.message exists
 *     console.log(error.data.data.message)
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
    "data" in error.data &&
    error.data.data !== null &&
    typeof error.data.data === "object" &&
    "message" in error.data.data &&
    typeof error.data.data.message === "string"
  )
}

/**
 * Type guard to check if an unknown error is an API Zod validation error with multiple field errors
 * This allows TypeScript to narrow the error type and safely access error.data.data.errors
 *
 * @param error - Unknown error object to check
 * @returns true if error matches ApiZodValidationError structure
 *
 * @example
 * ```typescript
 * try {
 *   await $fetch('/api/endpoint')
 * } catch (error: unknown) {
 *   if (isApiZodValidationError(error)) {
 *     // TypeScript now knows error.data.data.errors exists
 *     const firstError = error.data.data.errors[0]
 *     console.log(firstError.messageKey)
 *   }
 * }
 * ```
 */
export function isApiZodValidationError(error: unknown): error is ApiZodValidationError {
  return (
    error !== null &&
    typeof error === "object" &&
    "data" in error &&
    error.data !== null &&
    typeof error.data === "object" &&
    "data" in error.data &&
    error.data.data !== null &&
    typeof error.data.data === "object" &&
    "errors" in error.data.data &&
    Array.isArray(error.data.data.errors) &&
    error.data.data.errors.length > 0
  )
}
