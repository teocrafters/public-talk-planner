import type { Session, User } from "better-auth"

declare module "h3" {
  interface H3EventContext {
    readSession?: () => Promise<{ session: Session; user: User } | null>
  }
}

export {}
