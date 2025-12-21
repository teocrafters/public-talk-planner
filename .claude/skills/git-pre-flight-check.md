# Git Pre-Flight Check Skill

Verifies safe git operations before pushing changes to prevent destructive actions.

## Purpose

USE this skill when:

- About to push changes to remote (`git push`)
- Before force-pushing to any branch
- When uncertain about branch or push safety
- Before potentially destructive git operations

DO NOT use this skill for:

- Regular commits (use `pre-commit-quality-check` instead)
- Reading git history
- Creating branches
- Non-destructive git operations

## Critical Rules

⛔ **NEVER force push to main/master** - Extremely dangerous, can destroy team's work ⛔ **ALWAYS
verify current branch** - Know what you're pushing before pushing ⛔ **USE --force-with-lease** -
Safer alternative to --force ⛔ **RUN quality checks** - Ensure code passes all tests before pushing

## Workflow Steps

### Step 1: Verify Current Branch

**Goal**: Confirm which branch will be pushed to.

**Actions**:

1. Execute: `git branch --show-current`
2. Display current branch to user
3. **If main or master**:
   - ⚠️ **CRITICAL WARNING**: Pushing to main branch!
   - Display warning message
   - Ask for explicit confirmation
4. **If feature branch**:
   - ✅ Safe to proceed
5. Show result:

```
Current Branch: feat/speaker-import

✅ Feature branch detected

or

⚠️  WARNING: You are on 'main' branch!

Pushing directly to main can be dangerous:
- May bypass pull request reviews
- Could break production code
- Affects all team members immediately

Are you sure you want to push to main? (y/N)
```

**Output**: Branch confirmed OR user cancels.

---

### Step 2: Check for Uncommitted Changes

**Goal**: Ensure working directory is clean.

**Actions**:

1. Execute: `git status --short`
2. Check for uncommitted changes:
   - Modified files not staged
   - Staged files not committed
3. **If changes exist**:
   - ⚠️ Display warning
   - Suggest committing or stashing
4. **If clean**:
   - ✅ Proceed
5. Show result:

```
⚠️  Uncommitted Changes Detected

You have uncommitted changes:
 M app/components/SpeakerCard.vue
 M server/api/speakers/index.post.ts

Options:
1. Commit changes: git add . && git commit -m "message"
2. Stash changes: git stash
3. Discard changes: git restore <file>

Push with uncommitted changes? (y/N)

or

✅ Working directory clean
```

**Output**: Working directory confirmed OR user handles changes.

---

### Step 3: Determine Push Type

**Goal**: Identify if this is a regular push or force push.

**Actions**:

1. Ask user about push type:

```
Push Type

Will this be a force push? (y/N)

Regular push: git push
Force push: git push --force-with-lease
```

2. Based on response:
   - **Regular push**: Proceed to Step 4
   - **Force push**: Proceed to force push validation (Step 3a)

**Output**: Push type determined.

---

### Step 3a: Force Push Validation (If Force Push)

**Goal**: Ensure force push is safe and necessary.

**Actions**:

1. **Verify NOT main/master branch**:

   ```
   ⛔ STOP: Cannot force push to main/master!

   Force pushing to main can:
   - Overwrite other developers' work
   - Break production
   - Corrupt repository history

   NEVER force push to main.
   ```

2. **If feature branch**, verify reason for force push:

   ```
   Force Push Verification

   Why are you force-pushing? Common reasons:
   1. Rebased commits (git rebase)
   2. Amended last commit (git commit --amend)
   3. Reset to earlier state (git reset)
   4. Other reason

   Reason: [user input]
   ```

3. **Recommend --force-with-lease**:

   ```
   ⚠️  Use --force-with-lease instead of --force

   --force-with-lease is safer because:
   - Checks if remote was updated by others
   - Prevents overwriting others' work
   - Fails if remote differs from expected state

   Command: git push --force-with-lease
   ```

4. **Final confirmation**:

   ```
   ⚠️  Force Push Confirmation

   Branch: feat/speaker-import
   Command: git push --force-with-lease

   This will overwrite remote branch history.
   Have you coordinated with your team? (y/N)
   ```

**Output**: Force push validated OR cancelled.

---

### Step 4: Run Quality Checks

**Goal**: Ensure code passes all quality gates before pushing.

**Actions**:

1. Display quality check reminder:

```
🔍 Pre-Push Quality Checks

Before pushing, verify your code passes:

□ Linting: pnpm lint:fix
□ Type Checking: pnpm typecheck
□ Formatting: pnpm format
□ Tests: pnpm test (if applicable)
□ Build: pnpm build (if applicable)

Or run all checks: pnpm ci

Have quality checks passed? (Y/n)
```

2. **If user confirms "no"**:
   - Suggest running: `pnpm ci`
   - Wait for user to run checks
   - Return to verification

3. **If user confirms "yes"**:
   - Proceed to Step 5

**Output**: Quality checks confirmed.

---

### Step 5: Check Remote Status

**Goal**: Verify relationship with remote branch.

**Actions**:

1. Execute: `git status -sb` (short branch status)
2. Analyze output:
   - `[ahead X]` - Local commits not pushed
   - `[behind X]` - Remote commits not pulled
   - `[ahead X, behind Y]` - Diverged (fetch + rebase/merge needed)
3. Display status:

```
Remote Status

Your branch is ahead of 'origin/feat/speaker-import' by 3 commits

Local commits to push:
- feat: add speaker import modal
- test: add speaker import tests
- fix: validation error handling

✅ Safe to push

or

⚠️  Branch Diverged

Your branch and 'origin/feat/speaker-import' have diverged:
- Local: 3 commits ahead
- Remote: 2 commits behind

Action needed:
1. Fetch remote: git fetch origin
2. Rebase or merge: git rebase origin/feat/speaker-import
   or: git merge origin/feat/speaker-import
3. Resolve conflicts if any
4. Then push

Cannot push until resolved.
```

**Output**: Remote status OK OR action required.

---

### Step 6: Generate Push Command

**Goal**: Provide exact command to execute.

**Actions**:

1. Based on previous steps, generate command:
   - Regular push: `git push`
   - First push (no upstream): `git push -u origin <branch>`
   - Force push: `git push --force-with-lease`
2. Display command:

```
✅ Push Command

Execute the following command:

    git push -u origin feat/speaker-import

This will:
- Push your 3 commits to remote
- Set upstream tracking for this branch
- Make future pushes simpler (git push)

Ready to push? (Y/n)
```

**Output**: Push command displayed.

---

### Step 7: Final Summary

**Goal**: Provide comprehensive pre-push summary.

**Actions**:

1. Display summary:

```
✅ Git Pre-Flight Check Summary

Current Branch: feat/speaker-import
Working Directory: Clean
Push Type: Regular push
Quality Checks: Passed
Remote Status: Ahead by 3 commits
Command: git push -u origin feat/speaker-import

All safety checks passed. Safe to push!

Next steps:
1. Execute: git push -u origin feat/speaker-import
2. Verify push succeeded: check remote repository
3. Create pull request if needed

or

❌ Pre-Flight Check FAILED

⚠️  Current Branch: main (DANGEROUS!)
⚠️  Push Type: Force push (NOT ALLOWED on main)

Cannot proceed with push. Switch to feature branch first.
```

**Output**: Ready to push OR errors requiring fixes.

---

## Execution Flow Diagram

```
START
  ↓
[Step 1: Verify Branch] → main/master? → WARN + Confirm → No → STOP
  ↓ feature branch OR Yes
[Step 2: Check Uncommitted] → changes? → WARN + Options
  ↓
[Step 3: Push Type] → Force? → YES → [Step 3a: Force Validation]
  ↓ No                                  ↓
[Step 4: Quality Checks] ← ← ← ← ← ← ← ←
  ↓
[Step 5: Remote Status] → diverged? → WARN + Action needed → STOP
  ↓ OK
[Step 6: Generate Command]
  ↓
[Step 7: Summary] → Safe? → Yes → PUSH
                           ↓ No → STOP
```

## Common Scenarios

### Scenario 1: Regular Feature Branch Push

**Branch**: `feat/speaker-import`

**Checks**:

1. ✅ Feature branch (not main)
2. ✅ Working directory clean
3. ✅ Regular push (not force)
4. ✅ Quality checks passed
5. ✅ Ahead by 3 commits
6. ✅ Command: `git push -u origin feat/speaker-import`

**Result**: Safe to push ✅

### Scenario 2: Force Push to Feature Branch (After Rebase)

**Branch**: `feat/talk-schedule`

**Checks**:

1. ✅ Feature branch (not main)
2. ✅ Working directory clean
3. ⚠️ **Force push required** (rebased)
4. ✅ Reason: Rebased on latest main
5. ✅ Quality checks passed
6. ✅ Team coordinated
7. ✅ Command: `git push --force-with-lease`

**Result**: Safe to force push ✅ (with --force-with-lease)

### Scenario 3: Attempt to Push to Main

**Branch**: `main`

**Checks**:

1. ⚠️ **CRITICAL**: On main branch!
2. User confirmation: "Are you sure?" → User says NO

**Result**: ❌ Push cancelled (smart decision)

### Scenario 4: Branch Diverged (Behind Remote)

**Branch**: `feat/api-refactor`

**Checks**:

1. ✅ Feature branch
2. ✅ Working directory clean
3. ✅ Regular push
4. ❌ **Remote Status**: Diverged (ahead 2, behind 3)

**Action Required**:

```bash
git fetch origin
git rebase origin/feat/api-refactor
# Resolve conflicts if any
# Then re-run pre-flight check
```

**Result**: ❌ Cannot push until rebased/merged

---

## Anti-Patterns (NEVER DO THIS)

❌ **Force pushing to main**:

```bash
# WRONG - NEVER do this
git push --force origin main
```

❌ **Using --force instead of --force-with-lease**:

```bash
# WRONG - Dangerous
git push --force

# CORRECT - Safer
git push --force-with-lease
```

❌ **Skipping quality checks**:

```bash
# WRONG - Pushing broken code
git push
# (without running pnpm ci)
```

❌ **Pushing with uncommitted changes**:

```bash
# WRONG - Work in progress not committed
git push
# (while 'git status' shows modified files)
```

❌ **Pushing without verifying branch**:

```bash
# WRONG - Not sure which branch
git push
# (without checking 'git branch --show-current')
```

## Why This Workflow Matters

- **PREVENTS DATA LOSS**: Force push to main can destroy work
- **PROTECTS TEAM**: Ensures you don't overwrite others' commits
- **MAINTAINS QUALITY**: Quality checks prevent broken code on remote
- **REDUCES ACCIDENTS**: Explicit verification prevents mistakes
- **IMPROVES SAFETY**: Multiple checkpoints before destructive actions

## Integration with Other Skills

### Works with pre-commit-quality-check

**Relationship**:

- `pre-commit-quality-check` → Before committing locally
- `git-pre-flight-check` → Before pushing to remote

**Workflow**:

1. Make changes
2. Run `pre-commit-quality-check` skill
3. Commit changes
4. Run `git-pre-flight-check` skill
5. Push to remote

## Configuration

**Git commands used**:

- `git branch --show-current` - Show current branch name
- `git status --short` - Show working directory status
- `git status -sb` - Show branch status with remote tracking
- `git push` - Regular push
- `git push --force-with-lease` - Safe force push
- `git fetch origin` - Fetch remote changes

## References

- Pre-commit workflow: `pre-commit-quality-check.md` skill
- Git workflow: `AGENTS.md` (Git Workflow section)
- Git documentation: Official docs (Context7)
