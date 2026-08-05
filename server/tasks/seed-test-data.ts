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
    logger.info("Starting complete database seeding (test data)...")
    logger.info(`Environment: ${getNodeEnv()}`)
    logger.info("=".repeat(60))

    const results: Record<string, string> = {}

    try {
      // 1. Seed congregations (organizations)
      logger.info("\n[1/5] Seeding congregations...")
      await seedCongregations.run(event)
      results.congregations = "success"
      logger.info("✅ Congregations seeded")

      // 2. Seed test accounts (users)
      logger.info("\n[2/5] Seeding test accounts...")
      await seedTestAccounts.run(event)
      results.testAccounts = "success"
      logger.info("✅ Test accounts seeded")

      // 3. Seed public talks (shared seeder)
      logger.info("\n[3/5] Seeding public talks...")
      await seedPublicTalks.run(event)
      results.publicTalks = "success"
      logger.info("✅ Public talks seeded")

      // 4. Seed speakers
      logger.info("\n[4/5] Seeding speakers...")
      await seedSpeakers.run(event)
      results.speakers = "success"
      logger.info("✅ Speakers seeded")

      // 5. Seed weekend meetings
      logger.info("\n[5/5] Seeding weekend meetings...")
      await seedWeekendMeetings.run(event)
      results.weekendMeetings = "success"
      logger.info("✅ Weekend meetings seeded")

      // 6. Seed previous talks
      logger.info("\n[6/5] Seeding previous talks...")
      await seedPreviousTalks.run(event)
      results.previousTalks = "success"
      logger.info("✅ Previous talks seeded")

      logger.info("\n" + "=".repeat(60))
      logger.info("✅ Complete database seeding (test data) finished successfully")
      logger.info("=".repeat(60))

      return {
        result: "success",
        environment: getNodeEnv(),
        seeders: results,
      }
    } catch (error: unknown) {
      logger.error("\n" + "=".repeat(60))
      logger.error("❌ Database seeding failed", { error })
      logger.error("=".repeat(60))

      return {
        result: "error",
        environment: getNodeEnv(),
        seeders: results,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  },
})
