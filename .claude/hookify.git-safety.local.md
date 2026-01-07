---
name: git-safety
enabled: true
event: bash
action: block
pattern: git\s+push.*--force.*(main|master)|git\s+push.*-f.*(main|master)
---

⛔ **BLOCKED: Force Push to Main Branch**

You attempted to force push to main/master branch, which is extremely dangerous.

**Why this is blocked:**
- Force pushing to main/master can destroy team history
- Overwrites commits that others may have pulled
- Can cause data loss and team disruption
- Breaks CI/CD pipelines

**What to do instead:**

1. **Never force push to main/master** - This is a critical rule
2. **If you must force push:**
   - Use a feature branch instead
   - Use `--force-with-lease` (safer than `--force`)
   - Coordinate with your team first

3. **Better alternatives:**
   - Create a new commit to fix issues
   - Use `git revert` to undo changes
   - Merge or rebase properly

**If you really need to do this:** Discuss with the user first and get explicit permission.
