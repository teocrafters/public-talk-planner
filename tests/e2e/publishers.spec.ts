import { test, expect } from "../fixtures"

const PUBLISHERS_PAGE = "http://localhost:3000/publishers"

test.describe("Publishers Management - Access Control", () => {
  test("access granted for BOE coordinator", async ({ page, authenticateAs }) => {
    // Authenticate as BOE coordinator
    await authenticateAs.boeCoordinator()

    // Navigate to publishers page
    await page.goto(PUBLISHERS_PAGE)

    // Verify page displays correctly
    await expect(page.getByRole("heading", { name: "Głosiciele" })).toBeVisible()
    await expect(page.getByTestId("add-publisher-button")).toBeVisible()

    // Verify publisher cards are visible if publishers exist
    const publisherCards = page.getByTestId("publisher-card")
    const count = await publisherCards.count()
    if (count > 0) {
      await expect(publisherCards.first()).toBeVisible()
    }
  })

  test("access denied for public talk coordinator", async ({ page, authenticateAs }) => {
    // Authenticate as public talk coordinator
    await authenticateAs.publicTalkCoordinator()

    // Attempt to navigate to publishers page
    await page.goto(PUBLISHERS_PAGE)

    // Verify redirect to dashboard (access denied - middleware redirects to /, auth redirects to /user)
    await page.waitForURL("http://localhost:3000/user")
    expect(page.url()).toBe("http://localhost:3000/user")

    // Verify publishers page content is not visible
    await expect(page.getByTestId("add-publisher-button")).not.toBeVisible()
  })

  test("access denied for regular publisher", async ({ page, authenticateAs }) => {
    // Authenticate as regular publisher
    await authenticateAs.publisher()

    // Attempt to navigate to publishers page
    await page.goto(PUBLISHERS_PAGE)

    // Verify redirect to dashboard (access denied - middleware redirects to /, auth redirects to /user)
    await page.waitForURL("http://localhost:3000/user")
    expect(page.url()).toBe("http://localhost:3000/user")

    // Verify publishers page content is not visible
    await expect(page.getByTestId("add-publisher-button")).not.toBeVisible()
  })
})

test.describe("Publishers Management - CRUD Operations", () => {
  // Disable parallelization for CRUD tests to avoid race conditions
  test.describe.configure({ mode: "serial" })

  test.beforeEach(async ({ page, authenticateAs }) => {
    await authenticateAs.boeCoordinator()
    await page.goto(PUBLISHERS_PAGE)
  })

  test("add new publisher with basic capabilities", async ({ page }) => {
    // Click Add Publisher button
    await page.getByTestId("add-publisher-button").click()

    // Wait for modal to open
    await page.waitForSelector('[data-testid="publisher-form"]')

    // Verify modal title
    await expect(page.getByRole("heading", { name: "Dodaj głosiciela" })).toBeVisible()

    // Fill in publisher details
    await page.getByTestId("publisher-firstname-input").fill("TestJan")
    await page.getByTestId("publisher-lastname-input").fill("TestPublisher")

    // Check some capabilities
    await page.getByTestId("publisher-elder-checkbox").check()
    await page.getByTestId("publisher-chairman-checkbox").check()
    await page.getByTestId("publisher-reader-checkbox").check()

    // Submit form
    await page.getByTestId("publisher-save-button").click()

    // Verify success toast appears
    await expect(page.getByText("Głosiciel został dodany").first()).toBeVisible()

    // Verify modal closes
    await expect(page.getByTestId("publisher-form")).not.toBeVisible()

    // Wait for list to refresh
    await page.waitForTimeout(2000)

    // Verify publisher appears in list
    const publisherCard = page
      .getByTestId("publisher-card")
      .filter({
        hasText: "TestJan TestPublisher",
      })
      .first()
    await expect(publisherCard).toBeVisible()

    // Verify capability badges are visible
    await expect(publisherCard.getByText("Starszy")).toBeVisible()
    await expect(publisherCard.getByText("Przewoniczący w weekend")).toBeVisible()
    await expect(publisherCard.getByText("Lektor")).toBeVisible()
  })

  test("add publisher with all capabilities", async ({ page }) => {
    await page.getByTestId("add-publisher-button").click()
    await page.waitForSelector('[data-testid="publisher-form"]')

    // Fill basic info
    await page.getByTestId("publisher-firstname-input").fill("CompletePublisher")
    await page.getByTestId("publisher-lastname-input").fill("WithAllCaps")

    // Check all capability checkboxes
    await page.getByTestId("publisher-elder-checkbox").check()
    await page.getByTestId("publisher-ministerial-servant-checkbox").check()
    await page.getByTestId("publisher-circuit-overseer-checkbox").check()
    await page.getByTestId("publisher-regular-pioneer-checkbox").check()
    await page.getByTestId("publisher-chairman-checkbox").check()
    await page.getByTestId("publisher-watchtower-conductor-checkbox").check()
    await page.getByTestId("publisher-backup-watchtower-checkbox").check()
    await page.getByTestId("publisher-reader-checkbox").check()
    await page.getByTestId("publisher-prayer-checkbox").check()
    await page.getByTestId("publisher-public-talks-checkbox").check()

    // Submit
    await page.getByTestId("publisher-save-button").click()

    // Verify success
    await expect(page.getByText("Głosiciel został dodany").first()).toBeVisible()
    await expect(page.getByTestId("publisher-form")).not.toBeVisible()

    // Wait for refresh
    await page.waitForTimeout(2000)

    // Verify publisher with all badges
    const publisherCard = page
      .getByTestId("publisher-card")
      .filter({
        hasText: "CompletePublisher WithAllCaps",
      })
      .first()
    await expect(publisherCard).toBeVisible()
    await expect(publisherCard.getByText("Starszy")).toBeVisible()
    await expect(publisherCard.getByText("Sługa pomocniczy")).toBeVisible()
    await expect(publisherCard.getByText("Nadzorca obwodu")).toBeVisible()
  })

  test("edit existing publisher name and capabilities", async ({ page }) => {
    // Find first publisher card
    const firstCard = page.getByTestId("publisher-card").first()
    const originalName = await firstCard.locator("h3").first().textContent()

    // Open actions menu
    await firstCard.getByTestId("publisher-actions-menu").click()

    // Click Edit action
    await page.getByRole("menuitem", { name: /edytuj/i }).click()

    // Wait for modal
    await expect(page.getByTestId("publisher-form")).toBeVisible()

    // Verify modal title
    await expect(page.getByRole("heading", { name: "Edytuj głosiciela" })).toBeVisible()

    // Change first name
    const firstNameInput = page.getByTestId("publisher-firstname-input")
    await firstNameInput.clear()
    await firstNameInput.fill("UpdatedName")

    // Toggle some capabilities
    const elderCheckbox = page.getByTestId("publisher-elder-checkbox")
    const isChecked = await elderCheckbox.isChecked()
    if (isChecked) {
      await elderCheckbox.uncheck()
    } else {
      await elderCheckbox.check()
    }

    // Check reader capability
    await page.getByTestId("publisher-reader-checkbox").check()

    // Save changes
    await page.getByTestId("publisher-save-button").click()

    // Verify success toast
    await expect(page.getByText("Dane głosiciela zostały zaktualizowane").first()).toBeVisible()

    // Verify modal closes
    await expect(page.getByTestId("publisher-form")).not.toBeVisible({ timeout: 10000 })

    // Wait for refresh
    await page.waitForTimeout(3000)

    // Verify updated name appears
    const lastName = originalName?.split(" ")[1] || ""
    await expect(page.getByText(`UpdatedName ${lastName}`).first()).toBeVisible({ timeout: 10000 })

    // Verify reader badge is visible
    const updatedCard = page.getByTestId("publisher-card").filter({
      hasText: `UpdatedName ${lastName}`,
    })
    await expect(updatedCard.getByText("Lektor")).toBeVisible()
  })

  test("add publisher with required fields only", async ({ page }) => {
    await page.getByTestId("add-publisher-button").click()
    await page.waitForSelector('[data-testid="publisher-form"]')

    // Fill only required fields (no capabilities)
    await page.getByTestId("publisher-firstname-input").fill("MinimalPublisher")
    await page.getByTestId("publisher-lastname-input").fill("NoCapabilities")

    // Don't check any capabilities - all unchecked

    // Submit
    await page.getByTestId("publisher-save-button").click()

    // Verify success
    await expect(page.getByText("Głosiciel został dodany").first()).toBeVisible()
    await expect(page.getByTestId("publisher-form")).not.toBeVisible()

    // Wait for refresh
    await page.waitForTimeout(2000)

    // Verify publisher appears
    const publisherCard = page
      .getByTestId("publisher-card")
      .filter({
        hasText: "MinimalPublisher NoCapabilities",
      })
      .first()
    await expect(publisherCard).toBeVisible()

    // Verify no capability badges are shown
    // Should not have any capability badges (elder, reader, etc.)
    await expect(publisherCard.getByText("Starszy")).not.toBeVisible()
    await expect(publisherCard.getByText("Lektor")).not.toBeVisible()
  })
})

test.describe("Publishers Management - Form Validation", () => {
  test.beforeEach(async ({ page, authenticateAs }) => {
    await authenticateAs.boeCoordinator()
    await page.goto(PUBLISHERS_PAGE)
  })

  test("validation error - empty first name", async ({ page }) => {
    await page.getByTestId("add-publisher-button").click()
    await page.waitForSelector('[data-testid="publisher-form"]')

    // Leave first name empty
    await page.getByTestId("publisher-lastname-input").fill("TestLast")

    // Try to submit
    await page.getByTestId("publisher-save-button").click()

    // Modal should stay open (validation failed)
    const form = page.getByTestId("publisher-form")
    await expect(form).toBeVisible()

    // Publisher should not be created
    await expect(page.getByText("TestLast")).not.toBeVisible()
  })

  test("validation error - empty last name", async ({ page }) => {
    await page.getByTestId("add-publisher-button").click()
    await page.waitForSelector('[data-testid="publisher-form"]')

    // Leave last name empty
    await page.getByTestId("publisher-firstname-input").fill("TestFirst")

    // Try to submit
    await page.getByTestId("publisher-save-button").click()

    // Modal should stay open (validation failed)
    const form = page.getByTestId("publisher-form")
    await expect(form).toBeVisible()
  })

  test("cancel button closes modal without saving", async ({ page }) => {
    const initialCount = await page.getByTestId("publisher-card").count()

    await page.getByTestId("add-publisher-button").click()
    await page.waitForSelector('[data-testid="publisher-form"]')

    // Fill some data
    await page.getByTestId("publisher-firstname-input").fill("WillCancel")
    await page.getByTestId("publisher-lastname-input").fill("Publisher")
    await page.getByTestId("publisher-elder-checkbox").check()

    // Click cancel
    await page.getByTestId("publisher-cancel-button").click()

    // Verify modal closes
    await expect(page.getByRole("dialog")).not.toBeVisible()

    // Publisher count should not change
    const finalCount = await page.getByTestId("publisher-card").count()
    expect(finalCount).toBe(initialCount)

    // WillCancel Publisher should not exist
    await expect(page.getByText("WillCancel Publisher")).not.toBeVisible()
  })
})

test.describe("Publishers Management - Search and Filter", () => {
  test.beforeEach(async ({ page, authenticateAs }) => {
    await authenticateAs.boeCoordinator()
    await page.goto(PUBLISHERS_PAGE)
  })

  test("search by first name", async ({ page }) => {
    const searchInput = page.getByTestId("publisher-search-input")

    // Get initial count
    const initialCount = await page.getByTestId("publisher-card").count()

    // Search for a name
    await searchInput.fill("Test")

    // Wait for filter to apply
    await page.waitForTimeout(500)

    // Count should be less than or equal to initial
    const filteredCount = await page.getByTestId("publisher-card").count()
    expect(filteredCount).toBeLessThanOrEqual(initialCount)
  })

  test("filter by elder capability", async ({ page }) => {
    // Get initial count
    const initialCount = await page.getByTestId("publisher-card").count()

    // Check elder filter
    await page.getByTestId("filter-elder").check()

    // Wait for filter to apply
    await page.waitForTimeout(500)

    // Count should be less than or equal to initial (only elders shown)
    const filteredCount = await page.getByTestId("publisher-card").count()
    expect(filteredCount).toBeLessThanOrEqual(initialCount)

    // Verify all visible cards have elder badge
    if (filteredCount > 0) {
      const firstCard = page.getByTestId("publisher-card").first()
      await expect(firstCard.getByText("Starszy")).toBeVisible()
    }
  })

  test("combined search and filter", async ({ page }) => {
    const searchInput = page.getByTestId("publisher-search-input")

    // Apply search
    await searchInput.fill("Test")

    // Apply filter
    await page.getByTestId("filter-reader").check()

    // Wait for filters to apply
    await page.waitForTimeout(500)

    // All visible cards should match both search and filter
    const visibleCards = await page.getByTestId("publisher-card").count()
    if (visibleCards > 0) {
      const firstCard = page.getByTestId("publisher-card").first()
      const cardText = await firstCard.textContent()
      expect(cardText).toContain("Test")
      await expect(firstCard.getByText("Lektor")).toBeVisible()
    }
  })

  test("clear search shows all publishers", async ({ page }) => {
    const searchInput = page.getByTestId("publisher-search-input")

    // Get initial count
    const initialCount = await page.getByTestId("publisher-card").count()

    // Search to filter
    await searchInput.fill("TestFilter")
    await page.waitForTimeout(500)

    const filteredCount = await page.getByTestId("publisher-card").count()
    expect(filteredCount).toBeLessThanOrEqual(initialCount)

    // Clear search
    await searchInput.fill("")
    await page.waitForTimeout(500)

    // Should show all publishers again
    const finalCount = await page.getByTestId("publisher-card").count()
    expect(finalCount).toBe(initialCount)
  })

  test("no results message when no matches", async ({ page }) => {
    const searchInput = page.getByTestId("publisher-search-input")

    // Search for non-existent publisher
    await searchInput.fill("XYZNonExistentPublisher999")
    await page.waitForTimeout(500)

    // Should show no results alert
    const noResultsAlert = page.getByTestId("no-results-alert")
    await expect(noResultsAlert).toBeVisible()
    await expect(noResultsAlert).toContainText("Nie znaleziono głosicieli")
  })
})

test.describe("Publishers Management - Multiple Filters", () => {
  test.beforeEach(async ({ page, authenticateAs }) => {
    await authenticateAs.boeCoordinator()
    await page.goto(PUBLISHERS_PAGE)
  })

  test("filter by multiple capabilities (elder and chairman)", async ({ page }) => {
    // Check multiple filters
    await page.getByTestId("filter-elder").check()
    await page.getByTestId("filter-chairman").check()

    // Wait for filters to apply
    await page.waitForTimeout(500)

    // All visible cards should have both badges
    const visibleCards = await page.getByTestId("publisher-card").count()
    if (visibleCards > 0) {
      const firstCard = page.getByTestId("publisher-card").first()
      await expect(firstCard.getByText("Starszy")).toBeVisible()
      await expect(firstCard.getByText("Przewoniczący w weekend")).toBeVisible()
    }
  })

  test("filter by public talks capability", async ({ page }) => {
    // Check public talks filter
    await page.getByTestId("filter-public-talks").check()

    // Wait for filter to apply
    await page.waitForTimeout(500)

    // All visible cards should have public talks badge
    const visibleCards = await page.getByTestId("publisher-card").count()
    if (visibleCards > 0) {
      const firstCard = page.getByTestId("publisher-card").first()
      await expect(firstCard.getByText("Wykłady publiczne")).toBeVisible()
    }
  })
})
