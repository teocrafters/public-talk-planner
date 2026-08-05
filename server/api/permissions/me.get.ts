import type { H3Event } from "h3"
import { defineEndpoint } from "../../utils/define-endpoint"
import type { PermissionsMap } from "#shared/types/permissions"
import { statement } from "#shared/utils/permissions/declare"

interface PermissionMap {
  role: string
  permissions: Record<string, boolean>
}

interface PermissionCheck {
  key: string
  permissions: PermissionsMap
}

const ROLE_WITHOUT_MEMBERSHIP = "publisher"
const UNRESTRICTED_ROLES = ["admin", "owner"]

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

    return { role: member.role, permissions: await grantedPermissions(event) }
  },
})

function everyPermissionSetTo(granted: boolean): Record<string, boolean> {
  return Object.fromEntries(declaredChecks().map(check => [check.key, granted]))
}

async function grantedPermissions(event: H3Event): Promise<Record<string, boolean>> {
  const granted: Record<string, boolean> = {}

  for (const check of declaredChecks()) {
    const result = await serverAuth().api.hasPermission({
      headers: event.headers,
      body: { permissions: check.permissions },
    })

    granted[check.key] = result?.success === true
  }

  return granted
}

function declaredChecks(): PermissionCheck[] {
  const declaration: Record<string, readonly string[]> = statement

  return Object.entries(declaration).flatMap(([resource, actions]) =>
    actions.map(action => ({
      key: `${resource}:${action}`,
      permissions: { [resource]: [action] } as PermissionsMap,
    }))
  )
}
