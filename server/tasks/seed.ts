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
    console.log("Starting complete database seeding (real data)...")
    console.log(`Environment: ${getNodeEnv()}`)
    console.log("-".repeat(60))

    const results: Record<string, string> = {}

    try {
      // 1. Seed congregations (organizations)
      console.log("\n[1/8] Seeding congregations...")
      await seedCongregations.run(event)
      results.congregations = "success"
      console.log("✅ Congregations seeded")

      // 2. Seed public talks
      console.log("\n[2/8] Seeding public talks...")
      await seedPublicTalks.run(event)
      results.publicTalks = "success"
      console.log("✅ Public talks seeded")

      // 3. Seed publishers (Żychlin congregation members)
      console.log("\n[3/8] Seeding publishers...")
      await seedPublishers.run(event)
      results.publishers = "success"
      console.log("✅ Publishers seeded")

      // 4. Seed coordinator accounts (links to publisher profiles)
      console.log("\n[4/8] Seeding coordinator accounts...")
      await seedCoordinatorAccounts.run(event)
      results.coordinatorAccounts = "success"
      console.log("✅ Coordinator accounts seeded")

      // 5. Seed speakers (visiting speakers from other congregations)
      console.log("\n[5/8] Seeding speakers...")
      await seedSpeakers.run(event)
      results.speakers = "success"
      console.log("✅ Speakers seeded")

      // 6. Seed speaker-talks relationships
      console.log("\n[6/8] Seeding speaker-talks...")
      await seedSpeakerTalks.run(event)
      results.speakerTalks = "success"
      console.log("✅ Speaker-talks seeded")

      // 7. Seed previous talks
      console.log("\n[7/8] Seeding previous talks...")
      await seedPreviousTalks.run(event)
      results.previousTalks = "success"
      console.log("✅ Previous talks seeded")

      // 8. Seed scheduled meetings
      console.log("\n[8/8] Seeding scheduled meetings...")
      await seedScheduledMeetings.run(event)
      results.scheduledMeetings = "success"
      console.log("✅ Scheduled meetings seeded")

      console.log("\n" + "-".repeat(60))
      console.log("✅ Complete database seeding (real data) finished successfully")
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
