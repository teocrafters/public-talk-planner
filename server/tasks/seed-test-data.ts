import seedCongregations from "./test-seeders/seed-congregations"
import seedTestAccounts from "./test-seeders/seed-test-accounts"
import seedPublicTalks from "./seed-public-talks-from-json" // Shared seeder
import seedSpeakers from "./test-seeders/seed-speakers"
import seedWeekendMeetings from "./test-seeders/seed-weekend-meetings"
import seedPreviousTalks from "./test-seeders/seed-previous-talks"

export default defineTask({
  meta: {
    name: "db:seed-test-data",
    description: "Run all database seeders for test data in correct order",
  },
  async run(event) {
    console.log("Starting complete database seeding (test data)...")
    console.log(`Environment: ${getNodeEnv()}`)
    console.log("=".repeat(60))

    const results: Record<string, string> = {}

    try {
      // 1. Seed congregations (organizations)
      console.log("\n[1/5] Seeding congregations...")
      await seedCongregations.run(event)
      results.congregations = "success"
      console.log("✅ Congregations seeded")

      // 2. Seed test accounts (users)
      console.log("\n[2/5] Seeding test accounts...")
      await seedTestAccounts.run(event)
      results.testAccounts = "success"
      console.log("✅ Test accounts seeded")

      // 3. Seed public talks (shared seeder)
      console.log("\n[3/5] Seeding public talks...")
      await seedPublicTalks.run(event)
      results.publicTalks = "success"
      console.log("✅ Public talks seeded")

      // 4. Seed speakers
      console.log("\n[4/5] Seeding speakers...")
      await seedSpeakers.run(event)
      results.speakers = "success"
      console.log("✅ Speakers seeded")

      // 5. Seed weekend meetings
      console.log("\n[5/5] Seeding weekend meetings...")
      await seedWeekendMeetings.run(event)
      results.weekendMeetings = "success"
      console.log("✅ Weekend meetings seeded")

      // 6. Seed previous talks
      console.log("\n[6/5] Seeding previous talks...")
      await seedPreviousTalks.run(event)
      results.previousTalks = "success"
      console.log("✅ Previous talks seeded")

      console.log("\n" + "=".repeat(60))
      console.log("✅ Complete database seeding (test data) finished successfully")
      console.log("=".repeat(60))

      return {
        result: "success",
        environment: getNodeEnv(),
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
        environment: getNodeEnv(),
        seeders: results,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  },
})
