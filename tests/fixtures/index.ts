// AGENT-NOTE: ALWAYS import test and expect from THIS file (tests/fixtures/index.ts), NEVER from @playwright/test
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

    // Override goto to add hydration waiting with error handling
    page.goto = async (url, options) => {
      try {
        // Call original goto
        const response = await originalGoto(url, options)

        // Wait for Nuxt hydration to complete with timeout
        try {
          await page.waitForFunction(
            () => window.useNuxtApp?.().isHydrating === false,
            { timeout: 10000 }
          )
        } catch (hydrationError) {
          // If hydration wait times out, log but don't fail the test
          console.log("Hydration check timed out, continuing anyway", hydrationError)
        }

        return response
      } catch (error) {
        // If the original goto fails due to navigation interruption,
        // re-throw with more context
        if (error.message.includes("interrupted by another navigation")) {
          console.log(`Navigation to ${url} was interrupted, retrying...`)
          // Wait a moment and retry once
          await page.waitForTimeout(500)
          return await originalGoto(url, options)
        }
        throw error
      }
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
