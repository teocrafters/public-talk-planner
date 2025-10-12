import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core"
import { user, organization } from "./auth-schema"

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

export const speakerTalks = sqliteTable("speaker_talks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  speakerId: text("speaker_id")
    .notNull()
    .references(() => speakers.id, { onDelete: "cascade" }),
  talkId: integer("talk_id")
    .notNull()
    .references(() => publicTalks.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => {
  return {
    speakerTalkUnique: uniqueIndex("speaker_talks_speaker_talk_unique").on(table.speakerId, table.talkId),
  }
})

export type Speaker = typeof speakers.$inferSelect
export type NewSpeaker = typeof speakers.$inferInsert
export type SpeakerTalk = typeof speakerTalks.$inferSelect
