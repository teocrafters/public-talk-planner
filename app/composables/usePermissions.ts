type Role = "publisher" | "public_talk_coordinator" | "boe_coordinator" | "admin" | "owner"

export function usePermissions() {
  const { user } = useAuth()
  const requestFetch = useRequestFetch()
  const role = useState<Role>("permissions:role", () => "publisher")
  const permissionCache = useState<Map<string, boolean>>("permissions:cache", () => new Map())
  const isLoading = useState<boolean>("permissions:loading", () => false)
  const isFetched = useState<boolean>("permissions:fetched", () => false)

  const fetchPermissions = async () => {
    if ((isFetched.value && permissionCache.value.size > 0) || isLoading.value) {
      return
    }

    if (!user.value?.id) {
      role.value = "publisher"
      isFetched.value = true
      return
    }

    isLoading.value = true
    try {
      // requestFetch forwards the session cookie, which plain $fetch drops during SSR.
      const permissionMap = await requestFetch("/api/permissions/me")

      role.value = permissionMap.role as Role
      permissionCache.value = new Map(Object.entries(permissionMap.permissions))

      isFetched.value = true
    } catch (error) {
      console.error("Failed to fetch user permissions:", error)
      role.value = "publisher"
    } finally {
      isLoading.value = false
    }
  }

  const can = (
    resource: "speakers" | "talks" | "weekend_meetings" | "publishers",
    action: string
  ) => {
    return computed(() => {
      const permission = permissionCache.value.get(`${resource}:${action}`)
      return permission ?? false
    })
  }

  const clearPermissionCache = () => {
    permissionCache.value.clear()
  }

  return {
    role: readonly(role),
    isLoading: readonly(isLoading),
    can,
    fetchPermissions,
    clearPermissionCache,
  }
}
