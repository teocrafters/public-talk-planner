import { sqliteTable, text, integer, uniqueIndex, check } from "drizzle-orm/sqlite-core"
import { relations, sql } from "drizzle-orm"
import type { YYYYMMDD } from "../../shared/types/date"
import { organization, user } from "./auth-schema"
import { SPEAKER_SOURCE_TYPES } from "../../shared/constants/speaker-sources"

export * from "./auth-schema"

// AGENT-NOTE: After modifying schema, ALWAYS prompt user to run: pnpm db:generate (NEVER run it automatically)

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

// Publishers table - Local congregation publishers
export const publishers = sqliteTable("publishers", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  sex: text("sex", { enum: ["male", "female"] }).notNull(),
  userId: text("user_id")
    .unique()
    .references(() => user.id, { onDelete: "set null" }),
  isElder: integer("is_elder", { mode: "boolean" }).notNull().default(false),
  isMinisterialServant: integer("is_ministerial_servant", { mode: "boolean" })
    .notNull()
    .default(false),
  isRegularPioneer: integer("is_regular_pioneer", { mode: "boolean" }).notNull().default(false),
  canChairWeekendMeeting: integer("can_chair_weekend_meeting", { mode: "boolean" })
    .notNull()
    .default(false),
  conductsWatchtowerStudy: integer("conducts_watchtower_study", { mode: "boolean" })
    .notNull()
    .default(false),
  backupWatchtowerConductor: integer("backup_watchtower_conductor", { mode: "boolean" })
    .notNull()
    .default(false),
  isReader: integer("is_reader", { mode: "boolean" }).notNull().default(false),
  offersPublicPrayer: integer("offers_public_prayer", { mode: "boolean" }).notNull().default(false),
  deliversPublicTalks: integer("delivers_public_talks", { mode: "boolean" })
    .notNull()
    .default(false),
  isCircuitOverseer: integer("is_circuit_overseer", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export type Publisher = typeof publishers.$inferSelect
export type NewPublisher = typeof publishers.$inferInsert

export const meetingPrograms = sqliteTable("meeting_programs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").$type<"weekend" | "midweek">().notNull(),
  date: text("date").notNull().$type<YYYYMMDD>(),
  isCircuitOverseerVisit: integer("is_circuit_overseer_visit", { mode: "boolean" })
    .notNull()
    .default(false),
  name: text("name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})

export const meetingProgramParts = sqliteTable("meeting_program_parts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  meetingProgramId: integer("meeting_program_id")
    .notNull()
    .references(() => meetingPrograms.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  name: text("name"),
  order: integer("order").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})

// Scheduled public talks (renamed from scheduledMeetings)
export const scheduledPublicTalks = sqliteTable(
  "scheduled_public_talks",
  {
    id: text("id").primaryKey(),
    date: text("date").notNull().$type<YYYYMMDD>(),
    meetingProgramId: integer("meeting_program_id")
      .notNull()
      .references(() => meetingPrograms.id, { onDelete: "restrict" }),
    partId: integer("part_id")
      .notNull()
      .references(() => meetingProgramParts.id, { onDelete: "restrict" }),
    // Speaker source type: visiting_speaker or local_publisher
    speakerSourceType: text("speaker_source_type")
      .notNull()
      .default(SPEAKER_SOURCE_TYPES.VISITING_SPEAKER),
    // Speaker reference (for visiting speakers from external congregations)
    speakerId: text("speaker_id").references(() => speakers.id, { onDelete: "restrict" }),
    // Publisher reference (for local congregation publishers)
    publisherId: text("publisher_id").references(() => publishers.id, { onDelete: "restrict" }),
    talkId: integer("talk_id").references(() => publicTalks.id, { onDelete: "restrict" }),
    customTalkTitle: text("custom_talk_title"),
    overrideValidation: integer("override_validation", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  table => {
    return {
      uniqueSchedule: uniqueIndex("unique_public_talk_schedule").on(
        table.date,
        table.meetingProgramId,
        table.partId
      ),
      // Ensure exactly one of speakerId or publisherId is set
      speakerOrPublisherCheck: check(
        "speaker_or_publisher_check",
        sql`(speaker_id IS NOT NULL AND publisher_id IS NULL) OR (speaker_id IS NULL AND publisher_id IS NOT NULL)`
      ),
    }
  }
)

// Meeting scheduled parts - Non-public-talk assignments
export const meetingScheduledParts = sqliteTable(
  "meeting_scheduled_parts",
  {
    id: text("id").primaryKey(),
    meetingProgramPartId: integer("meeting_program_part_id")
      .notNull()
      .references(() => meetingProgramParts.id, { onDelete: "cascade" }),
    publisherId: text("publisher_id")
      .notNull()
      .references(() => publishers.id, { onDelete: "restrict" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  table => {
    return {
      uniquePublisherPerPart: uniqueIndex("meeting_scheduled_parts_part_unique").on(
        table.meetingProgramPartId
      ),
    }
  }
)

export const meetingExceptions = sqliteTable(
  "meeting_exceptions",
  {
    id: text("id").primaryKey(),
    date: text("date").notNull().$type<YYYYMMDD>(),
    exceptionType: text("exception_type")
      .$type<"circuit_assembly" | "regional_convention" | "memorial">()
      .notNull(),
    description: text("description"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  table => {
    return {
      uniqueDate: uniqueIndex("meeting_exceptions_date_unique").on(table.date),
    }
  }
)

export type MeetingProgram = typeof meetingPrograms.$inferSelect
export type NewMeetingProgram = typeof meetingPrograms.$inferInsert
export type MeetingProgramPart = typeof meetingProgramParts.$inferSelect
export type NewMeetingProgramPart = typeof meetingProgramParts.$inferInsert
export type ScheduledPublicTalk = typeof scheduledPublicTalks.$inferSelect
export type NewScheduledPublicTalk = typeof scheduledPublicTalks.$inferInsert
export type MeetingScheduledPart = typeof meetingScheduledParts.$inferSelect
export type NewMeetingScheduledPart = typeof meetingScheduledParts.$inferInsert
export type MeetingException = typeof meetingExceptions.$inferSelect
export type NewMeetingException = typeof meetingExceptions.$inferInsert

// Relations
export const publishersRelations = relations(publishers, ({ one, many }) => ({
  user: one(user, {
    fields: [publishers.userId],
    references: [user.id],
  }),
  meetingScheduledParts: many(meetingScheduledParts),
  scheduledPublicTalks: many(scheduledPublicTalks),
}))

export const scheduledPublicTalksRelations = relations(scheduledPublicTalks, ({ one }) => ({
  speaker: one(speakers, {
    fields: [scheduledPublicTalks.speakerId],
    references: [speakers.id],
  }),
  publisher: one(publishers, {
    fields: [scheduledPublicTalks.publisherId],
    references: [publishers.id],
  }),
  talk: one(publicTalks, {
    fields: [scheduledPublicTalks.talkId],
    references: [publicTalks.id],
  }),
  meetingProgram: one(meetingPrograms, {
    fields: [scheduledPublicTalks.meetingProgramId],
    references: [meetingPrograms.id],
  }),
  part: one(meetingProgramParts, {
    fields: [scheduledPublicTalks.partId],
    references: [meetingProgramParts.id],
  }),
}))

export const meetingScheduledPartsRelations = relations(meetingScheduledParts, ({ one }) => ({
  part: one(meetingProgramParts, {
    fields: [meetingScheduledParts.meetingProgramPartId],
    references: [meetingProgramParts.id],
  }),
  publisher: one(publishers, {
    fields: [meetingScheduledParts.publisherId],
    references: [publishers.id],
  }),
}))

export const speakersRelations = relations(speakers, ({ one, many }) => ({
  congregation: one(organization, {
    fields: [speakers.congregationId],
    references: [organization.id],
  }),
  speakerTalks: many(speakerTalks),
  scheduledPublicTalks: many(scheduledPublicTalks),
}))

export const meetingProgramsRelations = relations(meetingPrograms, ({ many }) => ({
  parts: many(meetingProgramParts),
  scheduledPublicTalks: many(scheduledPublicTalks),
}))

export const meetingProgramPartsRelations = relations(meetingProgramParts, ({ one, many }) => ({
  meetingProgram: one(meetingPrograms, {
    fields: [meetingProgramParts.meetingProgramId],
    references: [meetingPrograms.id],
  }),
  scheduledPublicTalks: many(scheduledPublicTalks),
  meetingScheduledParts: many(meetingScheduledParts),
}))

export const publicTalksRelations = relations(publicTalks, ({ many }) => ({
  speakerTalks: many(speakerTalks),
  scheduledPublicTalks: many(scheduledPublicTalks),
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
