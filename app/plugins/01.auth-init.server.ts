export default defineNuxtPlugin(async () => {
  const event = useRequestEvent()
  if (!event) return

  const { fetchSession } = useAuth()
  await fetchSession()
})
