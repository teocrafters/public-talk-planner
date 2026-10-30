import { defineEndpoint } from "../../utils/define-endpoint"
import {
  statement,
  publisher,
  public_talk_coordinator,
  boe_coordinator,
} from "#shared/utils/permissions/declare"

interface PermissionMap {
  role: string
  permissions: Record<string, boolean>
}

const ROLE_WITHOUT_MEMBERSHIP = "publisher"
const UNRESTRICTED_ROLES = ["admin", "owner"]

const ROLE_STATEMENTS: Record<string, Record<string, readonly string[]>> = {
  publisher: publisher.statements,
  public_talk_coordinator: public_talk_coordinator.statements,
  boe_coordinator: boe_coordinator.statements,
}

export default defineEndpoint({
  auth: true,
  handler: async (event): Promise<PermissionMap> => {
    const member = await serverAuth().api.getActiveMember({
      headers: event.headers,
    })

    if (!member) {
      return { role: ROLE_WITHOUT_MEMBERSHIP, permissions: everyPermissionSetTo(false) }
    }

    if (UNRESTRICTED_ROLES.includes(member.role)) {
      return { role: member.role, permissions: everyPermissionSetTo(true) }
    }

    return { role: member.role, permissions: grantedPermissions(member.role) }
  },
})

function everyPermissionSetTo(granted: boolean): Record<string, boolean> {
  return Object.fromEntries(declaredKeys().map(key => [key, granted]))
}

// Answered from the static declaration: asking better-auth per permission costs one D1
// round trip each, serialized inside a single SSR render.
function grantedPermissions(role: string): Record<string, boolean> {
  const granted = grantedKeys(role)

  return Object.fromEntries(declaredKeys().map(key => [key, granted.has(key)]))
}

function grantedKeys(role: string): Set<string> {
  return new Set(permissionKeysOf(ROLE_STATEMENTS[role] ?? {}))
}

function declaredKeys(): string[] {
  return permissionKeysOf(statement)
}

function permissionKeysOf(declaration: Record<string, readonly string[]>): string[] {
  return Object.entries(declaration).flatMap(([resource, actions]) =>
    actions.map(action => `${resource}:${action}`)
  )
}
