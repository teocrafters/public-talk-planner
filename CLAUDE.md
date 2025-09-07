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

## Tech Stack

**Nuxt 4 Full-Stack Application** for **Cloudflare Deployment**:
- **Frontend**: Nuxt 4 + Vue 3 + TypeScript + @nuxt/ui (Tailwind CSS)
- **Backend**: Nitro server + Drizzle ORM + D1 Database
- **Deployment**: Cloudflare Workers + NuxtHub + D1
- **Tooling**: ESLint + Prettier + TypeScript

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