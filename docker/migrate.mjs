import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { fileURLToPath } from "node:url"
import { Pool } from "pg"

const connectionString = process.env.NUXT_DATABASE_URL

if (!connectionString) {
  throw new Error("NUXT_DATABASE_URL must be set to run migrations")
}

// Runs to completion before the server starts, so it never competes with the request pool.
const pool = new Pool({ connectionString, max: 1 })

try {
  await migrate(drizzle(pool), {
    // The image copies this file and the SQL folder side by side into .output/server, which is
    // also the only place drizzle-orm and pg resolve from.
    migrationsFolder: fileURLToPath(new URL("migrations", import.meta.url)),
  })
} finally {
  await pool.end()
}
