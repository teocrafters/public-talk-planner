# Backend Development Guidelines (Nitro + Nuxt 4)

Guidelines for developing the backend API using Nitro, Drizzle ORM, and Cloudflare D1 database.

## Core Principles

- **Serverless-first** - Cloudflare Workers with edge computing
- **Type-safe API routes** - Drizzle ORM with TypeScript
- **Validation at boundaries** - Zod schemas for all request validation
- **Batch operation safety for D1** - Use db.batch() for related operations on D1
- **Security-first** - Input validation, SQL injection prevention, proper error handling

## Project Structure

```
server/
├── api/                  # API route handlers
│   ├── speakers/
│   │   ├── index.get.ts  # GET /api/speakers
│   │   ├── index.post.ts # POST /api/speakers
│   │   └── [id].patch.ts # PATCH /api/speakers/:id
│   └── meetings/
├── database/             # Database schema and migrations
│   ├── schema.ts         # Drizzle schema definitions
│   └── migrations/       # Generated SQL migrations
├── tasks/                # Background task definitions
│   └── seed.ts
└── utils/                # Server utilities (auto-imported)
    ├── drizzle.ts
    └── validation.ts
```

**Key Points**:

- API routes use HTTP method in filename: `.get.ts`, `.post.ts`, `.patch.ts`, `.delete.ts`
- Utilities in `server/utils/` are auto-imported in server context
- NEVER manually execute `.sql` files - use schema modifications
- ALWAYS prompt user to run `pnpm db:generate` after schema changes

## Database Patterns with Drizzle ORM

### Schema Definition

```typescript
// server/db/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const speakers = sqliteTable("speakers", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  congregation: text("congregation"),
  isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

// Export types for use in application
export type Speaker = typeof speakers.$inferSelect
export type NewSpeaker = typeof speakers.$inferInsert
```

**Key Points**:

- Use descriptive table and column names
- ALWAYS include `createdAt` and `updatedAt` timestamps
- Use `mode: "timestamp"` for datetime fields
- Use `mode: "boolean"` for boolean fields (SQLite compatibility)
- Store custom dates as unix timestamps (integer, seconds)
- Export TypeScript types using `$inferSelect` and `$inferInsert`

### Database Access

```typescript
// server/api/speakers/index.get.ts
import { eq } from "drizzle-orm"

export default defineEventHandler(async event => {
  const db = useDrizzle()

  const speakers = await db
    .select()
    .from(tables.speakers)
    .where(eq(tables.speakers.isArchived, false))

  return speakers
})
```

**Available via `useDrizzle()`**:

- Database instance: `const db = useDrizzle()`
- Operators: `eq`, `and`, `or`, `sql`, `gte`, `lte`, `desc`, `asc`
- Tables: `tables.speakers`, `tables.meetings`, etc.

### Cloudflare D1 Transaction Limitations

⛔ **CRITICAL:** Cloudflare D1 does NOT support traditional SQL transactions (`BEGIN TRANSACTION`, `SAVEPOINT`).

**Why D1 is Different:**
- D1 is a serverless SQLite database running in Cloudflare Workers
- Traditional SQL transactions don't work in the Workers environment
- Drizzle's `db.transaction()` uses SQL BEGIN which D1 will reject

**Recommended Alternative:**

1. **Use `db.batch()` for atomic operations** (D1-compatible approach)

### Batch Operations Pattern (D1-Compatible)

```typescript
// Use batch() for operations affecting multiple tables on D1
export default defineEventHandler(async event => {
  const db = useDrizzle()

  // All operations execute atomically - if any fails, all are rolled back
  await db.batch([
    // Insert talk
    db.insert(tables.talks).values({
      id: crypto.randomUUID(),
      title: "New Talk",
      speakerId: speaker.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),

    // Create schedule entry (talkId must be known beforehand)
    db.insert(tables.schedules).values({
      id: crypto.randomUUID(),
      talkId: talkId,
      scheduledDate: dateTimestamp,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  ])
})
```

**Key Points**:

- USE `db.batch()` when updating multiple related records (D1 requirement)
- ROLLBACK happens automatically on any error within batch
- KEEP batches short and focused
- MOVE dependent queries outside the batch (e.g., fetch data first)

### Migration Workflow (CRITICAL)

**NEVER execute `.sql` files manually** - All database changes MUST be through schema modifications.

**Workflow**:

1. Modify `server/db/schema.ts`
2. Prompt user: "Please run `pnpm db:generate`"
3. User generates migration files
4. Review generated migration before committing
5. Commit schema + migration files together

**USE SKILL**: `database-migration-workflow` for all schema changes

**Reference**: `.agents/database-patterns.md`

## API Routes & HTTP Methods

### Route Structure

```
server/api/
└── speakers/
    ├── index.get.ts       # GET /api/speakers (list all)
    ├── index.post.ts      # POST /api/speakers (create)
    ├── [id].get.ts        # GET /api/speakers/:id (get one)
    ├── [id].patch.ts      # PATCH /api/speakers/:id (update)
    └── [id].delete.ts     # DELETE /api/speakers/:id (remove)
```

### HTTP Method Usage

- **POST** - Creating resources (accepts body)
- **PUT** - Complete replacement (accepts body)
- **PATCH** - Partial updates (accepts body)
- **GET** - Retrieving data (no body)
- **DELETE** - Removing resources (no body)

### Request Validation

**ALWAYS validate request bodies with Zod schemas**:

```typescript
// server/api/speakers/index.post.ts
import { createSpeakerSchema } from "#shared/utils/schemas"

export default defineEventHandler(async event => {
  // Validate request body
  const body = await validateBody(event, createSpeakerSchema)

  const db = useDrizzle()

  const [speaker] = await db
    .insert(tables.speakers)
    .values({
      id: crypto.randomUUID(),
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      congregation: body.congregation,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  return speaker
})
```

**Key Points**:

- Schemas are auto-imported from `shared/utils/schemas/`
- `validateBody()` utility returns typed, validated data
- Validation errors return HTTP 400 with error details
- NEVER trust user input without validation

## Zod Schema Patterns

### Schema Factory Pattern

```typescript
// shared/utils/schemas/speaker.ts
import { z } from "zod"

export function createSpeakerSchema(t: (key: string) => string) {
  return z.object({
    firstName: z.string().min(1, t("validation.firstNameRequired")).max(100),
    lastName: z.string().min(1, t("validation.lastNameRequired")).max(100),
    email: z.string().email(t("validation.emailInvalid")).optional(),
    phone: z.string().max(20).optional(),
    congregation: z.string().max(200).optional(),
  })
}

// Export TypeScript type
export type CreateSpeakerInput = z.infer<ReturnType<typeof createSpeakerSchema>>

// Update schema (partial)
export function updateSpeakerSchema(t: (key: string) => string) {
  return createSpeakerSchema(t).partial()
}
```

**Key Points**:

- USE factory pattern with translation function parameter
- EMBED i18n keys in error messages
- EXPORT TypeScript types using `z.infer<ReturnType<...>>`
- CREATE separate schemas for create/update operations
- UPDATE barrel file `shared/utils/schemas/index.ts` when adding schemas

### Schema File Organization

```
shared/utils/schemas/
├── index.ts           # Barrel file (exports all schemas)
├── speaker.ts         # Speaker validation schemas
├── meeting.ts         # Meeting validation schemas
└── talk.ts            # Talk validation schemas
```

**USE SKILL**: `zod-validation-schema-creation` when creating new API endpoints

## Validation & Error Handling

### Input Validation at Boundaries

```typescript
import { createSpeakerSchema } from "#shared/utils/schemas"

export default defineEventHandler(async event => {
  // Validate at API boundary
  const body = await validateBody(event, createSpeakerSchema)

  // body is now fully typed and validated
  const db = useDrizzle()

  try {
    const [speaker] = await db
      .insert(tables.speakers)
      .values({
        id: crypto.randomUUID(),
        ...body,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return speaker
  } catch (err) {
    // Database errors
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create speaker",
    })
  }
})
```

### Validation Error Response Format

When validation fails, `validateBody()` returns:

```json
{
  "statusCode": 400,
  "statusMessage": "Validation Error",
  "data": {
    "errors": [
      { "field": "firstName", "messageKey": "validation.firstNameRequired" },
      { "field": "email", "messageKey": "validation.emailInvalid" }
    ]
  }
}
```

Frontend uses `messageKey` to display translated error messages via `$t(error.messageKey)`.

### Security Considerations

```typescript
// ✅ CORRECT: Parameterized queries (SQL injection safe)
const speaker = await db.select().from(tables.speakers).where(eq(tables.speakers.id, userId))

// ✅ CORRECT: Input validation
const body = await validateBody(event, createSpeakerSchema)

// ✅ CORRECT: Safe error messages (no internal details)
throw createError({
  statusCode: 404,
  statusMessage: "Speaker not found",
})

// ❌ WRONG: Never concatenate user input into SQL
// ❌ WRONG: Never expose internal error details to client
// ❌ WRONG: Never skip input validation
```

**Reference**: `.agents/security-guidelines.md`

## Background Tasks

```typescript
// server/tasks/seed.ts
export default defineTask({
  meta: {
    name: "db:seed",
    description: "Seed database with initial data",
  },
  async run() {
    const db = useDrizzle()

    // Task implementation
    await db.insert(tables.speakers).values([
      // Seed data
    ])

    return { result: "Database seeded successfully" }
  },
})
```

**Key Points**:

- Define tasks in `server/tasks/` directory
- Use descriptive names and descriptions
- Handle errors and provide meaningful logs
- Run with: `pnpm task db:seed`

## Server Utils & Composables

### useDrizzle() Composable

```typescript
// server/utils/drizzle.ts
import { drizzle } from "drizzle-orm/d1"
export { sql, eq, and, or, gte, lte, desc, asc } from "drizzle-orm"
import * as schema from "~/server/db/schema"

export function useDrizzle() {
  return drizzle(hubDatabase(), { schema })
}

export const tables = schema
```

**Auto-imported in server context**:

- `useDrizzle()` - Database instance
- `eq`, `and`, `or`, `sql` - Query operators
- `tables` - Schema tables

### Common Patterns

```typescript
// Query with operators
import { eq, and, gte } from "drizzle-orm"

const speakers = await db
  .select()
  .from(tables.speakers)
  .where(and(eq(tables.speakers.isArchived, false), gte(tables.speakers.createdAt, startDate)))

// Ordering
const speakers = await db
  .select()
  .from(tables.speakers)
  .orderBy(desc(tables.speakers.createdAt))
  .limit(10)
```

## Common Anti-Patterns

### ❌ Database Anti-Patterns

```typescript
// WRONG: Manual SQL execution
sqlite3 db.sqlite < migrations/0001_migration.sql

// WRONG: Running db:generate automatically
await $`pnpm db:generate`

// WRONG: Editing migration files manually
// WRONG: Committing schema without migration
```

### ❌ Validation Anti-Patterns

```typescript
// WRONG: No input validation
export default defineEventHandler(async event => {
  const body = await readBody(event) // Unvalidated!
  // ... use body directly
})

// CORRECT: Always validate
export default defineEventHandler(async event => {
  const body = await validateBody(event, createSpeakerSchema)
  // ... use validated body
})
```

### ❌ Security Anti-Patterns

```typescript
// WRONG: String concatenation (SQL injection)
const query = `SELECT * FROM speakers WHERE id = '${userId}'`

// WRONG: Exposing internal errors
catch (err) {
  throw createError({
    statusCode: 500,
    statusMessage: err.message // Leaks internal details
  })
}

// CORRECT: Parameterized queries and safe errors
const speaker = await db.select().from(tables.speakers).where(eq(tables.speakers.id, userId))
throw createError({ statusCode: 500, statusMessage: "Operation failed" })
```

## Available Skills

Use these skills during backend development:

- **database-migration-workflow** - Guide through schema modifications
- **zod-validation-schema-creation** - Create validation schemas with i18n
- **pre-commit-quality-check** - Run all quality checks before commit

## References

### Detailed Documentation

- Database patterns: `.agents/database-patterns.md`
- Security guidelines: `.agents/security-guidelines.md`

### Official Documentation (Context7)

- Drizzle ORM: Queries, schema definition, migrations
- Nitro: Server engine, API routes, event handlers
- Nuxt 4: Server utilities, composables
- Cloudflare D1: Database platform, Workers integration
