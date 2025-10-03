import { publicTalks } from "../database/schema"

export default defineEventHandler(async () => {
	const db = useDrizzle()
	const talks = await db.select().from(publicTalks).orderBy(publicTalks.no)

	return talks
})
