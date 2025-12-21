# Nuxt UI Component Integration Skill

Verifies correct Nuxt UI 4 component usage with MCP-first workflow to prevent common mistakes.

## Purpose

USE this skill when:

- Adding new Nuxt UI component to project (UButton, UModal, UDropdownMenu, etc.)
- Uncertain about component API (props, slots, events)
- Experiencing issues with component behavior
- Before implementing complex UI patterns

DO NOT use this skill for:

- Custom Vue components (non-Nuxt UI)
- Basic HTML elements
- Reading component documentation only

## Critical Rules

⚠️ **MCP-first verification** - ALWAYS verify component API via MCP before implementation ⚠️
**Correct component names** - UDropdownMenu (not UDropdown), UFormField (not UFormGroup) ⚠️ **Proper
event handlers** - onSelect for dropdown items (NOT click or onClick) ⚠️ **Slot structure
matters** - UModal has specific slot hierarchy that must be followed

## Workflow Steps

### Step 1: Identify Component Need

**Goal**: Determine which Nuxt UI component is needed.

**Actions**:

1. Analyze UI requirement:
   - Button → `UButton`
   - Input field → `UInput`
   - Form field wrapper → `UFormField`
   - Modal/Dialog → `UModal`
   - Dropdown menu → `UDropdownMenu`
   - Card container → `UCard`
   - Icon → `UIcon`
2. Check component name is correct:
   - ✅ `UDropdownMenu` (NOT UDropdown)
   - ✅ `UFormField` (NOT UFormGroup)
   - ✅ `UModal` (NOT UDialog)

**Output**: Correct component name identified.

---

### Step 2: Fetch Component API via MCP

**Goal**: Get current, accurate component API from Nuxt UI documentation.

**Actions**:

1. Execute MCP call:

   ```
   mcp__nuxt-ui__get_component(componentName: "ComponentName")
   ```

   Example: `mcp__nuxt-ui__get_component(componentName: "UModal")`

2. Review returned documentation:
   - Available props and their types
   - Slot structure and slot props
   - Emitted events
   - TypeScript types to import
   - Examples and usage patterns

3. Note any special requirements or gotchas

**Output**: Component API documentation retrieved.

---

### Step 3: Verify Props, Slots, and Events

**Goal**: Understand component API before implementation.

**Verification Checklist**:

```
Component API Verification

Props:
□ Required props identified
□ Optional props reviewed
□ Type definitions noted
□ Default values understood

Slots:
□ Available slots identified
□ Slot props documented (if any)
□ Slot hierarchy understood (especially for UModal)

Events:
□ Emitted events identified
□ Event handler names noted (e.g., onSelect vs onClick)
□ Event payload types documented

TypeScript:
□ Types to import identified (e.g., DropdownMenuItem)
□ Import statement: import type { ... } from "@nuxt/ui"
```

**Output**: Component API fully understood.

---

### Step 4: Check for Component-Specific Patterns

**Goal**: Identify special patterns or anti-patterns for this component.

**Special Cases**:

#### UModal Slot Structure

```vue
<template>
  <UModal v-model:open="isOpen">
    <!-- Trigger in default slot -->
    <UButton label="Open" />

    <!-- Content in #body slot (NOT default slot) -->
    <template #body>
      <p>Modal content here</p>
    </template>

    <!-- Footer with close function -->
    <template #footer="{ close }">
      <UButton
        label="Close"
        @click="close" />
    </template>
  </UModal>
</template>
```

**Anti-Pattern**:

```vue
<!-- ❌ WRONG: Content in default slot -->
<UModal v-model:open="isOpen">
  <p>This won't work as expected</p>
</UModal>
```

#### UModal with UForm Pattern

```vue
<template>
  <UModal v-model:open="isOpen">
    <UButton label="Open" />

    <template #body>
      <!-- UForm with ref in #body slot -->
      <UForm
        ref="form"
        @submit="handleSubmit">
        <UFormField name="firstName">
          <UInput v-model="state.firstName" />
        </UFormField>
      </UForm>
    </template>

    <template #footer="{ close }">
      <!-- Trigger form submit from footer -->
      <UButton
        label="Cancel"
        @click="close" />
      <UButton
        label="Submit"
        @click="form?.submit()" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
  const form = useTemplateRef("form")
  const isOpen = ref(false)

  async function handleSubmit(event: FormSubmitEvent) {
    // Handle form submission
    isOpen.value = false
  }
</script>
```

#### UDropdownMenu Event Handlers

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
      click: () => handleEdit(), // ❌ Wrong
    },
  ]
</script>
```

**Output**: Component-specific patterns identified.

---

### Step 5: Import TypeScript Types

**Goal**: Ensure type safety with proper type imports.

**Actions**:

1. Identify types to import from MCP documentation:
   - `DropdownMenuItem` for UDropdownMenu
   - `ButtonProps` for UButton
   - `FormSubmitEvent` for UForm
2. Add import statement:
   ```typescript
   import type { DropdownMenuItem, FormSubmitEvent } from "@nuxt/ui"
   ```
3. Apply types to data structures:
   ```typescript
   const items: DropdownMenuItem[] = [...]
   async function handleSubmit(event: FormSubmitEvent) { ... }
   ```

**Output**: TypeScript types imported and applied.

---

### Step 6: Implement Component

**Goal**: Implement component following verified API and patterns.

**Actions**:

1. Use verified props, slots, and events from MCP
2. Apply component-specific patterns identified in Step 4
3. Import TypeScript types from Step 5
4. Add data-testid attributes for testing
5. Verify implementation matches documentation

**Template Structure**:

```vue
<script setup lang="ts">
  // Type imports
  import type { ComponentTypes } from "@nuxt/ui"

  // Props/state
  const isOpen = ref(false)

  // Event handlers
  function handleAction() {
    // Implementation
  }
</script>

<template>
  <UComponentName
    v-model:open="isOpen"
    data-testid="feature-element-type"
    @event="handleAction">
    <!-- Slots as per MCP documentation -->
  </UComponentName>
</template>
```

**Output**: Component implemented with verified API.

---

### Step 7: Verify Against Common Mistakes

**Goal**: Check implementation against known anti-patterns.

**Common Mistakes Checklist**:

```
Anti-Pattern Verification

UModal:
□ Content in #body slot (NOT default slot)
□ UForm in #body with ref (if form present)
□ Submit button in #footer triggers form.submit()
□ Using #footer="{ close }" to access close function

UDropdownMenu:
□ Items use onSelect (NOT click or onClick)
□ Items typed as DropdownMenuItem[]
□ Correct import: import type { DropdownMenuItem } from "@nuxt/ui"

UFormField:
□ Component name is UFormField (NOT UFormGroup)
□ Proper name attribute for form integration

UButton:
□ Using loading or loading-auto for async actions
□ Icon positioning: icon (leading) vs trailing-icon

General:
□ data-testid attribute added
□ Event handlers match component API
□ Slots used correctly per documentation
```

**Output**: No anti-patterns found OR list of issues to fix.

---

## Component Reference Guide

### Component Name Corrections

| ❌ Common Mistake | ✅ Correct Name |
| ----------------- | --------------- |
| UDropdown         | UDropdownMenu   |
| UFormGroup        | UFormField      |
| UDialog           | UModal          |

### Event Handler Reference

| Component           | Event Property | Usage                               |
| ------------------- | -------------- | ----------------------------------- |
| UDropdownMenu items | `onSelect`     | `{ onSelect: () => handleClick() }` |
| UButton             | `@click`       | `<UButton @click="handleClick" />`  |
| UModal              | `@update:open` | `<UModal v-model:open="isOpen" />`  |
| UForm               | `@submit`      | `<UForm @submit="handleSubmit" />`  |

### Common TypeScript Imports

```typescript
import type { DropdownMenuItem, ButtonProps, FormSubmitEvent, InputProps } from "@nuxt/ui"
```

---

## Real-World Examples

### Example 1: UDropdownMenu with Actions

```vue
<script setup lang="ts">
  import type { DropdownMenuItem } from "@nuxt/ui"

  const items: DropdownMenuItem[] = [
    {
      label: "Edit",
      icon: "i-lucide-pencil",
      onSelect: () => handleEdit(),
    },
    {
      label: "Delete",
      icon: "i-lucide-trash",
      color: "error",
      onSelect: () => handleDelete(),
    },
  ]

  function handleEdit() {
    console.log("Edit clicked")
  }

  function handleDelete() {
    console.log("Delete clicked")
  }
</script>

<template>
  <UDropdownMenu
    :items="items"
    data-testid="speaker-actions-menu">
    <UButton
      icon="i-lucide-more-vertical"
      data-testid="speaker-actions-trigger" />
  </UDropdownMenu>
</template>
```

### Example 2: UModal with Form

```vue
<script setup lang="ts">
  import type { FormSubmitEvent } from "@nuxt/ui"

  const isOpen = ref(false)
  const form = useTemplateRef("form")
  const state = reactive({
    firstName: "",
    lastName: "",
  })

  async function handleSubmit(event: FormSubmitEvent<typeof state>) {
    try {
      await $fetch("/api/speakers", {
        method: "POST",
        body: event.data,
      })
      isOpen.value = false
    } catch (err) {
      console.error(err)
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    data-testid="speaker-create-modal">
    <UButton
      label="Create Speaker"
      data-testid="speaker-create-trigger" />

    <template #body>
      <UForm
        ref="form"
        :state="state"
        @submit="handleSubmit">
        <UFormField
          name="firstName"
          label="First Name">
          <UInput
            v-model="state.firstName"
            data-testid="speaker-first-name-input" />
        </UFormField>
        <UFormField
          name="lastName"
          label="Last Name">
          <UInput
            v-model="state.lastName"
            data-testid="speaker-last-name-input" />
        </UFormField>
      </UForm>
    </template>

    <template #footer="{ close }">
      <UButton
        label="Cancel"
        data-testid="speaker-cancel-button"
        @click="close" />
      <UButton
        label="Submit"
        data-testid="speaker-submit-button"
        @click="form?.submit()" />
    </template>
  </UModal>
</template>
```

---

## MCP Integration

### Available MCP Tools

**List all components**:

```
mcp__nuxt-ui__list_components()
```

**Get component documentation**:

```
mcp__nuxt-ui__get_component(componentName: "UButton")
```

**Get component metadata** (detailed props/slots/events):

```
mcp__nuxt-ui__get_component_metadata(componentName: "UModal")
```

**Search components**:

```
mcp__nuxt-ui__search_components_by_category(category: "Form")
```

---

## Why This Skill Matters

- **PREVENTS API MISTAKES**: MCP ensures current, accurate component API
- **SAVES TIME**: No guessing about props, slots, or events
- **AVOIDS BREAKING CHANGES**: MCP reflects latest Nuxt UI 4 API
- **ENSURES CORRECTNESS**: Type-safe implementation with proper TypeScript types
- **CATCHES ANTI-PATTERNS**: Known issues documented and checked

## References

- Nuxt UI integration: `.agents/nuxt-ui-4-integration.md`
- Frontend guidelines: `app/AGENTS.md`
- Nuxt UI documentation: Official docs via MCP
