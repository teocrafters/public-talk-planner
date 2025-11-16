import { test as setup } from "../fixtures"

setup.describe("authentication", () => {
  setup("as admin", async ({ authenticateAs }) => {
    await authenticateAs.admin()
  })

  setup("as publisher", async ({ authenticateAs }) => {
    await authenticateAs.publisher()
  })

  setup("as public talk coordinator", async ({ authenticateAs }) => {
    await authenticateAs.publicTalkCoordinator()
  })

  setup("as boe coordinator", async ({ authenticateAs }) => {
    await authenticateAs.boeCoordinator()
  })
})
