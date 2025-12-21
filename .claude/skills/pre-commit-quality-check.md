# Pre-Commit Quality Check Skill

Automates code quality validation before committing changes to the repository.

## Purpose

USE this skill when:

- About to commit changes (`git commit`)
- Before creating a pull request
- After completing a feature or bug fix
- When explicitly requested by developer

DO NOT use this skill for:

- Reading code
- Writing code
- Fixing bugs or implementing features

## Critical Rules

⚠️ **NO SHORTCUTS** - ALL quality checks must pass before committing ⚠️ **ALWAYS RUN** - Never skip
quality checks "just this once" ⚠️ **FIX BEFORE COMMIT** - Don't commit broken code with intent to
fix later

## Workflow Steps

### Step 1: Run Linting with Auto-Fix

**Goal**: Fix linting errors automatically and identify remaining issues.

**Actions**:

1. Execute: `pnpm lint:fix`
2. Wait for command to complete
3. Analyze output:
   - **If no errors**: ✅ Proceed to Step 2
   - **If errors remain**: ❌ Display errors and stop workflow
4. Show results to user:

```
✅ Linting: PASSED (auto-fixed X issues)
or
❌ Linting: FAILED (X errors remaining)

Errors:
[error details from eslint output]

Fix these errors before committing.
```

**Output**: Linting passed OR list of errors requiring manual fixes.

---

### Step 2: Run TypeScript Type Checking

**Goal**: Ensure no TypeScript type errors exist.

**Actions**:

1. Execute: `pnpm typecheck`
2. Wait for command to complete
3. Analyze output:
   - **If no errors**: ✅ Proceed to Step 3
   - **If errors exist**: ❌ Display errors and stop workflow
4. Show results to user:

```
✅ Type Checking: PASSED (0 errors)
or
❌ Type Checking: FAILED (X errors found)

Type Errors:
[error details from tsc output]

Common issues:
- Missing type annotations on functions
- Using 'any' where types should be explicit
- Incorrect type usage
- Missing imports for types

Fix these type errors before committing.
```

**Output**: Type checking passed OR list of type errors.

---

### Step 3: Run Code Formatting

**Goal**: Ensure consistent code formatting across the project.

**Actions**:

1. Execute: `pnpm format`
2. Wait for command to complete
3. Check if files were modified:
   - Run `git diff --stat` to see changes
   - **If no changes**: ✅ Already formatted
   - **If files changed**: ⚠️ Files were formatted
4. Show results to user:

```
✅ Formatting: PASSED (no changes needed)
or
⚠️  Formatting: Modified X files

Files formatted:
[list of modified files from git diff]

These files have been automatically formatted.
Review the changes with `git diff` before committing.
```

**Output**: Formatting completed.

---

### Step 4: Check for Database Schema Changes

**Goal**: Detect schema modifications and trigger migration workflow if needed.

**Actions**:

1. Check if `server/database/schema.ts` was modified:
   - Run `git diff --cached --name-only | grep "server/database/schema.ts"`
2. **If schema.ts modified**:
   - ⚠️ **CRITICAL**: Schema change detected!
   - **INVOKE**: database-migration-workflow skill
   - Wait for migration workflow to complete
   - Verify migration files are staged for commit
3. **If schema.ts NOT modified**:
   - ✅ No schema changes, continue
4. Show result:

```
⚠️  Database Schema Change Detected

Invoking database-migration-workflow skill...

or

✅ No database schema changes detected
```

**Output**: Schema changes handled OR no schema changes.

---

### Step 5: Suggest Manual Testing

**Goal**: Remind developer to test critical functionality.

**Actions**:

1. Analyze changed files to identify affected features:
   - Frontend changes → UI testing
   - Backend changes → API testing
   - Database changes → Data integrity testing
2. Display testing suggestions:

```
🧪 Manual Testing Suggestions

Based on your changes, please test:

Frontend Changes:
- [List affected pages/components]
- Verify UI renders correctly
- Test user interactions
- Check responsive behavior

Backend Changes:
- [List affected API routes]
- Test API endpoints with curl/Postman
- Verify database operations
- Check error handling

Critical Paths:
- [Identify critical user workflows to test]

Have you tested these areas? (Y/n)
```

3. Wait for user confirmation

**Output**: User confirmed testing OR skipped (with warning).

---

### Step 6: Generate Conventional Commit Message Template

**Goal**: Help developer write a well-formatted commit message.

**Actions**:

1. Analyze staged changes to suggest commit type:
   - New files in `app/components/` → `feat(ui): ...`
   - Changes in `server/api/` → `feat(api): ...` or `fix(api): ...`
   - Changes in tests → `test: ...`
   - Changes in docs → `docs: ...`
   - Database migrations → `feat(db): ...` or `fix(db): ...`
2. Generate commit message template:

```
📝 Suggested Commit Message Template

<type>(<scope>): <short description>

<optional detailed description>

<optional footer: references, breaking changes>

Examples based on your changes:

feat(speakers): add speaker import functionality
- Implemented speaker import modal
- Added file upload validation
- Integrated with backend API

Migration: 0001_add_speakers_import_log.sql

fix(api): resolve validation error in meetings endpoint
- Fixed Zod schema for date validation
- Added proper error messages
- Updated tests

BREAKING CHANGE: API response format changed

test(e2e): add tests for speaker import flow
- Added test fixtures for speakers
- Implemented import workflow tests
- Verified edge cases

Types: feat, fix, refactor, perf, style, docs, test, chore
Scopes: ui, api, auth, i18n, db, test, docs, deps, config
```

**Output**: Commit message template displayed.

---

### Step 7: Final Pre-Commit Summary

**Goal**: Provide complete summary of all checks before commit.

**Actions**:

1. Display comprehensive summary:

```
✅ Pre-Commit Quality Check Summary

✅ Linting: PASSED (auto-fixed 3 issues)
✅ Type Checking: PASSED (0 errors)
✅ Formatting: PASSED (modified 2 files)
✅ Database Schema: No changes (or: Migration generated and staged)
⚠️  Manual Testing: Suggested, user confirmed
✅ Commit Message: Template provided

All quality gates passed. Ready to commit!

Next steps:
1. Review formatted files: git diff
2. Stage new files if needed: git add .
3. Commit with message: git commit -m "..."
4. Push changes: git push

or

❌ Pre-Commit Quality Check FAILED

❌ Type Checking: 3 errors found
✅ Linting: PASSED
✅ Formatting: PASSED

Please fix the errors above before committing.
```

**Output**: Ready to commit OR errors requiring fixes.

---

## Execution Flow Diagram

```
START
  ↓
[Step 1: Linting] → FAIL → Display errors → STOP
  ↓ PASS
[Step 2: Type Check] → FAIL → Display errors → STOP
  ↓ PASS
[Step 3: Formatting] → Format files
  ↓
[Step 4: Schema Check] → IF schema changed → Invoke migration workflow
  ↓
[Step 5: Testing Reminder] → Suggest tests → Wait for confirmation
  ↓
[Step 6: Commit Template] → Generate message
  ↓
[Step 7: Summary] → Display results
  ↓
READY TO COMMIT or STOP (if errors)
```

## Integration with Other Skills

### Calls database-migration-workflow

**When**: Step 4 detects `server/database/schema.ts` modifications

**How**:

```
IF schema.ts modified:
  INVOKE database-migration-workflow skill
  WAIT for completion
  VERIFY migration files staged
```

### Future Integration Points

- **i18n-key-validation**: Could be invoked when new translation keys detected
- **test-ready-component-check**: Could be invoked when new components added

---

## Common Scenarios

### Scenario 1: Quick Bug Fix

**Changes**: Fixed typo in `server/api/speakers/index.get.ts`

**Quality Check**:

1. ✅ Linting: PASSED
2. ✅ Type Check: PASSED
3. ✅ Formatting: PASSED
4. ✅ Schema: No changes
5. ⚠️ Testing: Test API endpoint
6. ✅ Commit: `fix(api): correct typo in speakers endpoint`

**Result**: Ready to commit ✅

### Scenario 2: New Feature with Schema Change

**Changes**:

- Added `app/components/SpeakerImportModal.vue`
- Modified `server/database/schema.ts`
- Added API route `server/api/speakers/import.post.ts`

**Quality Check**:

1. ✅ Linting: PASSED (auto-fixed 2 issues)
2. ✅ Type Check: PASSED
3. ✅ Formatting: Modified 3 files
4. ⚠️ **Schema Changed**: Invoking migration workflow...
   - User ran `pnpm db:generate`
   - Migration reviewed and staged
5. ⚠️ Testing: Test import modal, API endpoint
6. ✅ Commit Template:

   ```
   feat(speakers): add speaker import functionality
   - Implemented import modal component
   - Added speaker import API endpoint
   - Updated database schema for import tracking

   Migration: 0015_add_speaker_imports_table.sql
   ```

**Result**: Ready to commit ✅ (with migration)

### Scenario 3: Type Errors Found

**Changes**: Refactored composable `app/composables/usePermissions.ts`

**Quality Check**:

1. ✅ Linting: PASSED
2. ❌ **Type Check: FAILED** (5 errors)

   ```
   app/composables/usePermissions.ts:23:12 - error TS2322:
   Type 'string | undefined' is not assignable to type 'string'.

   app/pages/speakers.vue:45:28 - error TS2339:
   Property 'canEditSpeakers' does not exist on type 'ReturnType<typeof usePermissions>'.
   ```

3. **STOPPED**: Must fix type errors before continuing

**Result**: ❌ Cannot commit until type errors fixed

---

## Anti-Patterns (NEVER DO THIS)

❌ **Skipping quality checks**:

```bash
# WRONG
git commit -m "quick fix" --no-verify
```

❌ **Committing with known errors**:

```
❌ Type Check: 3 errors
"I'll fix these in the next commit"
# WRONG - Fix NOW
```

❌ **Ignoring formatting changes**:

```
⚠️  Formatting: Modified 5 files
"I'll commit without reviewing the formatting changes"
# WRONG - Review with git diff first
```

❌ **Committing schema without migration**:

```
Modified: server/database/schema.ts
"I'll generate the migration later"
# WRONG - Generate migration NOW
```

❌ **Vague commit messages**:

```bash
git commit -m "updates"  # WRONG - Be specific
git commit -m "fix stuff"  # WRONG - Describe what was fixed
git commit -m "wip"  # WRONG - Don't commit work in progress
```

## Why This Workflow Matters

- **PREVENTS BROKEN BUILDS**: Type errors and linting issues caught before CI
- **MAINTAINS CONSISTENCY**: Code formatting enforced across team
- **ENSURES QUALITY**: Multiple validation layers catch issues early
- **SAVES TIME**: Automated checks faster than manual review
- **IMPROVES HISTORY**: Good commit messages aid future debugging

## Configuration

**Commands used**:

- `pnpm lint:fix` → ESLint with auto-fix
- `pnpm typecheck` → TypeScript compiler check
- `pnpm format` → Prettier code formatter

**All commands configured in**: `package.json` scripts section

## References

- Database migration workflow: `database-migration-workflow.md` skill
- Git workflow: `@AGENTS.md` (Git Workflow section)
- Conventional commits: Official specification (Context7)
- ESLint configuration: `.eslintrc.cjs` or `eslint.config.js`
- TypeScript configuration: `tsconfig.json`
