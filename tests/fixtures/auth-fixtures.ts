import type { Page } from "@playwright/test"
import { expect } from "@playwright/test"
import testAccounts from "./test-accounts.json" with { type: "json" }

type Role = "admin" | "member" | "editor" | "speakers_manager"

/**
 * Authenticates user with specified role and returns the page.
 * Handles login flow including waiting for hydration and redirect.
 */
export async function authenticateAs(page: Page, role: Role): Promise<void> {
	const user = testAccounts.users.find(u => u.role === role)
	if (!user) {
		throw new Error(`User with role "${role}" not found in test accounts`)
	}

	await page.goto("http://localhost:3000/login")
	await page.waitForTimeout(5000)

	await page.getByTestId("auth-email-input").fill(user.email)
	await page.getByTestId("auth-password-input").fill(user.password)

	const submitButton = page.getByTestId("auth-submit-button")
	await submitButton.waitFor({ state: "visible" })
	await expect(submitButton).toBeEnabled()
	await submitButton.click()
	await page.waitForTimeout(2000)

	await page.waitForURL("http://localhost:3000/user")
}
