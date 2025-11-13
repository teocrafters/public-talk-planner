import { createAccessControl } from "better-auth/plugins/access"

export const statement = {
	speakers: ["list", "create", "update", "archive"],
	talks: ["create", "update", "archive", "flag"],
	weekend_meetings: ["schedule_public_talks", "schedule_all", "list", "list_history"],
} as const

export const ac = createAccessControl(statement)

export const publisher = ac.newRole({
	speakers: ["list"],
	talks: [],
	weekend_meetings: ["list"],
})

export const manager = ac.newRole({
	speakers: ["list", "create", "update", "archive"],
	talks: ["create", "update", "archive", "flag"],
	weekend_meetings: ["schedule_public_talks", "list", "list_history"],
})

export const admin = ac.newRole({
	speakers: ["list", "create", "update", "archive"],
	talks: ["create", "update", "archive", "flag"],
	weekend_meetings: ["schedule_public_talks", "schedule_all", "list", "list_history"],
})
