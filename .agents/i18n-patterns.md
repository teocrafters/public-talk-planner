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
