import { eq, and } from "drizzle-orm"
import { publishers } from "../database/schema"

export default defineTask({
  meta: {
    name: "db:seed-publishers",
    description: "Seed sample publishers with various roles and capabilities",
  },
  async run() {
    console.log("Starting publishers seeding...")

    try {
      const db = useDrizzle()

      const sampleData = [
        // 1. Elder - Watchtower Conductor
        {
          id: crypto.randomUUID(),
          firstName: "Jan",
          lastName: "Kowalski",
          isElder: true,
          canChairWeekendMeeting: false,
          conductsWatchtowerStudy: true,
          backupWatchtowerConductor: false,
          isReader: false,
          offersPublicPrayer: false,
          deliversPublicTalks: false,
          isCircuitOverseer: false,
        },
        // 2. Elder - Backup Watchtower Conductor
        {
          id: crypto.randomUUID(),
          firstName: "Piotr",
          lastName: "Nowak",
          isElder: true,
          canChairWeekendMeeting: false,
          conductsWatchtowerStudy: false,
          backupWatchtowerConductor: true,
          isReader: false,
          offersPublicPrayer: false,
          deliversPublicTalks: false,
          isCircuitOverseer: false,
        },
        // 3-6. Four Elders - Readers AND Chairmen AND Prayer AND Public Talk Speakers
        {
          id: crypto.randomUUID(),
          firstName: "Marek",
          lastName: "Wiśniewski",
          isElder: true,
          canChairWeekendMeeting: true,
          conductsWatchtowerStudy: false,
          backupWatchtowerConductor: false,
          isReader: true,
          offersPublicPrayer: true, // ✅ Fixed: isReader && (canChairWeekendMeeting || isElder)
          deliversPublicTalks: true,
          isCircuitOverseer: false,
        },
        {
          id: crypto.randomUUID(),
          firstName: "Adam",
          lastName: "Wójcik",
          isElder: true,
          canChairWeekendMeeting: true,
          conductsWatchtowerStudy: false,
          backupWatchtowerConductor: false,
          isReader: true,
          offersPublicPrayer: true, // ✅ Fixed: isReader && (canChairWeekendMeeting || isElder)
          deliversPublicTalks: true,
          isCircuitOverseer: false,
        },
        {
          id: crypto.randomUUID(),
          firstName: "Tomasz",
          lastName: "Kamiński",
          isElder: true,
          canChairWeekendMeeting: true,
          conductsWatchtowerStudy: false,
          backupWatchtowerConductor: false,
          isReader: true,
          offersPublicPrayer: true, // ✅ Fixed: isReader && (canChairWeekendMeeting || isElder)
          deliversPublicTalks: true,
          isCircuitOverseer: false,
        },
        {
          id: crypto.randomUUID(),
          firstName: "Krzysztof",
          lastName: "Zieliński",
          isElder: true,
          canChairWeekendMeeting: true,
          conductsWatchtowerStudy: false,
          backupWatchtowerConductor: false,
          isReader: true,
          offersPublicPrayer: true, // ✅ Fixed: isReader && (canChairWeekendMeeting || isElder)
          deliversPublicTalks: true,
          isCircuitOverseer: false,
        },
        // 7-8. Two Ministerial Servants - Readers AND Prayer AND Public Talk Speakers
        {
          id: crypto.randomUUID(),
          firstName: "Paweł",
          lastName: "Szymański",
          isElder: false,
          isMinisterialServant: true,
          canChairWeekendMeeting: false,
          conductsWatchtowerStudy: false,
          backupWatchtowerConductor: false,
          isReader: true,
          offersPublicPrayer: true, // ✅ Fixed: isReader && isMinisterialServant
          deliversPublicTalks: true,
          isCircuitOverseer: false,
        },
        {
          id: crypto.randomUUID(),
          firstName: "Michał",
          lastName: "Woźniak",
          isElder: false,
          isMinisterialServant: true,
          canChairWeekendMeeting: false,
          conductsWatchtowerStudy: false,
          backupWatchtowerConductor: false,
          isReader: true,
          offersPublicPrayer: true, // ✅ Fixed: isReader && isMinisterialServant
          deliversPublicTalks: true,
          isCircuitOverseer: false,
        },
        // 9-10. Two Elders - Chairmen Only
        {
          id: crypto.randomUUID(),
          firstName: "Jakub",
          lastName: "Dąbrowski",
          isElder: true,
          canChairWeekendMeeting: true,
          conductsWatchtowerStudy: false,
          backupWatchtowerConductor: false,
          isReader: false,
          offersPublicPrayer: false,
          deliversPublicTalks: false,
          isCircuitOverseer: false,
        },
        {
          id: crypto.randomUUID(),
          firstName: "Mateusz",
          lastName: "Kwiatkowski",
          isElder: true,
          canChairWeekendMeeting: true,
          conductsWatchtowerStudy: false,
          backupWatchtowerConductor: false,
          isReader: false,
          offersPublicPrayer: false,
          deliversPublicTalks: false,
          isCircuitOverseer: false,
        },
        // 11-12. Two Elders - Public Talk Speakers AND Prayer Only
        {
          id: crypto.randomUUID(),
          firstName: "Grzegorz",
          lastName: "Mazur",
          isElder: true,
          canChairWeekendMeeting: false,
          conductsWatchtowerStudy: false,
          backupWatchtowerConductor: false,
          isReader: false,
          offersPublicPrayer: true,
          deliversPublicTalks: true,
          isCircuitOverseer: false,
        },
        {
          id: crypto.randomUUID(),
          firstName: "Wojciech",
          lastName: "Kaczmarek",
          isElder: true,
          canChairWeekendMeeting: false,
          conductsWatchtowerStudy: false,
          backupWatchtowerConductor: false,
          isReader: false,
          offersPublicPrayer: true,
          deliversPublicTalks: true,
          isCircuitOverseer: false,
        },
        // 13. Ministerial Servant - Public Talk Speaker AND Prayer Only
        {
          id: crypto.randomUUID(),
          firstName: "Bartosz",
          lastName: "Piotrowski",
          isElder: false,
          isMinisterialServant: true,
          canChairWeekendMeeting: false,
          conductsWatchtowerStudy: false,
          backupWatchtowerConductor: false,
          isReader: false,
          offersPublicPrayer: true,
          deliversPublicTalks: true,
          isCircuitOverseer: false,
        },
        // 14. Exemplary Publisher - Prayer Only
        {
          id: crypto.randomUUID(),
          firstName: "Robert",
          lastName: "Krawczyk",
          isElder: false,
          canChairWeekendMeeting: false,
          conductsWatchtowerStudy: false,
          backupWatchtowerConductor: false,
          isReader: false,
          offersPublicPrayer: true,
          deliversPublicTalks: false,
          isCircuitOverseer: false,
        },
        // 15. Circuit Overseer - Always delivers public talks
        {
          id: crypto.randomUUID(),
          firstName: "Andrzej",
          lastName: "Lewandowski",
          isElder: true,
          canChairWeekendMeeting: false,
          conductsWatchtowerStudy: false,
          backupWatchtowerConductor: false,
          isReader: false,
          offersPublicPrayer: false,
          deliversPublicTalks: true,
          isCircuitOverseer: true,
        },
      ]

      let created = 0
      let skipped = 0

      for (const data of sampleData) {
        // Check if publisher with this name already exists
        const existing = await db
          .select()
          .from(publishers)
          .where(
            and(eq(publishers.firstName, data.firstName), eq(publishers.lastName, data.lastName))
          )
          .get()

        if (!existing) {
          await db.insert(publishers).values({
            ...data,
            userId: null,
            isMinisterialServant: data.isMinisterialServant ?? false,
            isRegularPioneer: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })

          created++
          console.log(`✅ Created: ${data.firstName} ${data.lastName}`)
        } else {
          skipped++
          console.log(`⏭️  Exists: ${data.firstName} ${data.lastName}`)
        }
      }

      console.log(`\n✅ Publishers seeding completed successfully`)
      console.log(`   - Created: ${created}`)
      console.log(`   - Skipped: ${skipped}`)
      console.log(`   - Total: ${sampleData.length}`)

      return {
        result: "success",
        created,
        skipped,
        total: sampleData.length,
      }
    } catch (error: unknown) {
      console.error("Unexpected error during publishers seeding:", error)
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      throw error
    }
  },
})
