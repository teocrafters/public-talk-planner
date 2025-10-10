import { test as setup, expect } from "@playwright/test"
import testAccounts from "../fixtures/test-accounts.json" with { type: "json" }

setup("authenticate as admin", async ({ page }) => {
	const admin = testAccounts.users.find(u => u.role === "admin")!

  await page.goto("http://localhost:3000/login")
  await page.waitForTimeout(5000)

	await page.getByTestId("auth-email-input").fill(admin.email)
	await page.getByTestId("auth-password-input").fill(admin.password)

	const submitButton = page.getByTestId("auth-submit-button")
	await submitButton.waitFor({ state: "visible" })
	await expect(submitButton).toBeEnabled()
  await submitButton.click()
  await page.waitForTimeout(2000)

	await page.waitForURL("http://localhost:3000/user")

	await page.context().storageState({ path: ".auth/admin.json" })
})
