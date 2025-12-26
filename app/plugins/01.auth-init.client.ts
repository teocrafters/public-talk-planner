export default defineNuxtPlugin(async () => {
  const { fetchSession, session } = useAuth()
  if (session.value) return
  await fetchSession()
})
