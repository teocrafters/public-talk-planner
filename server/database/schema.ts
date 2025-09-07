import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export * from "./auth-schema"
export const publicTalks = sqliteTable("public_talks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  no: integer("no").notNull(),
  title: text("title").notNull(),
  hasMultimedia: integer("has_multimedia", { mode: "boolean" }).notNull(),
  hasVideo: integer("has_video", { mode: "boolean" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})
