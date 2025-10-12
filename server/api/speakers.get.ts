import { eq, sql } from "drizzle-orm"
import { speakers, organization, speakerTalks, publicTalks } from "../database/schema"

interface SpeakerWithRelations {
	id: string
	firstName: string
	lastName: string
	phone: string
	congregationId: string
	congregationName: string
	archived: boolean
	archivedAt: Date | null
	createdAt: Date
	updatedAt: Date
	talks: Array<{
		id: number
		no: string
		title: string
	}>
}

export default defineEventHandler(async (): Promise<SpeakerWithRelations[]> => {
	const db = useDrizzle()

	const speakersData = await db
		.select({
			id: speakers.id,
			firstName: speakers.firstName,
			lastName: speakers.lastName,
			phone: speakers.phone,
			congregationId: speakers.congregationId,
			congregationName: organization.name,
			archived: speakers.archived,
			archivedAt: speakers.archivedAt,
			createdAt: speakers.createdAt,
			updatedAt: speakers.updatedAt,
		})
		.from(speakers)
		.leftJoin(organization, eq(speakers.congregationId, organization.id))
		.orderBy(speakers.lastName, speakers.firstName)

	const speakerIds = speakersData.map((s) => s.id)

	if (speakerIds.length === 0) {
		return []
	}

	const talksData = await db
		.select({
			speakerId: speakerTalks.speakerId,
			talkId: publicTalks.id,
			talkNo: publicTalks.no,
			talkTitle: publicTalks.title,
		})
		.from(speakerTalks)
		.innerJoin(publicTalks, eq(speakerTalks.talkId, publicTalks.id))
		.where(sql`${speakerTalks.speakerId} IN ${speakerIds}`)

	const talksBySpeaker = talksData.reduce(
		(acc, talk) => {
			if (!acc[talk.speakerId]) {
				acc[talk.speakerId] = []
			}
			acc[talk.speakerId]!.push({
				id: talk.talkId,
				no: talk.talkNo,
				title: talk.talkTitle,
			})
			return acc
		},
		{} as Record<string, Array<{ id: number; no: string; title: string }>>,
	)

	return speakersData.map((speaker) => ({
		...speaker,
		congregationName: speaker.congregationName || "",
		talks: talksBySpeaker[speaker.id] || [],
	}))
})
