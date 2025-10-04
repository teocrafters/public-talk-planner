type Role = "member" | "marker" | "editor" | "admin"

interface OrganizationMembership {
  id: string
  organizationId: string
  userId: string
  role: string
  createdAt: Date
}

const ROLE_HIERARCHY: Record<Role, number> = {
  member: 1,
  marker: 2,
  editor: 3,
  admin: 4,
}

export function usePermissions() {
  const { user } = useAuth()
  const role = ref<Role>("member")
  const isLoading = ref(false)

  const fetchPermissions = async () => {
    if (!user.value?.id) {
      role.value = "member"
      return
    }

    isLoading.value = true
    try {
      const response = await $fetch<OrganizationMembership[]>("/api/user/membership", {
        method: "GET",
      })

      if (response && response.length > 0 && response[0]) {
        role.value = response[0].role as Role
      } else {
        role.value = "member"
      }
    } catch (error) {
      console.error("Failed to fetch user permissions:", error)
      role.value = "member"
    } finally {
      isLoading.value = false
    }
  }

  const canMarkTalks = computed(() => ["marker", "editor", "admin"].includes(role.value))

  const canEditTalks = computed(() => ["editor", "admin"].includes(role.value))

  const hasRole = (requiredRole: Role): boolean => {
    const userLevel = ROLE_HIERARCHY[role.value]
    const requiredLevel = ROLE_HIERARCHY[requiredRole]
    return userLevel >= requiredLevel
  }

  return {
    role: readonly(role),
    isLoading: readonly(isLoading),
    canMarkTalks,
    canEditTalks,
    hasRole,
    fetchPermissions,
  }
}
