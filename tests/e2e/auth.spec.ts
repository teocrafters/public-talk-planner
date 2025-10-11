import { test, expect } from "../fixtures"

test.describe("Authentication", () => {
	test("login flow", async ({ page }) => {
		await page.goto("/login")

		// Fill login form
		await page.getByTestId("auth-email-input").fill("admin@test.local")
		await page.getByTestId("auth-password-input").fill("TestAdmin123!")

		// Submit form
		await page.getByTestId("auth-submit-button").click()

		// Verify redirect to homepage
		await page.waitForURL("/")

		// Verify user session active (should see authenticated content)
		await expect(page.locator("body")).toContainText("Wykłady publiczne")
	})

	test("error handling - invalid credentials", async ({ page }) => {
		await page.goto("/login")

		await page.getByTestId("auth-email-input").fill("invalid@test.local")
		await page.getByTestId("auth-password-input").fill("WrongPassword123!")

		await page.getByTestId("auth-submit-button").click()

		// Verify error message displayed
		await expect(page.getByTestId("auth-error-message")).toBeVisible()
  })

  test.describe("Logout flow", () => {
		test.use({ storageState: ".auth/admin.json" })

		test("logout with admin", async ({ page }) => {
			await page.goto("/user")

			// Click logout button
			await page.getByTestId("logout-button").click()

			// Verify redirect to login page
			await expect(page).toHaveURL("/")
    })

    test.afterEach(async ({ authenticateAs }) => {
      // log in again, get new token and save it
      await authenticateAs.admin()
    })
	})
})
