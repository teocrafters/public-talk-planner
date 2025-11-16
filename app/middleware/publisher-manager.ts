export default defineNuxtRouteMiddleware(async () => {
  const { can, fetchPermissions } = usePermissions()

  await fetchPermissions()

  if (!can("publishers", "create").value && !can("publishers", "update").value) {
    return navigateTo("/")
  }
})
