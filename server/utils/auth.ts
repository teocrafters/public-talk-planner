import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, organization } from "better-auth/plugins"
import { passkey } from "better-auth/plugins/passkey"
import { sendVerificationEmail } from "./email"
import {
  ac,
  publisher,
  public_talk_coordinator,
  boe_coordinator,
} from "#shared/utils/permissions/declare"
import { AUTH_COOKIE_NAME } from "#shared/constants/cookies"
import { member as memberTable } from "../database/auth-schema"

// Pinned at the library's own defaults so an upgrade cannot move session lifetime silently.
const SESSION_EXPIRES_IN = 60 * 60 * 24 * 7
const SESSION_UPDATE_AGE = 60 * 60 * 24
const SESSION_FRESH_AGE = 60 * 60 * 24

let _auth: ReturnType<typeof getBetterAuth>

export function serverAuth() {
  if (_auth) {
    return _auth
  }

  _auth = getBetterAuth()
  return _auth
}

function getBetterAuth() {
  return betterAuth({
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    database: drizzleAdapter(useDrizzle(), {
      provider: "pg",
    }),
    plugins: [
      admin(),
      organization({
        ac,
        roles: {
          publisher,
          public_talk_coordinator,
          boe_coordinator,
        },
      }),
      passkey(),
    ],
    advanced: {
      database: {
        // Every key in the database is uuid; the string form "uuid" is not a legal
        // value here, only a function is.
        generateId: () => crypto.randomUUID(),
      },
      // Off so the session cookie keeps its plain name: better-auth prefixes every cookie
      // with "__Secure-" when this is on, which would orphan all live sessions.
      useSecureCookies: false,
      cookies: {
        session_token: {
          name: AUTH_COOKIE_NAME,
          attributes: {
            secure: true,
            httpOnly: true,
          },
        },
      },
    },
    session: {
      expiresIn: SESSION_EXPIRES_IN,
      updateAge: SESSION_UPDATE_AGE,
      freshAge: SESSION_FRESH_AGE,
      cookieCache: {
        enabled: true,
        maxAge: 300,
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }, _request) => {
        await sendVerificationEmail(user.email, url)
      },
    },
    databaseHooks: {
      session: {
        create: {
          before: async session => {
            const userOrgs = await useDrizzle()
              .select()
              .from(memberTable)
              .where(eq(memberTable.userId, session.userId))
            if (userOrgs.length === 0) {
              return {
                data: {
                  ...session,
                  activeOrganizationId: null,
                },
              }
            }

            const organization = userOrgs[0]!.organizationId

            return {
              data: {
                ...session,
                activeOrganizationId: organization,
              },
            }
          },
        },
      },
    },
  })
}
