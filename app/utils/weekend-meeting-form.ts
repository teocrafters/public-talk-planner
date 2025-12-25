interface WeekendProgram {
	id: number
	date: number
	isCircuitOverseerVisit: boolean
	parts: Array<{
		id: number
		type: string
		name: string | null
		order: number
		assignment?: {
			personId: string
			personName: string
			personType: "speaker" | "publisher"
		}
	}>
}

interface WeekendMeetingFormState {
	isCircuitOverseerVisit: boolean
	parts: {
		chairman: string
		watchtowerStudy: string
		reader: string
		prayer: string
		publicTalk: {
			title: string
		}
		circuitOverseerTalk: {
			publisherId: string
			title: string
		}
	}
	overrideDuplicates: boolean
}

/**
 * Creates default weekend meeting form state
 * Used to initialize form state and reset it after operations
 *
 * @returns Default form state object
 */
export function createDefaultWeekendMeetingFormState(): WeekendMeetingFormState {
	return {
		isCircuitOverseerVisit: false,
		parts: {
			chairman: "",
			watchtowerStudy: "",
			reader: "",
			prayer: "",
			publicTalk: {
				title: "",
			},
			circuitOverseerTalk: {
				publisherId: "",
				title: "",
			},
		},
		overrideDuplicates: false,
	}
}

/**
 * Builds form state from existing weekend program
 * Maps program parts to form structure
 *
 * @param program - Existing weekend program data
 * @returns Form state populated with program data
 */
export function buildStateFromProgram(
	program: WeekendProgram,
): WeekendMeetingFormState {
	const state = createDefaultWeekendMeetingFormState()
	state.isCircuitOverseerVisit = program.isCircuitOverseerVisit

	for (const part of program.parts) {
		const assignment = part.assignment

		switch (part.type) {
			case "chairman":
				state.parts.chairman = assignment?.personId || ""
				break
			case "watchtower_study":
				state.parts.watchtowerStudy = assignment?.personId || ""
				break
			case "reader":
				state.parts.reader = assignment?.personId || ""
				break
			case "closing_prayer":
				state.parts.prayer = assignment?.personId || ""
				break
			case "public_talk":
				state.parts.publicTalk.title = part.name || ""
				break
			case "circuit_overseer_talk":
				state.parts.circuitOverseerTalk.publisherId = assignment?.personId || ""
				state.parts.circuitOverseerTalk.title = part.name || ""
				break
		}
	}

	return state
}
