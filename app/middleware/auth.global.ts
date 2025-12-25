import { defu } from "defu"

type MiddlewareOptions =
  | false
  | {
      /**
       * Only apply auth middleware to guest or user
       */
      only?: "guest" | "user"
      /**
       * Redirect authenticated user to this route
       */
      redirectUserTo?: string
      /**
       * Redirect guest to this route
       */
      redirectGuestTo?: string
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

export default defineNuxtRouteMiddleware(async to => {
  // If auth is disabled, skip middleware
  if (to.meta?.auth === false) {
    return
  }
  const { loggedIn, options } = useAuth()
  // Session already loaded by plugin

  const { only, redirectUserTo, redirectGuestTo } = defu(to.meta?.auth, options)

  // If guest mode, redirect if authenticated
  if (only === "guest" && loggedIn.value) {
    // Check for redirect URL from query
    const redirectUrl = to.query.redirect as string | undefined

    if (redirectUrl && redirectUrl.startsWith("/") && !redirectUrl.startsWith("//")) {
      // Avoid infinite redirect
      if (to.path === redirectUrl) {
        return
      }
      return navigateTo(redirectUrl)
    }

    // Avoid infinite redirect
    if (to.path === redirectUserTo) {
      return
    }
    return navigateTo(redirectUserTo)
  }

  // If not authenticated, redirect with original URL
  if (!loggedIn.value) {
    // Avoid infinite redirect
    if (to.path === redirectGuestTo) {
      return
    }
    const fullPath = String(to.fullPath || to.path)
    return navigateTo(`${redirectGuestTo}?redirect=${encodeURIComponent(fullPath)}`)
  }
})
