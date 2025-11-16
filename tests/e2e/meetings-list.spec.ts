import { test, expect } from "../fixtures"

const MEETINGS_LIST_PAGE = "http://localhost:3000/meetings/list"

test.describe("Meetings List - Publisher Viewing", () => {
  test.use({ storageState: ".auth/publisher.json" })

  test.beforeEach(async ({ page }) => {
    await page.goto(MEETINGS_LIST_PAGE)
  })

  test("displays page title and meetings list", async ({ page }) => {
    // Verify page title is visible
    const pageTitle = page.getByTestId("meetings-title")
    await expect(pageTitle).toBeVisible()
    await expect(pageTitle).toContainText("Zebrania w weekend")

    // Verify meetings list is displayed
    const meetingsList = page.getByTestId("meetings-list")
    await expect(meetingsList).toBeVisible()
  })

  test("displays at least one meeting card with all details", async ({ page }) => {
    // Wait for meetings to load
    await page.waitForSelector('[data-testid="meetings-list"]')

    // Get all meeting cards
    const meetingCards = page.locator('[data-testid^="meeting-card-"]')
    const cardCount = await meetingCards.count()
    expect(cardCount).toBeGreaterThan(0)

    // Check first meeting card has all required elements
    const firstCard = meetingCards.first()

    // Verify date is visible
    const meetingDate = firstCard.getByTestId("meeting-date")
    await expect(meetingDate).toBeVisible()
    const dateText = await meetingDate.textContent()
    expect(dateText).toBeTruthy()

    // Verify speaker name is visible
    const meetingSpeaker = firstCard.getByTestId("meeting-speaker")
    await expect(meetingSpeaker).toBeVisible()
    const speakerText = await meetingSpeaker.textContent()
    expect(speakerText).toBeTruthy()

    // Verify talk information is visible
    const meetingTalk = firstCard.getByTestId("meeting-talk")
    await expect(meetingTalk).toBeVisible()
    const talkText = await meetingTalk.textContent()
    expect(talkText).toBeTruthy()
  })

  test("manage button is NOT visible for publisher", async ({ page }) => {
    // Verify manage button does not exist in DOM
    const manageButton = page.getByTestId("manage-button")
    await expect(manageButton).not.toBeVisible()
  })

  test("displays meetings grouped by month headers", async ({ page }) => {
    // Wait for meetings list to load
    await page.waitForSelector('[data-testid="meetings-list"]')

    // Get all h2 elements (month headers)
    const monthHeaders = page.locator("h2")
    const headerCount = await monthHeaders.count()

    // Should have at least one month header
    expect(headerCount).toBeGreaterThan(0)

    // Verify first header contains Polish month name
    const firstHeader = monthHeaders.first()
    const headerText = await firstHeader.textContent()
    expect(headerText).toBeTruthy()

    // Check if text matches Polish month pattern (lowercase month name + year)
    // Examples: "listopad 2025", "grudzień 2025"
    expect(headerText).toMatch(/^[a-ząćęłńóśźż]+ \d{4}$/i)
  })
})

test.describe("Meetings List - Admin Access", () => {
  test.use({ storageState: ".auth/admin.json" })

  test.beforeEach(async ({ page }) => {
    await page.goto(MEETINGS_LIST_PAGE)
  })

  test("displays page successfully for admin", async ({ page }) => {
    // Verify page loads
    const pageTitle = page.getByTestId("meetings-title")
    await expect(pageTitle).toBeVisible()
    await expect(pageTitle).toContainText("Zebrania w weekend")
  })

  test("manage button is visible for admin", async ({ page }) => {
    // Verify manage button exists and is visible
    const manageButton = page.getByTestId("manage-button")
    await expect(manageButton).toBeVisible()
  })

  test("clicking manage button navigates to management page", async ({ page }) => {
    // Find and click manage button
    const manageButton = page.getByTestId("manage-button")
    await expect(manageButton).toBeVisible()
    await manageButton.click()

    // Wait for navigation
    await page.waitForURL("**/meetings/manage-public-talks")

    // Verify URL changed
    expect(page.url()).toContain("/meetings/manage-public-talks")
  })
})

test.describe("Meetings List - Month Grouping", () => {
  test.use({ storageState: ".auth/publisher.json" })

  test("meetings are organized under month headers", async ({ page }) => {
    await page.goto(MEETINGS_LIST_PAGE)

    // Wait for meetings list
    await page.waitForSelector('[data-testid="meetings-list"]')

    // Get all month sections
    const monthSections = page.locator('[data-testid="meetings-list"] > div')
    const sectionCount = await monthSections.count()
    expect(sectionCount).toBeGreaterThan(0)

    // For each month section, verify structure
    for (let i = 0; i < Math.min(sectionCount, 2); i++) {
      const section = monthSections.nth(i)

      // Each section should have an h2 header
      const header = section.locator("h2")
      await expect(header).toBeVisible()

      // Each section should have at least one meeting card
      const cardsInSection = section.locator('[data-testid^="meeting-card-"]')
      const cardCount = await cardsInSection.count()
      expect(cardCount).toBeGreaterThan(0)
    }
  })

  test("month headers display in Polish locale", async ({ page }) => {
    await page.goto(MEETINGS_LIST_PAGE)

    await page.waitForSelector('[data-testid="meetings-list"]')

    // Get first month header
    const firstHeader = page.locator("h2").first()
    const headerText = await firstHeader.textContent()

    // Verify it's in Polish format (lowercase month + space + year)
    // Valid examples: "listopad 2025", "grudzień 2025", "styczeń 2026"
    const polishMonths = [
      "styczeń",
      "luty",
      "marzec",
      "kwiecień",
      "maj",
      "czerwiec",
      "lipiec",
      "sierpień",
      "wrzesień",
      "październik",
      "listopad",
      "grudzień",
    ]

    const containsPolishMonth = polishMonths.some(month =>
      headerText?.toLowerCase().includes(month)
    )

    expect(containsPolishMonth).toBeTruthy()
    expect(headerText).toMatch(/\d{4}/) // Should contain year
  })
})

test.describe("Meetings List - Empty State", () => {
  // Note: This test requires database to have NO scheduled meetings
  // May need manual setup or database reset before running
  test.skip("displays empty state when no meetings scheduled", async ({ page }) => {
    await page.goto(MEETINGS_LIST_PAGE)

    // Check for empty state
    const emptyState = page.getByTestId("empty-state")

    // If no meetings, empty state should be visible
    const isVisible = await emptyState.isVisible().catch(() => false)

    if (isVisible) {
      await expect(emptyState).toContainText("Brak zaplanowanych zebrań")
      await expect(emptyState).toContainText(
        "Nie ma jeszcze żadnych zaplanowanych zebrań w weekend"
      )

      // Meetings list should not be visible
      await expect(page.getByTestId("meetings-list")).not.toBeVisible()
    }
  })
})

test.describe("Meetings List - Data Display", () => {
  test.use({ storageState: ".auth/publisher.json" })

  test("meeting card displays date in Polish format", async ({ page }) => {
    await page.goto(MEETINGS_LIST_PAGE)

    const firstCard = page.locator('[data-testid^="meeting-card-"]').first()
    const dateElement = firstCard.getByTestId("meeting-date")

    const dateText = await dateElement.textContent()

    // Should match format: "niedziela, 16 listopada 2025"
    // Polish day names: poniedziałek, wtorek, środa, czwartek, piątek, sobota, niedziela
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
    expect(dateText).toMatch(/\d{4}/) // Should contain year
  })

  test("meeting card displays speaker name", async ({ page }) => {
    await page.goto(MEETINGS_LIST_PAGE)

    const firstCard = page.locator('[data-testid^="meeting-card-"]').first()
    const speakerElement = firstCard.getByTestId("meeting-speaker")

    await expect(speakerElement).toBeVisible()

    const speakerText = await speakerElement.textContent()
    // Should have both first and last name (at least 2 words)
    expect(speakerText?.trim().split(/\s+/).length).toBeGreaterThanOrEqual(2)
  })

  test("meeting card displays talk information", async ({ page }) => {
    await page.goto(MEETINGS_LIST_PAGE)

    const firstCard = page.locator('[data-testid^="meeting-card-"]').first()
    const talkElement = firstCard.getByTestId("meeting-talk")

    await expect(talkElement).toBeVisible()

    const talkText = await talkElement.textContent()
    expect(talkText).toBeTruthy()

    // Talk should either have:
    // - Number and title: "#13 - Title"
    // - Just title: "Title"
    // - No talk: "Brak wykładu"
    const hasNumberAndTitle = talkText?.includes("#") && talkText?.includes("-")
    const hasTitleOnly = !talkText?.includes("#") && talkText !== "Brak wykładu"
    const hasNoTalk = talkText === "Brak wykładu"

    expect(hasNumberAndTitle || hasTitleOnly || hasNoTalk).toBeTruthy()
  })
})
