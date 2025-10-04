import type { H3Event } from "h3"
import { getRequestIP } from "h3"
import { auditLog } from "../database/schema"
import type { AuditEventType, AuditEventDetails } from "../../types/audit-events"

interface LogAuditEventOptions {
  action: AuditEventType
  resourceType: string
  resourceId: string
  details: AuditEventDetails[keyof AuditEventDetails]
}

export async function logAuditEvent(event: H3Event, options: LogAuditEventOptions): Promise<void> {
  const session = await serverAuth().api.getSession({
    headers: event.headers,
  })

  if (!session?.user) {
    return
  }

  const db = useDrizzle()
  const ipAddress = getRequestIP(event) || null

  await db.insert(auditLog).values({
    userId: session.user.id,
    userEmail: session.user.email,
    action: options.action,
    resourceType: options.resourceType,
    resourceId: options.resourceId,
    details: JSON.stringify(options.details),
    ipAddress,
    timestamp: new Date(),
  })
}
