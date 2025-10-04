import { AUDIT_EVENTS } from "../../types/audit-events"

export function useAuditLog() {
  const logEvent = async (
    action: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, unknown>
  ): Promise<void> => {
    try {
      await $fetch("/api/audit-log", {
        method: "POST",
        body: { action, resourceType, resourceId, details },
      })
    } catch (error) {
      console.error("Failed to log audit event:", error)
    }
  }

  return { logEvent, AUDIT_EVENTS }
}
