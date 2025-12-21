# Nuxt UI 4 Integration Guide

Guidelines for using Nuxt UI 4 components with MCP-first workflow.

**For complete component API documentation, use MCP tools or Context7.**

## Critical Integration Rules

⚠️ **MCP-first workflow** - ALWAYS verify component API via MCP before implementation
⚠️ **Correct component names** - UDropdownMenu (not UDropdown), UFormField (not UFormGroup)
⚠️ **Proper event handlers** - onSelect for dropdown items (NOT click)
⚠️ **Slot structure** - UModal has specific hierarchy that must be followed

**USE SKILL**: `nuxt-ui-component-integration` when adding Nuxt UI components

## MCP-First Workflow

### Before Using Any Component

1. Verify API: `mcp__nuxt-ui__get_component(componentName: "ComponentName")`
2. Check props, slots, and events from documentation
3. Import TypeScript types from '@nuxt/ui'
4. Follow verified patterns

### Available MCP Tools

- `mcp__nuxt-ui__list_components()` - List all components
- `mcp__nuxt-ui__get_component(componentName)` - Get component docs
- `mcp__nuxt-ui__get_component_metadata(componentName)` - Detailed API
- `mcp__nuxt-ui__search_components_by_category(category)` - Search by category

## UModal Slot Structure (CRITICAL)

**Three slot patterns**:

### Pattern 1: Built-in Structure (Recommended)

```vue
<template>
  <UModal v-model:open="isOpen" title="Modal Title">
    <!-- Trigger in default slot -->
    <UButton label="Open Modal" />

    <!-- Content in #body slot -->
    <template #body>
      <p>Your content here</p>
    </template>

    <!-- Footer with close function -->
    <template #footer="{ close }">
      <UButton label="Cancel" @click="close" />
      <UButton label="Confirm" @click="handleConfirm" />
    </template>
  </UModal>
</template>
```

### Pattern 2: UModal with UForm (CRITICAL)

```vue
<template>
  <UModal v-model:open="isOpen">
    <UButton label="Open" />

    <!-- UForm in #body slot with ref -->
    <template #body>
      <UForm ref="form" @submit="handleSubmit">
        <UFormField name="firstName">
          <UInput v-model="state.firstName" />
        </UFormField>
      </UForm>
    </template>

    <!-- Submit from #footer via ref -->
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
  isOpen.value = false
}
</script>
```

**Key Points**:
- Place UForm in `#body` slot with ref attribute
- Trigger submission from `#footer` button via `form?.submit()`
- NEVER wrap `#footer` with UForm

### Common UModal Mistakes

```vue
<!-- ❌ WRONG: Content in default slot -->
<UModal v-model:open="isOpen">
  <p>This won't work</p>
</UModal>

<!-- ✅ CORRECT: Content in #body slot -->
<UModal v-model:open="isOpen">
  <UButton label="Open" />
  <template #body>
    <p>This works</p>
  </template>
</UModal>
```

## UDropdownMenu Event Handlers (CRITICAL)

```vue
<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui"

// ✅ CORRECT: Use onSelect
const items: DropdownMenuItem[] = [
  {
    label: "Edit",
    icon: "i-lucide-pencil",
    onSelect: () => handleEdit(),
  },
]

// ❌ WRONG: Using click or onClick
const items = [
  {
    label: "Edit",
    click: () => handleEdit(), // Wrong property
  },
]
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton label="Actions" />
  </UDropdownMenu>
</template>
```

## Component Name Reference

| ❌ Common Mistake | ✅ Correct Name |
|------------------|----------------|
| UDropdown | UDropdownMenu |
| UFormGroup | UFormField |
| UDialog | UModal |

## TypeScript Integration

```typescript
// Import component-specific types
import type {
  DropdownMenuItem,
  ButtonProps,
  FormSubmitEvent,
} from "@nuxt/ui"

// Use in component
const items: DropdownMenuItem[] = []
```

## Testing Integration

**ALWAYS add data-testid to Nuxt UI components**:

```vue
<template>
  <UButton
    data-testid="speakers-create-button"
    label="Create" />

  <UModal data-testid="speaker-import-modal">
    <!-- ... -->
  </UModal>

  <UDropdownMenu
    :items="items"
    data-testid="speaker-actions-menu">
    <UButton data-testid="speaker-actions-trigger" />
  </UDropdownMenu>
</template>
```

**Reference**: `.agents/test-ready-component-checklist.md`

## Context7 References

**For component API documentation, query via nuxt-ui**:

- **Nuxt UI 4 Components**: UButton, UInput, UModal, UDropdownMenu, UForm
- **Component Props**: Available props and their types
- **Component Slots**: Slot structure and slot props
- **Component Events**: Emitted events and handlers

**Query examples**:
- "Nuxt UI 4 UModal slots and props"
- "Nuxt UI 4 UDropdownMenu item structure"
- "Nuxt UI 4 UForm validation patterns"

## References

- Nuxt UI integration skill: `nuxt-ui-component-integration.md`
- Frontend guidelines: `app/AGENTS.md`
- Vue conventions: `.agents/vue-conventions.md`
- Nuxt UI documentation: Use MCP tools or Context7
