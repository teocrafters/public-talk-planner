import seedCongregations from "./seed-congregations"
import seedTestAccounts from "./seed-test-accounts"
import seedPublicTalks from "./seed-public-talks"
import seedSpeakers from "./seed-speakers"
import seedPublishers from "./seed-publishers"
import seedWeekendMeetings from "./seed-weekend-meetings"
import seedPreviousTalks from "./seed-previous-talks"

export default defineTask({
  meta: {
    name: "db:seed",
    description: "Run all database seeders in correct order",
  },
  async run(event) {
    console.log("Starting complete database seeding...")
    console.log("=".repeat(60))

    const results: Record<string, string> = {}

    try {
      // 1. Seed congregations (organizations)
      console.log("\n[1/7] Seeding congregations...")
      await seedCongregations.run(event)
      results.congregations = "success"
      console.log("✅ Congregations seeded")

      // 2. Seed test accounts (users)
      console.log("\n[2/7] Seeding test accounts...")
      await seedTestAccounts.run(event)
      results.testAccounts = "success"
      console.log("✅ Test accounts seeded")

      // 3. Seed public talks
      console.log("\n[3/7] Seeding public talks...")
      await seedPublicTalks.run(event)
      results.publicTalks = "success"
      console.log("✅ Public talks seeded")

      // 4. Seed speakers
      console.log("\n[4/7] Seeding speakers...")
      await seedSpeakers.run(event)
      results.speakers = "success"
      console.log("✅ Speakers seeded")

      // 5. Seed publishers
      console.log("\n[5/7] Seeding publishers...")
      await seedPublishers.run(event)
      results.publishers = "success"
      console.log("✅ Publishers seeded")

      // 6. Seed weekend meetings
      console.log("\n[6/7] Seeding weekend meetings...")
      await seedWeekendMeetings.run(event)
      results.weekendMeetings = "success"
      console.log("✅ Weekend meetings seeded")

      // 7. Seed previous talks
      console.log("\n[7/7] Seeding previous talks...")
      await seedPreviousTalks.run(event)
      results.previousTalks = "success"
      console.log("✅ Previous talks seeded")

      console.log("\n" + "=".repeat(60))
      console.log("✅ Complete database seeding finished successfully")
      console.log("=".repeat(60))

      return {
        result: "success",
        seeders: results,
      }
    } catch (error: unknown) {
      console.error("\n" + "=".repeat(60))
      console.error("❌ Database seeding failed")
      console.error("=".repeat(60))

      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }

      return {
        result: "error",
        seeders: results,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  },
})
