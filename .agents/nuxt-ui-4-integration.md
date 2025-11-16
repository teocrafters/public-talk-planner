# Nuxt UI 4 Integration Guide

Comprehensive guidelines for using Nuxt UI 4 components with proper API verification, slot patterns,
and event handling.

## Core Integration Principles

- ALWAYS verify component APIs via Nuxt UI MCP before implementation
- USE proper slot patterns for each component type
- APPLY correct event handlers (onSelect, not click)
- IMPORT TypeScript types from '@nuxt/ui' for type safety
- REFERENCE official documentation URLs for complex use cases

## MCP-First Workflow

### Before Using Any Component

1. USE `mcp__nuxt-ui__get_component` to fetch current component API
2. VERIFY available props, slots, and emits from documentation
3. CHECK for TypeScript types (e.g., `DropdownMenuItem`, `ButtonProps`)
4. REVIEW examples in documentation_url for complex patterns
5. VALIDATE slot structure and event handler requirements

### Example Workflow

```typescript
// Step 1: Fetch component documentation via MCP
// mcp__nuxt-ui__get_component(componentName: "DropdownMenu")

// Step 2: Import required types
import type { DropdownMenuItem } from "@nuxt/ui"

// Step 3: Use verified API patterns
const items: DropdownMenuItem[] = [
  {
    label: "Profile",
    icon: "i-lucide-user",
    onSelect: () => handleProfile(),
  },
]
```

## Component-Specific Patterns

### UModal Slot Architecture

**Critical**: UModal has a specific slot structure that must be followed.

#### Slot Hierarchy

- `default` slot → **Trigger element only** (Button, Link, etc.)
- `#content` slot → **Complete custom modal** (replaces entire structure)
- `#header`, `#body`, `#footer` → **Use with built-in structure**

#### Pattern 1: Using Built-in Structure (Recommended)

```vue
<template>
  <UModal
    v-model:open="isOpen"
    title="Modal Title">
    <!-- Trigger in default slot -->
    <UButton label="Open Modal" />

    <!-- Content goes in #body slot -->
    <template #body>
      <p>Your content here</p>
    </template>

    <!-- Footer receives { close } function -->
    <template #footer="{ close }">
      <UButton
        label="Cancel"
        @click="close" />
      <UButton
        label="Confirm"
        @click="handleConfirm" />
    </template>
  </UModal>
</template>
```

#### Pattern 2: Full Custom Content

```vue
<template>
  <UModal v-model:open="isOpen">
    <UButton label="Open Modal" />

    <!-- #content replaces entire modal structure -->
    <template #content>
      <UCard>
        <template #header>Custom Header</template>
        <template #body>Custom Body</template>
        <template #footer>Custom Footer</template>
      </UCard>
    </template>
  </UModal>
</template>
```

#### Common Mistakes

- ❌ NEVER put modal content in default slot
- ❌ DO NOT use `<template #default>` for modal body
- ❌ AVOID mixing #content with #header/#body/#footer
- ✅ USE #body for content when using built-in structure
- ✅ USE #footer="{ close }" to access close function
- ✅ USE #content only for complete custom structure

### UDropdownMenu Patterns

**Critical**: Component is `UDropdownMenu`, not `UDropdown`.

#### Event Handler Pattern

Items use `onSelect` callback, NOT `click` or `onClick`:

```vue
<script setup lang="ts">
  import type { DropdownMenuItem } from "@nuxt/ui"

  const items: DropdownMenuItem[] = [
    {
      label: "Edit",
      icon: "i-lucide-pencil",
      onSelect: () => handleEdit(), // ✅ Correct
      // onClick: () => handleEdit(), // ❌ Wrong
      // click: () => handleEdit(),   // ❌ Wrong
    },
  ]
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton label="Actions" />
  </UDropdownMenu>
</template>
```

#### Item Structure with Types

```typescript
import type { DropdownMenuItem } from "@nuxt/ui"

// Proper typing ensures correct properties
const items: DropdownMenuItem[] = [
  {
    label: "Profile",
    icon: "i-lucide-user",
    onSelect: () => console.log("Profile"),
  },
  {
    label: "Settings",
    icon: "i-lucide-cog",
    kbds: ["meta", "s"],
    onSelect: () => console.log("Settings"),
  },
  {
    type: "separator", // Special item type
  },
  {
    label: "Logout",
    icon: "i-lucide-log-out",
    color: "error",
    onSelect: () => handleLogout(),
  },
]
```

#### Grouped Items Pattern

Use nested arrays for grouped items:

```typescript
const items: DropdownMenuItem[][] = [
  [
    {
      label: "Profile",
      icon: "i-lucide-user",
      onSelect: () => console.log("Profile"),
    },
  ],
  [
    {
      label: "Settings",
      icon: "i-lucide-cog",
      onSelect: () => console.log("Settings"),
    },
    {
      label: "Logout",
      icon: "i-lucide-log-out",
      color: "error",
      onSelect: () => handleLogout(),
    },
  ],
]
```

#### Checkbox Items Pattern

```typescript
const showBookmarks = ref(true)

const items: DropdownMenuItem[] = [
  {
    label: "Show Bookmarks",
    icon: "i-lucide-bookmark",
    type: "checkbox",
    checked: showBookmarks.value,
    onUpdateChecked: (checked: boolean) => {
      showBookmarks.value = checked
    },
    onSelect: (e: Event) => {
      e.preventDefault() // Prevent menu from closing
    },
  },
]
```

### UButton Patterns

#### Loading States

Use `loading` prop with automatic handling via `loading-auto`:

```vue
<template>
  <!-- Manual loading control -->
  <UButton
    :loading="isLoading"
    @click="handleClick">
    Submit
  </UButton>

  <!-- Automatic loading from promise -->
  <UButton
    loading-auto
    @click="asyncHandler">
    Submit
  </UButton>
</template>
```

#### Icon Positioning

```vue
<template>
  <!-- Leading icon -->
  <UButton
    icon="i-lucide-search"
    label="Search" />
  <UButton
    leading-icon="i-lucide-search"
    label="Search" />

  <!-- Trailing icon -->
  <UButton
    trailing-icon="i-lucide-arrow-right"
    label="Next" />

  <!-- Icon only (no label) -->
  <UButton
    icon="i-lucide-search"
    square />
</template>
```

### UFormField Patterns

**Critical**: Component is `UFormField`, not `UFormGroup`.

#### Basic Usage

```vue
<template>
  <UFormField
    label="Email"
    name="email"
    help="We'll never share your email."
    required>
    <UInput
      v-model="email"
      type="email" />
  </UFormField>
</template>
```

#### With Form Integration

```vue
<script setup lang="ts">
  const state = reactive({ email: "" })

  async function onSubmit() {
    // Form submission logic
  }

  function validate(data: typeof state) {
    if (!data.email) return [{ name: "email", message: "Required" }]
    return []
  }
</script>

<template>
  <UForm
    :state="state"
    :validate="validate"
    @submit="onSubmit">
    <UFormField
      name="email"
      label="Email"
      required>
      <UInput v-model="state.email" />
    </UFormField>

    <UButton
      type="submit"
      loading-auto>
      Submit
    </UButton>
  </UForm>
</template>
```

### UModal with Forms Pattern

**Critical**: When using forms inside modals, place UForm in the `#body` slot with a ref attribute,
and trigger submission from the `#footer` button using that ref.

#### Why This Pattern

- SEPARATES form logic from modal structure clearly
- ALLOWS submit buttons in footer to trigger form validation via ref
- PROVIDES proper loading states during form submission
- MAINTAINS clean separation between form fields and modal actions

#### Correct Structure Rules

- PLACE UForm ONLY inside `#body` slot of UModal (not wrapping footer)
- ADD `ref` attribute to UForm component with unique name
- DEFINE form ref using `useTemplateRef` composable in script setup
- PLACE submit button in `#footer` slot of UModal (separate from UForm)
- TRIGGER form submission with `@click="form?.submit()"` on submit button
- HANDLE `@submit` event on UForm for actual form processing logic
- USE `type="submit"` attribute on submit button for semantic HTML
- DISABLE buttons using `isLoading` ref state during form submission
- NEVER wrap `#footer` slot with UForm component

#### Key Points

- **UForm Location**: Only in `#body` slot of UModal, not wrapping footer
- **Form Ref**: Use `const form = useTemplateRef('form')` to get form instance
- **Ref Attribute**: Add `ref="form"` to UForm component
- **Submit Button**: In `#footer` slot, calls `form?.submit()` to trigger validation
- **Loading State**: Use `isLoading` ref and pass to `:loading` or `:disabled` props
- **Close Modal**: Set `open.value = false` after successful submission
- **Error Handling**: Handle errors within submit handler with try-catch
- **FormSubmitEvent**: Type-safe event parameter with validated data in `event.data`
- **Form Reset**: Reset state properties after successful submission if needed

#### Reference Files

- Vue form patterns: @.agents/vue-conventions.md
- Validation patterns: @AGENTS.md (Zod Schema Patterns section)
- i18n integration: @.agents/i18n-patterns.md

### UInput Patterns

#### With Slots

```vue
<template>
  <!-- Leading slot -->
  <UInput v-model="value">
    <template #leading>
      <UIcon name="i-lucide-search" />
    </template>
  </UInput>

  <!-- Trailing slot -->
  <UInput v-model="value">
    <template #trailing>
      <UButton
        icon="i-lucide-x"
        size="sm"
        color="neutral"
        variant="link"
        @click="value = ''" />
    </template>
  </UInput>
</template>
```

#### With Icons

```vue
<template>
  <!-- Leading icon -->
  <UInput
    v-model="value"
    icon="i-lucide-search" />
  <UInput
    v-model="value"
    leading-icon="i-lucide-search" />

  <!-- Trailing icon -->
  <UInput
    v-model="value"
    trailing-icon="i-lucide-at-sign" />
</template>
```

## Component Naming Reference

### Correct Names (Always Use These)

- ✅ `UDropdownMenu` - Menu with actions
- ✅ `UFormField` - Form field wrapper
- ✅ `UModal` - Dialog/Modal component
- ✅ `UButton` - Button component
- ✅ `UInput` - Input field
- ✅ `UCard` - Card container
- ✅ `UIcon` - Icon component

### Common Naming Mistakes

- ❌ `UDropdown` (doesn't exist) → Use `UDropdownMenu`
- ❌ `UFormGroup` (doesn't exist) → Use `UFormField`
- ❌ `UDialog` (different API) → Use `UModal`
- ❌ `Button` (not auto-imported) → Use `UButton`

## Event Handler Reference

### Component-Specific Events

| Component     | Event Property       | Example                             |
| ------------- | -------------------- | ----------------------------------- |
| UDropdownMenu | `onSelect`           | `{ onSelect: () => handleClick() }` |
| UButton       | `@click`             | `<UButton @click="handleClick" />`  |
| UInput        | `@update:modelValue` | `<UInput v-model="value" />`        |
| UModal        | `@update:open`       | `<UModal v-model:open="isOpen" />`  |
| UForm         | `@submit`            | `<UForm @submit="handleSubmit" />`  |

### Common Event Mistakes

- ❌ `click` property on DropdownMenuItem → Use `onSelect`
- ❌ `onClick` property on DropdownMenuItem → Use `onSelect`
- ❌ `@select` on UDropdownMenu → Use `onSelect` on items
- ✅ `onSelect` property on each DropdownMenuItem
- ✅ `@click` event on UButton components

## TypeScript Integration

### Import Pattern

```typescript
// Component-specific types
import type { DropdownMenuItem } from "@nuxt/ui"
import type { ButtonProps } from "@nuxt/ui"
import type { FormSubmitEvent } from "#ui/types"

// Use in component
const items: DropdownMenuItem[] = []
const buttonProps: ButtonProps = { color: "primary" }
```

### Type Safety Best Practices

- ALWAYS import types from '@nuxt/ui' package
- USE `satisfies` operator for inline type checking
- DEFINE interfaces for complex prop structures
- VALIDATE event handler signatures match component API

## Anti-Patterns to Avoid

### UModal Anti-Patterns

```vue
<!-- ❌ Wrong: Content in default slot -->
<UModal v-model:open="isOpen">
  <p>This won't work as expected</p>
</UModal>

<!-- ✅ Correct: Content in #body slot -->
<UModal v-model:open="isOpen">
  <UButton label="Open" />

  <template #body>
    <p>This is correct</p>
  </template>
</UModal>
```

### UDropdownMenu Anti-Patterns

```vue
<script setup lang="ts">
  // ❌ Wrong: Using click instead of onSelect
  const items = [
    {
      label: "Edit",
      click: () => handleEdit(), // Wrong property name
    },
  ]

  // ✅ Correct: Using onSelect
  const items: DropdownMenuItem[] = [
    {
      label: "Edit",
      onSelect: () => handleEdit(),
    },
  ]
</script>
```

### Event Handler Anti-Patterns

```vue
<template>
  <!-- ❌ Wrong: Using @select on UDropdownMenu -->
  <UDropdownMenu
    :items="items"
    @select="handleSelect" />

  <!-- ✅ Correct: Using onSelect on items -->
  <UDropdownMenu :items="items" />
</template>

<script setup lang="ts">
  import type { DropdownMenuItem } from "@nuxt/ui"

  const items: DropdownMenuItem[] = [
    {
      label: "Item",
      onSelect: () => handleSelect(), // Correct
    },
  ]
</script>
```

## Verification Checklist

Before committing component code:

- [ ] Verified component API via `mcp__nuxt-ui__get_component`
- [ ] Used correct component name (e.g., UDropdownMenu, not UDropdown)
- [ ] Used correct slot structure (especially for UModal)
- [ ] Applied correct event handlers (onSelect for dropdown items)
- [ ] Imported TypeScript types from '@nuxt/ui'
- [ ] Tested with actual Nuxt UI 4 documentation examples
- [ ] Validated props and slots match current API
- [ ] Confirmed no deprecated patterns are used

## Testing Integration

### data-testid Requirements

- ADD data-testid attributes to ALL interactive Nuxt UI components
- APPLY test IDs on component root or trigger elements
- USE consistent naming: `{feature}-{element}-{type}` in kebab-case
- VERIFY test IDs are accessible in DOM for E2E tests

### Component Testing Patterns

- ADD data-testid to UButton trigger elements
- ADD data-testid to UInput fields for form testing
- ADD data-testid to UModal containers and action buttons
- ADD data-testid to UDropdownMenu triggers and containers
- ADD data-testid to UCard containers when testing content areas

### Fixture Considerations

- IMPLEMENT Page Object Models for complex Nuxt UI interactions
- CREATE fixtures for common UI patterns (modals, dropdowns, forms)
- USE Playwright's `test.extend()` for reusable Nuxt UI utilities
- DOCUMENT fixture integration requirements for UI components

### Why Testing Integration Matters

- CONSISTENCY: Nuxt UI components follow same testing patterns as custom components
- RELIABILITY: Test IDs ensure stable selectors across UI library updates
- MAINTAINABILITY: Centralized fixture patterns reduce test code duplication
- DOCUMENTATION: Clear test ID documentation aids fixture development

### Reference Files

- Comprehensive E2E patterns: @.agents/e2e-testing-patterns.md
- Component checklist: @.agents/test-ready-component-checklist.md
- Component conventions: @.agents/vue-conventions.md

## Additional Resources

- Use `mcp__nuxt-ui__list_components` to see all available components
- Use `mcp__nuxt-ui__get_component_metadata` for detailed prop/slot/emit info
- Reference official documentation URLs provided by MCP
