import type { H3Event } from "h3"
import { createError } from "h3"

export async function hasPermission(event: H3Event, permissions: PermissionsMap): Promise<boolean> {
  const auth = serverAuth()

  const session = await auth.api.getSession({
    headers: event.headers,
  })

  if (!session?.user) {
    return false
  }

  const member = await auth.api.getActiveMember({
    headers: event.headers,
  })

  if (!member) {
    return false
  }

  if (member.role === "admin" || member.role === "owner") {
    return true
  }

  const result = await auth.api.hasPermission({
    headers: event.headers,
    body: {
      permissions,
    },
  })

  return result?.success === true
}

export function requirePermission(permissions: PermissionsMap) {
  return async (event: H3Event) => {
    const auth = serverAuth()

    const session = await auth.api.getSession({
      headers: event.headers,
    })

    if (!session?.user) {
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

    // @ts-expect-error - activeOrganizationId is not typed
    if (!session?.activeOrganizationId) {
      const organizations = await auth.api.listOrganizations({
        headers: event.headers,
      })

      if (!organizations || organizations.length === 0) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          message: "User has no organization memberships",
        })
      }

      await auth.api.setActiveOrganization({
        headers: event.headers,
        body: {
          organizationId: organizations[0]?.id,
          organizationSlug: organizations[0]?.slug,
        },
      })
    }

    const role = await auth.api.getActiveMemberRole({
      headers: event.headers,
    })

    if (!role) {
      await logAuditEvent(event, {
        action: AUDIT_EVENTS.PERMISSION_DENIED,
        resourceType: "api",
        resourceId: event.path,
        details: {
          attemptedAction: event.method,
          requiredPermissions: permissions,
          userRole: "no membership",
        } satisfies AuditEventDetails[typeof AUDIT_EVENTS.PERMISSION_DENIED],
      })

      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "No organization membership found",
      })
    }

    if (role.role === "admin") {
      return
    }

    const result = await auth.api.hasPermission({
      headers: event.headers,
      body: {
        permissions,
      },
    })

    if (result?.success !== true) {
      await logAuditEvent(event, {
        action: AUDIT_EVENTS.PERMISSION_DENIED,
        resourceType: "api",
        resourceId: event.path,
        details: {
          attemptedAction: event.method,
          requiredPermissions: permissions,
          // userRole: member.role,
          userRole: "publisher",
        } satisfies AuditEventDetails[typeof AUDIT_EVENTS.PERMISSION_DENIED],
      })

      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: `Insufficient permissions. Required permissions: ${JSON.stringify(permissions)}`,
      })
    }
  }
}
