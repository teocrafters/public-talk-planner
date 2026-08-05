import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "../database/schema"
export { sql, eq, and, or } from "drizzle-orm"

// Traffic is a few hundred reads and single-digit writes a day served by one Node process, so 10
// sits far above observed concurrency while leaving PostgreSQL's default 100 connections free for
// psql, backups and the ETL.
const MAX_POOL_CONNECTIONS = 10

const pool = new Pool({
  connectionString: useRuntimeConfig().databaseUrl,
  max: MAX_POOL_CONNECTIONS,
})

export const tables = schema

export function useDrizzle() {
  return drizzle(pool, { schema })
}

export type PublicTalk = typeof schema.publicTalks.$inferSelect
