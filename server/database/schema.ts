import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export * from "./auth-schema"
export const publicTalks = sqliteTable("public_talks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  no: integer("no").notNull(),
  title: text("title").notNull(),
  multimediaCount: integer("multimedia_count").notNull().default(0),
  videoCount: integer("video_count").notNull().default(0),
  status: text("status").$type<"circuit_overseer" | "will_be_replaced" | null>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})
