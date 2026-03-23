---
name: block-npx
enabled: true
event: bash
pattern: \bnpx\s
action: block
---

**npx is not allowed in this project.**

Use `pnpm dlx` instead of `npx`. This project uses pnpm as its package manager.

Example: Replace `npx some-package` with `pnpm dlx some-package`.
