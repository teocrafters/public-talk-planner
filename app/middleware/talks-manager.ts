export default defineNuxtRouteMiddleware(async () => {
  const { can, fetchPermissions } = usePermissions()

  await fetchPermissions()

  if (
    !can("talks", "create").value ||
    !can("talks", "update").value ||
    !can("talks", "archive").value ||
    !can("talks", "flag").value
  ) {
    return navigateTo("/")
  }
})
