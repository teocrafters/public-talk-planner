import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { user } from "./auth-schema"

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
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
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
