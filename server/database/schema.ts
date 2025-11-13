import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"
import { organization } from "./auth-schema"

export * from "./auth-schema"

export const publicTalks = sqliteTable("public_talks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  no: text("no").notNull(),
  title: text("title").notNull(),
  multimediaCount: integer("multimedia_count").notNull().default(0),
  videoCount: integer("video_count").notNull().default(0),
  status: text("status").$type<"circuit_overseer" | "will_be_replaced" | null>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  userEmail: text("user_email").notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  timestamp: integer("timestamp", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const speakers = sqliteTable("speakers", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  congregationId: text("congregation_id")
    .notNull()
    .references(() => organization.id, { onDelete: "restrict" }),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  archivedAt: integer("archived_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const speakerTalks = sqliteTable(
  "speaker_talks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    speakerId: text("speaker_id")
      .notNull()
      .references(() => speakers.id, { onDelete: "cascade" }),
    talkId: integer("talk_id")
      .notNull()
      .references(() => publicTalks.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  table => {
    return {
      speakerTalkUnique: uniqueIndex("speaker_talks_speaker_talk_unique").on(
        table.speakerId,
        table.talkId
      ),
    }
  }
)

export type Speaker = typeof speakers.$inferSelect
export type NewSpeaker = typeof speakers.$inferInsert
export type SpeakerTalk = typeof speakerTalks.$inferSelect

export const meetingPrograms = sqliteTable("meeting_programs", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	type: text("type").$type<"weekend" | "midweek">().notNull(),
	name: text("name").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})

export const meetingProgramParts = sqliteTable("meeting_program_parts", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	meetingProgramId: integer("meeting_program_id")
		.notNull()
		.references(() => meetingPrograms.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	order: integer("order").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})

export const scheduledMeetings = sqliteTable(
	"scheduled_meetings",
	{
		id: text("id").primaryKey(),
		date: integer("date", { mode: "timestamp" }).notNull(),
		meetingProgramId: integer("meeting_program_id")
			.notNull()
			.references(() => meetingPrograms.id, { onDelete: "restrict" }),
		partId: integer("part_id")
			.notNull()
			.references(() => meetingProgramParts.id, { onDelete: "restrict" }),
		speakerId: text("speaker_id")
			.notNull()
			.references(() => speakers.id, { onDelete: "restrict" }),
		talkId: integer("talk_id").references(() => publicTalks.id, { onDelete: "restrict" }),
		customTalkTitle: text("custom_talk_title"),
		isCircuitOverseerVisit: integer("is_circuit_overseer_visit", { mode: "boolean" })
			.notNull()
			.default(false),
		overrideValidation: integer("override_validation", { mode: "boolean" })
			.notNull()
			.default(false),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
	},
	table => {
		return {
			uniqueSchedule: uniqueIndex("unique_schedule").on(
				table.date,
				table.meetingProgramId,
				table.partId
			),
		}
	}
)

export type MeetingProgram = typeof meetingPrograms.$inferSelect
export type NewMeetingProgram = typeof meetingPrograms.$inferInsert
export type MeetingProgramPart = typeof meetingProgramParts.$inferSelect
export type NewMeetingProgramPart = typeof meetingProgramParts.$inferInsert
export type ScheduledMeeting = typeof scheduledMeetings.$inferSelect
export type NewScheduledMeeting = typeof scheduledMeetings.$inferInsert

export const scheduledMeetingsRelations = relations(scheduledMeetings, ({ one }) => ({
	speaker: one(speakers, {
		fields: [scheduledMeetings.speakerId],
		references: [speakers.id],
	}),
	talk: one(publicTalks, {
		fields: [scheduledMeetings.talkId],
		references: [publicTalks.id],
	}),
	meetingProgram: one(meetingPrograms, {
		fields: [scheduledMeetings.meetingProgramId],
		references: [meetingPrograms.id],
	}),
	part: one(meetingProgramParts, {
		fields: [scheduledMeetings.partId],
		references: [meetingProgramParts.id],
	}),
}))

export const speakersRelations = relations(speakers, ({ one, many }) => ({
	congregation: one(organization, {
		fields: [speakers.congregationId],
		references: [organization.id],
	}),
	speakerTalks: many(speakerTalks),
	scheduledMeetings: many(scheduledMeetings),
}))

export const meetingProgramsRelations = relations(meetingPrograms, ({ many }) => ({
	parts: many(meetingProgramParts),
	scheduledMeetings: many(scheduledMeetings),
}))

export const meetingProgramPartsRelations = relations(meetingProgramParts, ({ one, many }) => ({
	meetingProgram: one(meetingPrograms, {
		fields: [meetingProgramParts.meetingProgramId],
		references: [meetingPrograms.id],
	}),
	scheduledMeetings: many(scheduledMeetings),
}))

export const publicTalksRelations = relations(publicTalks, ({ many }) => ({
	speakerTalks: many(speakerTalks),
	scheduledMeetings: many(scheduledMeetings),
}))

export const speakerTalksRelations = relations(speakerTalks, ({ one }) => ({
	speaker: one(speakers, {
		fields: [speakerTalks.speakerId],
		references: [speakers.id],
	}),
	talk: one(publicTalks, {
		fields: [speakerTalks.talkId],
		references: [publicTalks.id],
	}),
}))
