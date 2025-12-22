import { createAccessControl } from "better-auth/plugins/access"

export const statement = {
  speakers: ["list", "create", "update", "archive"],
  talks: ["create", "update", "archive", "flag"],
  weekend_meetings: [
    "schedule_public_talks",
    "schedule_rest",
    "manage_exceptions",
    "list",
    "list_history",
  ],
  publishers: ["list", "create", "update", "link_to_user"],
} as const

export const ac = createAccessControl(statement)

export const publisher = ac.newRole({
  speakers: [],
  talks: [],
  weekend_meetings: ["list"],
  publishers: [],
})

export const public_talk_coordinator = ac.newRole({
  speakers: ["list", "create", "update", "archive"],
  talks: ["create", "update", "archive", "flag"],
  weekend_meetings: ["schedule_public_talks", "list", "list_history"],
  publishers: [],
})

export const boe_coordinator = ac.newRole({
  speakers: ["list", "create", "update", "archive"],
  talks: ["create", "update", "archive", "flag"],
  weekend_meetings: [
    "schedule_public_talks",
    "schedule_rest",
    "list",
    "list_history",
    "manage_exceptions",
  ],
  publishers: ["list", "create", "update", "link_to_user"],
})

export const admin = ac.newRole({
  speakers: ["list", "create", "update", "archive"],
  talks: ["create", "update", "archive", "flag"],
  weekend_meetings: [
    "schedule_public_talks",
    "schedule_rest",
    "manage_exceptions",
    "list",
    "list_history",
  ],
  publishers: ["list", "create", "update", "link_to_user"],
})
