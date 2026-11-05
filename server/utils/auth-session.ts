import type { H3Event } from "h3"
import { appendResponseHeader } from "h3"

export async function readSession(event: H3Event) {
  const { headers, response } = await serverAuth().api.getSession({
    headers: event.headers,
    returnHeaders: true,
  })

  // Better Auth ships no Nuxt cookie integration: a refreshed session returns its
  // Set-Cookie on these headers, and nothing carries it to the browser unless we copy it.
  for (const cookie of headers.getSetCookie()) {
    appendResponseHeader(event, "set-cookie", cookie)
  }

  return response
}
