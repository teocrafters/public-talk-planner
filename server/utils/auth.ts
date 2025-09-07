import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

let _auth: ReturnType<typeof betterAuth>

export function serverAuth() {
  if (_auth) {
    return _auth
  }
  _auth = betterAuth({
    emailAndPassword: {
      enabled: true,
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
  })
  return _auth
}
