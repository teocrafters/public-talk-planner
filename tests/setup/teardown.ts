import { test as setup } from '@playwright/test';
import { x } from "tinyexec"
import { readFile, rm } from "node:fs/promises"
import { existsSync } from 'node:fs';

setup.setTimeout(120000)

setup("Build and start server", async () => {
  console.log("Starting global setup...")

  const pidFile = "tests/setup/server.pid.json"
  if (existsSync(pidFile)) {
    const pidFileContent = await readFile(pidFile, "utf-8")
    const serverPid = JSON.parse(pidFileContent)
    console.log("Stopping server...")
    await x("kill", [serverPid.pid])
    console.log("Server stopped")

    await rm(pidFile)
    console.log("PID file removed")
  }
})
