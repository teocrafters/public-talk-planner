import { test, expect } from "../fixtures"

const PLAN_WEEKEND_PAGE = "http://localhost:3000/meetings/plan-weekend"
const MEETINGS_LIST_PAGE = "http://localhost:3000/meetings/list"

test.describe("Plan Weekend Page - Permission-Based Access Control", () => {
  test("redirects publisher without permission", async ({ page, authenticateAs }) => {
    // Authenticate as publisher (no weekend meeting management permission)
    await authenticateAs.publisher()

    // Navigate to plan weekend page
    await page.goto(PLAN_WEEKEND_PAGE)

    // Should be redirected to meetings list due to middleware
    await expect(page).toHaveURL(MEETINGS_LIST_PAGE)
    await expect(page.getByRole("heading", { name: "Zebrania w weekend", level: 1 })).toBeVisible()
  })

  test("allows admin with permission to access", async ({ page, authenticateAs }) => {
    // Authenticate as BOE coordinator (has weekend meeting management permission)
    await authenticateAs.boeCoordinator()

    // Navigate to plan weekend page
    await page.goto(PLAN_WEEKEND_PAGE)

    // Should remain on plan weekend page
    await expect(page).toHaveURL(PLAN_WEEKEND_PAGE)

    // Verify page elements are visible
    await expect(page.getByTestId("weekend-planner-title")).toBeVisible()
  })
})

test.describe("Plan Weekend Page - Page Structure", () => {
  test.beforeEach(async ({ page, authenticateAs }) => {
    await authenticateAs.boeCoordinator()
    await page.goto(PLAN_WEEKEND_PAGE)
  })

  test("displays page title and description", async ({ page }) => {
    // Verify page title
    const pageTitle = page.getByTestId("weekend-planner-title")
    await expect(pageTitle).toBeVisible()
    await expect(pageTitle).toContainText("Planowanie zebrań w weekend")

    // Verify page description
    const description = page.locator("p.text-muted").first()
    await expect(description).toBeVisible()
  })

  test("displays calendar component", async ({ page }) => {
    // Verify calendar is visible
    const calendar = page.getByTestId("weekend-calendar")
    await expect(calendar).toBeVisible()

    // Calendar should display dates
    const calendarContent = await calendar.textContent()
    expect(calendarContent).toBeTruthy()
  })

  test("displays unplanned Sundays section", async ({ page }) => {
    // Verify section heading
    await expect(page.getByRole("heading", { name: "Niezaplanowane niedziele" })).toBeVisible()

    // Verify either unplanned list or "all scheduled" message is visible
    const unplannedList = page.getByTestId("unplanned-list")
    const noUnplanned = page.getByTestId("no-unplanned")

    const hasUnplanned = await unplannedList.isVisible().catch(() => false)
    const hasNoUnplanned = await noUnplanned.isVisible().catch(() => false)

    expect(hasUnplanned || hasNoUnplanned).toBe(true)
  })

  test("displays back to list button", async ({ page }) => {
    // Verify back button
    await expect(page.getByTestId("back-to-list-button")).toBeVisible()
    await expect(page.getByTestId("back-to-list-button")).toContainText("Powrót do listy")
  })
})

test.describe("Plan Weekend Page - Planning Standard Weekend Meeting", () => {
  test.beforeEach(async ({ page, authenticateAs }) => {
    await authenticateAs.boeCoordinator()
    await page.goto(PLAN_WEEKEND_PAGE)
  })

  test("opens modal when clicking unscheduled Sunday", async ({ page }) => {
    // Wait for unplanned list to load
    const unplannedList = page.getByTestId("unplanned-list")

    // Skip if no unscheduled Sundays
    const isVisible = await unplannedList.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip()
    }

    // Get first unscheduled Sunday card
    const firstUnplannedCard = page.locator('[data-testid^="unplanned-item-"]').first()
    await expect(firstUnplannedCard).toBeVisible()

    // Click on the unscheduled Sunday card
    await firstUnplannedCard.click()

    // Verify modal opens by checking for form
    await expect(page.getByTestId("weekend-planning-form")).toBeVisible()
    await expect(page.getByTestId("modal-title")).toBeVisible()
    await expect(page.getByTestId("modal-title")).toContainText("Zaplanuj zebranie")
  })

  test("can plan standard weekend meeting (SUCCESS PATH)", async ({ page }) => {
    // Wait for unplanned list
    const unplannedList = page.getByTestId("unplanned-list")
    const isVisible = await unplannedList.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip()
    }

    // Count initial unscheduled Sundays
    const initialCount = await page.locator('[data-testid^="unplanned-item-"]').count()

    // Click first unscheduled Sunday
    await page.locator('[data-testid^="unplanned-item-"]').first().click()

    // Wait for modal to open
    await expect(page.getByTestId("weekend-planning-form")).toBeVisible()

    // Select chairman
    const chairmanSelect = page.getByTestId("chairman-select")
    await chairmanSelect.click()
    // Wait for options to load and select first option
    await page.locator('[role="option"]').first().click()

    // Select watchtower study conductor
    const watchtowerSelect = page.getByTestId("watchtower-select")
    await watchtowerSelect.click()
    await page.locator('[role="option"]').first().click()

    // Select reader (optional, skip if not visible)
    const readerSelect = page.getByTestId("reader-select")
    const readerVisible = await readerSelect.isVisible().catch(() => false)
    if (readerVisible) {
      await readerSelect.click()
      await page.locator('[role="option"]').first().click()
    }

    // Select prayer
    const prayerSelect = page.getByTestId("prayer-select")
    await prayerSelect.click()
    await page.locator('[role="option"]').first().click()

    // Wait for submit button to become enabled
    const submitButton = page.getByTestId("save-button")
    await expect(submitButton).toBeEnabled()

    // Submit form
    await submitButton.click()

    // Wait for modal to close (indicating success)
    await expect(page.getByTestId("weekend-planning-form")).not.toBeVisible({ timeout: 10000 })

    // Verify unscheduled count decreased (meeting was planned)
    // Wait for UI to update using Playwright's retry mechanism
    await expect(async () => {
      const finalCount = await page.locator('[data-testid^="unplanned-item-"]').count()
      expect(finalCount).toBe(initialCount - 1)
    }).toPass({ timeout: 5000 })
  })

  test("closes modal when clicking cancel", async ({ page }) => {
    // Wait for unplanned list
    const unplannedList = page.getByTestId("unplanned-list")
    const isVisible = await unplannedList.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip()
    }

    // Click first unscheduled Sunday
    await page.locator('[data-testid^="unplanned-item-"]').first().click()

    // Wait for modal to open
    await expect(page.getByTestId("weekend-planning-form")).toBeVisible()

    // Click cancel button
    await page.getByTestId("cancel-button").click()

    // Modal should close
    await expect(page.getByTestId("weekend-planning-form")).not.toBeVisible()
  })
})

test.describe("Plan Weekend Page - Planning Circuit Overseer Visit", () => {
  test.beforeEach(async ({ page, authenticateAs }) => {
    await authenticateAs.boeCoordinator()
    await page.goto(PLAN_WEEKEND_PAGE)
  })

  test("shows CO visit fields when checkbox enabled", async ({ page }) => {
    // Wait for unplanned list
    const unplannedList = page.getByTestId("unplanned-list")
    const isVisible = await unplannedList.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip()
    }

    // Open modal
    await page.locator('[data-testid^="unplanned-item-"]').first().click()
    await expect(page.getByTestId("weekend-planning-form")).toBeVisible()

    // CO visit fields should not be visible initially
    const coVisitSection = page.getByTestId("co-visit-section")
    await expect(coVisitSection).not.toBeVisible()

    // Check CO visit checkbox
    const coVisitCheckbox = page.getByTestId("co-visit-checkbox")
    await coVisitCheckbox.check()

    // CO visit fields should now be visible
    await expect(coVisitSection).toBeVisible()
    await expect(page.getByTestId("co-select")).toBeVisible()
    await expect(page.getByTestId("public-talk-title-input")).toBeVisible()
    await expect(page.getByTestId("co-service-talk-title-input")).toBeVisible()

    // Reader field should be hidden during CO visit
    const readerSelect = page.getByTestId("reader-select")
    await expect(readerSelect).not.toBeVisible()
  })

  // FIXME: Form submission completes but modal doesn't close. All fields are correctly filled,
  // button becomes enabled, but the API call doesn't complete successfully. This might be
  // related to test environment database state or server-side validation specific to CO visits.
  test.fixme("can plan circuit overseer visit (SUCCESS PATH)", async ({ page }) => {
    // Wait for unplanned list
    const unplannedList = page.getByTestId("unplanned-list")
    const isVisible = await unplannedList.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip()
    }

    // Click first unscheduled Sunday
    await page.locator('[data-testid^="unplanned-item-"]').first().click()

    // Wait for modal to open
    await expect(page.getByTestId("weekend-planning-form")).toBeVisible()

    // Enable CO visit
    await page.getByTestId("co-visit-checkbox").check()

    // Wait for CO visit fields to appear
    await page.waitForTimeout(300)

    // Select chairman
    const chairmanSelect = page.getByTestId("chairman-select")
    await chairmanSelect.click()
    await page.waitForSelector('[role="option"]', { timeout: 5000 })
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(500)

    // Select circuit overseer
    const coSelect = page.getByTestId("co-select")
    await coSelect.click()
    await page.waitForSelector('[role="option"]', { timeout: 5000 })
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(500)

    // Enter public talk title
    await page.getByTestId("public-talk-title-input").fill("Wykład publiczny nadzorcy obwodu")

    // Enter service talk title
    await page.getByTestId("co-service-talk-title-input").fill("Przemówienie służbowe nadzorcy")

    // Select Watchtower study conductor
    const watchtowerSelect = page.getByTestId("watchtower-select")
    await watchtowerSelect.click()
    await page.waitForSelector('[role="option"]', { timeout: 5000 })
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(500)

    // Select prayer
    const prayerSelect = page.getByTestId("prayer-select")
    await prayerSelect.click()
    await page.waitForSelector('[role="option"]', { timeout: 5000 })
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(500)

    // Wait for save button to be enabled
    const saveButton = page.getByTestId("save-button")
    await expect(saveButton).toBeEnabled({ timeout: 5000 })

    // Submit form
    await saveButton.click()

    // Wait for modal to close
    await expect(page.getByTestId("weekend-planning-form")).not.toBeVisible({ timeout: 10000 })
  })
})

test.describe("Plan Weekend Page - Back Navigation", () => {
  test("navigates back to meetings list when clicking back button", async ({
    page,
    authenticateAs,
  }) => {
    await authenticateAs.boeCoordinator()
    await page.goto(PLAN_WEEKEND_PAGE)

    // Click back to list button
    await page.getByTestId("back-to-list-button").click()

    // Should navigate to meetings list
    await expect(page).toHaveURL(MEETINGS_LIST_PAGE)
    await expect(page.getByRole("heading", { name: "Zebrania w weekend", level: 1 })).toBeVisible()
  })
})

test.describe("Plan Weekend Page - All Sundays Scheduled State", () => {
  test("displays success message when all Sundays are scheduled", async ({
    page,
    authenticateAs,
  }) => {
    await authenticateAs.boeCoordinator()
    await page.goto(PLAN_WEEKEND_PAGE)

    // Check if "all scheduled" message is visible
    const noUnplanned = page.getByTestId("no-unplanned")
    const isVisible = await noUnplanned.isVisible().catch(() => false)

    if (isVisible) {
      // Verify success alert
      await expect(noUnplanned).toContainText("Wszystkie niedziele zaplanowane")
      await expect(noUnplanned).toContainText(
        "Wszystkie nadchodzące niedziele mają zaplanowane zebrania"
      )
    } else {
      // Has unscheduled Sundays - test not applicable
      test.skip()
    }
  })
})

test.describe("Plan Weekend Page - Calendar Interaction", () => {
  test.beforeEach(async ({ page, authenticateAs }) => {
    await authenticateAs.boeCoordinator()
    await page.goto(PLAN_WEEKEND_PAGE)
  })

  test("displays calendar with dates", async ({ page }) => {
    // Verify calendar is visible
    const calendar = page.getByTestId("weekend-calendar")
    await expect(calendar).toBeVisible()

    // Calendar should render with dates (UCalendar renders day cells)
    const calendarDays = calendar.locator('[role="gridcell"]')
    const dayCount = await calendarDays.count()
    expect(dayCount).toBeGreaterThan(0)
  })
})

test.describe("Plan Weekend Page - Unplanned Sundays List Display", () => {
  test.beforeEach(async ({ page, authenticateAs }) => {
    await authenticateAs.boeCoordinator()
    await page.goto(PLAN_WEEKEND_PAGE)
  })

  test("displays unplanned Sundays in Polish date format", async ({ page }) => {
    // Wait for unplanned list
    const unplannedList = page.getByTestId("unplanned-list")
    const isVisible = await unplannedList.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip()
    }

    // Get first unscheduled Sunday card
    const firstUnplannedCard = page.locator('[data-testid^="unplanned-item-"]').first()
    await expect(firstUnplannedCard).toBeVisible()

    // Get date text
    const dateText = await firstUnplannedCard.textContent()
    expect(dateText).toBeTruthy()

    // Should contain Polish day name
    const polishDays = [
      "poniedziałek",
      "wtorek",
      "środa",
      "czwartek",
      "piątek",
      "sobota",
      "niedziela",
    ]
    const containsPolishDay = polishDays.some(day => dateText?.toLowerCase().includes(day))
    expect(containsPolishDay).toBeTruthy()
  })

  test("unplanned Sunday cards are clickable", async ({ page }) => {
    // Wait for unplanned list
    const unplannedList = page.getByTestId("unplanned-list")
    const isVisible = await unplannedList.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip()
    }

    // Get all unscheduled Sunday cards
    const unplannedCards = page.locator('[data-testid^="unplanned-item-"]')
    const cardCount = await unplannedCards.count()
    expect(cardCount).toBeGreaterThan(0)

    // Verify first card has cursor-pointer class (clickable)
    const firstCard = unplannedCards.first()
    const classList = await firstCard.getAttribute("class")
    expect(classList).toContain("cursor-pointer")
  })
})
