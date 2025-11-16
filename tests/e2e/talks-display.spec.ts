import { test, expect } from "../fixtures"

test.describe("Public Talks Display", () => {
  test("display talk list", async ({ page, authenticateAs }) => {
    await authenticateAs.publicTalkCoordinator()
    await page.goto("/talks")

    // Verify talks list displayed
    await expect(page.locator("h1")).toContainText("Wykłady publiczne")

    // Verify talk cards show required information
    const firstTalk = page.getByTestId("talk-card").first()
    await expect(firstTalk).toBeVisible()

    // Verify talk card contains number and title
    await expect(firstTalk.locator('[class*="text-sm"]')).toBeVisible()
    await expect(firstTalk.locator('[class*="text-lg"]')).toBeVisible()
  })

  test("search functionality", async ({ page, authenticateAs }) => {
    await authenticateAs.publicTalkCoordinator()
    await page.goto("/talks")

    // Get initial number of talks
    const initialTalks = await page.getByTestId("talk-card").count()

    // Enter search term
    const searchInput = page.getByTestId("search-input")
    await searchInput.fill("test search query")

    // Wait for filtering
    await page.waitForTimeout(500)

    // Verify results changed (either fewer or message shown)
    const afterSearchTalks = await page.getByTestId("talk-card").count()
    const noResultsAlert = page.getByTestId("no-results-alert")

    // Either we have fewer talks or a "no results" message
    expect(afterSearchTalks < initialTalks || (await noResultsAlert.isVisible())).toBeTruthy()

    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(500)

    // Verify all talks shown again
    const finalTalks = await page.getByTestId("talk-card").count()
    expect(finalTalks).toBe(initialTalks)
  })

  test("sort ascending", async ({ page, authenticateAs }) => {
    await authenticateAs.publicTalkCoordinator()
    await page.goto("/talks")

    // Select sort option for ascending
    const sortSelect = page.getByTestId("sort-select")
    await sortSelect.click()

    // Find and click ascending option
    const ascendingOption = page.getByRole("option", { name: /rosnąco|ascending/i })
    await ascendingOption.click()

    await page.waitForTimeout(500)

    // Verify talks are displayed (basic check)
    await expect(page.getByTestId("talk-card").first()).toBeVisible()
  })

  test("sort descending", async ({ page, authenticateAs }) => {
    await authenticateAs.publicTalkCoordinator()
    await page.goto("/talks")

    // Select sort option for descending
    const sortSelect = page.getByTestId("sort-select")
    await sortSelect.click()

    // Find and click descending option
    const descendingOption = page.getByRole("option", { name: /malejąco|descending/i })
    await descendingOption.click()

    await page.waitForTimeout(500)

    // Verify talks are displayed
    await expect(page.getByTestId("talk-card").first()).toBeVisible()
  })
})
