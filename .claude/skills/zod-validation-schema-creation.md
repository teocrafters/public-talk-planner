# Zod Validation Schema Creation Skill

Guides through creating Zod validation schemas with i18n integration for API request validation.

## Purpose

USE this skill when:

- Creating new API endpoints that accept request bodies
- Adding validation for POST, PUT, or PATCH requests
- Implementing form validation schemas
- Need to validate user input with i18n error messages

DO NOT use this skill for:

- GET requests (no body validation needed)
- Client-side only validation
- Non-Zod validation approaches

## Critical Rules

⚠️ **Factory pattern REQUIRED** - Schemas must accept translation function `t: (key: string) => string`
⚠️ **i18n keys in errors** - All error messages use translation keys, not hardcoded text
⚠️ **File organization** - All schemas in `shared/utils/schemas/` directory
⚠️ **Type export** - Always export TypeScript type using `z.infer<ReturnType<...>>`

## Workflow Steps

### Step 1: Identify Validation Requirements

**Goal**: Determine what data needs validation.

**Actions**:

1. Analyze API endpoint requirements:
   - What fields are required?
   - What fields are optional?
   - What validation rules apply? (min/max length, email format, etc.)
2. Determine data type:
   - Creating new resource → `create` schema
   - Updating existing resource → `update` schema (usually partial)
3. Identify resource name (e.g., speaker, meeting, talk)

**Output**: Clear validation requirements and resource name.

---

### Step 2: Create Schema File

**Goal**: Create new file in correct location with proper naming.

**File Location**: `shared/utils/schemas/{resource}.ts`

**Naming Convention**:
- Use singular form: `speaker.ts`, `meeting.ts`, `talk.ts`
- Use kebab-case: `speaker-import.ts`, `talk-schedule.ts`

**Actions**:

1. Create file: `shared/utils/schemas/{resource}.ts`
2. Import Zod:
   ```typescript
   import { z } from "zod"
   ```
3. Proceed to Step 3

**Output**: Empty schema file created.

---

### Step 3: Implement Factory Function Pattern

**Goal**: Create schema factory accepting translation function.

**Template**:

```typescript
// shared/utils/schemas/{resource}.ts
import { z } from "zod"

export function create{Resource}Schema(t: (key: string) => string) {
  return z.object({
    // Required fields
    fieldName: z
      .string()
      .min(1, t("validation.fieldNameRequired"))
      .max(100, t("validation.fieldNameTooLong")),

    // Optional fields
    optionalField: z
      .string()
      .max(200, t("validation.optionalFieldTooLong"))
      .optional(),

    // Email validation
    email: z
      .string()
      .email(t("validation.emailInvalid"))
      .optional(),

    // Number validation
    age: z
      .number()
      .min(0, t("validation.ageTooLow"))
      .max(150, t("validation.ageTooHigh"))
      .optional(),

    // Boolean
    isActive: z.boolean().optional(),
  })
}
```

**Validation Rules**:
- Use `z.string()`, `z.number()`, `z.boolean()` for primitives
- Add `.min()`, `.max()` for length/value constraints
- Use `.email()`, `.url()`, `.uuid()` for format validation
- Add `.optional()` for non-required fields
- Embed i18n keys: `t("validation.keyName")`

**Output**: Schema factory function implemented.

---

### Step 4: Export TypeScript Type

**Goal**: Provide type-safe input type for the schema.

**Pattern**:

```typescript
// After schema factory definition
export type Create{Resource}Input = z.infer<ReturnType<typeof create{Resource}Schema>>
```

**Example**:

```typescript
export function createSpeakerSchema(t: (key: string) => string) {
  return z.object({
    firstName: z.string().min(1, t("validation.firstNameRequired")).max(100),
    lastName: z.string().min(1, t("validation.lastNameRequired")).max(100),
    email: z.string().email(t("validation.emailInvalid")).optional(),
  })
}

// Export TypeScript type
export type CreateSpeakerInput = z.infer<ReturnType<typeof createSpeakerSchema>>
```

**Key Points**:
- Type name follows PascalCase: `CreateSpeakerInput`
- Uses `z.infer<ReturnType<...>>` pattern
- Type automatically matches schema structure

**Output**: TypeScript type exported.

---

### Step 5: Create Update Schema (If Needed)

**Goal**: Create partial schema for update operations.

**Pattern**:

```typescript
export function update{Resource}Schema(t: (key: string) => string) {
  return create{Resource}Schema(t).partial()
}

export type Update{Resource}Input = z.infer<ReturnType<typeof update{Resource}Schema>>
```

**Why `.partial()`**:
- Makes all fields optional
- Allows partial updates (only send changed fields)
- Validation still applies to provided fields

**Example**:

```typescript
// Create schema (all required)
export function createSpeakerSchema(t: (key: string) => string) {
  return z.object({
    firstName: z.string().min(1, t("validation.firstNameRequired")),
    lastName: z.string().min(1, t("validation.lastNameRequired")),
  })
}

// Update schema (all optional)
export function updateSpeakerSchema(t: (key: string) => string) {
  return createSpeakerSchema(t).partial()
}

// Update allows: { firstName: "John" } or { lastName: "Doe" } or both
```

**Output**: Update schema created (if needed).

---

### Step 6: Update Barrel File

**Goal**: Export schema from central index for auto-import.

**File**: `shared/utils/schemas/index.ts`

**Actions**:

1. Add export line to `shared/utils/schemas/index.ts`:
   ```typescript
   export * from "./speaker"
   export * from "./meeting"
   export * from "./{new-resource}" // Add this line
   ```
2. Verify all schemas exported

**Why This Matters**:
- Schemas in `shared/utils/schemas/` subdirectory require explicit import
- Barrel file allows: `import { createSpeakerSchema } from "#shared/utils/schemas"`
- Without barrel export, direct imports needed: `import { createSpeakerSchema } from "#shared/utils/schemas/speaker"`

**Output**: Schema exported from barrel file.

---

### Step 7: Add Translation Keys

**Goal**: Ensure all validation error keys exist in translation files.

**Actions**:

1. List all translation keys used in schema:
   - `validation.fieldNameRequired`
   - `validation.fieldNameTooLong`
   - `validation.emailInvalid`
2. **INVOKE**: `i18n-key-validation` skill
3. Add missing keys to:
   - `i18n/locales/pl.json`
   - `i18n/locales/en.json`

**Example**:

```json
// i18n/locales/pl.json
{
  "validation": {
    "firstNameRequired": "Imię jest wymagane",
    "firstNameTooLong": "Imię jest za długie (max 100 znaków)",
    "lastNameRequired": "Nazwisko jest wymagane",
    "emailInvalid": "Nieprawidłowy adres email"
  }
}

// i18n/locales/en.json
{
  "validation": {
    "firstNameRequired": "First name is required",
    "firstNameTooLong": "First name is too long (max 100 characters)",
    "lastNameRequired": "Last name is required",
    "emailInvalid": "Invalid email address"
  }
}
```

**Output**: All translation keys added to both locale files.

---

### Step 8: Implement in API Route

**Goal**: Use schema in API endpoint for request validation.

**Pattern**:

```typescript
// server/api/{resource}/index.post.ts
import { create{Resource}Schema } from "#shared/utils/schemas"

export default defineEventHandler(async (event) => {
  // Validate request body with schema
  const body = await validateBody(event, create{Resource}Schema)

  // body is now typed as Create{Resource}Input
  // All validation passed, safe to use

  const db = useDrizzle()

  const [resource] = await db
    .insert(tables.{resources})
    .values({
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  return resource
})
```

**Key Points**:
- Import schema from `#shared/utils/schemas`
- Use `validateBody(event, schemaFactory)` utility
- Schema is auto-imported (no need to specify import)
- Body is fully typed after validation
- Validation errors return HTTP 400 automatically

**Output**: Schema integrated into API route.

---

## Complete Example

### Creating Speaker Validation Schema

**Requirement**: Validate speaker creation with first name, last name, email, phone, congregation

**Step 1**: Requirements identified
- Required: firstName, lastName
- Optional: email, phone, congregation
- Email must be valid format
- All text fields have max length

**Step 2**: Create file `shared/utils/schemas/speaker.ts`

**Step 3-4**: Implement factory and types

```typescript
// shared/utils/schemas/speaker.ts
import { z } from "zod"

export function createSpeakerSchema(t: (key: string) => string) {
  return z.object({
    firstName: z
      .string()
      .min(1, t("validation.firstNameRequired"))
      .max(100, t("validation.firstNameTooLong")),

    lastName: z
      .string()
      .min(1, t("validation.lastNameRequired"))
      .max(100, t("validation.lastNameTooLong")),

    email: z
      .string()
      .email(t("validation.emailInvalid"))
      .max(200, t("validation.emailTooLong"))
      .optional(),

    phone: z
      .string()
      .max(20, t("validation.phoneTooLong"))
      .optional(),

    congregation: z
      .string()
      .max(200, t("validation.congregationTooLong"))
      .optional(),
  })
}

export type CreateSpeakerInput = z.infer<ReturnType<typeof createSpeakerSchema>>

export function updateSpeakerSchema(t: (key: string) => string) {
  return createSpeakerSchema(t).partial()
}

export type UpdateSpeakerInput = z.infer<ReturnType<typeof updateSpeakerSchema>>
```

**Step 5**: Update schema created

**Step 6**: Update barrel file

```typescript
// shared/utils/schemas/index.ts
export * from "./speaker"
// ... other schemas
```

**Step 7**: Add translation keys (via i18n-key-validation skill)

**Step 8**: Use in API routes

```typescript
// server/api/speakers/index.post.ts
import { createSpeakerSchema } from "#shared/utils/schemas"

export default defineEventHandler(async (event) => {
  const body = await validateBody(event, createSpeakerSchema)

  const db = useDrizzle()
  const [speaker] = await db.insert(tables.speakers).values({
    id: crypto.randomUUID(),
    ...body,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()

  return speaker
})

// server/api/speakers/[id].patch.ts
import { updateSpeakerSchema } from "#shared/utils/schemas"

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id")
  const body = await validateBody(event, updateSpeakerSchema)

  const db = useDrizzle()
  const [speaker] = await db
    .update(tables.speakers)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(tables.speakers.id, id))
    .returning()

  return speaker
})
```

---

## Common Validation Patterns

### String with Length Constraints

```typescript
field: z
  .string()
  .min(1, t("validation.fieldRequired"))
  .max(200, t("validation.fieldTooLong"))
```

### Email Validation

```typescript
email: z
  .string()
  .email(t("validation.emailInvalid"))
  .optional()
```

### Phone Number Validation

```typescript
phone: z
  .string()
  .regex(/^\+?[0-9]{9,15}$/, t("validation.phoneInvalid"))
  .optional()
```

### Date Validation (Unix Timestamp)

```typescript
scheduledDate: z
  .number()
  .int(t("validation.dateInvalid"))
  .positive(t("validation.dateInvalid"))
```

### Enum/Union Validation

```typescript
import { SPEAKER_SOURCE_TYPES } from "#shared/constants/speaker-sources"

sourceType: z
  .enum(Object.values(SPEAKER_SOURCE_TYPES) as [string, ...string[]])
  .optional()
```

### Array Validation

```typescript
tags: z
  .array(z.string())
  .max(10, t("validation.tooManyTags"))
  .optional()
```

---

## Validation Error Response

When validation fails, API returns:

```json
{
  "statusCode": 400,
  "statusMessage": "Validation Error",
  "data": {
    "errors": [
      {
        "field": "firstName",
        "messageKey": "validation.firstNameRequired"
      },
      {
        "field": "email",
        "messageKey": "validation.emailInvalid"
      }
    ]
  }
}
```

Frontend handles errors:

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
    if (isApiValidationError(err)) {
      // Display translated errors
      err.data.errors.forEach(error => {
        console.error($t(error.messageKey))
      })
    }
  }
}
</script>
```

---

## Anti-Patterns (NEVER DO THIS)

### ❌ Hardcoded Error Messages

```typescript
// WRONG: Hardcoded text
export function createSpeakerSchema() {
  return z.object({
    firstName: z.string().min(1, "First name is required"),
  })
}

// CORRECT: i18n keys
export function createSpeakerSchema(t: (key: string) => string) {
  return z.object({
    firstName: z.string().min(1, t("validation.firstNameRequired")),
  })
}
```

### ❌ No Factory Pattern

```typescript
// WRONG: Direct schema without translation function
export const createSpeakerSchema = z.object({
  firstName: z.string().min(1),
})

// CORRECT: Factory pattern
export function createSpeakerSchema(t: (key: string) => string) {
  return z.object({
    firstName: z.string().min(1, t("validation.firstNameRequired")),
  })
}
```

### ❌ Wrong File Location

```typescript
// WRONG: Schema in API route file
// server/api/speakers/index.post.ts
const schema = z.object({ ... })

// CORRECT: Schema in shared/utils/schemas/
// shared/utils/schemas/speaker.ts
export function createSpeakerSchema(t) { ... }
```

### ❌ Missing Type Export

```typescript
// WRONG: No TypeScript type exported
export function createSpeakerSchema(t) {
  return z.object({ ... })
}

// CORRECT: Export type
export type CreateSpeakerInput = z.infer<ReturnType<typeof createSpeakerSchema>>
```

---

## Integration Checklist

```
✅ Zod Schema Creation Checklist

File Structure:
□ Schema file created in shared/utils/schemas/
□ File name is singular kebab-case: {resource}.ts

Schema Implementation:
□ Factory function with t parameter: (t: (key: string) => string)
□ All error messages use i18n keys: t("validation.keyName")
□ Appropriate validation rules (min, max, email, etc.)
□ Required vs optional fields correctly defined

TypeScript:
□ Type exported: export type Create{Resource}Input = z.infer<...>
□ Update schema created if needed: update{Resource}Schema
□ Update type exported: export type Update{Resource}Input = z.infer<...>

File Organization:
□ Barrel file updated: shared/utils/schemas/index.ts
□ Schema exported: export * from "./{resource}"

Translation Keys:
□ All validation keys added to i18n/locales/pl.json
□ All validation keys added to i18n/locales/en.json
□ Keys follow convention: validation.{field}{Rule}

API Integration:
□ Schema imported in API route: import from "#shared/utils/schemas"
□ validateBody() used: await validateBody(event, schema)
□ TypeScript type used for body typing

All items checked → Schema ready to use!
```

---

## Why This Skill Matters

- **CONSISTENCY**: All validation follows same pattern
- **TYPE SAFETY**: Automatic TypeScript types from schemas
- **i18n INTEGRATION**: Error messages translated automatically
- **SECURITY**: Input validation at API boundaries
- **MAINTAINABILITY**: Single source of truth for validation rules

## References

- Backend guidelines: `server/AGENTS.md`
- i18n patterns: `.agents/i18n-patterns.md`
- Zod documentation: Official docs (Context7)
