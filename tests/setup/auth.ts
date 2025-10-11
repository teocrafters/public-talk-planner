import { test as setup } from "../fixtures"

setup.describe("authentication", () => {
	setup("as admin", async ({ authenticateAs }) => {
    await authenticateAs.admin()
  })

  setup("as publisher", async ({ authenticateAs }) => {
    await authenticateAs.publisher()
  })

  setup("as talks manager", async ({ authenticateAs }) => {
	await authenticateAs.talksManager()
})
})
