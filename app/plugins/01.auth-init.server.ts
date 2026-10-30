export default defineNuxtPlugin(async () => {
  const event = useRequestEvent()
  if (!event) return

  const { session, user } = useAuth()
  // The app bundle cannot import server utils, so Better Auth is reached through the
  // request context instead of over HTTP.
  const serverSession = await event.context.readSession?.()

  session.value = serverSession?.session ?? null
  user.value = serverSession?.user ?? null
})
