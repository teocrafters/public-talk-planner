# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

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
pnpm generate     # Generate static files
```

### Code Quality

```bash
pnpm lint         # Run ESLint
pnpm lint:fix     # Run ESLint with auto-fix
pnpm format       # Format code with Prettier
pnpm typecheck    # Run TypeScript type checking
```

### Database

```bash
pnpm db:generate  # Generate Drizzle migrations
```

## Architecture

Nuxt 4 Full-Stack Application for Cloudflare Deployment:

- Serverless-first approach using Cloudflare Workers
- TypeScript-first development for type safety
- Component-driven development with reusable UI elements
- Responsive design with mobile-first approach
- SEO-optimized with server-side rendering
- Frontend: Nuxt 4 + Vue 3 + TypeScript + `@nuxt/ui` (Tailwind CSS)
- Backend: Nitro server + Drizzle ORM + D1 Database
- Authentication: Better Auth for secure user management
- Internationalization: `@nuxtjs/i18n` with Polish primary language
- Deployment: Cloudflare Workers + NuxtHub + D1
- Build tool: Vite (via Nuxt)
- Package manager: `pnpm`
- Developer tools: ESLint + Prettier + TypeScript
- Testing: Playwright for E2E testing

## Code Style

- TypeScript: Strict mode with `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`
- Imports: Always use `consistent-type-imports`
- Use tabs for indentation (2 spaces for YAML/JSON/MD)
- Use double quotes, no semicolons, trailing commas
- Do not use `JSDoc` docstrings for documenting `TypeScript` definitions
- Always keep 100 character line limit
- Use descriptive variable/function names
- Prefer functional programming patterns
- Never use `@ts-expect-error` or `@ts-ignore` to suppress type errors
- Always declare types function parameters and return values
- Avoid `any` - find for necessary types instead or create them if missing
- Handle potential undefined values explicitly
- Avoid enums - use const objects instead
- Use discriminated unions to model data with different shapes
- Prefer types over interfaces except for public APIs
- Avoid magic numbers: Use constants with descriptive names for numerical or string literals
- Avoid primitive obsession: Encapsulate data in composite types
- Prefer immutability: Use `readonly` for immutable properties, `as const` for literals
- Validate at boundaries: Use classes with internal validation instead of function-level validation
- Use Result types instead of throwing errors for library code
- Keep functions short (less than 20 lines) and single-purpose
- Use early returns to avoid deeply nested blocks
- Use arrow functions for simple cases (less than 3 instructions)
- Use default parameters instead of `null`/`undefined` checks
- Use RO-RO pattern (Receive Object, Return Object) for multiple parameters
- Separate logical sections with blank lines, not with comments
- Use comments only when it describes an architectural decision. Do not use comments to explain the
  code
- Use named exports over default exports when possible (remember about frontend frameworks
  exceptions)

### Naming Conventions

- `camelCase`: Variables and function names (`myVariable`, `myFunction()`)
- `PascalCase`: Classes, types, and interfaces (`MyClass`, `MyInterface`)
- `ALL_CAPS`: Constants and enum values (`MAX_COUNT`, `Color.RED`)
- `kebab-case`: File and directory names
- Generic types: Prefix with `T` (`TKey`, `TValue`, `TData`, `TError`)
- In `camelCase` names, use `URL` (not `Url`), `API` (not `Api`), `ID` (not `Id`)

## Development Rules & Best Practices

### Project Structure Rules

```
app/                 # Frontend application code
├── app.vue         # Root application component
├── layouts/        # Shared layout components
├── pages/          # File-based routing (auto-generated routes)
├── components/     # Reusable Vue components
├── composables/    # Vue composables and business logic
├── utils/          # Client-side utilities (auto-imported)
└── assets/         # Static assets and global styles

server/             # Backend server code
├── api/            # API route handlers
├── database/       # Database schema and migrations
├── tasks/          # Background task definitions
└── utils/          # Server utilities and helpers

shared/             # Universal code (both server and client)
├── types/          # Shared TypeScript type definitions
└── utils/          # Pure functions and constants
```

### Nuxt 4 Auto-Import System

Nuxt 4 automatically imports components, composables, and utilities from specific directories.

Directory Auto-Imports:

- `app/components/` - Vue components are auto-imported in templates
- `app/composables/` - Vue composables are auto-imported everywhere
- `app/utils/` - Client-side utilities are auto-imported everywhere
- `server/utils/` - Server-side utilities are auto-imported in server context
- `shared/` - Universal code imported explicitly (not auto-imported by default)

Built-in Auto-Imports:

- Vue APIs: `ref`, `computed`, `watch`, `reactive`, `onMounted`, etc.
- Nuxt utilities: `navigateTo`, `useRoute`, `useRouter`, `useFetch`, `useAsyncData`, etc.
- Nuxt modules: APIs from installed Nuxt modules (e.g., `useI18n` from `@nuxtjs/i18n`)

Configuration:

- CHECK `nuxt.config.ts` for custom auto-import directories
- CONFIGURE additional directories using `imports.dirs` array in nuxt.config
- DISABLE auto-imports for specific directories if needed

Example Custom Configuration:

```typescript
export default defineNuxtConfig({
  imports: {
    dirs: ['stores'] // Auto-import from stores directory
  }
})
```

Best Practices:

- RELY on auto-imports for Vue APIs and Nuxt utilities (no manual imports needed)
- USE explicit imports from `shared/` directory for universal code
- AVOID creating custom utils when Nuxt or VueUse provides equivalent functionality
- CHECK nuxt.config.ts before assuming a directory is auto-imported

### Shared Code Pattern

The `shared/` directory contains universal code that works in both server and client contexts.

Directory Structure:

- `shared/types/` - TypeScript type definitions and interfaces
- `shared/utils/` - Pure functions, constants, and validation schemas

Requirements:

- NEVER import Vue-specific code (ref, reactive, components)
- NEVER import Nitro-specific code (defineEventHandler, H3 utilities)
- USE only pure TypeScript/JavaScript
- WRITE framework-agnostic code

Use Cases:

- Constants: `export const AUDIT_EVENTS = { ... } as const`
- Type definitions: `export type AuditEventType = ...`
- Validation schemas: Zod schemas used by both client and server
- Pure utility functions: data transformations, formatters, calculators

Import Pattern:

```typescript
// ✅ Explicit imports from shared directory
import { AUDIT_EVENTS } from '~/shared/utils/audit-events'
import type { AuditEventDetails } from '~/shared/types/audit-events'

// Use in both server and client code
const eventType = AUDIT_EVENTS.TALK_CREATED
```

Why Use Shared Directory:

- CONSISTENCY: Same types and constants across server and client
- TYPE SAFETY: Single source of truth for TypeScript definitions
- MAINTAINABILITY: Update once, apply everywhere
- NO DUPLICATION: Avoid copying code between app/ and server/

### TypeScript Patterns

Always use strict TypeScript:

- Enable `strict: true` in `tsconfig.json`
- Use type inference from Drizzle schemas: `typeof schema.tableName.$inferSelect`
- Create interface files for complex types in `types/` directory
- Use generic types for reusable patterns
- Prefer `interface` over `type` for object shapes
- Use `const assertions` for literal types

Good patterns:

- Use schema inference: `export type User = typeof schema.users.$inferSelect`
- Create generic composables: `export function useApi<T>(endpoint: string): ComputedRef<T | null>`

### Database Patterns with Drizzle

Schema Definition:

- Define all tables in `server/database/schema.ts`
- Use descriptive table and column names
- Always include `createdAt` and `updatedAt` timestamps
- Use `mode: "timestamp"` for dates, `mode: "boolean"` for booleans
- Export inferred types: `export type TableName = typeof tableName.$inferSelect`

Database Access:

- Create a `useDrizzle()` composable in `server/utils/drizzle.ts`
- Export commonly used operators: `eq`, `and`, `or`, `sql`
- Use transactions for multi-table operations
- Always validate input data before database operations

Migration Workflow:

1. Modify schema in `server/database/schema.ts`
2. Run `pnpm db:generate` to create migration files
3. Review generated migration before committing
4. Never edit migration files manually

### Server-Side Patterns

API Routes:

- Place API routes in `server/api/` directory
- Use proper HTTP methods:
  - POST for creating resources (accepts body)
  - PUT for complete replacement (accepts body)
  - PATCH for partial updates (accepts body)
  - GET for retrieving (no body)
  - DELETE for removing (no body)
- VALIDATE all request bodies with Zod schemas:
  - IMPORT schema factory from `app/schemas/`
  - USE `validateBody(event, schemaFactory)` utility from `server/utils/validation`
  - RETURN validation errors with i18n keys automatically via utility
- Return consistent response formats
- Handle errors gracefully with proper status codes

#### Zod Schema Patterns

Schema Structure:

- CREATE schemas in `app/schemas/` directory
- USE factory pattern accepting translation function `t: (key: string) => string`
- EMBED i18n keys in error messages: `t("validation.fieldRequired")`
- EXPORT TypeScript types using `z.infer<ReturnType<typeof schemaFactory>>`
- DEFINE separate schemas for create/update operations (use `.partial()` for updates)

Example Schema:

```typescript
// app/schemas/resource.ts
import { z } from "zod"

export const createResourceSchema = (t: (key: string) => string) => {
  return z.object({
    name: z
      .string()
      .min(1, t("validation.nameRequired"))
      .max(100, t("validation.nameTooLong"))
      .transform((s) => s.trim()),

    email: z.string().email(t("validation.emailInvalid")),

    phone: z.string().regex(/^\d{9}$/, t("validation.phoneInvalid")),
  })
}

export const updateResourceSchema = (t: (key: string) => string) => {
  return createResourceSchema(t).partial()
}

export type ResourceInput = z.infer<ReturnType<typeof createResourceSchema>>
export type ResourceUpdateInput = z.infer<ReturnType<typeof updateResourceSchema>>
```

#### API Validation Usage

Endpoint Implementation Pattern:

```typescript
// server/api/resources/index.post.ts
import { createResourceSchema } from "~/app/schemas/resource"
import { validateBody } from "~/server/utils/validation"

export default defineEventHandler(async (event) => {
  await requirePermission({ resources: ["create"] })(event)

  // Validate and parse request body - throws on error
  const body = await validateBody(event, createResourceSchema)

  // body is fully typed as ResourceInput
  const db = useDrizzle()
  const result = await db.insert(resources).values({
    id: crypto.randomUUID(),
    name: body.name, // Already trimmed by schema transform
    email: body.email,
    phone: body.phone,
    createdAt: new Date(),
  })

  return { success: true, resource: result[0] }
})
```

Validation Error Response Format:

When validation fails, `validateBody()` automatically returns:

```json
{
  "statusCode": 400,
  "statusMessage": "Validation Error",
  "data": {
    "errors": [
      { "field": "name", "messageKey": "validation.nameRequired" },
      { "field": "email", "messageKey": "validation.emailInvalid" }
    ]
  }
}
```

Frontend can use `messageKey` values to display translated error messages via `$t(error.messageKey)`.

Background Tasks:

- Define tasks in `server/tasks/` directory using `defineTask()`
- Use descriptive names and descriptions
- Handle errors and provide meaningful logs
- Use tasks for database seeding, cleanup, and scheduled operations

Server Utils:

- Create reusable utilities in `server/utils/`
- Export commonly used database functions
- Use composable pattern for server-side logic

### Frontend Patterns

Vue 3 Composition API:

- Always use `<script setup>` syntax
- Create composables for reusable logic in `composables/`
- Use `ref()` for primitive values, `reactive()` for objects
- Prefer `computed()` over methods for derived data
- Use `watch()` for side effects, `watchEffect()` for automatic tracking

Components:

- Use PascalCase for component names
- Create single-purpose components
- Use props with TypeScript interfaces
- Emit events with proper typing
- Use `@nuxt/ui` components when available

Pages and Layouts:

- Use file-based routing in `pages/` directory
- Create layouts in `layouts/` for shared UI patterns
- Use dynamic routes with proper parameter validation
- Implement proper SEO with `useSeoMeta()`

### SSR Data Fetching

This application uses Server-Side Rendering (SSR). Always use Nuxt's SSR-compatible data fetching
composables to ensure data is fetched on the server and properly transferred to the client.

Critical Rules:

- **ALWAYS** use `useFetch()` or `useAsyncData()` for data fetching in components
- **NEVER** use raw `$fetch()` directly in components (it won't transfer SSR data to client)
- **ALWAYS** `await` these composables in `<script setup>` for proper SSR hydration
- **HANDLE** loading and error states using destructured values

Using useFetch():

```vue
<script setup lang="ts">
// ✅ Correct: useFetch for SSR-compatible data fetching
const { data: speakers, pending, error, refresh } = await useFetch<Speaker[]>("/api/speakers")

// Access reactive data in template
// - data: reactive reference to fetched data
// - pending: true while fetching, false when complete
// - error: contains error object if request fails
// - refresh: function to manually refetch data
</script>

<template>
  <div v-if="pending">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <div v-else>
    <div v-for="speaker in speakers" :key="speaker.id">
      {{ speaker.firstName }} {{ speaker.lastName }}
    </div>
  </div>
</template>
```

Using useAsyncData():

```vue
<script setup lang="ts">
// ✅ Use useAsyncData for complex async operations or custom fetching logic
const { data: userData, pending, error } = await useAsyncData(
  'user-profile', // unique key for caching
  () => $fetch('/api/user/profile', {
    headers: { 'X-Custom-Header': 'value' }
  })
)
</script>
```

When to Use Each:

- USE `useFetch()` for simple API calls (most common case)
- USE `useAsyncData()` when you need:
  - Custom fetch logic with headers or request options
  - Non-HTTP async operations
  - More control over caching with unique keys
  - Multiple data sources combined

Anti-Patterns to Avoid:

```vue
<script setup lang="ts">
// ❌ Wrong: Direct $fetch() in component doesn't transfer SSR data
const speakers = await $fetch('/api/speakers')

// ❌ Wrong: Using onMounted for data fetching defeats SSR
onMounted(async () => {
  const data = await $fetch('/api/speakers')
  speakers.value = data
})

// ❌ Wrong: Not awaiting useFetch breaks SSR hydration
const { data } = useFetch('/api/speakers') // Missing await!
</script>
```

Best Practices:

- DESTRUCTURE return values for clear code: `const { data, pending, error, refresh }`
- PROVIDE TypeScript types for data: `useFetch<Speaker[]>(...)`
- HANDLE all states: loading (`pending`), error (`error`), success (`data`)
- USE `refresh()` function to manually refetch when data changes
- AVOID fetching in `onMounted` - use `useFetch`/`useAsyncData` instead
- CHECK data exists before accessing properties: `v-if="data"` or optional chaining

Example from Codebase:

```vue
<script setup lang="ts">
// Real example from app/pages/speakers.vue
const { data: speakers, pending, error, refresh } = await useFetch<Speaker[]>("/api/speakers")

// Permission checks use usePermissions composable
const { canManageSpeakers, fetchPermissions } = usePermissions()
onMounted(async () => {
  await fetchPermissions()
})

// Data is fetched on server-side during SSR
// Permissions are fetched client-side using BetterAuth organization API
// Client receives pre-rendered HTML with data already available
</script>
```

Why This Matters:

- **SEO**: Search engines see fully rendered content with data
- **PERFORMANCE**: Faster initial page load with server-rendered data
- **UX**: No loading flicker - content appears immediately
- **HYDRATION**: Client-side Vue picks up where server left off

### Cloudflare & NuxtHub Patterns

Configuration:

- Use `cloudflare_module` preset in `nitro.preset`
- Enable node compatibility for server-side features
- Configure D1 database binding through NuxtHub
- Use environment variables for configuration

Performance:

- Leverage Cloudflare's edge caching
- Use `hubCache()` for server-side caching
- Minimize bundle size with proper tree-shaking
- Use dynamic imports for code splitting

Deployment:

- Use Wrangler for local development and deployment
- Configure D1 database bindings properly
- Use environment-specific configurations
- Test locally with `wrangler dev` before deployment

### Code Quality Rules

Naming Conventions:

- `camelCase` for variables, functions, and methods
- `PascalCase` for components, classes, and types
- `kebab-case` for file names and CSS classes
- `SCREAMING_SNAKE_CASE` for constants

Error Handling:

- Always handle async operations with try-catch
- Provide meaningful error messages to users
- Log errors properly for debugging
- Use proper HTTP status codes in API responses

Performance:

- Use `defineAsyncComponent()` for lazy loading
- Implement proper loading states
- Use `v-memo` for expensive list renders
- Optimize images and assets

## Testing

- Vitest for unit testing and API integration tests
- Playwright for E2E tests and UI-focused integration tests
- When writing tests, do it one test case at a time
- Use `expect(VALUE).toXyz(...)` instead of storing in variables
- Omit `should` from test names (e.g., `it("validates input")` not `it("should validate input")`)
- Test files: `*.test.ts` or `*.spec.ts`
- Mock external dependencies appropriately

### E2E Testing with Playwright

Test Selector Requirements:

- ADD data-testid attributes to ALL interactive elements during component development
- USE data-testid as primary selector strategy, NEVER use CSS classes, attributes, or text content
- FOLLOW naming convention: `{feature}-{element}-{type}` in kebab-case
- DOCUMENT all data-testid values in component files
- VERIFY test IDs exist before marking component complete

Fixture Pattern Requirements:

- USE Playwright's `test.extend()` API for all reusable test utilities
- ORGANIZE fixtures in `tests/fixtures/` directory with domain-specific files
- IMPLEMENT Page Object Models as fixtures, not standalone classes
- COMBINE fixtures using `mergeTests()` and export from `tests/fixtures/index.ts`
- IMPORT test and expect from merged fixtures in all test files

Fixture Usage in Tests:

```typescript
// ✅ Correct: Import test and expect from merged fixtures
import { test, expect } from "../fixtures"

test("displays speakers list", async ({ page }) => {
  // Enhanced page fixture automatically waits for Nuxt hydration
  await page.goto("http://localhost:3000/speakers")

  // Use data-testid selectors for stability
  await expect(page.getByTestId("speakers-list")).toBeVisible()
})

test("authenticates as admin", async ({ page, authenticateAs }) => {
  // Use authenticateAs fixture for role-based authentication
  await authenticateAs.admin()

  await page.goto("http://localhost:3000/admin")
  await expect(page.getByTestId("admin-dashboard")).toBeVisible()
})
```

Available Fixtures:

- `page` - Enhanced page that waits for Nuxt hydration after navigation
- `authenticateAs` - Object with role-based authentication methods:
  - `authenticateAs.admin()` - Authenticate as admin user
  - `authenticateAs.publisher()` - Authenticate as publisher user
  - `authenticateAs.talksManager()` - Authenticate as talks manager
  - `authenticateAs.speakersManager()` - Authenticate as speakers manager

Fixture Anti-Patterns:

```typescript
// ❌ Wrong: Importing directly from @playwright/test
import { test, expect } from "@playwright/test"

// ❌ Wrong: Creating standalone Page Object classes
class SpeakersPage {
  constructor(private page: Page) {}
  async goto() { await this.page.goto("/speakers") }
}

// ✅ Correct: Implement Page Objects as fixtures
export const test = base.extend<{ speakersPage: SpeakersPage }>({
  speakersPage: async ({ page }, use) => {
    await use(new SpeakersPage(page))
  }
})
```

Component Development Rules:

- IMPLEMENT component with data-testid attributes from start
- CREATE or UPDATE fixtures for reusable patterns
- WRITE tests only after component is test-ready with all test IDs
- REFERENCE @.agents/test-ready-component-checklist.md before marking complete

Module Syntax Requirements:

- USE `import` statements exclusively in all test files
- ADD `with { type: "json" }` assertion for JSON imports
- NEVER use `require()` in test files
- FOLLOW project's ESM module standard

Comprehensive E2E Guidelines:

- REFERENCE @.agents/e2e-testing-patterns.md for complete testing patterns
- FOLLOW three-step workflow: component first, fixtures second, tests third
- ENSURE test isolation and independence using fixtures
- LEVERAGE Playwright's built-in features over custom solutions

## Security

- Use appropriate data types that limit exposure of sensitive information
- Never commit secrets or API keys to repository
- Use environment variables for sensitive data
- Validate all user inputs on both client and server
- Follow principle of least privilege

### Development Workflow

Before Starting Work:

1. Run `pnpm install` to ensure dependencies are up to date
2. Check database schema and run migrations if needed
3. Verify environment variables are properly configured

During Development:

1. Run `pnpm dev` for hot-reload development
2. Use `pnpm typecheck` frequently to catch type errors
3. Test database operations thoroughly
4. Use browser dev tools for debugging

Before Committing:

1. Run `pnpm lint:fix` to fix linting issues
2. Run `pnpm typecheck` to ensure no type errors
3. Run `pnpm format` to ensure consistent formatting
4. Test critical functionality manually
5. Generate and review database migrations if schema changed

Deployment Checklist:

1. Ensure all environment variables are configured
2. Test build process with `pnpm build`
3. Verify database migrations are applied
4. Test production build locally with `pnpm preview`

## Internationalization (i18n) Rules

### Language Standards

UI Language: Polish (Primary)

- All user-facing text must be in Polish
- Use `$t()` function for all UI text
- Never hardcode Polish text directly in components
- Maintain consistent formal/informal tone (informal "Ty" form)

Code & Documentation: English (Strict)

- All code, comments, and documentation in English only
- Variable names, function names: English camelCase
- Git commit messages: English
- API endpoints and technical terms: English
- Error logging and console messages: English

### Translation Key Structure

Hierarchical Organization:

- `common.*` - Shared UI elements (buttons, labels)
- `auth.*` - Authentication flows
- `dashboard.*` - Dashboard and main app
- `navigation.*` - Navigation elements
- `meta.*` - SEO meta tags and descriptions
- `errors.*` - Error messages and validation
- `validation.*` - API and form validation messages (field-specific errors)

Key Naming Conventions:

- Use English-based descriptive keys: `auth.signInButton` not `auth.przyciskLogowania`
- Dot notation for hierarchy: `auth.form.emailLabel`
- Context-specific grouping: `errors.validation.required`
- Consistent naming patterns: `action.resource` (e.g., `create.account`, `delete.item`)

Validation Key Examples:

- Field requirements: `validation.firstNameRequired`, `validation.emailRequired`
- Format validation: `validation.phoneInvalid`, `validation.emailInvalid`
- Length constraints: `validation.firstNameTooLong`, `validation.passwordTooShort`
- Business rules: `validation.congregationRequired`, `validation.dateInPast`

### Component Integration Patterns

Required Usage:

- Use `$t()` for UI text: `<button>{{ $t('common.submit') }}</button>`
- Never hardcode Polish text: avoid `<button>Zatwierdź</button>`
- Always import `useI18n()` in components with translations: `const { $t } = useI18n()`
- Use interpolation for dynamic content: `$t('dashboard.welcomeUser', { email: user.value?.email })`

SEO Meta Tags:

- Use i18n meta tags: `useSeoMeta({ title: $t('meta.dashboard.title') })`
- Avoid hardcoded meta tags: never use `title: 'Panel główny - Planer Wystąpień'`

### Translation File Management

File Structure:

- `locales/pl.json` - Primary Polish translations
- `locales/en.json` - English fallback (for development)

Translation Quality Standards:

- Natural Polish expressions, not literal translations
- Consistent technical terminology
- Proper Polish grammar and declension
- Context-aware translations (formal vs informal)
- UTF-8 encoding with Polish diacritical marks (ą, ć, ę, ł, ń, ó, ś, ź, ż)

Example Translation Patterns:

- Auth translations: `"signIn": "Zaloguj się"`, `"emailAddress": "Adres email"`
- Dashboard translations: `"welcomeUser": "Witaj, {email}!"`, with proper interpolation

### Development Workflow

Adding New UI Text:

1. Add translation key to `locales/pl.json`
2. Use `$t('key')` in component, never hardcode text
3. Test with missing translation detection
4. Verify Polish character rendering

Before Committing:

1. Run `pnpm typecheck` to catch i18n typing errors
2. Verify no hardcoded Polish text remains in components
3. Check translation file JSON syntax validity
4. Test critical user flows with Polish UI

Quality Checks:

- Use browser dev tools to check for missing translation warnings
- Verify interpolation works correctly: `$t('key', { variable })`
- Test responsive design with longer Polish text
- Validate Polish character encoding in all browsers

### Technical Configuration

Nuxt i18n Module Settings:

- Default locale: `'pl'` (Polish primary)
- Fallback locale: `'pl'` (consistent experience)
- Strategy: `'no_prefix'` (no URL prefixes)
- Lazy loading: Enabled for performance
- SEO optimization: Automatic hreflang generation

TypeScript Integration:

- Use proper typing for translation keys
- Define interface with translation structure: `auth: { signIn: string }`

### Error Prevention

Common Mistakes to Avoid:

- Mixing Polish and English in same component
- Hardcoding Polish text instead of using `$t()`
- Using English variable names in Polish translation keys
- Forgetting to add `useI18n()` in components
- Not testing with missing translations
- Inconsistent formal/informal tone across UI

Validation Rules:

- All user-visible text must use translation functions
- No Polish text should appear directly in Vue templates
- Translation keys must be in English and descriptive
- All new components must include i18n integration from start

## Git Workflow

### Commit Standards

- Conventional commits: Use format `<type>(<scope>): <description> [AI]`
- Granular commits: One logical change per commit
- Clear messages: Explain why changes were made, not just what
- Issue linking: Reference ticket numbers with `fixes #123`, `refs #123`
- Standard scopes: `ui`, `api`, `auth`, `i18n`, `test`, `docs`, `deps`, `config`
- Breaking changes: Use `!` after type or `BREAKING CHANGE:` footer
- Commit frequently: After creating component, fixing bug, or significant progress
- Review AI code: Never merge code you don't understand

### Common Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `style`: Code formatting
- `docs`: Documentation
- `test`: Adding tests
- `chore`: Dependencies, tooling

### Pre-commit Process

- Always run `pnpm ci` before committing (see `package.json` for available CI command)
- Fix linting errors with `pnpm lint:fix`
- Run `pnpm typecheck` to verify type safety
- Never use `git push --force` on the main branch
- Use `git push --force-with-lease` for feature branches if needed
- Always verify current branch before force operations

## Common Pitfalls

- Trying to use `npm` instead of `pnpm`
- Not following the established project structure
- Working in the wrong directory
- Using incorrect import patterns
- Writing tests without proper analysis and planning, even when directly requested
- Using scoped styles instead of Tailwind classes
- Making large refactors in a single commit
- Mixing Polish and English text in components
- Hardcoding Polish text instead of using `$t()`
- Not running type checks before committing

## Files to NOT Modify

These files should never be modified without explicit permission:

- `.gitignore` and `.npmignore` files
- Lock files (e.g., `pnpm-lock.yaml`)
- Environment configuration files (`.env.*`)
- Generated type definitions (`.d.ts`)
- Core configuration files (e.g., `nuxt.config.ts`, `wrangler.toml`, `drizzle.config.ts`)
- Migration files in `server/database/migrations/`

## Configuration

When adding new configuration options, update all relevant places:

1. Environment variables in `.env.example`
2. Configuration schemas if using config validation
3. Documentation in README.md

All configuration keys use consistent naming and must be documented.

## Anchor Comments System

Use specially formatted comments throughout the codebase to provide inline knowledge that can be
easily searched:

- Use `AGENT-NOTE:`, `AGENT-TODO:`, or `AGENT-QUESTION:` (all-caps prefix) for comments aimed at all
  agents and developers
- Keep them concise (≤ 120 chars)
- Important: Before scanning files, always first try to locate existing anchors `AGENT-*` in
  relevant subdirectories
- Update relevant anchors when modifying associated code
- Do not remove `AGENT-NOTE`s without explicit human instruction

Example pattern: `// AGENT-NOTE: Performance-critical path; avoid extra allocations`

## Frontend development

- @.agents/nuxt-ui-4-integration.md
- @.agents/i18n-patterns.md
- @.agents/official-tailwind.md
- @.agents/official-vue-components.md
- @.agents/official-vue-pages.md
- @.agents/quality-standards.md
- @.agents/security-guidelines.md
- @.agents/tailwind-patterns.md
- @.agents/vue-conventions.md
