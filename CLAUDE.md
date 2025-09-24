# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

**Nuxt 4 Full-Stack Application** for **Cloudflare Deployment**:
- Serverless-first approach using Cloudflare Workers
- TypeScript-first development for type safety
- Component-driven development with reusable UI elements
- Responsive design with mobile-first approach
- SEO-optimized with server-side rendering
- **Frontend**: Nuxt 4 + Vue 3 + TypeScript + @nuxt/ui (Tailwind CSS)
- **Backend**: Nitro server + Drizzle ORM + D1 Database
- **Authentication**: Better Auth for secure user management
- **Internationalization**: @nuxtjs/i18n with Polish primary language
- **Deployment**: Cloudflare Workers + NuxtHub + D1
- **Build tool**: Vite (via Nuxt)
- **Package manager**: pnpm
- **Developer tools**: ESLint + Prettier + TypeScript
- **Testing**: Playwright for E2E testing

## Code Style

- TypeScript: Strict mode with exactOptionalPropertyTypes, noUncheckedIndexedAccess
- Imports: ALWAYS Use consistent-type-imports
- USE tabs for indentation (2 spaces for YAML/JSON/MD)
- USE double quotes, no semicolons, trailing commas
- DO NOT use JSDoc docstrings for documenting TypeScript definitions
- ALWAYS keep 100 character line limit
- USE descriptive variable/function names
- PREFER functional programming patterns
- NEVER use `@ts-expect-error` or `@ts-ignore` to suppress type errors
- ALWAYS declare types function parameters and return values
- AVOID `any` - find for necessary types instead or create them if missing
- HANDLE potential undefined values explicitly
- AVOID enums - use const objects instead
- USE discriminated unions to model data with different shapes
- PREFER types over interfaces except for public APIs
- AVOID magic numbers: Use constants with descriptive names for numerical or string literals.
- AVOID primitive obsession: Encapsulate data in composite types
- PREFER immutability: Use `readonly` for immutable properties, `as const` for literals
- VALIDATE at boundaries: Use classes with internal validation instead of function-level validation
- USE Result types instead of throwing errors for library code
- KEEP functions short (less than 20 lines) and single-purpose
- USE early returns to avoid deeply nested blocks
- USE arrow functions for simple cases (less than 3 instructions)
- USE default parameters instead of null/undefined checks
- USE RO-RO pattern (Receive Object, Return Object) for multiple parameters
- SEPARATE logical sections with blank lines, not with comments
- Use comments ONLY when it's describe a architectural decision. DO NOT use comments to explain the code
- USE named exports over default exports when possible (remember about frontend frameworks exceptions)

### Naming Conventions

- camelCase: Variables and function names (`myVariable`, `myFunction()`)
- PascalCase: Classes, types, and interfaces (`MyClass`, `MyInterface`)
- ALL_CAPS: Constants and enum values (`MAX_COUNT`, `Color.RED`)
- kebab-case: File and directory names
- Generic types: Prefix with `T` (`TKey`, `TValue`, `TData`, `TError`)
- In CamelCase names, use "URL" (not "Url"), "API" (not "Api"), "ID" (not "Id")

## Development Rules & Best Practices

### Project Structure Rules

```
app/                 # Frontend application code
├── app.vue         # Root application component
├── layouts/        # Shared layout components
├── pages/          # File-based routing (auto-generated routes)
├── components/     # Reusable Vue components
├── composables/    # Vue composables and business logic
└── assets/         # Static assets and global styles

server/             # Backend server code
├── api/            # API route handlers
├── database/       # Database schema and migrations
├── tasks/          # Background task definitions
└── utils/          # Server utilities and helpers
```

### TypeScript Patterns

**Always use strict TypeScript**:
- Enable `strict: true` in tsconfig.json
- Use type inference from Drizzle schemas: `typeof schema.tableName.$inferSelect`
- Create interface files for complex types in `types/` directory
- Use generic types for reusable patterns
- Prefer `interface` over `type` for object shapes
- Use `const assertions` for literal types

**Example**:
```typescript
// Good: Use schema inference
export type User = typeof schema.users.$inferSelect
export type NewUser = typeof schema.users.$inferInsert

// Good: Generic composables
export function useApi<T>(endpoint: string): ComputedRef<T | null>
```

### Database Patterns with Drizzle

**Schema Definition**:
- Define all tables in `server/database/schema.ts`
- Use descriptive table and column names
- Always include `createdAt` and `updatedAt` timestamps
- Use `mode: "timestamp"` for dates, `mode: "boolean"` for booleans
- Export inferred types: `export type TableName = typeof tableName.$inferSelect`

**Database Access**:
- Create a `useDrizzle()` composable in `server/utils/drizzle.ts`
- Export commonly used operators: `eq, and, or, sql`
- Use transactions for multi-table operations
- Always validate input data before database operations

**Migration Workflow**:
1. Modify schema in `server/database/schema.ts`
2. Run `pnpm db:generate` to create migration files
3. Review generated migration before committing
4. Never edit migration files manually

### Server-Side Patterns

**API Routes**:
- Place API routes in `server/api/` directory
- Use proper HTTP methods and status codes
- Always validate request bodies with TypeScript types
- Return consistent response formats
- Handle errors gracefully with proper error messages

**Background Tasks**:
- Define tasks in `server/tasks/` directory using `defineTask()`
- Use descriptive names and descriptions
- Handle errors and provide meaningful logs
- Use tasks for database seeding, cleanup, and scheduled operations

**Server Utils**:
- Create reusable utilities in `server/utils/`
- Export commonly used database functions
- Use composable pattern for server-side logic

### Frontend Patterns

**Vue 3 Composition API**:
- Always use `<script setup>` syntax
- Create composables for reusable logic in `composables/`
- Use `ref()` for primitive values, `reactive()` for objects
- Prefer `computed()` over methods for derived data
- Use `watch()` for side effects, `watchEffect()` for automatic tracking

**Components**:
- Use PascalCase for component names
- Create single-purpose components
- Use props with TypeScript interfaces
- Emit events with proper typing
- Use `@nuxt/ui` components when available

**Pages and Layouts**:
- Use file-based routing in `pages/` directory
- Create layouts in `layouts/` for shared UI patterns
- Use dynamic routes with proper parameter validation
- Implement proper SEO with `useSeoMeta()`

### Cloudflare & NuxtHub Patterns

**Configuration**:
- Use `cloudflare_module` preset in `nitro.preset`
- Enable node compatibility for server-side features
- Configure D1 database binding through NuxtHub
- Use environment variables for configuration

**Performance**:
- Leverage Cloudflare's edge caching
- Use `hubCache()` for server-side caching
- Minimize bundle size with proper tree-shaking
- Use dynamic imports for code splitting

**Deployment**:
- Use Wrangler for local development and deployment
- Configure D1 database bindings properly
- Use environment-specific configurations
- Test locally with `wrangler dev` before deployment

### Code Quality Rules

**Naming Conventions**:
- `camelCase` for variables, functions, and methods
- `PascalCase` for components, classes, and types
- `kebab-case` for file names and CSS classes
- `SCREAMING_SNAKE_CASE` for constants

**Error Handling**:
- Always handle async operations with try-catch
- Provide meaningful error messages to users
- Log errors properly for debugging
- Use proper HTTP status codes in API responses

**Performance**:
- Use `defineAsyncComponent()` for lazy loading
- Implement proper loading states
- Use `v-memo` for expensive list renders
- Optimize images and assets

## Testing

- Vitest for unit testing and API integration tests
- Playwright for E2E tests and UI-focused integration tests
- When writing tests, do it one test case at a time
- Use `expect(VALUE).toXyz(...)` instead of storing in variables
- Omit "should" from test names (e.g., `it("validates input")` not `it("should validate input")`)
- Test files: `*.test.ts` or `*.spec.ts`
- Mock external dependencies appropriately

## Security

- Use appropriate data types that limit exposure of sensitive information
- Never commit secrets or API keys to repository
- Use environment variables for sensitive data
- Validate all user inputs on both client and server
- Follow principle of least privilege

### Development Workflow

**Before Starting Work**:
1. Run `pnpm install` to ensure dependencies are up to date
2. Check database schema and run migrations if needed
3. Verify environment variables are properly configured

**During Development**:
1. Run `pnpm dev` for hot-reload development
2. Use `pnpm typecheck` frequently to catch type errors
3. Test database operations thoroughly
4. Use browser dev tools for debugging

**Before Committing**:
1. Run `pnpm lint:fix` to fix linting issues
2. Run `pnpm typecheck` to ensure no type errors
3. Run `pnpm format` to ensure consistent formatting
4. Test critical functionality manually
5. Generate and review database migrations if schema changed

**Deployment Checklist**:
1. Ensure all environment variables are configured
2. Test build process with `pnpm build`
3. Verify database migrations are applied
4. Test production build locally with `pnpm preview`

## Internationalization (i18n) Rules

### Language Standards

**UI Language**: Polish (Primary)
- All user-facing text must be in Polish
- Use `$t()` function for all UI text
- Never hardcode Polish text directly in components
- Maintain consistent formal/informal tone (informal "Ty" form)

**Code & Documentation**: English (Strict)
- All code, comments, and documentation in English only
- Variable names, function names: English camelCase
- Git commit messages: English
- API endpoints and technical terms: English
- Error logging and console messages: English

### Translation Key Structure

**Hierarchical Organization**:
```
common.*          # Shared UI elements (buttons, labels)
auth.*           # Authentication flows
dashboard.*      # Dashboard and main app
navigation.*     # Navigation elements  
meta.*           # SEO meta tags and descriptions
errors.*         # Error messages and validation
validation.*     # Form validation messages
```

**Key Naming Conventions**:
- Use English-based descriptive keys: `auth.signInButton` not `auth.przyciskLogowania`
- Dot notation for hierarchy: `auth.form.emailLabel`
- Context-specific grouping: `errors.validation.required`
- Consistent naming patterns: `action.resource` (e.g., `create.account`, `delete.item`)

### Component Integration Patterns

**Required Usage**:
```vue
<template>
  <!-- ✅ Correct: Using $t() for UI text -->
  <button>{{ $t('common.submit') }}</button>
  <input :placeholder="$t('auth.enterEmail')" />
  
  <!-- ❌ Wrong: Hardcoded Polish text -->
  <button>Zatwierdź</button>
  <input placeholder="Wprowadź email" />
</template>

<script setup>
// ✅ Always import useI18n in components with translations
const { $t } = useI18n()

// ✅ Use interpolation for dynamic content
const welcomeMessage = computed(() => 
  $t('dashboard.welcomeUser', { email: user.value?.email })
)
</script>
```

**SEO Meta Tags**:
```typescript
// ✅ Correct: i18n meta tags
useSeoMeta({
  title: $t('meta.dashboard.title'),
  description: $t('meta.dashboard.description')
})

// ❌ Wrong: Hardcoded meta tags
useSeoMeta({
  title: 'Panel główny - Planer Wystąpień',
  description: 'Zarządzaj wystąpieniami'
})
```

### Translation File Management

**File Structure**:
```
locales/
├── pl.json    # Primary Polish translations
└── en.json    # English fallback (for development)
```

**Translation Quality Standards**:
- Natural Polish expressions, not literal translations
- Consistent technical terminology
- Proper Polish grammar and declension
- Context-aware translations (formal vs informal)
- UTF-8 encoding with Polish diacritical marks (ą, ć, ę, ł, ń, ó, ś, ź, ż)

**Example Translation Patterns**:
```json
{
  "auth": {
    "signIn": "Zaloguj się",
    "signOut": "Wyloguj się", 
    "emailAddress": "Adres email",
    "forgotPassword": "Zapomniałeś hasła?"
  },
  "dashboard": {
    "welcomeUser": "Witaj, {email}!",
    "userDashboard": "To jest Twój chroniony panel użytkownika."
  }
}
```

### Development Workflow

**Adding New UI Text**:
1. Add translation key to `locales/pl.json`
2. Use `$t('key')` in component, never hardcode text
3. Test with missing translation detection
4. Verify Polish character rendering

**Before Committing**:
1. Run `pnpm typecheck` to catch i18n typing errors
2. Verify no hardcoded Polish text remains in components
3. Check translation file JSON syntax validity
4. Test critical user flows with Polish UI

**Quality Checks**:
- Use browser dev tools to check for missing translation warnings
- Verify interpolation works correctly: `$t('key', { variable })`
- Test responsive design with longer Polish text
- Validate Polish character encoding in all browsers

### Technical Configuration

**Nuxt i18n Module Settings**:
- Default locale: `'pl'` (Polish primary)
- Fallback locale: `'pl'` (consistent experience)  
- Strategy: `'no_prefix'` (no URL prefixes)
- Lazy loading: Enabled for performance
- SEO optimization: Automatic hreflang generation

**TypeScript Integration**:
```typescript
// ✅ Use proper typing for translation keys
interface TranslationSchema {
  auth: {
    signIn: string
    emailAddress: string
  }
}
```

### Error Prevention

**Common Mistakes to Avoid**:
- ❌ Mixing Polish and English in same component
- ❌ Hardcoding Polish text instead of using `$t()`
- ❌ Using English variable names in Polish translation keys
- ❌ Forgetting to add `useI18n()` in components
- ❌ Not testing with missing translations
- ❌ Inconsistent formal/informal tone across UI

**Validation Rules**:
- All user-visible text must use translation functions
- No Polish text should appear directly in Vue templates
- Translation keys must be in English and descriptive
- All new components must include i18n integration from start

## Git Workflow

### Commit Standards

- **Conventional commits**: Use format `<type>(<scope>): <description> [AI]`
- **Granular commits**: One logical change per commit
- **AI tagging**: ALWAYS add `[AI]` suffix to AI-generated commits
- **Clear messages**: Explain WHY changes were made, not just what
- **Issue linking**: Reference ticket numbers with `fixes #123`, `refs #123`
- **Standard scopes**: `ui`, `api`, `auth`, `i18n`, `test`, `docs`, `deps`, `config`
- **Breaking changes**: Use `!` after type or `BREAKING CHANGE:` footer
- **Commit frequently**: After creating component, fixing bug, or significant progress
- **Review AI code**: Never merge code you don't understand

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

- ALWAYS run `pnpm ci` before committing (see package.json for available CI command)
- Fix linting errors with `pnpm lint:fix`
- Run `pnpm typecheck` to verify type safety
- NEVER use `git push --force` on the main branch
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

These files should NEVER be modified without explicit permission:

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

All configuration keys use consistent naming and MUST be documented.

## Anchor Comments System

Use specially formatted comments throughout the codebase to provide inline knowledge that can be easily searched:

- Use `AGENT-NOTE:`, `AGENT-TODO:`, or `AGENT-QUESTION:` (all-caps prefix) for comments aimed at all agents and developers
- Keep them concise (≤ 120 chars)
- **Important:** Before scanning files, always first try to locate existing anchors `AGENT-*` in relevant subdirectories
- **Update relevant anchors** when modifying associated code
- **Do not remove `AGENT-NOTE`s** without explicit human instruction

Example:

```typescript
// AGENT-NOTE: Performance-critical path; avoid extra allocations
async function renderDashboard(...): Promise<void> {
  // Implementation
}
```