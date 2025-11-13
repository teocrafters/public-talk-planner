# Vue Component Conventions

Framework-specific patterns and best practices for Vue 3 components in Nuxt 4.

## Component Structure and Organization

- USE `<script setup lang="ts">` syntax for Vue 3 Composition API
- LEVERAGE auto-imports for Vue composables and Nuxt utilities
- ORDER imports: type imports first, then component imports
- DEFINE props interface before props definition
- CALL composables at setup function top level
- ORGANIZE reactive state before `computed` properties
- PLACE methods after `computed` properties
- USE consistent indentation and formatting

## Props Design Guidelines

- AVOID optional properties when possible - think twice about every optional prop
- USE specific union types instead of generic boolean props
- PROVIDE sensible defaults for optional properties with `withDefaults` or destructuring
- PREFER explicit props over variant-based configurations
- DEFINE props with TypeScript interfaces for type safety
- USE exact type validation for complex object props
- AVOID loose prop definitions with any or unknown types
- VALIDATE prop shapes with detailed interface definitions

## Props Declaration Patterns

- USE type-based props declaration with `defineProps<Interface>()`
- USE `withDefaults()` macro for default values (pre-Vue 3.5)
- USE reactive destructuring with defaults for Vue 3.5+
- DEFINE required props without default values
- SPECIFY optional props with question mark notation
- USE PropType for complex runtime prop validation
- AVOID string array syntax for prop definitions

## Event Handling and Emits

- USE `defineEmits<Interface>()` for type-safe event declarations
- USE descriptive method names that indicate the action
- HANDLE async operations properly with loading states
- EMIT events for parent-child communication
- USE named tuple syntax for emit type definitions (Vue 3.3+)
- DECLARE all emitted events explicitly
- PASS meaningful payload data with events
- FOLLOW consistent event naming conventions

## Template Best Practices

- USE `v-if` for conditional mounting and unmounting
- USE `v-show` for frequent visibility toggles
- PREFER `computed` properties for complex template logic
- EXTRACT complex conditions into `computed` properties
- USE event modifiers (.prevent, .stop) appropriately
- BIND attributes with descriptive variable names
- AVOID complex expressions directly in template
- USE semantic HTML elements when possible

## Nuxt UI Integration

- PREFER Nuxt UI components over custom implementations
- USE `UButton`, `UInput`, `UCard`, `UFormField` for standard UI elements
- USE `UIcon` component for all icons instead of manual `<svg>` tags
- UTILIZE template slots for flexible content structure
- CONFIGURE component props for theming and variants
- EXTEND existing Nuxt UI components when needed
- CREATE custom components only when Nuxt UI lacks functionality
- FOLLOW Nuxt UI naming conventions and patterns
- USE Nuxt UI color and size variants consistently

### Nuxt UI 4 Specific Guidelines

- **ALWAYS** verify component API via Nuxt UI MCP before implementation
- **REFERENCE** @.agents/nuxt-ui-4-integration.md for comprehensive Nuxt UI 4 patterns
- **USE** proper slot structure for UModal (#content, #header, #body, #footer)
- **USE** `onSelect` event handler on UDropdownMenu items, NOT click or onClick
- **IMPORT** TypeScript types from '@nuxt/ui' (e.g., `DropdownMenuItem`, `ButtonProps`)
- **VERIFY** component names (UDropdownMenu not UDropdown, UFormField not UFormGroup)

### Icon Usage Guidelines

- USE `<UIcon>` component from Nuxt UI for all icon needs
- PREFER Nuxt UI icon library over manual SVG implementations
- SPECIFY icon size using Nuxt UI size variants (`size="xs"`, `size="sm"`, `size="md"`, etc.)
- USE semantic icon names for better accessibility
- AVOID manual `<svg>` tags when `UIcon` equivalent exists

## Internationalization Integration

- USE `useI18n()` composable in Vue components
- REFERENCE @.agents/i18n-patterns.md for comprehensive i18n guidelines

## Composables Integration

- CALL composables at the top level of setup function only
- USE destructuring for clear composable API access
- LEVERAGE VueUse composables before creating custom functionality
- HANDLE composable state changes with watchers when needed
- AVOID calling composables inside methods or lifecycle hooks
- USE provide/inject for dependency injection patterns
- COMPOSE multiple composables for complex state management
- RETURN reactive values from custom composables

## SSR Data Fetching Patterns

This application uses Server-Side Rendering (SSR), which requires special data fetching patterns to
ensure data is fetched on the server and properly transferred to the client.

### Critical Rules

- **ALWAYS** use `useFetch()` or `useAsyncData()` for data fetching in components
- **NEVER** use raw `$fetch()` directly in components (it won't transfer SSR data to client)
- **ALWAYS** `await` these composables in `<script setup>` for proper SSR hydration
- **HANDLE** loading, error, and success states appropriately

### Using useFetch()

Use `useFetch()` for simple API calls (most common case):

```vue
<script setup lang="ts">
// ✅ Correct: useFetch for SSR-compatible data fetching
const { data: speakers, pending, error, refresh } = await useFetch<Speaker[]>("/api/speakers")

// Destructured values are reactive:
// - data: reactive reference to fetched data (null until loaded)
// - pending: true while fetching, false when complete
// - error: contains error object if request fails (null if success)
// - refresh: function to manually refetch data
</script>

<template>
  <!-- Handle all states appropriately -->
  <div v-if="pending">Loading speakers...</div>
  <div v-else-if="error">
    <UAlert color="error" :title="error.message" />
  </div>
  <div v-else-if="speakers">
    <div v-for="speaker in speakers" :key="speaker.id">
      {{ speaker.firstName }} {{ speaker.lastName }}
    </div>
  </div>
</template>
```

### Using useAsyncData()

Use `useAsyncData()` for complex async operations or custom fetching logic:

```vue
<script setup lang="ts">
// ✅ Use useAsyncData for custom fetch logic
const { data: userData, pending, error, refresh } = await useAsyncData(
  'user-profile', // unique key for caching
  () => $fetch('/api/user/profile', {
    headers: {
      'X-Custom-Header': 'value'
    }
  })
)

// ✅ Use useAsyncData for combining multiple data sources
const { data: combinedData } = await useAsyncData(
  'dashboard-data',
  async () => {
    const [talks, speakers] = await Promise.all([
      $fetch('/api/talks'),
      $fetch('/api/speakers')
    ])
    return { talks, speakers }
  }
)
</script>
```

### When to Use Each

**Use `useFetch()`:**

- Simple GET requests to API endpoints
- When you don't need custom headers or request options
- Most common use case (90% of the time)

**Use `useAsyncData()`:**

- Custom fetch logic with headers or request options
- Non-HTTP async operations (e.g., WebSocket, localStorage)
- Combining multiple data sources
- More control over caching with unique keys

### Multiple Parallel Requests

Fetch multiple resources in parallel for better performance:

```vue
<script setup lang="ts">
// ✅ Multiple parallel requests (execute simultaneously)
const { data: speakers, pending: speakersPending } = await useFetch<Speaker[]>("/api/speakers")
const { data: talks, pending: talksPending } = await useFetch<Talk[]>("/api/talks")

// Both requests execute on server-side during SSR
// Data is serialized and transferred to client
// Client receives pre-rendered HTML with both data sets
</script>
```

### Reactive Refetching

Refetch data when dependencies change:

```vue
<script setup lang="ts">
const route = useRoute()

// ✅ Automatically refetches when route.params.id changes
const { data: speaker } = await useFetch(
  () => `/api/speakers/${route.params.id}`
)

// ✅ Manual refetch using refresh function
const { data: speakers, refresh } = await useFetch("/api/speakers")

async function handleSpeakerCreated() {
  await refresh() // Refetch speakers list
}
</script>
```

### Anti-Patterns to Avoid

```vue
<script setup lang="ts">
// ❌ Wrong: Direct $fetch() in component doesn't transfer SSR data
const speakers = await $fetch('/api/speakers')
// Problem: Data fetched only on client, not during SSR
// Result: No SEO, loading flicker, slower initial page load

// ❌ Wrong: Using onMounted for data fetching defeats SSR
const speakers = ref([])
onMounted(async () => {
  speakers.value = await $fetch('/api/speakers')
})
// Problem: Runs only on client, not during SSR

// ❌ Wrong: Not awaiting useFetch breaks SSR hydration
const { data } = useFetch('/api/speakers') // Missing await!
// Problem: SSR won't wait for data, hydration mismatch

// ❌ Wrong: Using fetch() API directly
onMounted(async () => {
  const response = await fetch('/api/speakers')
  const data = await response.json()
})
// Problem: Client-only, no SSR, no reactivity

// ✅ Correct: Always use useFetch or useAsyncData with await
const { data: speakers, pending, error } = await useFetch<Speaker[]>('/api/speakers')
</script>
```

### Error Handling

```vue
<script setup lang="ts">
const { data: speakers, error } = await useFetch<Speaker[]>("/api/speakers")

// Option 1: Handle in template
</script>

<template>
  <div v-if="error">
    <UAlert color="error" title="Failed to load speakers">
      {{ error.message }}
    </UAlert>
  </div>
  <div v-else>
    <!-- Success state -->
  </div>
</template>

<script setup lang="ts">
// Option 2: Handle with watch
watch(error, (newError) => {
  if (newError) {
    console.error('Failed to fetch speakers:', newError)
    // Show toast notification
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to load speakers',
      color: 'error'
    })
  }
})
</script>
```

### Loading States

```vue
<script setup lang="ts">
const { data: speakers, pending } = await useFetch<Speaker[]>("/api/speakers")
</script>

<template>
  <!-- Show skeleton or spinner while loading -->
  <div v-if="pending">
    <USkeleton v-for="i in 5" :key="i" class="h-20 mb-4" />
  </div>

  <!-- Show content when loaded -->
  <div v-else-if="speakers">
    <SpeakerCard v-for="speaker in speakers" :key="speaker.id" :speaker="speaker" />
  </div>
</template>
```

### Type Safety

```vue
<script setup lang="ts">
import type { Speaker } from '~/server/database/schema'

// ✅ Provide TypeScript types for data
const { data: speakers } = await useFetch<Speaker[]>("/api/speakers")

// TypeScript knows speakers is Ref<Speaker[] | null>
// Auto-completion and type checking work correctly
</script>
```

### Real Example from Codebase

```vue
<script setup lang="ts">
// From app/pages/speakers.vue
import type { Speaker } from "~/server/database/schema"

// Fetch speakers list
const { data: speakers, pending, error, refresh } = await useFetch<Speaker[]>("/api/speakers")

// Fetch user membership (for permissions)
const { data: userMembership } = await useFetch("/api/user/membership")

// Both requests execute during SSR
// Pre-rendered HTML includes speakers list
// SEO-friendly, fast initial load
// Client-side hydration seamless
</script>
```

### Why This Matters

**SEO Benefits:**
- Search engines see fully rendered content with data
- Better rankings for content-heavy pages
- Social media previews show actual content

**Performance Benefits:**
- Faster initial page load (no loading flicker)
- Data fetched once on server, not again on client
- Reduced Time to Interactive (TTI)

**User Experience:**
- Content appears immediately
- No loading spinners on initial load
- Seamless navigation with client-side routing

**Hydration:**
- Server renders with data
- Client receives pre-rendered HTML
- Vue picks up where server left off
- No mismatch errors

## Performance and Reactivity

- USE `ref()` for primitive reactive values
- USE `shallowRef()` for large, infrequently changing objects
- USE `readonly()` for immutable data references
- PREFER `ref` over `reactive` for most use cases
- AVOID unnecessary deep watchers on large objects
- USE targeted watchers for specific property changes
- IMPLEMENT `v-memo` for expensive render operations and lists
- EXTRACT complex `computed` logic into separate `computed` properties
- AVOID inline object creation in templates
- USE `computed` properties for derived state
- IMPLEMENT lazy loading for heavy components
- USE `Suspense` and async components for loading states
- AVOID unnecessary component re-renders
- OPTIMIZE watcher usage with specific dependency tracking
- MINIMIZE template expression complexity

## Middleware Patterns

- USE `defineNuxtRouteMiddleware` for navigation guards and route validation
- IMPLEMENT middleware for authentication checks and access control
- CHAIN multiple middleware by defining them in array format
- HANDLE middleware errors gracefully with try-catch blocks
- USE route-specific middleware with `definePageMeta({ middleware: 'auth' })`
- IMPLEMENT global middleware in `middleware/` directory
- VALIDATE route parameters and query strings in middleware
- REDIRECT users based on authentication state or permissions
- LOG navigation events and security violations in middleware
- AVOID heavy computations in middleware to prevent blocking navigation

## Component Communication

- USE props for data flowing down to child components
- EMIT events for actions flowing up to parent components
- USE provide/inject for deep component tree communication
- DEFINE clear interfaces for component communication
- VALIDATE prop types and emit event signatures
- HANDLE errors gracefully in event handlers
- USE descriptive event names that indicate the action
- PASS necessary data with emitted events

## Testing and Maintainability

- USE dependency injection for external services in Vue components
- EXTRACT pure functions from Vue components for easier unit testing
- DESIGN Vue components with single responsibility principle
- AVOID complex lifecycle logic in Vue components
- REFERENCE project testing patterns for comprehensive testing guidelines

### Component Testing Attributes

- ADD data-testid attributes to ALL interactive elements during component development
- USE data-testid as primary selector for E2E tests
- FOLLOW naming convention: `{feature}-{element}-{type}` in kebab-case
- APPLY test IDs to form inputs, buttons, links, menus, dialogs, and dynamic content
- DOCUMENT all data-testid values in component file
- VERIFY test ID presence before marking component complete
- REFERENCE @.agents/test-ready-component-checklist.md for comprehensive verification

### Why Test Attributes Matter

- STABILITY: Test IDs remain unchanged during refactoring or styling updates
- MAINTAINABILITY: Eliminates brittle selectors based on CSS classes or text content
- CLARITY: Explicit test attributes separate testing concerns from implementation
- EFFICIENCY: Prevents retroactive updates to components after tests are written

## Auto-Import Conventions

- LEVERAGE Nuxt 4 auto-imports for Vue APIs (ref, computed, watch)
- USE auto-imported composables without explicit imports
- RELY on Nuxt component auto-discovery
- DO NOT import from `shared/utils/` or `shared/types/` directories (auto-imported)
- DO NOT import from `app/utils/` directory (auto-imported)
- DO NOT import Zod schemas from `shared/utils/schemas/` (auto-imported)
- CONFIGURE custom auto-imports in nuxt.config when needed
- AVOID manual imports for commonly used Vue utilities
- TRUST TypeScript to infer auto-imported function types
- DOCUMENT custom auto-imports for team awareness

## Anti-Patterns to Avoid

- NEVER call composables inside methods or conditional blocks
- NEVER mutate props directly in child components
- NEVER use `v-model` on props without proper emit handling
- NEVER create reactive state inside computed properties
- NEVER watch entire objects when specific properties suffice
- NEVER use complex expressions directly in templates
- NEVER ignore TypeScript errors with any types
- NEVER create custom components when Nuxt UI equivalents exist

## File References

- Vue 3 Composition API: `@vue/composition-api`
- Nuxt UI components: `@nuxt/ui`
- Auto-imports configuration: `nuxt.config.ts`
- Component examples: `app/components/`
- Composables: `app/composables/`
- Type definitions: `types/` (if exists)
