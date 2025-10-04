# Official Tailwind CSS v4 Reference

Official Tailwind CSS v4 features, breaking changes, and upgrade guidance. For general Tailwind
patterns and project conventions, see @.agents/tailwind-patterns.md.

## Core v4 Principles

- **Always use Tailwind CSS v4.1+** - Ensure the codebase is using the latest version
- **Do not use deprecated or removed utilities** - ALWAYS use the replacement (see tables below)
- **Never use `@apply`** - Use CSS variables, the `--spacing()` function, or framework components
  instead

## Upgrading to Tailwind CSS v4

### Before Upgrading

- **Always read the upgrade documentation first** - Read https://tailwindcss.com/docs/upgrade-guide
  and https://tailwindcss.com/blog/tailwindcss-v4 before starting an upgrade.
- Ensure the git repository is in a clean state before starting

### Upgrade Process

1. Run the upgrade command: `npx @tailwindcss/upgrade@latest` for both major and minor updates
2. The tool will convert JavaScript config files to the new CSS format
3. Review all changes extensively to clean up any false positives
4. Test thoroughly across your application

## Breaking Changes Reference

### Removed Utilities (NEVER use these in v4)

| ❌ Deprecated           | ✅ Replacement                                    |
| ----------------------- | ------------------------------------------------- |
| `bg-opacity-*`          | Use opacity modifiers like `bg-black/50`          |
| `text-opacity-*`        | Use opacity modifiers like `text-black/50`        |
| `border-opacity-*`      | Use opacity modifiers like `border-black/50`      |
| `divide-opacity-*`      | Use opacity modifiers like `divide-black/50`      |
| `ring-opacity-*`        | Use opacity modifiers like `ring-black/50`        |
| `placeholder-opacity-*` | Use opacity modifiers like `placeholder-black/50` |
| `flex-shrink-*`         | `shrink-*`                                        |
| `flex-grow-*`           | `grow-*`                                          |
| `overflow-ellipsis`     | `text-ellipsis`                                   |
| `decoration-slice`      | `box-decoration-slice`                            |
| `decoration-clone`      | `box-decoration-clone`                            |

### Renamed Utilities (ALWAYS use the v4 name)

| ❌ v3              | ✅ v4              |
| ------------------ | ------------------ |
| `bg-gradient-*`    | `bg-linear-*`      |
| `shadow-sm`        | `shadow-xs`        |
| `shadow`           | `shadow-sm`        |
| `drop-shadow-sm`   | `drop-shadow-xs`   |
| `drop-shadow`      | `drop-shadow-sm`   |
| `blur-sm`          | `blur-xs`          |
| `blur`             | `blur-sm`          |
| `backdrop-blur-sm` | `backdrop-blur-xs` |
| `backdrop-blur`    | `backdrop-blur-sm` |
| `rounded-sm`       | `rounded-xs`       |
| `rounded`          | `rounded-sm`       |
| `outline-none`     | `outline-hidden`   |
| `ring`             | `ring-3`           |

## Gradient Utilities

- **ALWAYS Use `bg-linear-*` instead of `bg-gradient-*` utilities** - The gradient utilities were
  renamed in v4
- Use the new `bg-radial` or `bg-radial-[<position>]` to create radial gradients
- Use the new `bg-conic` or `bg-conic-*` to create conic gradients

```html
<!-- ✅ Use the new gradient utilities -->
<div class="h-14 bg-linear-to-br from-violet-500 to-fuchsia-500"></div>
<div class="size-18 bg-radial-[at_50%_75%] from-sky-200 via-blue-400 to-indigo-900 to-90%"></div>
<div class="size-24 bg-conic-180 from-indigo-600 via-indigo-50 to-indigo-600"></div>

<!-- ❌ Do not use bg-gradient-* utilities -->
<div class="h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500"></div>
```

## Working with CSS Variables

### Accessing Theme Values

Tailwind CSS v4 exposes all theme values as CSS variables:

```css
/* Access colors, and other theme values */
.custom-element {
  background: var(--color-red-500);
  border-radius: var(--radius-lg);
}
```

### The `--spacing()` Function

Use the dedicated `--spacing()` function for spacing calculations:

```css
.custom-class {
  margin-top: calc(100vh - --spacing(16));
}
```

### Extending theme values

Use CSS to extend theme values:

```css
@import "tailwindcss";

@theme {
  --color-mint-500: oklch(0.72 0.11 178);
}
```

```html
<div class="bg-mint-500">
  <!-- ... -->
</div>
```

## New v4 Features

### Container Queries

Use the `@container` class and size variants:

```html
<article class="@container">
  <div class="flex flex-col @md:flex-row @lg:gap-8">
    <img class="w-full @md:w-48" />
    <div class="mt-4 @md:mt-0">
      <!-- Content adapts to container size -->
    </div>
  </div>
</article>
```

### Container Query Units

Use container-based units like `cqw` for responsive sizing:

```html
<div class="@container">
  <h1 class="text-[50cqw]">Responsive to container width</h1>
</div>
```

### Text Shadows (v4.1)

Use text-shadow-\* utilities from text-shadow-2xs to text-shadow-lg:

```html
<!-- ✅ Text shadow examples -->
<h1 class="text-shadow-lg">Large shadow</h1>
<p class="text-shadow-sm/50">Small shadow with opacity</p>
```

### Masking (v4.1)

Use the new composable mask utilities for image and gradient masks:

```html
<!-- ✅ Linear gradient masks on specific sides -->
<div class="mask-t-from-50%">Top fade</div>
<div class="mask-b-from-20% mask-b-to-80%">Bottom gradient</div>
<div class="mask-linear-from-white mask-linear-to-black/60">Fade from white to black</div>

<!-- ✅ Radial gradient masks -->
<div class="mask-radial-[100%_100%] mask-radial-from-75% mask-radial-at-left">Radial mask</div>
```
