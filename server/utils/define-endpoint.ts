import type { H3Event, EventHandler } from "h3"
import {
  defineEventHandler,
  getQuery,
  getRouterParams,
  readBody,
  createError,
} from "h3"
import { z } from "zod"
import { serverAuth } from "./auth"
import { logAuditEvent } from "./audit-log"
import type { PermissionsMap } from "#shared/types/permissions"
import { AUDIT_EVENTS } from "#shared/utils/audit-events"
import type { AuditEventDetails } from "#shared/types/audit-events"

export type SchemaFactory<T> = (t: (key: string) => string) => z.ZodType<T>

export type EndpointHandler<TBody, TQuery, TParams, TResponse> = (
  event: H3Event,
  validated: ValidatedData<TBody, TQuery, TParams>
) => Promise<TResponse> | TResponse

export type ValidatedData<TBody, TQuery, TParams> = {
  body: TBody
  query: TQuery
  params: TParams
}

export interface EndpointConfig<
  TBody = undefined,
  TQuery = undefined,
  TParams = undefined,
  TResponse = unknown
> {
  handler: EndpointHandler<TBody, TQuery, TParams, TResponse>
  permissions?: PermissionsMap
  auth?: boolean
  body?: SchemaFactory<TBody>
  query?: SchemaFactory<TQuery>
  params?: SchemaFactory<TParams>
  response?: z.ZodType<TResponse>
}

interface ValidationError {
  field: string
  messageKey: string
}

async function validateWithSchema<T>(
  event: H3Event,
  data: unknown,
  schemaFactory: SchemaFactory<T>,
  errorMessage: string
): Promise<T> {
  const t = (key: string): string => key
  const schema = schemaFactory(t)

  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.issues.map(issue => ({
        field: issue.path.join("."),
        messageKey: issue.message,
      }))

      throw createError({
        statusCode: 400,
        statusMessage: "Validation Error",
        data: { message: errorMessage, errors },
      })
    }
    throw error
  }
}

async function checkAuthentication(event: H3Event): Promise<{
  session: ReturnType<typeof serverAuth> extends {
    api: { getSession: (options: { headers: Headers }) => Promise<infer R> }
  }
    ? R
    : never
  user: ReturnType<typeof serverAuth> extends {
    api: { getSession: (options: { headers: Headers }) => Promise<{ user: infer U } | null> }
  }
    ? U
    : never
} | null> {
  const auth = serverAuth()
  const session = await auth.api.getSession({
    headers: event.headers,
  })

  return session as {
    session: Awaited<ReturnType<typeof auth.api.getSession>>
    user: Awaited<ReturnType<typeof auth.api.getSession>> extends { user: infer U }
      ? U
      : never
  } | null
}

async function checkAuthorization(
  event: H3Event,
  permissions: PermissionsMap
): Promise<{
  authorized: boolean
  role?: string
}> {
  const auth = serverAuth()

  const session = await auth.api.getSession({
    headers: event.headers,
  })

  if (!session?.user) {
    return { authorized: false }
  }

  const member = await auth.api.getActiveMember({
    headers: event.headers,
  })

  if (!member) {
    return { authorized: false }
  }

  if (member.role === "admin" || member.role === "owner") {
    return { authorized: true, role: member.role }
  }

  const result = await auth.api.hasPermission({
    headers: event.headers,
    body: {
      permissions,
    },
  })

  return {
    authorized: result?.success === true,
    role: member.role,
  }
}

function getValidatedFields<TBody, TQuery, TParams>(
  config: EndpointConfig<TBody, TQuery, TParams>,
  body: TBody | undefined,
  query: TQuery | undefined,
  params: TParams | undefined
): ValidatedData<TBody, TQuery, TParams> {
  return {
    body: body as TBody,
    query: query as TQuery,
    params: params as TParams,
  }
}

/**
 * Unified endpoint handler wrapper that consolidates authentication,
 * authorization, and validation logic into a single, type-safe API.
 */
export function defineEndpoint<TBody, TQuery, TParams, TResponse>(
  config: EndpointConfig<TBody, TQuery, TParams, TResponse>
): EventHandler {
  return defineEventHandler(async event => {
    const requiresAuth = config.permissions !== undefined || config.auth === true
    const requiresPermissions = config.permissions !== undefined

    if (requiresAuth) {
      const authResult = await checkAuthentication(event)

      if (!authResult?.session?.user) {
        await logAuditEvent(event, {
          action: AUDIT_EVENTS.UNAUTHORIZED_ACCESS,
          resourceType: "api",
          resourceId: event.path,
          details: {
            attemptedAction: event.method,
            path: event.path,
          } satisfies AuditEventDetails[typeof AUDIT_EVENTS.UNAUTHORIZED_ACCESS],
        })

        throw createError({
          statusCode: 401,
          statusMessage: "Unauthorized",
          message: "Authentication required",
        })
      }

      event.context.session = authResult.session
      event.context.user = authResult.session.user

      if (requiresPermissions && config.permissions) {
        const membership = await serverAuth().api.getActiveMember({
          headers: event.headers,
        })

        if (!membership) {
          await logAuditEvent(event, {
            action: AUDIT_EVENTS.PERMISSION_DENIED,
            resourceType: "api",
            resourceId: event.path,
            details: {
              attemptedAction: event.method,
              requiredPermissions: config.permissions,
              userRole: "no membership",
            } satisfies AuditEventDetails[typeof AUDIT_EVENTS.PERMISSION_DENIED],
          })

          throw createError({
            statusCode: 403,
            statusMessage: "Forbidden",
            message: "No organization membership found",
          })
        }

        const authzResult = await checkAuthorization(event, config.permissions)

        if (!authzResult.authorized) {
          await logAuditEvent(event, {
            action: AUDIT_EVENTS.PERMISSION_DENIED,
            resourceType: "api",
            resourceId: event.path,
            details: {
              attemptedAction: event.method,
              requiredPermissions: config.permissions,
              userRole: authzResult.role || "unknown",
            } satisfies AuditEventDetails[typeof AUDIT_EVENTS.PERMISSION_DENIED],
          })

          throw createError({
            statusCode: 403,
            statusMessage: "Forbidden",
            message: `Insufficient permissions. Required: ${JSON.stringify(config.permissions)}`,
          })
        }
      }
    }

    let validatedBody: TBody | undefined
    let validatedQuery: TQuery | undefined
    let validatedParams: TParams | undefined

    if (config.body) {
      validatedBody = await validateWithSchema(
        event,
        await readBody(event),
        config.body,
        "errors.validationFailed"
      )
    }

    if (config.query) {
      validatedQuery = await validateWithSchema(
        event,
        getQuery(event),
        config.query,
        "errors.validationFailed"
      )
    }

    if (config.params) {
      validatedParams = await validateWithSchema(
        event,
        getRouterParams(event),
        config.params,
        "errors.validationFailed"
      )
    }

    const validated = getValidatedFields(
      config,
      validatedBody,
      validatedQuery,
      validatedParams
    )

    let result = await config.handler(event, validated)

    if (config.response) {
      try {
        result = config.response.parse(result) as typeof result
      } catch (error) {
        console.error("Response validation failed:", {
          error,
          path: event.path,
          method: event.method,
        })

        throw createError({
          statusCode: 500,
          statusMessage: "Internal Server Error",
          message: "Response validation failed",
        })
      }
    }

    return result
  })
}
