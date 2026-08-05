import { defineEventHandler, setResponseStatus } from "h3"
import { sql } from "drizzle-orm"

export default defineEventHandler(async event => {
  if (!(await isDatabaseReachable())) {
    setResponseStatus(event, 503)
    return { status: "unavailable" }
  }

  return { status: "ok" }
})

async function isDatabaseReachable(): Promise<boolean> {
  try {
    await useDrizzle().run(sql`SELECT 1`)
    return true
  } catch {
    return false
  }
}
