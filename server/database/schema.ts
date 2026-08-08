import {
  pgTable,
  pgEnum,
  text,
  integer,
  uuid,
  timestamp,
  boolean,
  date,
  jsonb,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core"
import { relations, sql } from "drizzle-orm"
import type { YYYYMMDD } from "../../shared/types/date"
import { organization, user } from "./auth-schema"
import { MEETING_EXCEPTION_TYPES } from "../../shared/constants/meeting-exceptions"
import {
  SPEAKER_SOURCE_TYPES,
  SPEAKER_SOURCE_TYPE_VALUES,
} from "../../shared/constants/speaker-sources"

export * from "./auth-schema"

// AGENT-NOTE: After modifying schema, ALWAYS prompt user to run: pnpm db:generate (NEVER run it automatically)

export const talkStatusEnum = pgEnum("talk_status", ["circuit_overseer", "will_be_replaced"])

export const meetingTypeEnum = pgEnum("meeting_type", ["weekend", "midweek"])

export const sexEnum = pgEnum("sex", ["male", "female"])

export const exceptionTypeEnum = pgEnum("exception_type", [
  MEETING_EXCEPTION_TYPES.CIRCUIT_ASSEMBLY,
  MEETING_EXCEPTION_TYPES.REGIONAL_CONVENTION,
  MEETING_EXCEPTION_TYPES.MEMORIAL,
])

export const speakerSourceTypeEnum = pgEnum("speaker_source_type", SPEAKER_SOURCE_TYPE_VALUES)

export const publicTalks = pgTable("public_talks", {
  id: uuid("id").primaryKey().defaultRandom(),
  no: text("no").notNull(),
  title: text("title").notNull(),
  multimediaCount: integer("multimedia_count").notNull().default(0),
  videoCount: integer("video_count").notNull().default(0),
  status: talkStatusEnum("status"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
})

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey(),
  userId: text("user_id").notNull(),
  userEmail: text("user_email").notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const speakers = pgTable("speakers", {
  id: uuid("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  congregationId: uuid("congregation_id")
    .notNull()
    .references(() => organization.id, { onDelete: "restrict" }),
  archived: boolean("archived").notNull().default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
})

export const speakerTalks = pgTable(
  "speaker_talks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    speakerId: uuid("speaker_id")
      .notNull()
      .references(() => speakers.id, { onDelete: "cascade" }),
    talkId: uuid("talk_id")
      .notNull()
      .references(() => publicTalks.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
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
export const publishers = pgTable("publishers", {
  id: uuid("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  sex: sexEnum("sex").notNull(),
  userId: uuid("user_id")
    .unique()
    .references(() => user.id, { onDelete: "set null" }),
  isElder: boolean("is_elder").notNull().default(false),
  isMinisterialServant: boolean("is_ministerial_servant").notNull().default(false),
  isRegularPioneer: boolean("is_regular_pioneer").notNull().default(false),
  canChairWeekendMeeting: boolean("can_chair_weekend_meeting").notNull().default(false),
  conductsWatchtowerStudy: boolean("conducts_watchtower_study").notNull().default(false),
  backupWatchtowerConductor: boolean("backup_watchtower_conductor").notNull().default(false),
  isReader: boolean("is_reader").notNull().default(false),
  offersPublicPrayer: boolean("offers_public_prayer").notNull().default(false),
  deliversPublicTalks: boolean("delivers_public_talks").notNull().default(false),
  isCircuitOverseer: boolean("is_circuit_overseer").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
})

export type Publisher = typeof publishers.$inferSelect
export type NewPublisher = typeof publishers.$inferInsert

export const meetingPrograms = pgTable("meeting_programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: meetingTypeEnum("type").notNull(),
  date: date("date").notNull().$type<YYYYMMDD>(),
  isCircuitOverseerVisit: boolean("is_circuit_overseer_visit").notNull().default(false),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
})

export const meetingProgramParts = pgTable("meeting_program_parts", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingProgramId: uuid("meeting_program_id")
    .notNull()
    .references(() => meetingPrograms.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  name: text("name"),
  // "order" is reserved in PostgreSQL: Drizzle quotes it, and raw SQL touching it must quote it too
  order: integer("order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
})

// Scheduled public talks (renamed from scheduledMeetings)
export const scheduledPublicTalks = pgTable(
  "scheduled_public_talks",
  {
    id: uuid("id").primaryKey(),
    date: date("date").notNull().$type<YYYYMMDD>(),
    meetingProgramId: uuid("meeting_program_id")
      .notNull()
      .references(() => meetingPrograms.id, { onDelete: "restrict" }),
    partId: uuid("part_id")
      .notNull()
      .references(() => meetingProgramParts.id, { onDelete: "restrict" }),
    // Speaker source type: visiting_speaker or local_publisher
    speakerSourceType: speakerSourceTypeEnum("speaker_source_type")
      .notNull()
      .default(SPEAKER_SOURCE_TYPES.VISITING_SPEAKER),
    // Speaker reference (for visiting speakers from external congregations)
    speakerId: uuid("speaker_id").references(() => speakers.id, { onDelete: "restrict" }),
    // Publisher reference (for local congregation publishers)
    publisherId: uuid("publisher_id").references(() => publishers.id, { onDelete: "restrict" }),
    talkId: uuid("talk_id").references(() => publicTalks.id, { onDelete: "restrict" }),
    customTalkTitle: text("custom_talk_title"),
    overrideValidation: boolean("override_validation").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
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
export const meetingScheduledParts = pgTable(
  "meeting_scheduled_parts",
  {
    id: uuid("id").primaryKey(),
    meetingProgramPartId: uuid("meeting_program_part_id")
      .notNull()
      .references(() => meetingProgramParts.id, { onDelete: "cascade" }),
    publisherId: uuid("publisher_id")
      .notNull()
      .references(() => publishers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  table => {
    return {
      uniquePublisherPerPart: uniqueIndex("meeting_scheduled_parts_part_unique").on(
        table.meetingProgramPartId
      ),
    }
  }
)

export const meetingExceptions = pgTable(
  "meeting_exceptions",
  {
    id: uuid("id").primaryKey(),
    date: date("date").notNull().$type<YYYYMMDD>(),
    exceptionType: exceptionTypeEnum("exception_type").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
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
