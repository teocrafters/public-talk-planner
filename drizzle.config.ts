import { defineConfig } from "drizzle-kit"

const databaseUrl = process.env.NUXT_DATABASE_URL

if (!databaseUrl) {
  throw new Error("NUXT_DATABASE_URL must be set to run drizzle-kit")
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./server/database/schema.ts",
  out: "./server/database/migrations",
  dbCredentials: {
    url: databaseUrl,
  },
})
