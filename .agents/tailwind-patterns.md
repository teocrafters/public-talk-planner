# Tailwind CSS Patterns

Styling guidelines and patterns for Tailwind CSS 4 with Nuxt UI 4 design system integration.

## Import Structure

- IMPORT "tailwindcss" first in main.css
- IMPORT "@nuxt/ui" after Tailwind CSS
- USE `@source` directive to include content directories for scanning
- USE `@theme` directive for custom design tokens in Tailwind CSS 4

## Styling Priority Hierarchy

- REFERENCE CSS variables from `app/assets/css/` first
- USE Nuxt UI design tokens and component props second
- APPLY Tailwind utilities for precise values when system doesn't cover
- CREATE custom CSS only for complex animations or very specific requirements

## CSS Architecture Rules

- NEVER use `<style>` blocks in Vue components
- ALWAYS use Tailwind CSS 4 classes directly on elements
- USE `@layer` directive to organize styles (base, components, utilities)
- USE `@theme` static directive to define CSS variables in Tailwind CSS 4
- LEVERAGE JIT compilation for dynamic values with square brackets
- EXTRACT repeated patterns into component classes with `@apply`
- REFERENCE typography system in `app/assets/css/typography.css` (if exists)
- REFERENCE color palette in `app/assets/css/colors.css` (if exists)
- REFERENCE theme variables in `app/assets/css/theme.css` (if exists)

## Nuxt UI 4 CSS Variables

- USE `--ui-text-dimmed`, `--ui-text-muted`, `--ui-text-toned` for secondary text
- USE `--ui-text`, `--ui-text-highlighted`, `--ui-text-inverted` for primary text
- USE `--ui-bg`, `--ui-bg-muted`, `--ui-bg-elevated`, `--ui-bg-accented` for backgrounds
- USE `--ui-bg-inverted` for contrasting backgrounds
- USE `--ui-border`, `--ui-border-muted`, `--ui-border-accented` for borders
- USE `--ui-border-inverted` for contrasting borders
- USE `--ui-primary`, `--ui-secondary`, `--ui-success` for semantic colors
- USE `--ui-info`, `--ui-warning`, `--ui-error` for status colors
- USE `--ui-radius` for consistent border radius system
- REFERENCE complete variable list in CSS assets or Nuxt UI documentation

## Design Token Classes

- USE `text-dimmed`, `text-muted`, `text-toned` for text hierarchy
- USE `text-default`, `text-highlighted`, `text-inverted` for emphasis
- USE `bg-default`, `bg-muted`, `bg-elevated`, `bg-accented` for backgrounds
- USE `bg-inverted` with `text-inverted` for contrasting elements
- USE `border-default`, `border-muted`, `border-accented` for borders
- USE `primary`, `secondary`, `success`, `info`, `warning`, `error` color aliases
- USE `rounded-xs` through `rounded-3xl` based on --ui-radius system

## Typography Rules

- USE semantic HTML elements (h1-h6, p, blockquote) first
- USE predefined CSS classes (.article, .quote, .caption) second
- USE font family utilities (font-sans, font-serif, font-mono) third
- CHECK for typography system files before custom text sizing classes
- PREFER system consistency over custom styling
- USE text token classes instead of hardcoded gray shades

## Design System Integration

- CHECK app.config.ts for ui.colors configuration
- USE ui.colors object to define primary, neutral color aliases
- CONFIGURE theme.colors array in nuxt.config.ts for dynamic colors
- USE component slots and defaultVariants for theming
- LEVERAGE Tailwind Variants API for component styling
- AVOID manual values when design system equivalents exist
- USE ui prop for component-level theming overrides

## Component Theming Patterns

- USE slots configuration for component part styling
- USE defaultVariants for component default props
- USE ui prop to override specific component slots
- USE class prop for root element styling overrides
- CONFIGURE global themes in app.config.ts under ui key
- DEFINE custom variants using Tailwind Variants syntax

## Responsive Design Patterns

- START with mobile styles first (mobile-first approach)
- ENHANCE progressively with md:, lg:, xl: breakpoints
- USE consistent breakpoint strategy across application
- HIDE elements with `hidden md:block` and `md:hidden` patterns
- ADJUST layouts with responsive grid and flexbox utilities
- USE container queries (@container) for component-level responsiveness

## Class Organization Convention

- ORDER classes as: layout → sizing → spacing → typography → colors → effects → interactions →
  states
- GROUP related utilities together for better readability
- MAINTAIN consistent ordering across all components
- USE line breaks for long class lists to improve readability
- USE arbitrary values with square brackets when needed

## Animation and Transition Rules

- USE consistent transition durations (200ms, 300ms)
- APPLY ease-out for enter animations, ease-in for exit animations
- IMPLEMENT smooth hover effects with transition-colors
- CREATE loading states with animate-pulse
- USE transform utilities for smooth motion
- LEVERAGE CSS nesting support in Tailwind CSS 4

## Dark Mode Strategy

- RELY on CSS variables for automatic dark mode adaptation
- USE `dark:` for dark mode overrides
- ADJUST color intensity between light (500) and dark (400) modes
- AVOID manual `dark:` class toggling when variables exist
- ADAPT images and media with filter adjustments
- ENSURE proper contrast in both light and dark modes

## Performance Optimization

- DEFINE explicit class lists for dynamic styles to ensure content scanning
- AVOID string concatenation for dynamic classes
- EXTRACT common patterns into reusable computed properties
- USE content configuration to include all source files
- LEVERAGE improved JIT performance in Tailwind CSS 4

## Anti-Patterns to Avoid

- NEVER use style blocks when Tailwind utilities exist
- NEVER concatenate class strings dynamically without safeguarding
- NEVER ignore the styling hierarchy (CSS vars → design system → utilities)
- NEVER create custom CSS for simple styling that Tailwind handles
- NEVER use hardcoded colors when CSS variables are available
- NEVER use old gray-_ classes, use neutral-_ or text tokens instead
- NEVER import custom icons from Figma when Nuxt UI alternatives exist
- NEVER create custom components that replicate existing Nuxt UI functionality

## Custom CSS Guidelines

- USE custom CSS only for complex animations or very specific requirements
- DEFINE component-specific CSS custom properties when needed
- KEEP custom CSS minimal and well-documented
- PREFER Tailwind utilities over custom CSS whenever possible
- USE `@layer` directive to organize custom CSS properly

## Configuration Patterns

- CONFIGURE colors in app.config.ts under ui.colors object
- DEFINE theme.colors array in nuxt.config.ts for dynamic generation
- SET defaultVariants in nuxt.config.ts under ui.theme.defaultVariants
- DISABLE transitions with ui.theme.transitions: false if needed
- CUSTOMIZE prefix with ui.prefix option
- CONFIGURE colorMode integration with ui.colorMode option

## Context7 References

**For Tailwind CSS documentation, query via Context7**:

- **Tailwind CSS v4**: Utilities, configuration, CSS variables
- **Responsive design**: Breakpoints, mobile-first approach
- **Dark mode**: Dark variant and color strategies
- **Performance**: JIT compilation, tree-shaking

**Query examples**:
- "Tailwind CSS v4 responsive design patterns"
- "Tailwind CSS dark mode implementation"
- "Tailwind CSS custom theme configuration"

## File References

- Color system: `app/assets/css/colors.css` (if exists)
- Typography system: `app/assets/css/typography.css` (if exists)
- Theme variables: `app/assets/css/theme.css` (if exists)
- Nuxt UI config: `app.config.ts`
- Build config: `nuxt.config.ts`
- Component patterns: `app/components/`
- Tailwind v4 quick ref: `.agents/official-tailwind.md`
- Frontend guidelines: `app/AGENTS.md`
