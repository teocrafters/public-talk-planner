import seedCongregations from "./seed-congregations-from-json"
import seedCoordinatorAccounts from "./seed-coordinator-accounts"
import seedPublicTalks from "./seed-public-talks-from-json"
import seedPublishers from "./seed-publishers-from-json"
import seedSpeakers from "./seed-speakers-from-json"
import seedSpeakerTalks from "./seed-speaker-talks-from-json"
import seedPreviousTalks from "./seed-previous-talks-from-json"
import seedScheduledMeetings from "./seed-scheduled-meetings-from-json"

export default defineTask({
  meta: {
    name: "db:seed",
    description: "Run all database seeders for real data in correct order",
  },
  async run(event) {
    logger.info("Starting complete database seeding (real data)...")
    logger.info(`Environment: ${getNodeEnv()}`)
    logger.info("-".repeat(60))

    const results: Record<string, string> = {}

    try {
      // 1. Seed congregations (organizations)
      logger.info("\n[1/8] Seeding congregations...")
      await seedCongregations.run(event)
      results.congregations = "success"
      logger.info("✅ Congregations seeded")

      // 2. Seed public talks
      logger.info("\n[2/8] Seeding public talks...")
      await seedPublicTalks.run(event)
      results.publicTalks = "success"
      logger.info("✅ Public talks seeded")

      // 3. Seed publishers (Żychlin congregation members)
      logger.info("\n[3/8] Seeding publishers...")
      await seedPublishers.run(event)
      results.publishers = "success"
      logger.info("✅ Publishers seeded")

      // 4. Seed coordinator accounts (links to publisher profiles)
      logger.info("\n[4/8] Seeding coordinator accounts...")
      await seedCoordinatorAccounts.run(event)
      results.coordinatorAccounts = "success"
      logger.info("✅ Coordinator accounts seeded")

      // 5. Seed speakers (visiting speakers from other congregations)
      logger.info("\n[5/8] Seeding speakers...")
      await seedSpeakers.run(event)
      results.speakers = "success"
      logger.info("✅ Speakers seeded")

      // 6. Seed speaker-talks relationships
      logger.info("\n[6/8] Seeding speaker-talks...")
      await seedSpeakerTalks.run(event)
      results.speakerTalks = "success"
      logger.info("✅ Speaker-talks seeded")

      // 7. Seed previous talks
      logger.info("\n[7/8] Seeding previous talks...")
      await seedPreviousTalks.run(event)
      results.previousTalks = "success"
      logger.info("✅ Previous talks seeded")

      // 8. Seed scheduled meetings
      logger.info("\n[8/8] Seeding scheduled meetings...")
      await seedScheduledMeetings.run(event)
      results.scheduledMeetings = "success"
      logger.info("✅ Scheduled meetings seeded")

      logger.info("\n" + "-".repeat(60))
      logger.info("✅ Complete database seeding (real data) finished successfully")
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
