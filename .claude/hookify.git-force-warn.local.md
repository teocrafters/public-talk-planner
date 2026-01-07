---
name: git-force-warn
enabled: true
event: bash
action: warn
pattern: git\s+push.*--force(?!-with-lease)
---

⚠️ **Warning: Using --force instead of --force-with-lease**

You're using `git push --force` which is less safe than `--force-with-lease`.

**Why --force-with-lease is better:**
- Checks if remote branch has unexpected changes
- Prevents accidentally overwriting others' work
- Fails if someone pushed while you were working
- Safer for collaborative workflows

**Recommendation:** Use `git push --force-with-lease` instead.

**When --force is acceptable:**
- You own the branch and no one else is working on it
- You've coordinated with your team
- You know exactly what you're doing

Proceed with caution if you're sure this is safe.
