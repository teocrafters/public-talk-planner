---
name: test-readiness
enabled: true
event: file
action: warn
conditions:
  - field: file_path
    operator: regex_match
    pattern: app/components/.*\.vue$
  - field: new_text
    operator: regex_match
    pattern: (<UButton|<UInput|<USelect|<UCard|<UModal|<UForm|@click=|@submit=)
  - field: new_text
    operator: not_contains
    pattern: data-testid=
---

⚠️ **Test Readiness: Missing data-testid Attributes**

You're creating or modifying an interactive Vue component without `data-testid` attributes.

**Why this matters:**
- E2E tests rely on data-testid for reliable element selection
- CSS classes and text content are fragile selectors
- Adding test IDs retroactively is inefficient
- Test-first development catches issues earlier

**Required: Add data-testid to ALL interactive elements**

**Naming convention:** `{feature}-{element}-{type}` in kebab-case

Examples:
```vue
<!-- Buttons -->
<UButton data-testid="speakers-create-button" />
<UButton data-testid="speaker-edit-button" />
<UButton data-testid="speaker-delete-button" />

<!-- Inputs -->
<UInput data-testid="speaker-first-name-input" />
<UInput data-testid="speaker-email-input" />

<!-- Cards/Containers -->
<UCard data-testid="speaker-card" />
<UModal data-testid="speaker-edit-modal" />

<!-- Forms -->
<UForm data-testid="speaker-form" @submit="..." />
```

**Elements that MUST have data-testid:**
- All buttons (UButton, button elements)
- All inputs (UInput, UTextarea, USelect, etc.)
- All forms (UForm)
- All interactive elements (@click, @submit handlers)
- Container elements tested for content (UCard, UModal)

**See:** `.claude/skills/playwright-fixtures-implementation/SKILL.md` for test patterns.

If this is not an interactive component or already has test IDs, you can proceed.
