// The generator emits `text("id")` for the pg provider, so every run of `pnpm auth:schema`
// overwrites auth-schema.ts and its eight primary keys and foreign keys must be
// hand-edited back to `uuid`.
import { drizzle } from "drizzle-orm/node-postgres"
import { serverAuth } from "../server/utils/auth"

// @ts-expect-error - Global variable
global.useDrizzle = function useDrizzle() {
  return drizzle(process.env.DATABASE_URL!)
}

export const auth = serverAuth()
