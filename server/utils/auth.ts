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
      provider: "sqlite",
    }),
    secondaryStorage: {
      get: key => hubKV().getItemRaw(`_auth:${key}`),
      set: (key, value, ttl) => {
        return hubKV().set(`_auth:${key}`, value, { ttl })
      },
      delete: key => hubKV().del(`_auth:${key}`),
    },
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
