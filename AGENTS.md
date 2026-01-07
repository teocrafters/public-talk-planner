# AGENTS.md

This file provides essential guidance to Claude Code when working with this repository.

## Project Fundamentals

**Tech Stack:**
- Frontend: Nuxt 4 + Vue 3 + TypeScript + @nuxt/ui (Tailwind CSS)
- Backend: Nitro server + Drizzle ORM + D1 Database
- Authentication: Better Auth
- i18n: @nuxtjs/i18n (Polish primary)
- Testing: Playwright E2E
- Deployment: Cloudflare Workers + NuxtHub

**Directory Structure:**
```
app/                 # Frontend (see app/AGENTS.md)
server/              # Backend (see server/AGENTS.md)
shared/              # Universal code (types, utils)
.claude/skills/      # Workflow automation
.claude/hooks/       # Active enforcement
.agents/             # Reference documentation
```

**Package Manager:** Always use `pnpm` (never npm). Use `pnpm dlx` instead of `npx`.

## Immutable Rules

### Auto-Import System

**Auto-imported directories:**
- `app/components/`, `app/composables/`, `app/utils/`
- `server/utils/`
- `shared/utils/*.ts`, `shared/types/*.ts` (direct files only)

**Critical:** Use `#shared` alias for subdirectory imports. Never import direct auto-imported files.

```typescript
// ✅ Correct
import { createScheduleSchema } from "#shared/utils/schemas"

// ❌ Wrong
import { AUDIT_EVENTS } from "#shared/utils/audit-events" // auto-imported
```

### Database Safety (Enforced by Hooks)

- NEVER execute .sql files manually
- NEVER run `pnpm db:generate` automatically - prompt user
- NEVER edit migration files manually
- ALWAYS commit schema + migration together

### Testing Requirements (Enforced by Hooks)

- ALWAYS add `data-testid` to interactive elements during development
- USE naming: `{feature}-{element}-{type}` in kebab-case
- NEVER use CSS classes or text as selectors

### SSR Requirements

- ALWAYS use `useFetch()` or `useAsyncData()` (never `$fetch()` in components)
- ALWAYS await composables for proper hydration
- ALWAYS handle loading and error states

### Type Safety

- NEVER use `@ts-expect-error` or `@ts-ignore`
- AVOID `any` - find or create proper types
- TypeScript strict mode with `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`

### i18n

- ALWAYS use `$t()` for UI text (never hardcode Polish)
- VERIFY keys exist in both `pl.json` and `en.json`

## Code Style Essentials

**Formatting:**
- Tabs for indentation (2 spaces for YAML/JSON/MD)
- Double quotes, no semicolons, trailing commas
- 100 character line limit
- Imports: `consistent-type-imports`

**Naming Conventions:**
- `camelCase`: Variables, functions
- `PascalCase`: Components, classes, types
- `ALL_CAPS`: Constants (with `as const`)
- `kebab-case`: Files, directories
- Generic types: Prefix with `T` (TKey, TValue)

**Constants Pattern:**
```typescript
export const SPEAKER_SOURCE_TYPES = {
  VISITING_SPEAKER: "visiting_speaker",
  LOCAL_PUBLISHER: "local_publisher",
} as const
```

## Available Resources

### Skills (Workflow Automation)

**Quality & Validation:**
- `database-migration` - Safe schema modification workflow
- `i18n-validation` - Validate translation keys in both locales
- `e2e-testing` - Complete E2E test creation workflow

**Development Workflows:**
- `ssr-data-fetching` - SSR-compatible data fetching
- `zod-schema-creation` - Zod schemas with i18n
- `nuxt-ui-integration` - Verify Nuxt UI component usage
- `date-time-implementation` - Unix timestamps with dayjs
- `playwright-fixtures-implementation` - Playwright fixtures and Page Object Models

### Hooks (Active Enforcement)

**BLOCK Operations:**
- `database-safety-bash` - Blocks manual database commands
- `database-safety-files` - Blocks migration file edits
- `git-safety` - Blocks force push to main/master

**WARN Operations:**
- `git-force-warn` - Suggests `--force-with-lease` over `--force`
- `security-validation` - Detects security vulnerabilities
- `test-readiness` - Reminds about data-testid attributes

### Reference Documentation

**Frontend (.agents/):**
- `vue-conventions.md` - Vue 3 patterns
- `nuxt-ui-4-integration.md` - Nuxt UI components
- `tailwind-patterns.md` - Tailwind CSS guidelines
- `e2e-testing-patterns.md` - Comprehensive testing reference
- `i18n-patterns.md` - Internationalization deep dive

**Backend (.agents/):**
- `database-patterns.md` - Drizzle ORM deep dive
- `security-guidelines.md` - Security best practices

**Official (Context7):**
- Nuxt 4, Vue 3, Drizzle ORM, Tailwind CSS v4

### Subdirectory Guides

- `app/AGENTS.md` - Frontend development (SSR, Vue, components)
- `server/AGENTS.md` - Backend development (API, database)

## Common Pitfalls

- Using `npm` instead of `pnpm`
- Importing auto-imported files explicitly
- Using `~~/shared` instead of `#shared`
- Hardcoding Polish text instead of `$t()`
- Running `pnpm db:generate` automatically
- Missing `data-testid` on interactive elements
- Using `$fetch()` directly in components

## Files to NOT Modify

- Lock files, `.gitignore`, `.npmignore`
- Environment files (`.env.*`)
- Generated files (`.d.ts`, `server/database/migrations/*.sql`)
- Core configs (`nuxt.config.ts`, `wrangler.toml`, `drizzle.config.ts`)

## Development Commands

**Setup:** `pnpm install`

**Dev:** `pnpm dev` (localhost:3000)

**Quality:** `pnpm ci` (lint + typecheck + format)

**Database:** User runs `pnpm db:generate` after schema changes

**Build:** `pnpm build`, `pnpm preview`
