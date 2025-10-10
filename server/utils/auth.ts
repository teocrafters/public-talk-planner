import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, organization } from "better-auth/plugins"
import { passkey } from "better-auth/plugins/passkey"
import { sendVerificationEmail } from "./email"

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
    plugins: [admin(), organization(), passkey()],
    emailVerification: {
      sendVerificationEmail: async ({ user, url }, _request) => {
        await sendVerificationEmail(user.email, url)
      },
    },
  })
}
