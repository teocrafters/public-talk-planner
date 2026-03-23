import { publishers, type Publisher } from "../../database/schema"
import { defineEndpoint } from "../../utils/define-endpoint"

interface AvailablePublishers {
  chairman: Publisher[]
  watchtowerStudy: Publisher[]
  reader: Publisher[]
  prayer: Publisher[]
  circuitOverseerTalk: Publisher[]
}

export default defineEndpoint({
  permissions: { publishers: ["list"] },
  handler: async (): Promise<AvailablePublishers> => {
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
  }
})
