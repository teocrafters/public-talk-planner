import { test, expect } from "../fixtures"

const SPEAKERS_PAGE = "http://localhost:3000/speakers"

test.describe("Speaker Management - CRUD Operations", () => {
	test.use({ storageState: ".auth/speakers-manager.json" })

	test.beforeEach(async ({ page }) => {
		await page.goto(SPEAKERS_PAGE)
		await page.waitForLoadState("networkidle")
	})

	test("create speaker with all fields", async ({ page }) => {
		// Click Add Speaker button
		await page.getByTestId("add-speaker-button").click()

		// Wait for modal to open
		await page.waitForSelector('[data-testid="speaker-form"]')

		// Fill in speaker details
		await page.getByTestId("speaker-firstname-input").fill("TestFirst")
		await page.getByTestId("speaker-lastname-input").fill("TestLast")
		await page.getByTestId("speaker-phone-input").fill("111222333")

		// Select congregation (first option)
		const congregationSelect = page.getByTestId("speaker-congregation-select")
		await congregationSelect.click()
		await page.keyboard.press("ArrowDown")
		await page.keyboard.press("Enter")

		// Select talks (select first 2 options)
		const talksSelect = page.getByTestId("speaker-talks-select")
		await talksSelect.click()
		await page.keyboard.press("Space") // Select first
		await page.keyboard.press("ArrowDown")
		await page.keyboard.press("Space") // Select second
		await page.keyboard.press("Escape") // Close dropdown

		// Submit form
		await page.getByTestId("speaker-save-button").click()

		// Verify success toast appears
		await expect(page.getByText("Mówca został dodany").first()).toBeVisible()

		// Verify modal closes
		await expect(page.getByTestId("speaker-form")).not.toBeVisible()

		// Verify speaker appears in list
		await expect(page.getByText("TestFirst TestLast")).toBeVisible()
	})

	test("create speaker without talks (optional field)", async ({ page }) => {
		await page.getByTestId("add-speaker-button").click()
		await page.waitForSelector('[data-testid="speaker-form"]')

		await page.getByTestId("speaker-firstname-input").fill("NoTalks")
		await page.getByTestId("speaker-lastname-input").fill("Speaker")
		await page.getByTestId("speaker-phone-input").fill("999888777")

		// Select congregation
		const congregationSelect = page.getByTestId("speaker-congregation-select")
		await congregationSelect.click()
		await page.keyboard.press("ArrowDown")
		await page.keyboard.press("Enter")

		// Do NOT select any talks - leave empty

		await page.getByTestId("speaker-save-button").click()

		// Verify success toast appears
		await expect(page.getByText("Mówca został dodany").first()).toBeVisible()

		// Verify modal closes
		await expect(page.getByTestId("speaker-form")).not.toBeVisible()

		await expect(page.getByText("NoTalks Speaker")).toBeVisible()
	})

	test("edit speaker information", async ({ page }) => {
		// Find first speaker card and open actions menu
		const firstCard = page.getByTestId("speaker-card").first()

		await firstCard.getByTestId("speaker-actions-menu").click()

		// Click Edit action
		await page.getByRole('menuitem', { name: /edytuj/i }).click()

		// Wait for modal
		await expect(page.getByTestId("speaker-form")).toBeVisible()

		// Get the lastname to identify the speaker
		const lastNameInput = page.getByTestId("speaker-lastname-input")
		const lastName = await lastNameInput.inputValue()

		// Change first name
		const firstNameInput = page.getByTestId("speaker-firstname-input")
		await firstNameInput.fill("UpdatedName")

		// Save changes
		await page.getByTestId("speaker-save-button").click()

		// Verify success toast appears
		await expect(page.getByText("Mówca został zaktualizowany").first()).toBeVisible()

		// Verify modal closes
		await expect(page.getByTestId("speaker-form")).not.toBeVisible()

		// Verify the updated name appears with the same last name
		await expect(page.getByText(`UpdatedName ${lastName}`)).toBeVisible()
	})

	test("archive speaker", async ({ page }) => {
		// Count initial speakers (should be > 6 active by default)
		const initialCount = await page.getByTestId("speaker-card").count()
		expect(initialCount).toBeGreaterThan(0)

		// Archive first speaker
		const firstCard = page.getByTestId("speaker-card").first()
		const speakerName = await firstCard.locator("h3").textContent()

		await firstCard.getByTestId("speaker-actions-menu").click()
		await page.getByRole('menuitem', { name: /archiwizuj/i }).click()

		// Verify success toast appears
		await expect(page.getByText("Mówca został zarchiwizowany").first()).toBeVisible()

		// Wait for the count to decrease (archived hidden by default)
		await expect(page.getByTestId("speaker-card")).toHaveCount(initialCount - 1)

		// Toggle show archived
		await page.getByTestId("show-archived-toggle").click()

		// Verify archived speaker is visible and grayed out
		const archivedCard = page.getByTestId("speaker-card").filter({ hasText: speakerName || "" })
		await expect(archivedCard).toBeVisible()
		await expect(archivedCard).toHaveClass(/opacity-60/)
	})

	test("restore archived speaker", async ({ page }) => {
		// Show archived speakers
		await page.getByTestId("show-archived-toggle").click()

		// Find an archived speaker (has "Zarchiwizowany" badge)
		const archivedCard = page
			.getByTestId("speaker-card")
			.filter({ hasText: "Zarchiwizowany" })
			.first()

		// Get speaker name before restoring
		const speakerName = await archivedCard.locator("h3").textContent()

		// Open actions and restore
		await archivedCard.getByTestId("speaker-actions-menu").click()
		await page.getByRole('menuitem', { name: /przywróć/i }).click()

		// Verify success toast appears
		await expect(page.getByText("Mówca został przywrócony").first()).toBeVisible()

		// Toggle off show archived
		await page.getByTestId("show-archived-toggle").click()

		// Verify restored speaker is visible and NOT grayed out
		const restoredCard = page.getByText(speakerName || "")
		await expect(restoredCard).toBeVisible()
	})
})

test.describe("Speaker Management - Search Functionality", () => {
	test.use({ storageState: ".auth/speakers-manager.json" })

	test.beforeEach(async ({ page }) => {
		await page.goto(SPEAKERS_PAGE)
		await page.waitForLoadState("networkidle")
	})

	test("search by first name", async ({ page }) => {
		const searchInput = page.getByTestId("search-input")

		// Search for "Jan"
		await searchInput.fill("Jan")

		// Should show Jan Kowalski
		await expect(page.getByText("Jan Kowalski")).toBeVisible()

		// Should not show Anna Nowak
		await expect(page.getByText("Anna Nowak")).not.toBeVisible()
	})

	test("search by last name", async ({ page }) => {
		const searchInput = page.getByTestId("search-input")

		// Search for "Nowak"
		await searchInput.fill("Nowak")

		// Should show Anna Nowak
		await expect(page.getByText("Anna Nowak")).toBeVisible()

		// Should not show Jan Kowalski
		await expect(page.getByText("Jan Kowalski")).not.toBeVisible()
	})

	test("search by phone number (formatted)", async ({ page }) => {
		const searchInput = page.getByTestId("search-input")

		// Search for formatted phone "123-456-789"
		await searchInput.fill("123-456")

		// Should show Jan Kowalski (phone: 123456789)
		await expect(page.getByText("Jan Kowalski")).toBeVisible()
	})

	test("search is case-insensitive", async ({ page }) => {
		const searchInput = page.getByTestId("search-input")

		// Search with lowercase
		await searchInput.fill("kowalski")

		// Should still find Jan Kowalski
		await expect(page.getByText("Jan Kowalski")).toBeVisible()
	})

	test("clear search shows all speakers", async ({ page }) => {
		const searchInput = page.getByTestId("search-input")

		// Search to filter
		await searchInput.fill("Jan")

		let visibleCount = await page.getByTestId("speaker-card").count()
		expect(visibleCount).toBe(1)

		// Clear search
		await searchInput.fill("")

		// Should show all active speakers again (6+)
		visibleCount = await page.getByTestId("speaker-card").count()
		expect(visibleCount).toBeGreaterThan(1)
	})

	test("no results message when search has no matches", async ({ page }) => {
		const searchInput = page.getByTestId("search-input")

		// Search for non-existent speaker
		await searchInput.fill("XYZNonExistent")

		// Should show no results alert
		const noResultsAlert = page.getByTestId("no-results-alert")
		await expect(noResultsAlert).toBeVisible()
		await expect(noResultsAlert).toContainText("Nie znaleziono mówców")
	})
})

test.describe("Speaker Management - Archive Toggle", () => {
	test.use({ storageState: ".auth/speakers-manager.json" })

	test.beforeEach(async ({ page }) => {
		await page.goto(SPEAKERS_PAGE)
		await page.waitForLoadState("networkidle")
	})

	test("archived speakers hidden by default", async ({ page }) => {
		// By default, show archived toggle is OFF
		const toggle = page.getByTestId("show-archived-toggle")
		await expect(toggle).not.toBeChecked()

		// Should not see "Zarchiwizowany" badge within speaker cards
		const archivedBadge = page.getByTestId("speaker-card").getByText("Zarchiwizowany")
		await expect(archivedBadge).not.toBeVisible()
	})

	test("toggle on shows archived speakers", async ({ page }) => {
		// Turn on show archived
		await page.getByTestId("show-archived-toggle").click()

		// Should see "Zarchiwizowany" badges
		const archivedBadges = page.getByText("Zarchiwizowany")
		await expect(archivedBadges.first()).toBeVisible()

		// Archived speakers should have reduced opacity
		const archivedCards = page.getByTestId("speaker-card").filter({ hasText: "Zarchiwizowany" })
		const firstArchivedCard = archivedCards.first()
		await expect(firstArchivedCard).toHaveClass(/opacity-60/)
	})

	test("search respects archive toggle", async ({ page }) => {
		const searchInput = page.getByTestId("search-input")

		// Search for archived speaker "Tomasz" (toggle OFF)
		await searchInput.fill("Tomasz")

		// Should not find Tomasz (archived, toggle OFF)
		await expect(page.getByText("Tomasz Lewandowski")).not.toBeVisible()

		// Turn on show archived
		await page.getByTestId("show-archived-toggle").click()

		// Now should find Tomasz
		await expect(page.getByText("Tomasz Lewandowski")).toBeVisible()
	})
})

test.describe("Speaker Management - Form Validation", () => {
	test.use({ storageState: ".auth/speakers-manager.json" })

	test.beforeEach(async ({ page }) => {
		await page.goto(SPEAKERS_PAGE)
		await page.waitForLoadState("networkidle")
	})

	test("required field validation - first name", async ({ page }) => {
		await page.getByTestId("add-speaker-button").click()
		await page.waitForSelector('[data-testid="speaker-form"]')

		// Leave first name empty, fill other required fields
		await page.getByTestId("speaker-lastname-input").fill("TestLast")
		await page.getByTestId("speaker-phone-input").fill("123456789")

		const congregationSelect = page.getByTestId("speaker-congregation-select")
		await congregationSelect.click()
		await page.keyboard.press("ArrowDown")
		await page.keyboard.press("Enter")

		// Try to submit
		await page.getByTestId("speaker-save-button").click()

		// Should show validation error (modal stays open)
		const form = page.getByTestId("speaker-form")
		await expect(form).toBeVisible()
	})

	test("phone validation - too short", async ({ page }) => {
		await page.getByTestId("add-speaker-button").click()
		await page.waitForSelector('[data-testid="speaker-form"]')

		await page.getByTestId("speaker-firstname-input").fill("Test")
		await page.getByTestId("speaker-lastname-input").fill("User")
		await page.getByTestId("speaker-phone-input").fill("12345") // Invalid - too short

		const congregationSelect = page.getByTestId("speaker-congregation-select")
		await congregationSelect.click()
		await page.keyboard.press("ArrowDown")
		await page.keyboard.press("Enter")

		// Try to submit
		await page.getByTestId("speaker-save-button").click()

		// Should show validation error
		const form = page.getByTestId("speaker-form")
		await expect(form).toBeVisible()
	})

	test("phone validation - accepts 9 digits", async ({ page }) => {
		await page.getByTestId("add-speaker-button").click()
		await page.waitForSelector('[data-testid="speaker-form"]')

		await page.getByTestId("speaker-firstname-input").fill("Valid")
		await page.getByTestId("speaker-lastname-input").fill("Phone")
		await page.getByTestId("speaker-phone-input").fill("123456789") // Valid

		const congregationSelect = page.getByTestId("speaker-congregation-select")
		await congregationSelect.click()
		await page.keyboard.press("ArrowDown")
		await page.keyboard.press("Enter")

		// Submit
		await page.getByTestId("speaker-save-button").click()

		// Should succeed
		await expect(page.getByText("Valid Phone")).toBeVisible()
	})

	test("phone validation - accepts formatted XXX-XXX-XXX", async ({ page }) => {
		await page.getByTestId("add-speaker-button").click()
		await page.waitForSelector('[data-testid="speaker-form"]')

		await page.getByTestId("speaker-firstname-input").fill("Formatted")
		await page.getByTestId("speaker-lastname-input").fill("Phone")
		await page.getByTestId("speaker-phone-input").fill("987-654-321") // Valid formatted

		const congregationSelect = page.getByTestId("speaker-congregation-select")
		await congregationSelect.click()
		await page.keyboard.press("ArrowDown")
		await page.keyboard.press("Enter")

		// Submit
		await page.getByTestId("speaker-save-button").click()

		// Should succeed
		await expect(page.getByText("Formatted Phone")).toBeVisible()
	})

	test("cancel button closes modal without saving", async ({ page }) => {
		const initialCount = await page.getByTestId("speaker-card").count()

		await page.getByTestId("add-speaker-button").click()
		await page.waitForSelector('[data-testid="speaker-form"]')

		// Fill some data
		await page.getByTestId("speaker-firstname-input").fill("WillCancel")
		await page.getByTestId("speaker-lastname-input").fill("Speaker")

		// Click cancel using role selector
		await page.getByRole('button', { name: /anuluj|cancel/i }).click()

		// Wait for modal to fully close by checking dialog is not visible
		await expect(page.getByRole('dialog')).not.toBeVisible()

		// Speaker count should not change
		const finalCount = await page.getByTestId("speaker-card").count()
		expect(finalCount).toBe(initialCount)
	})
})

test.describe("Speaker Management - Data Integrity", () => {
	test.use({ storageState: ".auth/speakers-manager.json" })

	test.beforeEach(async ({ page }) => {
		await page.goto(SPEAKERS_PAGE)
		await page.waitForLoadState("networkidle")
	})

	test("phone number displays formatted in list", async ({ page }) => {
		// Jan Kowalski has phone 123456789
		// Should display as 123-456-789
		const janCard = page.getByTestId("speaker-card").filter({ hasText: "Jan Kowalski" })
		await expect(janCard).toContainText("123-456-789")
	})

	test("phone number pre-fills formatted in edit modal", async ({ page }) => {
		// Edit Jan Kowalski
		const janCard = page.getByTestId("speaker-card").filter({ hasText: "Jan Kowalski" })
		await janCard.getByTestId("speaker-actions-menu").click()
		await page.getByRole('menuitem', { name: /edytuj/i }).click()

		await page.waitForSelector('[data-testid="speaker-form"]')

		// Phone should be formatted
		const phoneInput = page.getByTestId("speaker-phone-input")
		const phoneValue = await phoneInput.inputValue()
		expect(phoneValue).toMatch(/^\d{3}-\d{3}-\d{3}$/)
	})

	test("assigned talks display as badges", async ({ page }) => {
		// Piotr Wiśniewski has 5 talks assigned
		const piotrCard = page.getByTestId("speaker-card").filter({ hasText: "Piotr Wiśniewski" })

		// Should show talks badges
		const badgesContainer = piotrCard.getByTestId("speaker-talks-badges")
		await expect(badgesContainer).toBeVisible()

		// Verify badges are present (Piotr has 5 talks)
		const badgeTexts = await badgesContainer.locator("> *").allTextContents()
		expect(badgeTexts.length).toBeGreaterThan(0)
	})

	test("congregation name displays correctly", async ({ page }) => {
		// All speakers belong to "Test Organization"
		const firstCard = page.getByTestId("speaker-card").first()
		await expect(firstCard).toContainText("Test Organization")
	})
})
