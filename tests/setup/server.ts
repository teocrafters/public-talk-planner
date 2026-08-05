import { test as setup } from "@playwright/test"
import { x } from "tinyexec"
import { writeFile } from "node:fs/promises"
import { Pool } from "pg"

setup.setTimeout(120000)

setup("Build and start server", async () => {
  console.log("Starting global setup...")

  // 1. Clean database state
  console.log("Cleaning database...")
  await truncateApplicationTables()

  // 2. Kill any lingering Nuxt processes if they are still running
  try {
    await x("pkill", ["-f", "nuxt"])
    console.log("Killed lingering nuxt processes")
  } catch (error) {
    console.log("pkill nuxt failed", error)
  }

  // 3. Start preview server
  console.log("Starting preview server...")
  const serverProcess = x("pnpm", ["dev"], {
    nodeOptions: {
      stdio: "ignore",
      detached: true,
    },
  })

  await writeFile(
    "tests/setup/server.pid.json",
    JSON.stringify({
      pid: serverProcess.pid,
      port: 3000,
      startedAt: new Date().toISOString(),
    })
  )

  // 4. Wait for server
  console.log("Waiting for server...")
  await waitForServer("http://localhost:3000", 120000)

  // 5. Run main seeder (handles all database seeding in correct order)
  console.log("Running main database seeder...")
  let seedAttempts = 0
  while (seedAttempts < 3) {
    try {
      const seedResult = await x("curl", ["-X", "POST", "http://localhost:3000/_nitro/tasks/seed"])
      console.log("Main seeder response:", seedResult.stdout)

      // Check if the response contains an error
      if (
        seedResult.stdout.includes('"result":"error"') ||
        seedResult.stdout.includes('"error":true')
      ) {
        throw new Error("Main seeder returned an error")
      }

      console.log("✅ Database seeding completed successfully")
      break
    } catch (error) {
      seedAttempts++
      console.error(`Failed to run main seeder (attempt ${seedAttempts}/3):`, error)
      if (seedAttempts >= 3) {
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  console.log("Global setup complete!")
})

/**
 * Empties the schema the migrations own without dropping it, so the suite starts from a known
 * state. Most seeders skip rows that already exist, which would otherwise let one run's data
 * decide the next run's counts and ordering.
 */
async function truncateApplicationTables(): Promise<void> {
  const connectionString = process.env.NUXT_DATABASE_URL

  if (!connectionString) {
    throw new Error("NUXT_DATABASE_URL must be set to run the E2E suite")
  }

  const pool = new Pool({ connectionString, max: 1 })

  try {
    const { rows } = await pool.query<{ qualifiedName: string }>(
      `SELECT format('%I.%I', schemaname, tablename) AS "qualifiedName"
       FROM pg_tables
       WHERE schemaname = 'public'`
    )

    if (rows.length === 0) return

    await pool.query(
      `TRUNCATE ${rows.map(row => row.qualifiedName).join(", ")} RESTART IDENTITY CASCADE`
    )
  } finally {
    await pool.end()
  }
}

async function waitForServer(url: string, timeout: number = 120000): Promise<void> {
  const startTime = Date.now()
  let attempt = 0

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        console.log(`Server ready after ${attempt + 1} attempts`)
        return
      }
    } catch {
      // Server not ready, retry
      console.log(`Server not ready, retrying... (${attempt + 1} attempts)`)
    }

    attempt++
    const delay = attempt * 1000
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  throw new Error(`Server not ready after ${timeout}ms`)
}
