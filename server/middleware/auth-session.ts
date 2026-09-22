export default defineEventHandler(event => {
  // Handed over rather than resolved: this runs on every request, and only a page render
  // needs the session here — API handlers read it themselves.
  event.context.readSession = () => readSession(event)
})
