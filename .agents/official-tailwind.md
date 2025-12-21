# Tailwind CSS v4 Quick Reference

Quick reference for Tailwind CSS v4 migration and project-specific patterns.

**For complete Tailwind documentation, use Context7 to query official docs.**

## Project-Specific Notes

- **Project uses**: Tailwind CSS v4.1+ with Nuxt UI 4
- **Reference project patterns**: `.agents/tailwind-patterns.md`
- **Never use `@apply`** - Use CSS variables or component patterns instead

## Critical Breaking Changes (v3 → v4)

Quick reference for common migration issues:

### Most Common Renames

| ❌ v3 (Don't use) | ✅ v4 (Use this) |
| ----------------- | ---------------- |
| `bg-gradient-*`   | `bg-linear-*`    |
| `shadow-sm`       | `shadow-xs`      |
| `shadow`          | `shadow-sm`      |
| `rounded-sm`      | `rounded-xs`     |
| `rounded`         | `rounded-sm`     |
| `ring`            | `ring-3`         |

### Removed Utilities

Use opacity modifiers instead:

- `bg-opacity-*` → `bg-black/50`
- `text-opacity-*` → `text-black/50`

### Renamed Flex Utilities

- `flex-shrink-*` → `shrink-*`
- `flex-grow-*` → `grow-*`

## Context7 References

**For comprehensive documentation, query via Context7**:

- **Tailwind CSS v4 Upgrade Guide**: https://tailwindcss.com/docs/upgrade-guide
- **Tailwind CSS v4 Changelog**: https://tailwindcss.com/blog/tailwindcss-v4
- **New v4 Features**: Container queries, text shadows, masking utilities
- **CSS Variables**: `--color-*`, `--radius-*`, `--spacing()` function
- **Configuration**: `@theme` directive, `@source` directive

**Query examples**:

- "How to use container queries in Tailwind v4"
- "Tailwind v4 text shadow utilities"
- "Tailwind CSS v4 @theme directive syntax"

## References

- Project Tailwind patterns: `.agents/tailwind-patterns.md`
- Official Tailwind CSS v4 docs: Use Context7
