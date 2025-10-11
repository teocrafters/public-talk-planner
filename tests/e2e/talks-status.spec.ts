import { test, expect } from "../fixtures"
import type { Locator } from "@playwright/test"

test.describe("Public Talks Status Management", () => {
  test.describe("with editor role", () => {
    test.use({ storageState: ".auth/talks-manager.json" })

    test("block for circuit overseer", async ({ page }) => {
      await page.goto("/talks")

      // Find a talk without existing status to avoid conflicts
      const talkCards = page.getByTestId("talk-card")
      await talkCards.first().waitFor({ state: "visible" })

      // Get the first talk that doesn't have a status badge
      let targetTalk: Locator | null = null
      const cardCount = await talkCards.count()

      for (let i = 0; i < Math.min(cardCount, 5); i++) {
        const card = talkCards.nth(i)
        const statusBadge = card.getByTestId("talk-status-badge")
        const badgeCount = await statusBadge.count()

        if (badgeCount === 0) {
          targetTalk = card
          break
        }
      }

      // Fallback to first card if all have badges
      if (!targetTalk) {
        targetTalk = talkCards.first()
      }

      // Open actions menu for the selected talk
      const actionsButton = targetTalk.getByTestId("talk-actions-button")
      await actionsButton.waitFor({ state: "visible" })
      await actionsButton.click()

      // Wait for menu to be visible and menu items to be ready
      const menu = page.getByRole("menu")
      await menu.waitFor({ state: "visible" })
      const blockMenuItem = page.getByRole("menuitem", { name: "Zablokuj pod nadzorców obwodu" })
      await blockMenuItem.waitFor({ state: "visible" })
      await blockMenuItem.click()

      // Confirm in dialog - wait for dialog to appear and confirm button to be ready
      const dialog = page.getByRole("dialog")
      await dialog.waitFor({ state: "visible" })
      const confirmButton = page.getByTestId("confirm-button")
      await confirmButton.waitFor({ state: "visible" })
      await confirmButton.click()

      // Wait for dialog to close and status badge to appear
      await dialog.waitFor({ state: "hidden" })
      const statusBadge = targetTalk.getByTestId("talk-status-badge")
      await statusBadge.waitFor({ state: "visible" })
      await expect(statusBadge).toBeVisible()
    })

    test("unblock talk", async ({ page }) => {
      await page.goto("/talks")

      // Find a talk without existing status to avoid conflicts
      const talkCards = page.getByTestId("talk-card")
      await talkCards.first().waitFor({ state: "visible" })

      // Get the first talk that doesn't have a status badge
      let targetTalk: Locator | null = null
      const cardCount = await talkCards.count()

      for (let i = 0; i < Math.min(cardCount, 5); i++) {
        const card = talkCards.nth(i)
        const statusBadge = card.getByTestId("talk-status-badge")
        const badgeCount = await statusBadge.count()

        if (badgeCount === 0) {
          targetTalk = card
          break
        }
      }

      // Fallback to first card if all have badges
      if (!targetTalk) {
        targetTalk = talkCards.first()
      }

      // First block the talk
      const actionsButton = targetTalk.getByTestId("talk-actions-button")
      await actionsButton.waitFor({ state: "visible" })
      await actionsButton.click()

      // Wait for menu and select block option
      const menu = page.getByRole("menu")
      await menu.waitFor({ state: "visible" })
      const blockMenuItem = page.getByRole("menuitem", { name: "Zablokuj pod nadzorców obwodu" })
      await blockMenuItem.waitFor({ state: "visible" })
      await blockMenuItem.click()

      const dialog = page.getByRole("dialog")
      await dialog.waitFor({ state: "visible" })
      const confirmButton = page.getByTestId("confirm-button")
      await confirmButton.waitFor({ state: "visible" })
      await confirmButton.click()

      // Wait for dialog to close and status to be updated
      await dialog.waitFor({ state: "hidden" })
      const statusBadge = targetTalk.getByTestId("talk-status-badge")
      await statusBadge.waitFor({ state: "visible" })
      await expect(statusBadge).toBeVisible()

      // Now unblock it - wait a moment for the menu to be ready
      await page.waitForTimeout(500)
      await actionsButton.click()
      await menu.waitFor({ state: "visible" })
      const clearMenuItem = page.getByRole("menuitem", { name: "Usuń status" })
      await clearMenuItem.waitFor({ state: "visible" })
      await clearMenuItem.click()

      // Confirm
      await dialog.waitFor({ state: "visible" })
      await confirmButton.waitFor({ state: "visible" })
      await confirmButton.click()

      // Wait for dialog to close and verify badge is removed
      await dialog.waitFor({ state: "hidden" })
      await page.waitForTimeout(500) // Allow time for UI to update
      await expect(statusBadge).not.toBeVisible()
    })

    test("mark for replacement", async ({ page }) => {
      await page.goto("/talks")

      // Find a talk without existing status to avoid conflicts
      const talkCards = page.getByTestId("talk-card")
      await talkCards.first().waitFor({ state: "visible" })

      // Get the first talk that doesn't have a status badge
      let targetTalk: Locator | null = null
      const cardCount = await talkCards.count()

      for (let i = 0; i < Math.min(cardCount, 5); i++) {
        const card = talkCards.nth(i)
        const statusBadge = card.getByTestId("talk-status-badge")
        const badgeCount = await statusBadge.count()

        if (badgeCount === 0) {
          targetTalk = card
          break
        }
      }

      // Fallback to first card if all have badges
      if (!targetTalk) {
        targetTalk = talkCards.first()
      }

      // Open actions menu
      const actionsButton = targetTalk.getByTestId("talk-actions-button")
      await actionsButton.waitFor({ state: "visible" })
      await actionsButton.click()

      // Wait for menu and select mark for replacement option
      const menu = page.getByRole("menu")
      await menu.waitFor({ state: "visible" })
      const replaceMenuItem = page.getByRole("menuitem", { name: "Oznacz do wymiany" })
      await replaceMenuItem.waitFor({ state: "visible" })
      await replaceMenuItem.click()

      // Confirm
      const dialog = page.getByRole("dialog")
      await dialog.waitFor({ state: "visible" })
      const confirmButton = page.getByTestId("confirm-button")
      await confirmButton.waitFor({ state: "visible" })
      await confirmButton.click()

      // Wait for dialog to close and status badge to appear
      await dialog.waitFor({ state: "hidden" })
      const statusBadge = targetTalk.getByTestId("talk-status-badge")
      await statusBadge.waitFor({ state: "visible" })
      await expect(statusBadge).toBeVisible()
    })
  })

  test.describe("permission check with member role", () => {
    test.use({ storageState: ".auth/publisher.json" })

    test("cannot manage status as member", async ({ page }) => {
      await page.goto("/talks")

      // Wait for page to load completely
      await page.waitForLoadState("networkidle")

      // Verify actions menu NOT visible - check for the container, not just the button
      const actionsMenus = page.getByTestId("talk-actions-menu")
      await expect(actionsMenus).toHaveCount(0)

      // Also verify that no action buttons are visible
      const actionButtons = page.getByTestId("talk-actions-button")
      await expect(actionButtons).toHaveCount(0)
    })
  })
})
