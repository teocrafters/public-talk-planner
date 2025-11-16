export default defineNuxtRouteMiddleware(async () => {
  const { can, fetchPermissions } = usePermissions()

  await fetchPermissions()

  if (!can("weekend_meetings", "schedule_rest").value) {
    return navigateTo("/meetings/list")
  }
})
