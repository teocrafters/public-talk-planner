type Role = "publisher" | "manager" | "admin"

export function usePermissions() {
	const { user, client } = useAuth()
	const role = useState<Role>("permissions:role", () => "publisher")
	const permissionCache = useState<Map<string, boolean>>("permissions:cache", () => new Map())
	const isLoading = useState<boolean>("permissions:loading", () => false)
	const isFetched = useState<boolean>("permissions:fetched", () => false)

	const fetchPermissions = async () => {
		if (isFetched.value || isLoading.value) {
			return
		}

		if (!user.value?.id) {
			role.value = "publisher"
			isFetched.value = true
			return
		}

		isLoading.value = true
		try {
			const { data: activeMember } = await client.organization.getActiveMember()

			if (activeMember?.role) {
				role.value = activeMember.role as Role
			} else {
				role.value = "publisher"
			}

			const permissionsToCheck = [
				{ key: "speakers:list", permissions: { speakers: ["list"] } },
				{ key: "speakers:create", permissions: { speakers: ["create"] } },
				{ key: "speakers:update", permissions: { speakers: ["update"] } },
				{ key: "speakers:archive", permissions: { speakers: ["archive"] } },
				{ key: "talks:create", permissions: { talks: ["create"] } },
				{ key: "talks:update", permissions: { talks: ["update"] } },
				{ key: "talks:archive", permissions: { talks: ["archive"] } },
				{ key: "talks:flag", permissions: { talks: ["flag"] } },
				{ key: "weekend_meetings:schedule_public_talks", permissions: { weekend_meetings: ["schedule_public_talks"] } },
				{ key: "weekend_meetings:schedule_all", permissions: { weekend_meetings: ["schedule_all"] } },
				{ key: "weekend_meetings:list", permissions: { weekend_meetings: ["list"] } },
				{ key: "weekend_meetings:list_history", permissions: { weekend_meetings: ["list_history"] } },
			]

			// Admin users have all permissions
			if (role.value === "admin") {
				for (const check of permissionsToCheck) {
					permissionCache.value.set(check.key, true)
				}
			} else {
				// Non-admin users need to check permissions via API
				for (const check of permissionsToCheck) {
					const { data } = await client.organization.hasPermission({
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						permissions: check.permissions as any,
					})
					permissionCache.value.set(check.key, data?.success ?? false)
				}
			}

			isFetched.value = true
		} catch (error) {
			console.error("Failed to fetch user permissions:", error)
			role.value = "publisher"
		} finally {
			isLoading.value = false
		}
	}

	const can = (resource: "speakers" | "talks" | "weekend_meetings", action: string) => {
		return computed(() => {
			const permission = permissionCache.value.get(`${resource}:${action}`)
			return permission ?? false
		})
	}

	return {
		role: readonly(role),
		isLoading: readonly(isLoading),
		can,
		fetchPermissions,
	}
}
