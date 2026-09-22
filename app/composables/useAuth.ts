import { defu } from "defu"
import { createAuthClient } from "better-auth/client"
import type { InferSessionFromClient, InferUserFromClient, ClientOptions } from "better-auth/client"
import type { RouteLocationRaw } from "vue-router"
import { passkeyClient, organizationClient } from "better-auth/client/plugins"
import {
  ac,
  publisher,
  public_talk_coordinator,
  boe_coordinator,
  admin,
} from "#shared/utils/permissions/declare"

interface RuntimeAuthConfig {
  redirectUserTo: RouteLocationRaw | string
  redirectGuestTo: RouteLocationRaw | string
}

export function useAuth() {
  // Browser-only client: the SSR pass gets its session in-process, so no origin or
  // forwarded headers are needed here.
  const client = createAuthClient({
    plugins: [
      passkeyClient(),
      organizationClient({
        ac,
        roles: {
          publisher,
          public_talk_coordinator,
          boe_coordinator,
          admin,
        },
      }),
    ],
  })

  const options = defu(useRuntimeConfig().public.auth as Partial<RuntimeAuthConfig>, {
    redirectUserTo: "/",
    redirectGuestTo: "/",
  })
  const session = useState<InferSessionFromClient<ClientOptions> | null>("auth:session", () => null)
  const user = useState<InferUserFromClient<ClientOptions> | null>("auth:user", () => null)
  const sessionFetching = useState("auth:sessionFetching", () => false)
  const loggedIn = computed(() => !!session.value)

  const fetchSession = async () => {
    if (import.meta.server) {
      return { session: session.value, user: user.value }
    }

    if (sessionFetching.value) {
      return
    }

    sessionFetching.value = true
    const { data } = await client.getSession()
    session.value = data?.session || null
    user.value = data?.user || null
    sessionFetching.value = false
    return data
  }

  if (import.meta.client) {
    client.$store.listen("$sessionSignal", async signal => {
      if (!signal) return
      await fetchSession()
    })
  }

  return {
    session,
    user,
    loggedIn,
    sessionFetching,
    signIn: client.signIn,
    signUp: client.signUp,
    async signOut({ redirectTo }: { redirectTo?: RouteLocationRaw } = {}) {
      const res = await client.signOut()
      session.value = null
      user.value = null
      if (redirectTo) {
        await navigateTo(redirectTo)
      }
      return res
    },
    options,
    fetchSession,
    client,
  }
}
