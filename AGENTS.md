# AGENTS.md

This file provides guidance to Claude Code when working with code in this repository.

## Package Manager

Always use `pnpm` - never npm. Use `pnpm dlx` instead of `npx`.

## Development Commands

### Setup

```bash
pnpm install
```

### Development

```bash
pnpm dev          # Start dev server on localhost:3000
pnpm build        # Build for production
pnpm preview      # Preview production build locally
```

### Code Quality

```bash
pnpm lint:fix     # Run ESLint with auto-fix
pnpm typecheck    # Run TypeScript type checking
pnpm format       # Format code with Prettier
pnpm ci           # Run all checks (lint + typecheck + format)
```

### Database

```bash
pnpm db:generate  # Generate Drizzle migrations (USER must run after schema changes)
```

## Architecture

Nuxt 4 Full-Stack Application for Cloudflare Deployment:

- Frontend: Nuxt 4 + Vue 3 + TypeScript + @nuxt/ui (Tailwind CSS)
- Backend: Nitro server + Drizzle ORM + D1 Database
- Authentication: Better Auth
- Internationalization: @nuxtjs/i18n with Polish primary language
- Testing: Playwright for E2E
- Deployment: Cloudflare Workers + NuxtHub + D1

## Code Style Essentials

- TypeScript: Strict mode with `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`
- Imports: Always use `consistent-type-imports`
- Use tabs for indentation (2 spaces for YAML/JSON/MD)
- Use double quotes, no semicolons, trailing commas
- Always keep 100 character line limit
- Never use `@ts-expect-error` or `@ts-ignore` to suppress type errors
- Avoid `any` - find or create proper types

### Naming Conventions

- `camelCase`: Variables and functions
- `PascalCase`: Components, classes, types
- `ALL_CAPS`: Constants with `as const`
- `kebab-case`: File and directory names
- Generic types: Prefix with `T` (TKey, TValue, TData)

## Project Structure

```
app/                 # Frontend (see app/AGENTS.md)
├── components/      # Vue components (auto-imported)
├── composables/     # Vue composables (auto-imported)
├── pages/           # File-based routing
└── utils/           # Client utilities (auto-imported)

server/              # Backend (see server/AGENTS.md)
├── api/             # API route handlers
├── database/        # Schema and migrations
└── utils/           # Server utilities (auto-imported)

shared/              # Universal code (both contexts)
├── types/           # TypeScript types (auto-imported)
└── utils/           # Pure functions (auto-imported)
```

## Nuxt 4 Auto-Import System

**Directory Auto-Imports**:
- `app/components/` - Vue components auto-imported in templates
- `app/composables/` - Composables auto-imported everywhere
- `app/utils/` - Client utilities auto-imported
- `server/utils/` - Server utilities auto-imported in server context
- `shared/utils/*.ts` - ONLY direct files auto-imported
- `shared/types/*.ts` - ONLY direct files auto-imported

**Critical Import Rules**:
- USE `#shared` alias for imports from `shared/` subdirectories
- DO NOT import direct files from `shared/utils/` or `shared/types/` (auto-imported)
- DO NOT import from `app/utils/` (auto-imported)
- NEVER use `~~/shared` alias (use `#shared` instead)

**Examples**:
```typescript
// ✅ Correct: Direct files auto-imported
const event = AUDIT_EVENTS.USER_LOGIN // from shared/utils/audit-events.ts
const today = getToday() // from shared/utils/date.ts

// ✅ Correct: Subdirectories use #shared
import { createScheduleSchema } from "#shared/utils/schemas"
import { SPEAKER_SOURCE_TYPES } from "#shared/constants/speaker-sources"

// ❌ Wrong: Don't import direct files
import { AUDIT_EVENTS } from "#shared/utils/audit-events"
```

## Shared Code Pattern

The `shared/` directory contains universal code working in both server and client contexts.

**Requirements**:
- NEVER import Vue-specific code (ref, reactive, components)
- NEVER import Nitro-specific code (defineEventHandler, H3 utilities)
- USE only pure TypeScript/JavaScript

**Import Patterns**:
- Direct files (`shared/utils/audit-events.ts`) → Auto-imported
- Subdirectories (`shared/utils/schemas/`) → Require `#shared` import

## Constants Pattern

```typescript
// shared/constants/speaker-sources.ts
export const SPEAKER_SOURCE_TYPES = {
  VISITING_SPEAKER: "visiting_speaker",
  LOCAL_PUBLISHER: "local_publisher",
} as const

export type SpeakerSourceType = typeof SPEAKER_SOURCE_TYPES[keyof typeof SPEAKER_SOURCE_TYPES]

// Usage (auto-imported)
const sourceType = SPEAKER_SOURCE_TYPES.VISITING_SPEAKER
```

**Rules**:
- DECLARE constants with ALL_CAPS using `as const`
- PLACE shared constants in `shared/constants/`
- IMPORT using `#shared/constants/*`

## CRITICAL RULES SUMMARY

### Database Rules

⛔ **NEVER execute .sql files manually** - All changes through schema modifications
⛔ **NEVER run `pnpm db:generate` automatically** - ALWAYS prompt user to execute
⛔ **NEVER edit migration files manually** - Generated files stay unchanged
⛔ **ALWAYS commit schema + migration together**

**USE SKILL**: `database-migration-workflow` for all schema changes

**REFERENCE**: `server/AGENTS.md`, `.agents/database-patterns.md`

### Testing Rules

⛔ **ALWAYS add data-testid to ALL interactive elements**
⛔ **USE data-testid as PRIMARY selector** - NEVER use CSS classes or text
⛔ **FOLLOW naming**: `{feature}-{element}-{type}` in kebab-case
⛔ **ADD test IDs DURING development** - Not retroactively

**USE SKILL**: `test-ready-component-check` before marking component complete

**REFERENCE**: `app/AGENTS.md`, `.agents/e2e-testing-patterns.md`

### Import Rules

⛔ **USE #shared for subdirectories** - Never ~~/shared
⛔ **DO NOT import shared/utils/ direct files** - They're auto-imported
⛔ **DO NOT import app/utils/** - Auto-imported by Nuxt

### SSR Rules

⛔ **ALWAYS use useFetch() or useAsyncData()** - NEVER $fetch() in components
⛔ **ALWAYS await the composable** - Required for SSR hydration
⛔ **ALWAYS handle loading and error states**

**USE SKILL**: `ssr-data-fetching-implementation` when adding data fetching

**REFERENCE**: `app/AGENTS.md`

### Type Safety Rules

⛔ **NEVER use @ts-expect-error or @ts-ignore**
⛔ **AVOID any type** - Find or create proper types
⛔ **ALWAYS declare function parameter and return types**

### i18n Rules

⛔ **ALWAYS use $t() for UI text** - NEVER hardcode Polish text
⛔ **VERIFY keys exist in pl.json AND en.json**
⛔ **MAINTAIN Polish-first strategy**

**USE SKILL**: `i18n-key-validation` when adding translation keys

**REFERENCE**: `app/AGENTS.md`, `.agents/i18n-patterns.md`

## Git Workflow

### Commit Standards

- Conventional commits: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- Scopes: `ui`, `api`, `auth`, `i18n`, `db`, `test`
- Granular commits: One logical change per commit

### Pre-commit Process

**USE SKILL**: `pre-commit-quality-check` before every commit

**Manual steps**:
1. Run `pnpm ci` (lint + typecheck + format)
2. If schema changed: Ask user to run `pnpm db:generate`
3. Test critical functionality manually
4. Verify current branch before force operations

### Pre-push Process

**USE SKILL**: `git-pre-flight-check` before pushing

**Safety checks**:
- Verify not pushing to main/master
- Use `--force-with-lease` for force pushes
- Ensure quality checks passed

## Common Pitfalls

- Using `npm` instead of `pnpm`
- Not following established project structure
- Using incorrect import patterns (#shared)
- Hardcoding Polish text instead of using $t()
- Executing SQL files manually
- Running `pnpm db:generate` without user confirmation
- Not adding data-testid to components during development
- Using $fetch() directly in components (breaks SSR)

## Files to NOT Modify

- `.gitignore`, `.npmignore`, lock files
- Environment files (`.env.*`)
- Generated type definitions (`.d.ts`)
- Core config files (`nuxt.config.ts`, `wrangler.toml`, `drizzle.config.ts`)
- Migration files in `server/database/migrations/`

## Anchor Comments System

Use specially formatted comments for inline knowledge:

- Use `AGENT-NOTE:`, `AGENT-TODO:`, or `AGENT-QUESTION:` (all-caps prefix)
- Keep concise (≤ 120 chars)
- Before scanning files, try to locate existing anchors first
- Update relevant anchors when modifying code
- Do not remove without explicit instruction

Example: `// AGENT-NOTE: Performance-critical path; avoid extra allocations`

## Directory-Specific Guidelines

- **Frontend (SSR + Vue)**: See `app/AGENTS.md`
- **Backend (API + DB)**: See `server/AGENTS.md`

## Available Skills

Workflow automation skills for common tasks:

### Quality & Validation
- **pre-commit-quality-check** - Run lint, typecheck, format before commit
- **git-pre-flight-check** - Verify safe git operations before push
- **i18n-key-validation** - Validate translation keys in pl.json and en.json
- **test-ready-component-check** - Verify component ready for E2E testing

### Development Workflows
- **database-migration-workflow** - Guide through schema modifications
- **ssr-data-fetching-implementation** - Implement SSR-compatible data fetching
- **zod-validation-schema-creation** - Create Zod schemas with i18n
- **nuxt-ui-component-integration** - Verify Nuxt UI component usage
- **e2e-test-workflow** - Complete E2E test creation workflow

## Specialized Documentation

### Frontend Development
- `.agents/vue-conventions.md` - Vue 3 patterns and best practices
- `.agents/nuxt-ui-4-integration.md` - Nuxt UI 4 component integration
- `.agents/tailwind-patterns.md` - Tailwind CSS styling guidelines
- `.agents/e2e-testing-patterns.md` - Playwright E2E testing
- `.agents/i18n-patterns.md` - Internationalization patterns
- `.agents/date-time-patterns.md` - Date/time handling with dayjs

### Backend Development
- `.agents/database-patterns.md` - Drizzle ORM and D1 database
- `.agents/security-guidelines.md` - Security best practices

### Quality & Testing
- `.agents/test-ready-component-checklist.md` - Component testing checklist

### Official Documentation (via Context7)
- Nuxt 4: Composables, SSR, auto-imports
- Vue 3: Composition API, defineModel
- Drizzle ORM: Queries, schema, migrations
- Tailwind CSS v4: Utilities, configuration
