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
          sex: "male" as const,
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
          sex: "male" as const,
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
          sex: "male" as const,
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
          sex: "male" as const,
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
          sex: "male" as const,
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
          sex: "male" as const,
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
          sex: "male" as const,
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
          sex: "male" as const,
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
          sex: "male" as const,
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
          sex: "male" as const,
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
          sex: "male" as const,
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
          sex: "male" as const,
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
          sex: "male" as const,
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
          sex: "male" as const,
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
          sex: "male" as const,
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
