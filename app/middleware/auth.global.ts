import { defu } from "defu"
import { cosineDistance } from "drizzle-orm"

type MiddlewareOptions =
  | false
  | {
      /**
       * Only apply auth middleware to guest or user
       */
      only?: "guest" | "user"
    }

declare module "#app" {
  interface PageMeta {
    auth?: MiddlewareOptions
  }
}

declare module "vue-router" {
  interface RouteMeta {
    auth?: MiddlewareOptions
  }
}

const REDIRECT_USER_TO = "/"
const REDIRECT_GUEST_TO = "/login"

export default defineNuxtRouteMiddleware(async to => {
  // If auth is disabled, skip middleware
  if (to.meta?.auth === false) {
    return
  }
  const { loggedIn, options } = useAuth()
  // Session already loaded by plugin

  const { only } = defu(to.meta?.auth, options)

  // If guest mode, redirect if authenticated
  if (only === "guest" && loggedIn.value) {
    const redirectUrl = to.query.redirect as string | undefined

    if (redirectUrl && redirectUrl.startsWith("/") && !redirectUrl.startsWith("//")) {
      // Avoid infinite redirect
      if (to.path === redirectUrl) {
        return
      }
      return navigateTo(redirectUrl)
    }

    // Avoid infinite redirect
    if (to.path === REDIRECT_USER_TO) {
      return
    }
    return navigateTo(REDIRECT_USER_TO)
  }

  // If not authenticated, redirect with original URL
  if (!loggedIn.value) {
    // Avoid infinite redirect
    if (to.path === REDIRECT_GUEST_TO) {
      return
    }
    console.log(">>>> HIER")
    const fullPath = String(to.fullPath || to.path)
    return navigateTo(`${REDIRECT_GUEST_TO}?redirect=${encodeURIComponent(fullPath)}`)
  }
})
