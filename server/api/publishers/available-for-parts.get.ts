import { schema } from "hub:db"

interface AvailablePublishers {
  chairman: Publisher[]
  watchtowerStudy: Publisher[]
  reader: Publisher[]
  prayer: Publisher[]
  circuitOverseerTalk: Publisher[]
}

export default defineEventHandler(async (event): Promise<AvailablePublishers> => {
  await requirePermission({ publishers: ["list"] })(event)


  // Fetch all publishers once
  const allPublishers = await db
    .select()
    .from(schema.publishers)
    .orderBy(schema.publishers.lastName, schema.publishers.firstName)

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
