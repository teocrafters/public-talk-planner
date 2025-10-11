import { test as setup, expect } from "../fixtures"
import testAccounts from "../fixtures/test-accounts.json" with { type: "json" }

setup("authenticate as talks manager", async ({ page }) => {
	const manager = testAccounts.users.find(u => u.role === "editor")!

  await page.goto("http://localhost:3000/login")
  await page.waitForTimeout(5000)

	await page.getByTestId("auth-email-input").fill(manager.email)
	await page.getByTestId("auth-password-input").fill(manager.password)

	const submitButton = page.getByTestId("auth-submit-button")
	await submitButton.waitFor({ state: "visible" })
	await expect(submitButton).toBeEnabled()
  await submitButton.click()
  await page.waitForTimeout(2000)

	await page.waitForURL("http://localhost:3000/user")

	await page.context().storageState({ path: ".auth/talks-manager.json" })
})
