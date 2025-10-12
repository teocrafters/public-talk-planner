import type { H3Event } from "h3"
import { createError } from "h3"
import { eq } from "drizzle-orm"
import { member } from "../database/schema"

type Role = "member" | "marker" | "speakers_manager" | "editor" | "admin"

const ROLE_HIERARCHY: Record<Role, number> = {
  member: 1,
  marker: 2,
  speakers_manager: 2,
  editor: 3,
  admin: 4,
}

export async function getUserRole(event: H3Event): Promise<Role | null> {
  const session = await serverAuth().api.getSession({
    headers: event.headers,
  })

  if (!session?.user) {
    return null
  }

  const db = useDrizzle()
  const memberRecord = await db
    .select()
    .from(member)
    .where(eq(member.userId, session.user.id))
    .limit(1)

  if (!memberRecord || memberRecord.length === 0) {
    return null
  }

  const memberData = memberRecord[0]
  if (!memberData) {
    return null
  }

  return memberData.role as Role
}

export function requireRole(requiredRole: Role) {
  return async (event: H3Event) => {
    const userRole = await getUserRole(event)

    if (!userRole) {
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

    const userRoleLevel = ROLE_HIERARCHY[userRole]
    const requiredRoleLevel = ROLE_HIERARCHY[requiredRole]

    if (userRoleLevel < requiredRoleLevel) {
      await logAuditEvent(event, {
        action: AUDIT_EVENTS.PERMISSION_DENIED,
        resourceType: "api",
        resourceId: event.path,
        details: {
          attemptedAction: event.method,
          requiredRole,
          userRole,
        } satisfies AuditEventDetails[typeof AUDIT_EVENTS.PERMISSION_DENIED],
      })

      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: `Insufficient permissions. Required role: ${requiredRole}, your role: ${userRole}`,
      })
    }
  }
}
