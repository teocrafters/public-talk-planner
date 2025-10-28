import { createAccessControl } from "better-auth/plugins/access"

const statement = {
	speakers: ["list", "create", "update", "archive"],
	talks: ["create", "update", "archive", "flag"],
} as const

export const ac = createAccessControl(statement)

export const publisher = ac.newRole({
	speakers: ["list"],
	talks: [],
})

export const manager = ac.newRole({
	speakers: ["list", "create", "update", "archive"],
	talks: ["create", "update", "archive", "flag"],
})

export const admin = ac.newRole({
	speakers: ["list", "create", "update", "archive"],
	talks: ["create", "update", "archive", "flag"],
})
