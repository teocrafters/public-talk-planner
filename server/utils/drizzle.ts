import { schema } from "hub:db"

// Re-export Drizzle utilities
export { sql, eq, and, or } from "drizzle-orm"

// Re-export schema for backward compatibility
export const tables = schema

// DEPRECATED: db is auto-imported on server-side
// Use `db` directly instead of useDrizzle()
export function useDrizzle() {
	return db
}

// Re-export types for backward compatibility
export type PublicTalk = typeof schema.publicTalks.$inferSelect
export type Publisher = typeof schema.publishers.$inferSelect
export type NewPublisher = typeof schema.publishers.$inferInsert
export type Speaker = typeof schema.speakers.$inferSelect
export type NewSpeaker = typeof schema.speakers.$inferInsert
