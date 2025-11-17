import { publishers, type Publisher } from "../../database/schema"

interface AvailablePublishers {
  chairman: Publisher[]
  watchtowerStudy: Publisher[]
  reader: Publisher[]
  prayer: Publisher[]
  circuitOverseerTalk: Publisher[]
}

export default defineEventHandler(async (event): Promise<AvailablePublishers> => {
  await requirePermission({ publishers: ["list"] })(event)

  const db = useDrizzle()

  // Fetch all publishers once
  const allPublishers = await db
    .select()
    .from(publishers)
    .orderBy(publishers.lastName, publishers.firstName)

  // Filter by capability
  return {
    chairman: allPublishers.filter(p => p.isElder || p.canChairWeekendMeeting),
    watchtowerStudy: allPublishers.filter(
      p => p.conductsWatchtowerStudy || p.backupWatchtowerConductor
    ),
    reader: allPublishers.filter(p => p.isReader),
    prayer: allPublishers.filter(p => p.offersPublicPrayer),
    circuitOverseerTalk: allPublishers.filter(p => p.isCircuitOverseer),
  }
})
