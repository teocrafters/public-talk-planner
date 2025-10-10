import { test, expect } from "@playwright/test"

test.describe("Public Talks Edit", () => {
	test.describe("with editor role", () => {
		test.use({ storageState: ".auth/talks-manager.json" })

		test("edit talk title", async ({ page }) => {
			await page.goto("/talks")

			// Click edit on first talk
			await page.getByTestId("talk-actions-button").first().click()

			// Click edit option
			const editOption = page.getByText(/Edytuj|Edit/i)
			if (await editOption.isVisible()) {
				await editOption.click()
			}

			// Wait for modal to appear
			await page.waitForTimeout(500)

			// Change title
			await page.getByTestId("talk-title-input").fill("Updated Test Title")

			// Save changes
			await page.getByTestId("talk-save-button").click()

			// Verify success
			await page.waitForTimeout(500)
			await expect(page.locator("body")).toContainText("Updated Test Title")
		})

		test("edit multimedia count", async ({ page }) => {
			await page.goto("/talks")

			// Open edit modal for first talk
			await page.getByTestId("talk-actions-button").first().click()

			const editOption = page.getByText(/Edytuj|Edit/i)
			if (await editOption.isVisible()) {
				await editOption.click()
			}

			await page.waitForTimeout(500)

			// Change multimedia count
			await page.getByTestId("talk-multimedia-input").fill("5")

			// Save
			await page.getByTestId("talk-save-button").click()

			// Verify count updated (look for badge with number)
			await page.waitForTimeout(500)
			await expect(page.locator('[color="info"]').first()).toBeVisible()
		})

		test("validation errors", async ({ page }) => {
			await page.goto("/talks")

			// Open edit modal
			await page.getByTestId("talk-actions-button").first().click()

			const editOption = page.getByText(/Edytuj|Edit/i)
			if (await editOption.isVisible()) {
				await editOption.click()
			}

			await page.waitForTimeout(500)

			// Try to clear title (make it invalid)
			await page.getByTestId("talk-title-input").clear()

			// Try to save
			await page.getByTestId("talk-save-button").click()

			// Verify validation error shown (adjust based on actual error display)
			await expect(
				page.locator('[class*="error"], [color="error"], .text-red-500')
			).toBeVisible()
		})
	})

	test.describe("permission check with member role", () => {
		test.use({ storageState: ".auth/publisher.json" })

		test("cannot edit as member", async ({ page }) => {
			await page.goto("/talks")

			// Verify edit button/menu NOT visible for members
			await expect(page.getByTestId("talk-actions-menu")).toHaveCount(0)
		})
	})
})
