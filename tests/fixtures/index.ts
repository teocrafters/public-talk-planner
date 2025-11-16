import { test as base } from "@playwright/test"
import { authenticateAs } from "./auth-fixtures"

export const test = base.extend({
  /**
   * Extended test fixture that overrides page.goto() to automatically wait
   * for Nuxt hydration to complete before proceeding with test steps.
   *
   * This prevents race conditions where tests interact with non-hydrated views.
   */
  page: async ({ page }, use) => {
    // Store original goto function
    const originalGoto = page.goto.bind(page)

    // Override goto to add hydration waiting
    page.goto = async (url, options) => {
      // Call original goto
      const response = await originalGoto(url, options)

      // Wait for Nuxt hydration to complete
      await page.waitForFunction(() => window.useNuxtApp?.().isHydrating === false)

      return response
    }

    // Provide the enhanced page to tests
    await use(page)
  },

  /**
   * Test fixture that provides a page authenticated as different roles.
   */
  authenticateAs: async ({ page }, use) => {
    await use({
      admin: async () => {
        await authenticateAs(page, "admin")
        await page.context().storageState({ path: ".auth/admin.json" })
      },
      publisher: async () => {
        await authenticateAs(page, "publisher")
        await page.context().storageState({ path: ".auth/publisher.json" })
      },
      publicTalkCoordinator: async () => {
        await authenticateAs(page, "public_talk_coordinator")
        await page.context().storageState({ path: ".auth/public-talk-coordinator.json" })
      },
      boeCoordinator: async () => {
        await authenticateAs(page, "boe_coordinator")
        await page.context().storageState({ path: ".auth/boe-coordinator.json" })
      },
    })
  },
})

export { expect } from "@playwright/test"
