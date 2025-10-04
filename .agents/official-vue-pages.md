# Official Vue Router Advanced Patterns

Advanced Vue Router and file-based routing patterns. For basic routing and project structure, see
@.agents/project-structure.md.

## Advanced Route Syntax

- Use double brackets `[[paramName]]` for optional route parameters
- Use the `+` modifier after a closing bracket `]` to make a parameter repeatable:
  `/posts.[[slug]]+.vue` matches `/posts/some-posts` and `/posts/some/post`
- Within a page component, use `definePage()` to customize the route's properties like `meta`,
  `name`, `path`, `alias`, etc
- ALWAYS refer to the `typed-router.d.ts` file to find route names and parameters

### Route groups

Route groups can also create shared layouts without interfering with the generated URL:

```
src/pages/
├── (admin).vue # layout for all admin routes, does not affect other pages
├── (admin)/
│   ├── dashboard.vue
│   └── settings.vue
└── (user)/
    ├── profile.vue
    └── order.vue
```

Resulting URLs:

- `/dashboard` -> renders `src/pages/(admin)/dashboard.vue`
- `/settings` -> renders `src/pages/(admin)/settings.vue`
- `/profile` -> renders `src/pages/(user)/profile.vue`
- `/order` -> renders `src/pages/(user)/order.vue`
