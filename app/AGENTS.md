# Frontend Development Guidelines (Nuxt 4 + Vue 3)

Guidelines for developing the frontend application using Nuxt 4, Vue 3, and SSR patterns.

## Core Principles

- **SSR-first approach** - Server-Side Rendering for SEO and performance
- **Component-driven development** - Reusable Vue 3 components with Composition API
- **Auto-imports** - Nuxt automatically imports Vue APIs, composables, and utilities
- **Type-safe development** - TypeScript strict mode with proper type annotations
- **Testing-first** - Add data-testid attributes during component development

## Project Structure

```
app/
├── app.vue              # Root application component
├── components/          # Vue components (auto-imported)
│   ├── Speaker*.vue
│   ├── Meeting*.vue
│   └── Talk*.vue
├── composables/         # Vue composables (auto-imported)
│   ├── usePermissions.ts
│   └── use*.ts
├── layouts/             # Shared layout components
│   └── default.vue
├── pages/               # File-based routing (auto-generated routes)
│   ├── index.vue
│   ├── speakers.vue
│   └── [dynamic].vue
├── utils/               # Client-side utilities (auto-imported)
└── assets/              # Static assets and global styles
```

**Key Points**:
- Components in `app/components/` are auto-imported in templates
- Composables in `app/composables/` are auto-imported everywhere
- Utilities in `app/utils/` are auto-imported everywhere
- DO NOT import from `app/utils/` - they're auto-imported by Nuxt

## Vue 3 Composition API Patterns

### Component Structure

```vue
<script setup lang="ts">
// 1. Type imports (always at top)
import type { Speaker } from "~/server/database/schema"

// 2. Composables (at top level of setup)
const { $t } = useI18n()
const { canManageSpeakers } = usePermissions()

// 3. Reactive state
const isOpen = ref(false)
const selectedSpeaker = ref<Speaker | null>(null)

// 4. Computed properties
const filteredSpeakers = computed(() => {
  // Derived state logic
})

// 5. Methods
async function handleCreate() {
  // Method implementation
}

// 6. Lifecycle hooks (if needed)
onMounted(async () => {
  // Initialization logic
})
</script>

<template>
  <!-- Template with proper data-testid attributes -->
</template>
```

**Critical Rules**:
- ALWAYS use `<script setup lang="ts">` syntax
- CALL composables at top level only (not in methods or conditionals)
- USE `ref()` for primitive values, `reactive()` for objects
- PREFER `computed()` over methods for derived data
- IMPORT types explicitly: `import type { ... } from ...`

## SSR Data Fetching (CRITICAL)

**This application uses Server-Side Rendering**. Data must be fetched correctly for SSR to work.

### ALWAYS Use useFetch() or useAsyncData()

```vue
<script setup lang="ts">
import type { Speaker } from "~/server/database/schema"

// ✅ CORRECT: useFetch for SSR-compatible data fetching
const { data: speakers, pending, error, refresh } = await useFetch<Speaker[]>("/api/speakers")

// Access reactive values in template:
// - data: reactive reference to fetched data
// - pending: true while fetching
// - error: error object if request fails
// - refresh: function to manually refetch
</script>

<template>
  <div v-if="pending">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <div v-else-if="speakers">
    <SpeakerCard
      v-for="speaker in speakers"
      :key="speaker.id"
      :speaker="speaker" />
  </div>
</template>
```

### When to Use Each

**useFetch()** - Most common case:
```vue
<script setup lang="ts">
// Simple API call
const { data } = await useFetch<Talk[]>("/api/talks")
</script>
```

**useAsyncData()** - Custom fetch logic:
```vue
<script setup lang="ts">
// Custom headers or complex async operations
const { data } = await useAsyncData(
  "user-profile",
  () => $fetch("/api/user/profile", {
    headers: { "X-Custom-Header": "value" }
  })
)
</script>
```

### NEVER Do This (Anti-Patterns)

```vue
<script setup lang="ts">
// ❌ WRONG: Direct $fetch() doesn't transfer SSR data to client
const speakers = await $fetch("/api/speakers")

// ❌ WRONG: onMounted defeats SSR purpose
onMounted(async () => {
  speakers.value = await $fetch("/api/speakers")
})

// ❌ WRONG: Not awaiting breaks SSR hydration
const { data } = useFetch("/api/speakers") // Missing await!
</script>
```

### Why SSR Matters
- **SEO**: Search engines see fully rendered content
- **Performance**: Faster initial page load
- **UX**: No loading flicker, content appears immediately
- **Hydration**: Client picks up where server left off

## Component Development

### Props and Emits

```vue
<script setup lang="ts">
import type { Speaker } from "~/server/database/schema"

// Props with TypeScript interface
interface Props {
  speaker: Speaker
  readonly?: boolean
}
const props = defineProps<Props>()

// Emits with TypeScript
interface Emits {
  (e: "update", speaker: Speaker): void
  (e: "delete", id: string): void
}
const emit = defineEmits<Emits>()

// Use in methods
function handleUpdate() {
  emit("update", props.speaker)
}
</script>
```

### Testing Attributes (CRITICAL)

**ALWAYS add data-testid during development**:

```vue
<template>
  <UCard data-testid="speaker-card">
    <UButton
      data-testid="speaker-edit-button"
      @click="handleEdit" />
    <UButton
      data-testid="speaker-delete-button"
      @click="handleDelete" />
  </UCard>
</template>
```

**Naming Convention**: `{feature}-{element}-{type}` in kebab-case

**USE SKILL**: `test-ready-component-check` before marking component complete

**Reference**: `.agents/test-ready-component-checklist.md`

## Nuxt UI 4 Integration

### Component Verification

**ALWAYS verify component API via MCP before implementation**:
1. Use `mcp__nuxt-ui__get_component` to fetch current API
2. Verify props, slots, and events from documentation
3. Check TypeScript types to import

### UModal Slot Structure (CRITICAL)

```vue
<template>
  <UModal v-model:open="isOpen">
    <!-- Trigger in default slot -->
    <UButton label="Open Modal" />

    <!-- Content in #body slot -->
    <template #body>
      <UForm ref="form" @submit="handleSubmit">
        <!-- Form fields here -->
      </UForm>
    </template>

    <!-- Footer with close function -->
    <template #footer="{ close }">
      <UButton label="Cancel" @click="close" />
      <UButton label="Submit" @click="form?.submit()" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
const form = useTemplateRef('form')
const isOpen = ref(false)

async function handleSubmit(event: FormSubmitEvent) {
  // Form submission logic
  isOpen.value = false // Close modal on success
}
</script>
```

**Key Points**:
- Place UForm in `#body` slot with ref
- Trigger submission from `#footer` button via `form?.submit()`
- Use `#footer="{ close }"` to access close function
- NEVER wrap `#footer` with UForm

### UDropdownMenu Event Handlers

```vue
<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui"

// ✅ CORRECT: Use onSelect (NOT click or onClick)
const items: DropdownMenuItem[] = [
  {
    label: "Edit",
    icon: "i-lucide-pencil",
    onSelect: () => handleEdit(), // ✅ Correct
  },
  {
    label: "Delete",
    icon: "i-lucide-trash",
    color: "error",
    onSelect: () => handleDelete(),
  },
]
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton label="Actions" />
  </UDropdownMenu>
</template>
```

**Reference**: `.agents/nuxt-ui-4-integration.md`

## Internationalization (i18n)

### Always Use $t() for UI Text

```vue
<script setup lang="ts">
const { $t } = useI18n()
const title = computed(() => $t('pages.speakers.title'))
</script>

<template>
  <h1>{{ title }}</h1>
  <UButton :label="$t('common.submit')" />

  <!-- ❌ NEVER hardcode Polish text -->
  <!-- <h1>Lista prelegentów</h1> -->
</template>
```

### Translation Key Validation

**CRITICAL**: Keys must exist in BOTH `i18n/locales/pl.json` AND `i18n/locales/en.json`

**USE SKILL**: `i18n-key-validation` before committing new translation keys

**Reference**: `.agents/i18n-patterns.md`

## Error Handling

### API Error Validation

```vue
<script setup lang="ts">
import { isApiValidationError } from "~/app/utils/error"

async function handleSubmit() {
  try {
    await $fetch("/api/speakers", {
      method: "POST",
      body: formData,
    })
  } catch (err) {
    // ✅ CORRECT: Use type guard
    if (isApiValidationError(err)) {
      // err.data.errors is typed and available
      console.error(err.data.errors)
    } else {
      // Generic error handling
      console.error("Unknown error:", err)
    }
  }
}
</script>
```

**Key Points**:
- ALWAYS use `isApiValidationError` type guard
- IMPORT type guard before handling API errors
- NEVER assume error structure without validation

## E2E Testing

### Test Development Workflow

**Three-step process**:
1. **Component**: Add data-testid during development (use `test-ready-component-check` skill)
2. **Fixtures**: Create/update fixtures for reusable patterns
3. **Tests**: Write tests using fixtures and test IDs

### Fixture Pattern

```typescript
// ✅ CORRECT: Import from merged fixtures
import { test, expect } from "../fixtures"

test("displays speakers list", async ({ page }) => {
  // Enhanced page automatically waits for Nuxt hydration
  await page.goto("http://localhost:3000/speakers")

  await expect(page.getByTestId("speakers-list")).toBeVisible()
})
```

**Reference**: `.agents/e2e-testing-patterns.md`

## Common Anti-Patterns

### ❌ SSR Anti-Patterns

```vue
<script setup lang="ts">
// WRONG: Direct $fetch in component
const speakers = await $fetch("/api/speakers")

// WRONG: Fetching in onMounted
onMounted(async () => {
  speakers.value = await $fetch("/api/speakers")
})

// WRONG: Not awaiting useFetch
const { data } = useFetch("/api/speakers")
</script>
```

### ❌ Internationalization Anti-Patterns

```vue
<template>
  <!-- WRONG: Hardcoded Polish text -->
  <h1>Lista prelegentów</h1>

  <!-- CORRECT: Use $t() -->
  <h1>{{ $t('pages.speakers.title') }}</h1>
</template>
```

### ❌ Testing Anti-Patterns

```vue
<template>
  <!-- WRONG: No data-testid -->
  <UButton @click="handleCreate" />

  <!-- CORRECT: With data-testid -->
  <UButton
    data-testid="speakers-create-button"
    @click="handleCreate" />
</template>
```

### ❌ Nuxt UI Anti-Patterns

```vue
<script setup>
// WRONG: Using click instead of onSelect
const items = [{
  label: "Edit",
  click: () => handleEdit() // ❌ Wrong
}]

// CORRECT: Using onSelect
const items: DropdownMenuItem[] = [{
  label: "Edit",
  onSelect: () => handleEdit() // ✅ Correct
}]
</script>
```

## Available Skills

Use these skills during frontend development:

- **i18n-key-validation** - Validate translation keys before commit
- **test-ready-component-check** - Verify component is ready for E2E testing
- **ssr-data-fetching-implementation** - Guide through proper SSR data fetching
- **pre-commit-quality-check** - Run all quality checks before commit

## References

### Detailed Documentation
- Vue conventions: `.agents/vue-conventions.md`
- Nuxt UI integration: `.agents/nuxt-ui-4-integration.md`
- E2E testing: `.agents/e2e-testing-patterns.md`
- i18n patterns: `.agents/i18n-patterns.md`
- Tailwind patterns: `.agents/tailwind-patterns.md`

### Official Documentation (Context7)
- Nuxt 4: Composables, SSR, auto-imports
- Vue 3: Composition API, defineModel
- Tailwind CSS v4: Utilities, configuration
