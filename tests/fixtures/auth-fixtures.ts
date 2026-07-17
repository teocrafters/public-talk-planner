import type { Page } from "@playwright/test"
import { expect } from "@playwright/test"
import testAccounts from "./test-accounts.json" with { type: "json" }

type Role = "admin" | "publisher" | "public_talk_coordinator" | "boe_coordinator"

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

  const emailInput = page.getByTestId("auth-email-input")
  const passwordInput = page.getByTestId("auth-password-input")
  const submitButton = page.getByTestId("auth-submit-button")

  await emailInput.waitFor({ state: "visible" })

  // Retry filling until the hydrated form accepts the values and enables submit.
  // Guards against interacting before Vue hydration completes, which otherwise
  // resets the inputs and leaves the submit button permanently disabled.
  await expect(async () => {
    await emailInput.fill(user.email)
    await passwordInput.fill(user.password)
    await expect(submitButton).toBeEnabled({ timeout: 1000 })
  }).toPass({ timeout: 15000 })

  await submitButton.click()

  await page.waitForURL("http://localhost:3000/")
}
