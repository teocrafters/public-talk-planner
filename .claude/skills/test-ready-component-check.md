# Test-Ready Component Check Skill

Verifies that Vue components are fully prepared for E2E testing with Playwright before tests are
written.

## Purpose

USE this skill when:

- Creating a new Vue component in `app/components/`
- Modifying an existing component significantly
- Before marking a component as "complete"
- Before writing E2E tests for a component

DO NOT use this skill for:

- Writing actual tests (use E2E workflow for that)
- Testing component logic (use Vitest for unit tests)
- Reviewing component functionality

## Critical Rules

⚠️ **data-testid is MANDATORY** - ALL interactive elements MUST have data-testid attributes ⚠️
**Naming convention MUST be followed** - Use `{feature}-{element}-{type}` in kebab-case ⚠️
**Component-first approach** - Add test IDs DURING development, NOT retroactively

## Workflow Steps

### Step 1: Identify Component and Interactive Elements

**Goal**: Determine which component to check and what elements need test IDs.

**Actions**:

1. Identify the component file to check (e.g., `app/components/SpeakerImportModal.vue`)
2. Read the component's `<template>` section
3. Catalog ALL interactive elements:
   - **Form inputs**: `<UInput>`, `<USelect>`, `<UTextarea>`, `<UCheckbox>`, `<URadio>`
   - **Buttons**: `<UButton>`, `<button>`
   - **Links**: `<NuxtLink>`, `<a>`
   - **Menus**: `<UDropdownMenu>`, navigation items
   - **Modals/Dialogs**: `<UModal>`, `<UCard>` with actions
   - **Lists**: containers for repeating elements
   - **Dynamic content**: areas that tests will verify (success messages, errors)
4. Create list of elements that need data-testid

**Output**: Complete list of interactive elements requiring test IDs.

---

### Step 2: Verify data-testid Attributes

**Goal**: Check that every interactive element has a data-testid attribute.

**Actions**:

1. For each element identified in Step 1, verify presence of `data-testid`:

   ```vue
   <!-- ✅ Has data-testid -->
   <UButton data-testid="speakers-create-button" />

   <!-- ❌ Missing data-testid -->
   <UButton label="Create" />
   ```

2. Identify MISSING test IDs:
   - Element type (button, input, link)
   - Element purpose (submit, cancel, email input)
   - Suggested test ID (see naming convention in Step 3)
3. Create list of elements missing test IDs

**Output**: List of elements missing data-testid attributes (if any).

---

### Step 3: Verify Naming Convention

**Goal**: Ensure all data-testid values follow project naming convention.

**Naming Convention**: `{feature}-{element}-{type}`

- **feature**: Feature/page name in kebab-case (e.g., `speakers`, `meetings`, `talk-schedule`)
- **element**: Specific element purpose (e.g., `create`, `submit`, `email`, `title`)
- **type**: Element type (e.g., `button`, `input`, `select`, `menu`, `dialog`, `list`)

**Examples**:

- `speakers-create-button` - Button to create speaker
- `speakers-first-name-input` - Input for speaker's first name
- `meetings-submit-button` - Submit button in meetings form
- `talk-schedule-list` - List container for talks
- `speaker-import-modal` - Modal dialog for importing speakers

**Actions**:

1. For each data-testid found, validate naming:
   - Check kebab-case (lowercase with hyphens)
   - Verify structure: `{feature}-{element}-{type}`
   - Ensure descriptive element name
   - Check type suffix is appropriate
2. Identify INVALID naming:

   ```vue
   <!-- ❌ Wrong: camelCase -->
   <UButton data-testid="speakersCreateButton" />

   <!-- ❌ Wrong: Missing type suffix -->
   <UButton data-testid="speakers-create" />

   <!-- ❌ Wrong: Generic name -->
   <UButton data-testid="button1" />

   <!-- ✅ Correct -->
   <UButton data-testid="speakers-create-button" />
   ```

3. Create list of test IDs that violate naming convention

**Output**: List of test IDs with invalid naming (if any).

---

### Step 4: Category-Specific Checklist

**Goal**: Verify component meets requirements for its specific category.

**Categories**:

#### Form Components

Checklist:

- [ ] All input fields have unique data-testid
- [ ] Submit button has data-testid
- [ ] Cancel/Close buttons have data-testid
- [ ] Error message containers have data-testid
- [ ] Success feedback elements have data-testid
- [ ] Form validation states are testable

#### Navigation Components

Checklist:

- [ ] Menu items have data-testid
- [ ] Dropdown triggers have data-testid
- [ ] Navigation links have data-testid
- [ ] Active state indicators are testable (via data-testid or aria attributes)
- [ ] Mobile navigation toggles have data-testid

#### List and Table Components

Checklist:

- [ ] Container element has data-testid
- [ ] Individual list items have data-testid (if testing specific items)
- [ ] Action buttons within items have data-testid
- [ ] Empty state elements have data-testid
- [ ] Loading state elements have data-testid

#### Dialog and Modal Components

Checklist:

- [ ] Dialog/Modal container has data-testid
- [ ] Confirm/Action buttons have data-testid
- [ ] Cancel/Close buttons have data-testid
- [ ] Dialog content areas have data-testid (if testing content)
- [ ] Overlay/backdrop is testable (optional)

**Actions**:

1. Determine component category (may be multiple)
2. Apply appropriate checklist(s)
3. Identify unchecked items
4. For each unchecked item, determine if:
   - Element doesn't exist (not applicable)
   - Element exists but missing test ID (issue)

**Output**: Category-specific validation results.

---

### Step 5: Document Test IDs

**Goal**: Ensure test IDs are documented in the component file.

**Actions**:

1. Check for test ID documentation in component:
   - Inline comments near elements
   - Component documentation block
   - Props interface with test ID references
2. If documentation missing or incomplete, suggest adding:

```vue
<script setup lang="ts">
  /**
   * SpeakerImportModal Component
   *
   * Test IDs:
   * - speaker-import-modal: Modal container
   * - speaker-import-file-input: File upload input
   * - speaker-import-format-select: Format selection dropdown
   * - speaker-import-submit-button: Submit button
   * - speaker-import-cancel-button: Cancel button
   * - speaker-import-error-message: Error message container
   */
</script>

<template>
  <UModal data-testid="speaker-import-modal">
    <!-- ... -->
  </UModal>
</template>
```

**Output**: Documentation status (documented / needs documentation).

---

### Step 6: DOM Verification

**Goal**: Verify test IDs appear in rendered DOM.

**Actions**:

1. Prompt user to verify in browser:

```
✅ Component test IDs validated in code.

Please verify in browser:

1. Run dev server: pnpm dev
2. Navigate to component (or trigger it if modal/dropdown)
3. Open browser DevTools (F12)
4. Inspect interactive elements
5. Verify data-testid attributes are present in DOM

Example check:
<button data-testid="speakers-create-button" class="...">
  Create Speaker
</button>

If test IDs missing from DOM:
- Check conditional rendering (v-if, v-show)
- Verify prop binding is correct
- Check component is actually rendering
```

2. Wait for user confirmation

**Output**: Test IDs confirmed present in DOM.

---

### Step 7: Final Pre-Test Checklist

**Goal**: Confirm component is ready for E2E test implementation.

**Actions**:

1. Display final checklist:

```
✅ Test-Ready Component Pre-Test Checklist

Component: [ComponentName.vue]

□ ALL interactive elements have data-testid
□ ALL test IDs follow naming convention: {feature}-{element}-{type}
□ ALL test IDs use kebab-case (no camelCase, no underscores)
□ Category-specific requirements met (forms/navigation/lists/modals)
□ Test IDs documented in component file
□ Test IDs verified present in browser DOM
□ No generic test IDs (button1, input, etc.)
□ Test IDs provide context (feature prefix)

✅ Component is TEST-READY
❌ Component needs fixes before testing
```

2. If any items unchecked, list required fixes
3. Confirm readiness or return to appropriate step

**Output**: Component marked as test-ready OR list of required fixes.

---

## Example Validation

### Component: SpeakerImportModal.vue

**Template**:

```vue
<template>
  <UModal
    v-model:open="isOpen"
    data-testid="speaker-import-modal">
    <UButton data-testid="speaker-import-trigger-button"> Import Speakers </UButton>

    <template #body>
      <UFormField label="Upload File">
        <UInput
          type="file"
          data-testid="speaker-import-file-input"
          @change="handleFileChange" />
      </UFormField>

      <UFormField label="File Format">
        <USelect
          v-model="format"
          :options="formats"
          data-testid="speaker-import-format-select" />
      </UFormField>

      <div
        v-if="errorMessage"
        data-testid="speaker-import-error-message"
        class="text-error">
        {{ errorMessage }}
      </div>
    </template>

    <template #footer="{ close }">
      <UButton
        data-testid="speaker-import-cancel-button"
        color="neutral"
        @click="close">
        Cancel
      </UButton>
      <UButton
        data-testid="speaker-import-submit-button"
        @click="handleSubmit">
        Import
      </UButton>
    </template>
  </UModal>
</template>
```

**Validation**:

1. **Interactive elements**: ✅ 6 elements identified
2. **data-testid presence**: ✅ All 6 have test IDs
3. **Naming convention**:
   - `speaker-import-modal` ✅ Correct
   - `speaker-import-trigger-button` ✅ Correct
   - `speaker-import-file-input` ✅ Correct
   - `speaker-import-format-select` ✅ Correct
   - `speaker-import-error-message` ✅ Correct
   - `speaker-import-cancel-button` ✅ Correct
   - `speaker-import-submit-button` ✅ Correct
4. **Category**: Modal with Form
   - ✅ Modal container has test ID
   - ✅ Form inputs have test IDs
   - ✅ Submit/Cancel buttons have test IDs
   - ✅ Error message has test ID
5. **Documentation**: ✅ Documented in component
6. **DOM verification**: ✅ User confirmed
7. **Final checklist**: ✅ ALL items checked

**Result**: Component is TEST-READY ✅

---

## Common Issues and Solutions

### Issue: Missing test ID on Nuxt UI component

**Symptom**: `<UButton>` doesn't have data-testid

**Solution**:

```vue
<!-- Add data-testid as prop -->
<UButton data-testid="speakers-create-button" label="Create" />
```

### Issue: Wrong naming convention

**Symptom**: `data-testid="createButton"` (camelCase)

**Solution**:

```vue
<!-- Use kebab-case with feature prefix -->
<UButton data-testid="speakers-create-button" />
```

### Issue: Generic test ID

**Symptom**: `data-testid="button1"`

**Solution**:

```vue
<!-- Use descriptive name with context -->
<UButton data-testid="speakers-create-button" />
```

### Issue: Test ID not in DOM

**Symptom**: Attribute missing when inspecting in browser

**Solution**:

1. Check conditional rendering (v-if might be false)
2. Verify component is imported and rendering
3. Check for typos in attribute name
4. Verify Vue is hydrated (not SSR HTML only)

---

## Why This Workflow Matters

- **PREVENTS RETROACTIVE WORK**: Adding test IDs after development is expensive
- **ENSURES TEST STABILITY**: data-testid selectors don't break with styling changes
- **IMPROVES TEST QUALITY**: Consistent naming makes tests self-documenting
- **ENABLES COMPONENT-FIRST**: Components are test-ready before tests are written

## References

- Test-ready checklist: `.agents/test-ready-component-checklist.md`
- E2E testing patterns: `.agents/e2e-testing-patterns.md`
- Vue conventions: `.agents/vue-conventions.md`
- Playwright documentation: Official docs (Context7)
