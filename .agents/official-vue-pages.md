# Vue Router Quick Reference

Quick reference for advanced Vue Router syntax and project-specific routing patterns.

**For complete Vue Router documentation, use Context7 to query official docs.**

## Project-Specific Notes

- **File-based routing**: Pages in `app/pages/` auto-generate routes
- **Typed router**: Always refer to `typed-router.d.ts` for route names and parameters
- **Reference project patterns**: `.agents/vue-conventions.md`

## Advanced Route Syntax

### Optional Parameters

```
pages/posts.[[slug]].vue → /posts or /posts/some-slug
```

### Repeatable Parameters

```
pages/posts.[[slug]]+.vue → /posts/some-posts or /posts/some/post
```

### Route Groups

```
pages/
├── (admin).vue       # Layout for admin routes
├── (admin)/
│   ├── dashboard.vue → /dashboard
│   └── settings.vue  → /settings
```

## Context7 References

**For comprehensive documentation, query via Context7**:

- **Vue Router**: Advanced routing, dynamic routes, route guards
- **File-based routing**: Nuxt 4 pages directory conventions
- **Route configuration**: definePage(), route meta, aliases

**Query examples**:

- "Nuxt 4 file-based routing patterns"
- "Vue Router route guards and middleware"
- "Nuxt typed router usage"

## References

- Project Vue patterns: `.agents/vue-conventions.md`
- Typed routes: `typed-router.d.ts`
- Official Vue Router docs: Use Context7
