export default defineNuxtRouteMiddleware(async () => {
  const { can, fetchPermissions } = usePermissions()

  await fetchPermissions()

  if (!can("speakers", "list").value) {
    return navigateTo("/")
  }
})
