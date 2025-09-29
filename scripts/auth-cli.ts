import { drizzle } from "drizzle-orm/d1"
import { serverAuth } from "../server/utils/auth"

// @ts-expect-error - Global variable
global.useDrizzle = function useDrizzle() {
  // @ts-expect-error - Cloudflare D1 database
  return drizzle(process.env.DB || globalThis.__env__?.DB || globalThis.DB) as D1Database
}

export const auth = serverAuth()
