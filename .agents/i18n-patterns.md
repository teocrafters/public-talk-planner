# Internationalization (i18n) Patterns

Comprehensive guidelines for implementing internationalization in the Public Talk Planner project.

## Core Principles

- USE translation keys for all user-facing text
- PROVIDE meaningful context in translation key naming
- SUPPORT pluralization through pipe-separated values
- MAINTAIN consistent hierarchical key naming conventions
- IMPLEMENT fallback to English when translations missing

## Translation Key Structure Rules

- STRUCTURE keys hierarchically using dot notation: `pages.talks.list.title`
- GROUP related translations under common prefixes: `forms.errors.*` or `nav.*`
- INCLUDE context in key names: `forms.errors.emailInvalid` instead of `invalidEmail`
- AVOID deep nesting beyond 4 levels for maintainability
- USE consistent naming pattern throughout project: camelCase or snake_case

## Vue Component Implementation Rules

- DESTRUCTURE `useI18n()` to access `t`, `d`, `n`, `locale`, `tm`, `rt` functions
- USE `t('translation.key')` for basic message translation
- PASS named parameters using object syntax: `t('key', { name: value, date: formattedDate })`
- CREATE `computed()` properties for reactive translations depending on props or state
- ACCESS current locale with `locale.value` from `useI18n()` composable
- FORMAT dates using `d(date, 'short')` with pre-configured format keys
- FORMAT numbers using `n(value, 'currency')` for locale-aware number display

## Pluralization Rules

- HANDLE pluralization using pipe-separated syntax: `"no items | one item | {count} items"`
- PASS count as second parameter: `t('messages.count', count)`
- USE named interpolation for count display: `t('items.found', { count: itemCount })`
- STRUCTURE plural messages with consistent pattern across all locales
- CONSIDER locale-specific pluralization rules for different languages

## Parameter Interpolation Rules

- USE named parameters instead of positional: `{author}` not `{0}`
- KEEP parameters simple and avoid complex object interpolation
- FORMAT data before passing to translation functions
- USE consistent parameter names across related translation keys: `{count}`, `{date}`, `{author}`
- ESCAPE user content when necessary to prevent XSS vulnerabilities

## Translation Key Validation Rules

**Critical**: Always verify that translation keys exist in both Polish (primary) and English
(fallback) translation files before using them in components.

### Why Key Validation Matters

- PREVENTS runtime errors from missing translation keys
- ENSURES consistent user experience across all locales
- CATCHES typos and key mismatches during development
- MAINTAINS translation file synchronization
- AVOIDS displaying raw key strings to users

### Validation Workflow

#### Before Committing

1. **Verify key exists in both locale files**:
   - Check `i18n/locales/pl.json` for Polish translation
   - Check `i18n/locales/en.json` for English fallback
   - Ensure keys are identical in both files

2. **Test key usage in component**:
   - Run application in development mode
   - Navigate to pages using the new keys
   - Check browser console for missing translation warnings
   - Verify Polish text displays correctly

3. **Validate key structure**:
   - Ensure hierarchical nesting is consistent
   - Verify key follows project naming conventions
   - Check for typos in key path

#### Development Process

```vue
<script setup lang="ts">
  const { t } = useI18n()

  // ✅ Before using a key, verify it exists in translation files
  const title = computed(() => t("pages.meetings.create.title"))
  // Check: i18n/locales/pl.json has "pages.meetings.create.title"
  // Check: i18n/locales/en.json has "pages.meetings.create.title"
</script>
```

### Type-Safe Key Patterns

#### Using Constants for Keys

Create constants file for frequently used keys to catch typos at compile time:

```typescript
// shared/constants/i18n-keys.ts
export const I18N_KEYS = {
  COMMON: {
    SAVE: "common.save",
    CANCEL: "common.cancel",
    DELETE: "common.delete",
    EDIT: "common.edit",
  },
  VALIDATION: {
    REQUIRED: "validation.required",
    EMAIL_INVALID: "validation.emailInvalid",
    PHONE_INVALID: "validation.phoneInvalid",
  },
  MEETINGS: {
    CREATE_TITLE: "pages.meetings.create.title",
    LIST_TITLE: "pages.meetings.list.title",
  },
} as const

// Usage in component
import { I18N_KEYS } from "~/shared/constants/i18n-keys"

const title = computed(() => t(I18N_KEYS.MEETINGS.CREATE_TITLE))
```

#### Using TypeScript Type Inference (Advanced)

For projects with TypeScript strict mode, consider generating types from translation files:

```typescript
// types/i18n.d.ts (generated or manually maintained)
type TranslationKeys =
  | "common.save"
  | "common.cancel"
  | "validation.required"
  | "pages.meetings.create.title"

// Use in component with type checking
const key: TranslationKeys = "common.save"
const text = t(key) // Type-safe
```

### Validation in API Integration

When using i18n keys in API validation errors:

```typescript
// server/api/meetings/index.post.ts
import { createMeetingSchema } from "~/app/schemas/meeting"

export default defineEventHandler(async event => {
  // Schema uses i18n keys for error messages
  const body = await validateBody(event, createMeetingSchema)

  // Verify all validation keys exist in translation files:
  // - validation.titleRequired
  // - validation.dateRequired
  // - validation.speakerRequired
})
```

Translation file verification:

```json
// i18n/locales/pl.json
{
  "validation": {
    "titleRequired": "Tytuł jest wymagany",
    "dateRequired": "Data jest wymagana",
    "speakerRequired": "Prelegent jest wymagany"
  }
}
```

### Anti-Patterns to Avoid

#### Dynamic Key Generation

```vue
<script setup lang="ts">
// ❌ Wrong: Dynamic key generation makes validation impossible
const errorCode = "404"
const errorMessage = t(`errors.${errorCode}`) // Can't verify key exists

// ❌ Wrong: String concatenation for keys
const prefix = "common"
const action = "save"
const text = t(`${prefix}.${action}`) // Breaks type safety

// ✅ Correct: Use explicit keys with conditional logic
const errorMessage = computed(() => {
	switch (errorCode) {
		case "404":
			return t("errors.notFound") // Verifiable key
		case "500":
			return t("errors.serverError") // Verifiable key
		default:
			return t("errors.unknown") // Verifiable key
	}
})
```

#### Skipping Fallback Locale

```json
// ❌ Wrong: Key only in Polish, missing English fallback
// i18n/locales/pl.json
{
  "meetings": {
    "newKey": "Nowy klucz"
  }
}

// i18n/locales/en.json
{
  "meetings": {
    // Missing "newKey" - breaks fallback!
  }
}

// ✅ Correct: Key exists in both locales
// i18n/locales/pl.json
{
  "meetings": {
    "newKey": "Nowy klucz"
  }
}

// i18n/locales/en.json
{
  "meetings": {
    "newKey": "New key"
  }
}
```

#### Using Keys Before Adding to Translation Files

```vue
<script setup lang="ts">
  // ❌ Wrong: Using key that doesn't exist yet
  const title = computed(() => t("pages.schedule.new.title"))
  // Key not added to i18n/locales/*.json files yet!

  // ✅ Correct Workflow:
  // 1. Add key to i18n/locales/pl.json: "pages.schedule.new.title": "Nowy harmonogram"
  // 2. Add key to i18n/locales/en.json: "pages.schedule.new.title": "New schedule"
  // 3. Use key in component: t("pages.schedule.new.title")
</script>
```

### Missing Key Detection

#### Development Mode Warnings

Enable missing translation warnings in `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  i18n: {
    detectBrowserLanguage: false,
    strategy: "no_prefix",
    defaultLocale: "pl",
    lazy: true,
    langDir: "locales",
    locales: [
      { code: "pl", file: "pl.json" },
      { code: "en", file: "en.json" },
    ],
    // Enable missing translation warnings
    vueI18n: "./i18n.config.ts",
  },
})
```

```typescript
// i18n.config.ts
export default {
  legacy: false,
  locale: "pl",
  fallbackLocale: "en",
  // Log missing translations in development
  missing: (locale: string, key: string) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[i18n] Missing translation: ${key} (locale: ${locale})`)
    }
  },
}
```

#### Browser Console Monitoring

During development, monitor browser console for warnings:

```
[i18n] Missing translation: pages.meetings.new.title (locale: pl)
```

This indicates the key needs to be added to translation files.

### Pre-Commit Checklist

Before committing code with new i18n keys:

- [ ] Added key to `i18n/locales/pl.json` (primary locale)
- [ ] Added key to `i18n/locales/en.json` (fallback locale)
- [ ] Verified key path matches exactly in both files
- [ ] Tested component in browser to confirm translation displays
- [ ] Checked browser console for missing translation warnings
- [ ] Verified Polish characters render correctly (ą, ć, ę, ł, ń, ó, ś, ź, ż)
- [ ] Confirmed no hardcoded Polish text remains in component

### CI/CD Integration (Advanced)

For larger projects, consider automated validation:

```bash
# package.json script
"scripts": {
  "i18n:validate": "node scripts/validate-i18n-keys.js"
}
```

```javascript
// scripts/validate-i18n-keys.js
const fs = require("fs")
const path = require("path")

const pl = JSON.parse(fs.readFileSync("i18n/locales/pl.json", "utf-8"))
const en = JSON.parse(fs.readFileSync("i18n/locales/en.json", "utf-8"))

function getKeys(obj, prefix = "") {
  return Object.keys(obj).flatMap(key => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    return typeof obj[key] === "object" ? getKeys(obj[key], fullKey) : [fullKey]
  })
}

const plKeys = new Set(getKeys(pl))
const enKeys = new Set(getKeys(en))

const missingInEn = [...plKeys].filter(key => !enKeys.has(key))
const missingInPl = [...enKeys].filter(key => !plKeys.has(key))

if (missingInEn.length > 0) {
  console.error("❌ Keys missing in en.json:", missingInEn)
  process.exit(1)
}

if (missingInPl.length > 0) {
  console.error("❌ Keys missing in pl.json:", missingInPl)
  process.exit(1)
}

console.log("✅ All i18n keys are synchronized")
```

### Reference Files

- Core i18n rules: `app/AGENTS.md` (Internationalization section)
- Component integration: `.agents/vue-conventions.md`
- Date formatting with i18n: `.agents/date-time-patterns.md`
- Validation schemas: `server/AGENTS.md` (Zod Schema Patterns section)
- i18n validation skill: `i18n-key-validation.md`
- Zod schema skill: `zod-validation-schema-creation.md`

## Date and Number Formatting Rules

- FORMAT dates using `d(date, formatKey)` with registered datetime formats
- FORMAT numbers using `n(value, formatKey)` with registered number formats
- USE `d(date, 'short')`, `d(date, 'medium')`, `d(date, 'long')` for common date displays
- FORMAT currency with `n(amount, 'currency')` for locale-aware currency display
- FORMAT percentages using `n(value, 'percent')` for proper percentage formatting
- CREATE custom formatting functions when built-in formatters insufficient

## Message Resolution Rules

- RESOLVE messages directly using `rt(message)` when working with `tm()` results
- USE `tm('translation.key')` to access message tree for complex translations
- HANDLE missing translations gracefully with fallback messages
- PROVIDE default message as second parameter: `t('key', 'Default text')`
- CHECK translation existence with conditional rendering when appropriate

## Error Handling and Fallbacks Rules

- IMPLEMENT fallback content using computed properties with `t('fallback.key')`
- VALIDATE translation exists before complex interpolation operations
- PROVIDE meaningful error states using translated messages for missing content
- LOG missing translation warnings during development without breaking UX
- CREATE loading states with translated text while translations load

## API Integration Rules

- RETURN translation keys from API responses for frontend translation
- USE i18n keys in validation error messages: `forms.errors.emailInvalid`
- TRANSLATE API success messages on frontend using returned keys
- HANDLE API error messages through translation system for consistent UX
- VALIDATE user input with translated error messages using Zod or similar

## SEO and Meta Tag Rules

- TRANSLATE page titles using `t('pages.section.meta.title')`
- LOCALIZE meta descriptions through translation keys
- SET `ogLocale` property to current locale value
- PROVIDE alternate language links for SEO using available locales
- STRUCTURE JSON-LD with translated content for search engines

## Static Content Integration Rules

- USE Vue i18n exclusively for all text content (no CMS integration)
- APPLY Vue i18n for interface labels, buttons, and system messages
- IMPLEMENT fallback to default language when locale content missing
- VALIDATE translation keys exist before rendering
- ORGANIZE static content translations by feature and page sections

## Performance Optimization Rules

- LAZY load translation files only when needed
- CACHE loaded translations in memory for repeated use
- USE `computed()` for expensive translation operations
- SPLIT translations by feature or page for smaller bundle sizes
- IMPLEMENT tree shaking to remove unused translation keys in production

## Quality Guidelines

- ALWAYS provide English translation as fallback for every key
- MAINTAIN translation file organization with clear categorization
- DOCUMENT parameter requirements for complex translation strings
- TEST translations in all supported locales during development
- VERIFY proper RTL language support when implementing new locales

## Context7 References

**For Vue i18n documentation, query via Context7**:

- **@nuxtjs/i18n**: Nuxt i18n module configuration and usage
- **Vue I18n**: Translation functions, pluralization, formatting
- **Locale configuration**: Setup and fallback strategies
- **SEO integration**: i18n meta tags and hreflang

**Query examples**:
- "Nuxt i18n module configuration"
- "Vue i18n pluralization rules"
- "i18n SEO meta tags setup"

## References

- Frontend guidelines: `app/AGENTS.md`
- i18n validation skill: `i18n-key-validation.md`
- Polish locale: `i18n/locales/pl.json`
- English locale: `i18n/locales/en.json`
