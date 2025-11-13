import { eq } from "drizzle-orm"
import { generateId } from "better-auth"
import { meetingPrograms, meetingProgramParts, scheduledMeetings, speakers } from "../database/schema"

export default defineTask({
	meta: {
		name: "db:seed-meeting-programs",
		description: "Seed meeting programs, parts, and scheduled meetings for weekend meetings",
	},
	async run() {
		console.log("Starting meeting programs seeding...")

		try {
			const db = useDrizzle()

			// Check if weekend program exists
			let weekendProgram = await db
				.select()
				.from(meetingPrograms)
				.where(eq(meetingPrograms.type, "weekend"))
				.get()

			let publicTalkPart
			let watchtowerPart

			if (!weekendProgram) {
				console.log("Creating weekend meeting program...")
				;[weekendProgram] = await db
					.insert(meetingPrograms)
					.values({
						type: "weekend",
						name: "Zebranie w weekend",
						createdAt: new Date(),
					})
					.returning()

				console.log(`Created weekend meeting program: ${weekendProgram.id}`)

				console.log("Creating parts for weekend meeting program...")
				const parts = await db.insert(meetingProgramParts).values([
					{
						meetingProgramId: weekendProgram.id,
						name: "Wykład publiczny",
						order: 1,
						createdAt: new Date(),
					},
					{
						meetingProgramId: weekendProgram.id,
						name: "Strażnica",
						order: 2,
						createdAt: new Date(),
					},
				]).returning()

				publicTalkPart = parts[0]
				watchtowerPart = parts[1]

				console.log("✅ Created 2 parts for weekend meeting program")
			} else {
				console.log("Weekend meeting program already exists")

				// Get existing parts
				const parts = await db
					.select()
					.from(meetingProgramParts)
					.where(eq(meetingProgramParts.meetingProgramId, weekendProgram.id))

				publicTalkPart = parts.find((p) => p.order === 1)
				watchtowerPart = parts.find((p) => p.order === 2)

				if (!publicTalkPart || !watchtowerPart) {
					throw new Error("Missing required parts for weekend program")
				}
			}

			// Create scheduled meetings for next 12 Sundays
			console.log("Creating scheduled meetings for next 12 Sundays...")

			// Get all active speakers with their talks
			const speakersWithTalks = await db.query.speakers.findMany({
				where: eq(speakers.archived, false),
				with: {
					speakerTalks: {
						with: {
							talk: true,
						},
					},
				},
			})

			if (speakersWithTalks.length === 0) {
				console.warn("⚠️  No speakers found. Run seed-speakers first.")
				return {
					result: "success",
					programId: weekendProgram.id,
					partsCount: 2,
					scheduledMeetingsCount: 0,
				}
			}

			console.log(`Found ${speakersWithTalks.length} active speakers`)

			// Calculate next 12 Sundays
			const today = new Date()
			const currentDay = today.getDay() // 0 = Sunday, 6 = Saturday
			const daysUntilNextSunday = currentDay === 0 ? 7 : 7 - currentDay

			const sundays: Date[] = []
			for (let i = 0; i < 12; i++) {
				const sunday = new Date(today)
				sunday.setDate(today.getDate() + daysUntilNextSunday + i * 7)
				sunday.setHours(10, 0, 0, 0) // Set to 10:00 AM
				sundays.push(sunday)
			}

			console.log(`Creating schedules for ${sundays.length} Sundays`)

			let scheduledCount = 0
			for (const sunday of sundays) {
				// Pick a random speaker with at least one talk
				const eligibleSpeakers = speakersWithTalks.filter(
					(s) => s.speakerTalks && s.speakerTalks.length > 0
				)

				if (eligibleSpeakers.length === 0) {
					console.warn(`⚠️  No eligible speakers for ${sunday.toISOString()}`)
					continue
				}

				const speaker = eligibleSpeakers[Math.floor(Math.random() * eligibleSpeakers.length)]
				const speakerTalk = speaker.speakerTalks![Math.floor(Math.random() * speaker.speakerTalks!.length)]

				// Check if schedule already exists for this date and part
				const existingSchedule = await db
					.select()
					.from(scheduledMeetings)
					.where(eq(scheduledMeetings.date, sunday))
					.get()

				if (!existingSchedule) {
					await db.insert(scheduledMeetings).values({
						id: generateId(),
						date: sunday,
						meetingProgramId: weekendProgram.id,
						partId: publicTalkPart.id,
						speakerId: speaker.id,
						talkId: speakerTalk.talkId,
						customTalkTitle: null,
						isCircuitOverseerVisit: false,
						overrideValidation: false,
						createdAt: new Date(),
						updatedAt: new Date(),
					})

					scheduledCount++
					console.log(
						`✅ Scheduled: ${speaker.firstName} ${speaker.lastName} - Talk #${speakerTalk.talkId} on ${sunday.toLocaleDateString()}`
					)
				} else {
					console.log(`⏭️  Schedule already exists for ${sunday.toLocaleDateString()}`)
				}
			}

			console.log(`✅ Created ${scheduledCount} scheduled meetings`)
			console.log("Meeting programs seeding completed successfully")

			return {
				result: "success",
				programId: weekendProgram.id,
				partsCount: 2,
				scheduledMeetingsCount: scheduledCount,
			}
		} catch (error: unknown) {
			console.error("Unexpected error during seeding:", error)
			if (error instanceof Error) {
				console.error("Error message:", error.message)
				console.error("Error stack:", error.stack)
			}
			throw error
		}
	},
})
