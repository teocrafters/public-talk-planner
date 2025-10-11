import { test, expect } from "../fixtures"

test.describe("Public Talks Status Management", () => {
	test.describe("with editor role", () => {
		test.use({ storageState: ".auth/talks-manager.json" })

		test("block for circuit overseer", async ({ page }) => {
			await page.goto("/talks")

			// Open actions menu for first talk
			const actionsButton = page.getByTestId("talk-actions-button").first()
			await actionsButton.click()

			// Wait for menu to be visible and select block option
			await page.getByRole("menu").waitFor({ state: "visible" })
			await page.getByRole("menuitem", { name: "Zablokuj pod nadzorców obwodu" }).click()

			// Confirm in dialog - wait for dialog to appear
			await page.getByRole("dialog").waitFor({ state: "visible" })
			await page.getByTestId("confirm-button").click()

			// Verify status badge appears (warning color)
			await expect(page.getByTestId("talk-status-badge").first()).toBeVisible()
		})

		test("unblock talk", async ({ page }) => {
			await page.goto("/talks")

			// First block a talk
			const firstTalkMenu = page.getByTestId("talk-actions-button").first()
			await firstTalkMenu.click()

			// Wait for menu and select block option
			await page.getByRole("menu").waitFor({ state: "visible" })
			await page.getByRole("menuitem", { name: "Zablokuj pod nadzorców obwodu" }).click()

			await page.getByRole("dialog").waitFor({ state: "visible" })
			await page.getByTestId("confirm-button").click()

			// Wait for status to be updated
			await expect(page.getByTestId("talk-status-badge").first()).toBeVisible()

			// Now unblock it
			await firstTalkMenu.click()
			await page.getByRole("menu").waitFor({ state: "visible" })
			await page.getByRole("menuitem", { name: "Usuń status" }).click()

			// Confirm
			await page.getByRole("dialog").waitFor({ state: "visible" })
			await page.getByTestId("confirm-button").click()

			// Verify badge removed - check that it's not visible anymore
			await expect(page.getByTestId("talk-status-badge").first()).not.toBeVisible()
		})

		test("mark for replacement", async ({ page }) => {
			await page.goto("/talks")

			// Open actions menu
			const actionsButton = page.getByTestId("talk-actions-button").first()
			await actionsButton.click()

			// Wait for menu and select mark for replacement option
			await page.getByRole("menu").waitFor({ state: "visible" })
			await page.getByRole("menuitem", { name: "Oznacz do wymiany" }).click()

			// Confirm
			await page.getByRole("dialog").waitFor({ state: "visible" })
			await page.getByTestId("confirm-button").click()

			// Verify status badge appears (info color)
			await expect(page.getByTestId("talk-status-badge").first()).toBeVisible()
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
