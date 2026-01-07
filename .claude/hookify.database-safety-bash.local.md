---
name: database-safety-bash
enabled: true
event: bash
action: block
pattern: (sqlite3.*migrations/|\.sql$|pnpm\s+db:generate|pnpm\s+db:push|drizzle-kit\s+(generate|push))
---

⛔ **BLOCKED: Unsafe Database Command**

You attempted to run a database command that violates the project's safety rules.

**What was blocked:**
- Manual SQL file execution
- Direct `pnpm db:generate` or `pnpm db:push` execution
- Manual drizzle-kit commands
- Direct sqlite3 access to migration files

**Why this is blocked:**
- Database migrations must be user-executed for safety
- Automated migration generation can cause issues
- Direct SQL execution bypasses schema validation

**Correct workflow:**

1. **Modify the schema**: Edit `server/database/schema.ts`
2. **Prompt the user**: Ask the user to run `pnpm db:generate`
3. **Never run automatically**: User must execute migration generation
4. **Commit together**: Schema + generated migration files

**See the database-migration skill for the complete workflow.**
