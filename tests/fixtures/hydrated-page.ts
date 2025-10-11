import { test as base } from "@playwright/test"

/**
 * Extended test fixture that overrides page.goto() to automatically wait
 * for Nuxt hydration to complete before proceeding with test steps.
 *
 * This prevents race conditions where tests interact with non-hydrated views.
 */
export const test = base.extend({
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
})

export { expect } from "@playwright/test"
