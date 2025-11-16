import { test, expect } from "../fixtures"

test.describe("Public Talks Create", () => {
  test.describe("with editor role", () => {
    test("create new talk", async ({ page, authenticateAs }) => {
      await authenticateAs.publicTalkCoordinator()
      await page.goto("/talks")

      // Click "Dodaj wykład" button
      await page.getByTestId("add-talk-button").click()

      // Wait for modal/form
      await page.waitForTimeout(500)

      // Fill form
      await page.getByTestId("talk-no-input").fill("999")
      await page.getByTestId("talk-title-input").fill("Test New Talk Title")
      await page.getByTestId("talk-multimedia-input").fill("2")
      await page.getByTestId("talk-video-input").fill("1")

      // Submit
      await page.getByTestId("talk-save-button").click()

      // Verify talk appears in list
      await page.waitForTimeout(500)
      await expect(page.locator("body")).toContainText("Test New Talk Title")
    })

    test("create with special designation", async ({ page, authenticateAs }) => {
      await authenticateAs.publicTalkCoordinator()
      await page.goto("/talks")

      // Click add button
      await page.getByTestId("add-talk-button").click()

      await page.waitForTimeout(500)

      // Enter special number
      await page.getByTestId("talk-no-input").fill("S428")
      await page.getByTestId("talk-title-input").fill("Special Talk")
      await page.getByTestId("talk-multimedia-input").fill("0")
      await page.getByTestId("talk-video-input").fill("0")

      // Submit
      await page.getByTestId("talk-save-button").click()

      // Verify special designation displayed
      await page.waitForTimeout(500)
      await expect(page.locator("body")).toContainText("S428")
    })

    test("validation errors", async ({ page, authenticateAs }) => {
      await authenticateAs.publicTalkCoordinator()
      await page.goto("/talks")

      // Click add button
      await page.getByTestId("add-talk-button").click()

      await page.waitForTimeout(500)

      // Try to submit without required fields
      await page.getByTestId("talk-save-button").click()

      // Verify validation messages shown
      // Wait for any validation error text to appear
      await page.waitForTimeout(200)

      // Check for validation error messages - they appear as text below inputs in Nuxt UI
      // Use .first() since multiple validation errors will be shown
      await expect(
        page.getByText(/jest wymagany|mieć co najmniej|required|at least/i).first()
      ).toBeVisible()
    })
  })

  test.describe("permission check with member role", () => {
    test("cannot create as member", async ({ page, authenticateAs }) => {
      await authenticateAs.publisher()
      await page.goto("/talks")

      // Verify "Dodaj wykład" button NOT visible
      await expect(page.getByTestId("add-talk-button")).toHaveCount(0)
    })
  })
})
