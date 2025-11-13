import type { statement } from "../utils/permissions/declare"

/**
 * Inferred permission types from the access control statement.
 * Adding new resources to the statement automatically propagates types throughout the codebase.
 */

// Infer the complete statement type
export type Statement = typeof statement

// Extract all resource names as a union type
// Example: "speakers" | "talks" | "weekend_meetings"
export type Resource = keyof Statement

// Generic type to get actions for any specific resource
// Example: ActionsFor<"speakers"> = "list" | "create" | "update" | "archive"
export type ActionsFor<R extends Resource> = Statement[R][number]

// Flexible PermissionsMap that automatically includes ALL resources from statement
// Uses Partial so each resource is optional
// Automatically updates when new resources are added to statement
export type PermissionsMap = Partial<{
	[K in Resource]: ActionsFor<K>[]
}>
