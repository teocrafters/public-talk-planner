import type { H3Event } from "h3"
import { appendResponseHeader } from "h3"

const sessionByRequest = new WeakMap<H3Event, ReturnType<typeof readActiveSession>>()
const memberByRequest = new WeakMap<H3Event, ReturnType<typeof readActiveMember>>()

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

// Every read is a database round-trip, and one authorised request asks for the same session from
// the endpoint wrapper, the permission check and the audit log.
export function getRequestSession(event: H3Event) {
  return readOnce(sessionByRequest, event, () => readActiveSession(event))
}

export function getRequestMember(event: H3Event) {
  return readOnce(memberByRequest, event, () => readActiveMember(event))
}

function readOnce<T>(
  cache: WeakMap<H3Event, Promise<T>>,
  event: H3Event,
  read: () => Promise<T>
): Promise<T> {
  const cached = cache.get(event)

  if (cached) {
    return cached
  }

  const pending = read()
  cache.set(event, pending)

  return pending
}

function readActiveSession(event: H3Event) {
  return serverAuth().api.getSession({
    headers: event.headers,
  })
}

function readActiveMember(event: H3Event) {
  return serverAuth().api.getActiveMember({
    headers: event.headers,
  })
}
