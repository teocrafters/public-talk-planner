import { test as setup } from "@playwright/test"
import { x } from "tinyexec"
import { readFile, rm } from "node:fs/promises"
import { existsSync } from "node:fs"

setup.setTimeout(120000)

setup("Stop server", async () => {
  console.log("Stopping server...")

  const pidFile = "tests/setup/server.pid.json"
  if (existsSync(pidFile)) {
    const pidFileContent = await readFile(pidFile, "utf-8")
    const serverPid = JSON.parse(pidFileContent)
    console.log("Stopping server...", serverPid)
    await x("kill", [serverPid.pid])
    console.log("Server stopped")

    await rm(pidFile)
    console.log("PID file removed")
  }

  await x("pnpm", ["stop"])

  // Kill any lingering Nuxt/Workerd processes if they are still running
  try {
    await x("pkill", ["-f", "nuxt"])
    console.log("Killed lingering nuxt processes")
  } catch (error) {
    console.log("pkill nuxt failed", error)
  }

  try {
    await x("pkill", ["-f", "workerd"])
    console.log("Killed lingering workerd processes")
  } catch (error) {
    console.log("pkill workerd failed", error)
  }
})
