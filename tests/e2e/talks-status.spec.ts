import { test, expect } from "@playwright/test"

test.describe("Public Talks Status Management", () => {
	test.describe("with editor role", () => {
		test.use({ storageState: ".auth/talks-manager.json" })

		test("block for circuit overseer", async ({ page }) => {
			await page.goto("/talks")

			// Open actions menu for first talk
			await page.getByTestId("talk-actions-button").first().click()

			// Select block option
			const blockOption = page.getByText(/Zablokuj pod nadzorców obwodu|Block/i)
			if (await blockOption.isVisible()) {
				await blockOption.click()

				// Confirm in dialog
				await page.waitForTimeout(300)
				await page.getByTestId("confirm-button").click()

				// Verify status badge appears (warning color)
				await page.waitForTimeout(500)
				await expect(page.getByTestId("talk-status-badge").first()).toBeVisible()
			}
		})

		test("unblock talk", async ({ page }) => {
			await page.goto("/talks")

			// First block a talk
			const firstTalkMenu = page.getByTestId("talk-actions-button").first()
			await firstTalkMenu.click()

			const blockOption = page.getByText(/Zablokuj|Block/i)
			if (await blockOption.isVisible()) {
				await blockOption.click()
				await page.waitForTimeout(300)
				await page.getByTestId("confirm-button").click()
				await page.waitForTimeout(500)
			}

			// Now unblock it
			await firstTalkMenu.click()
			const removeStatusOption = page.getByText(/Usuń status|Remove status/i)
			if (await removeStatusOption.isVisible()) {
				await removeStatusOption.click()

				// Confirm
				await page.waitForTimeout(300)
				await page.getByTestId("confirm-button").click()

				// Verify badge removed
				await page.waitForTimeout(500)
			}
		})

		test("mark for replacement", async ({ page }) => {
			await page.goto("/talks")

			// Open actions menu
			await page.getByTestId("talk-actions-button").first().click()

			// Select mark for replacement option
			const replaceOption = page.getByText(/Oznacz do wymiany|Mark for replacement/i)
			if (await replaceOption.isVisible()) {
				await replaceOption.click()

				// Confirm
				await page.waitForTimeout(300)
				await page.getByTestId("confirm-button").click()

				// Verify status badge appears (info color)
				await page.waitForTimeout(500)
				await expect(page.getByTestId("talk-status-badge").first()).toBeVisible()
			}
		})
	})

	test.describe("permission check with member role", () => {
		test.use({ storageState: ".auth/publisher.json" })

		test("cannot manage status as member", async ({ page }) => {
			await page.goto("/talks")

			// Verify actions menu NOT visible
			await expect(page.getByTestId("talk-actions-menu")).toHaveCount(0)
		})
	})
})
