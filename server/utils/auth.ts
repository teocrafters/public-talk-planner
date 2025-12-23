import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, organization } from "better-auth/plugins"
import { passkey } from "better-auth/plugins/passkey"
import { kv } from "hub:kv"
import { sendVerificationEmail } from "./email"
import {
  ac,
  publisher,
  public_talk_coordinator,
  boe_coordinator,
} from "~~/shared/utils/permissions/declare"
import { member as memberTable } from "../db/auth-schema"

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
      get: key => kv.get(`_auth:${key}`),
      set: (key, value, ttl) => {
        return kv.set(`_auth:${key}`, value, { ttl })
      },
      delete: key => kv.del(`_auth:${key}`),
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
