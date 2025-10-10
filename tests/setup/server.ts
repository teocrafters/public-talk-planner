import { test as setup } from '@playwright/test';
import { x } from "tinyexec"
import { rm, writeFile } from "node:fs/promises"

setup.setTimeout(120000)

setup("Build and start server", async () => {
	console.log("Starting global setup...")

	// 1. Clean database state
	console.log("Cleaning database...")
	await rm(".data/hub/d1", { recursive: true, force: true })

	// 2. Start preview server
	console.log("Starting preview server...")
  const serverProcess = x("pnpm", ["dev"], {
    nodeOptions: {
      stdio: "ignore",
      detached: true,
    },
  })

  await writeFile("tests/setup/server.pid.json", JSON.stringify({
    pid: serverProcess.pid,
    port: 3000,
    startedAt: new Date().toISOString(),
  }))

	// 3. Wait for server
	console.log("Waiting for server...")
  await waitForServer("http://localhost:3000", 120000)

	// 4. Seed test accounts
	console.log("Seeding test accounts...")
	let seedAccountsAttempts = 0
	while (seedAccountsAttempts < 3) {
		try {
			const seedAccountsResult = await x("curl", [
				"-X",
				"POST",
				"http://localhost:3000/_nitro/tasks/seed-test-accounts",
			])
			console.log("Seed accounts response:", seedAccountsResult.stdout)

			// Check if the response contains an error
			if (seedAccountsResult.stdout.includes('"error":true')) {
				throw new Error("Seed accounts returned an error")
			}
			break
		} catch (error) {
			seedAccountsAttempts++
			console.error(`Failed to seed test accounts (attempt ${seedAccountsAttempts}/3):`, error)
			if (seedAccountsAttempts >= 3) {
				throw error
			}
			await new Promise(resolve => setTimeout(resolve, 2000))
		}
	}

	// 5. Seed public talks
	console.log("Seeding public talks...")
	try {
		const seedTalksResult = await x("curl", [
			"-X",
			"POST",
			"http://localhost:3000/_nitro/tasks/seed-public-talks",
		])
		console.log("Seed public talks response:", seedTalksResult.stdout)
	} catch (error) {
		console.error("Failed to seed public talks:", error)
		throw error
	}

	console.log("Global setup complete!")
})

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
