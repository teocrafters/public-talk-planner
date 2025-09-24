# Vue Component Conventions

Framework-specific patterns and best practices for Vue 3 components in Nuxt 4.

## Component Structure and Organization

- USE `<script setup lang="ts">` syntax for Vue 3 Composition API
- LEVERAGE auto-imports for Vue composables and Nuxt utilities
- ORDER imports: type imports first, then component imports
- DEFINE props interface before props definition
- CALL composables at setup function top level
- ORGANIZE reactive state before `computed` properties
- PLACE methods after `computed` properties
- USE consistent indentation and formatting

## Props Design Guidelines

- AVOID optional properties when possible - think twice about every optional prop
- USE specific union types instead of generic boolean props
- PROVIDE sensible defaults for optional properties with `withDefaults` or destructuring
- PREFER explicit props over variant-based configurations
- DEFINE props with TypeScript interfaces for type safety
- USE exact type validation for complex object props
- AVOID loose prop definitions with any or unknown types
- VALIDATE prop shapes with detailed interface definitions

## Props Declaration Patterns

- USE type-based props declaration with `defineProps<Interface>()`
- USE `withDefaults()` macro for default values (pre-Vue 3.5)
- USE reactive destructuring with defaults for Vue 3.5+
- DEFINE required props without default values
- SPECIFY optional props with question mark notation
- USE PropType for complex runtime prop validation
- AVOID string array syntax for prop definitions

## Event Handling and Emits

- USE `defineEmits<Interface>()` for type-safe event declarations
- USE descriptive method names that indicate the action
- HANDLE async operations properly with loading states
- EMIT events for parent-child communication
- USE named tuple syntax for emit type definitions (Vue 3.3+)
- DECLARE all emitted events explicitly
- PASS meaningful payload data with events
- FOLLOW consistent event naming conventions

## Template Best Practices

- USE `v-if` for conditional mounting and unmounting
- USE `v-show` for frequent visibility toggles
- PREFER `computed` properties for complex template logic
- EXTRACT complex conditions into `computed` properties
- USE event modifiers (.prevent, .stop) appropriately
- BIND attributes with descriptive variable names
- AVOID complex expressions directly in template
- USE semantic HTML elements when possible

## Nuxt UI Integration

- PREFER Nuxt UI components over custom implementations
- USE `UButton`, `UInput`, `UCard`, `UFormGroup` for standard UI elements
- USE `UIcon` component for all icons instead of manual `<svg>` tags
- UTILIZE template slots for flexible content structure
- CONFIGURE component props for theming and variants
- EXTEND existing Nuxt UI components when needed
- CREATE custom components only when Nuxt UI lacks functionality
- FOLLOW Nuxt UI naming conventions and patterns
- USE Nuxt UI color and size variants consistently

### Icon Usage Guidelines

- USE `<UIcon>` component from Nuxt UI for all icon needs
- PREFER Nuxt UI icon library over manual SVG implementations
- SPECIFY icon size using Nuxt UI size variants (`size="xs"`, `size="sm"`, `size="md"`, etc.)
- USE semantic icon names for better accessibility
- AVOID manual `<svg>` tags when `UIcon` equivalent exists

## Internationalization Integration

- USE `useI18n()` composable in Vue components
- REFERENCE @.agents/i18n-patterns.md for comprehensive i18n guidelines

## Composables Integration

- CALL composables at the top level of setup function only
- USE destructuring for clear composable API access
- LEVERAGE VueUse composables before creating custom functionality
- HANDLE composable state changes with watchers when needed
- AVOID calling composables inside methods or lifecycle hooks
- USE provide/inject for dependency injection patterns
- COMPOSE multiple composables for complex state management
- RETURN reactive values from custom composables

## Performance and Reactivity

- USE `ref()` for primitive reactive values
- USE `shallowRef()` for large, infrequently changing objects
- USE `readonly()` for immutable data references
- PREFER `ref` over `reactive` for most use cases
- AVOID unnecessary deep watchers on large objects
- USE targeted watchers for specific property changes
- IMPLEMENT `v-memo` for expensive render operations and lists
- EXTRACT complex `computed` logic into separate `computed` properties
- AVOID inline object creation in templates
- USE `computed` properties for derived state
- IMPLEMENT lazy loading for heavy components
- USE `Suspense` and async components for loading states
- AVOID unnecessary component re-renders
- OPTIMIZE watcher usage with specific dependency tracking
- MINIMIZE template expression complexity

## Middleware Patterns

- USE `defineNuxtRouteMiddleware` for navigation guards and route validation
- IMPLEMENT middleware for authentication checks and access control
- CHAIN multiple middleware by defining them in array format
- HANDLE middleware errors gracefully with try-catch blocks
- USE route-specific middleware with `definePageMeta({ middleware: 'auth' })`
- IMPLEMENT global middleware in `middleware/` directory
- VALIDATE route parameters and query strings in middleware
- REDIRECT users based on authentication state or permissions
- LOG navigation events and security violations in middleware
- AVOID heavy computations in middleware to prevent blocking navigation

## Component Communication

- USE props for data flowing down to child components
- EMIT events for actions flowing up to parent components
- USE provide/inject for deep component tree communication
- DEFINE clear interfaces for component communication
- VALIDATE prop types and emit event signatures
- HANDLE errors gracefully in event handlers
- USE descriptive event names that indicate the action
- PASS necessary data with emitted events

## Testing and Maintainability

- USE dependency injection for external services in Vue components
- EXTRACT pure functions from Vue components for easier unit testing
- DESIGN Vue components with single responsibility principle
- AVOID complex lifecycle logic in Vue components
- REFERENCE project testing patterns for comprehensive testing guidelines

## Auto-Import Conventions

- LEVERAGE Nuxt 4 auto-imports for Vue APIs (ref, computed, watch)
- USE auto-imported composables without explicit imports
- RELY on Nuxt component auto-discovery
- CONFIGURE custom auto-imports in nuxt.config when needed
- AVOID manual imports for commonly used Vue utilities
- TRUST TypeScript to infer auto-imported function types
- DOCUMENT custom auto-imports for team awareness

## Anti-Patterns to Avoid

- NEVER call composables inside methods or conditional blocks
- NEVER mutate props directly in child components
- NEVER use `v-model` on props without proper emit handling
- NEVER create reactive state inside computed properties
- NEVER watch entire objects when specific properties suffice
- NEVER use complex expressions directly in templates
- NEVER ignore TypeScript errors with any types
- NEVER create custom components when Nuxt UI equivalents exist

## File References

- Vue 3 Composition API: `@vue/composition-api`
- Nuxt UI components: `@nuxt/ui`
- Auto-imports configuration: `nuxt.config.ts`
- Component examples: `app/components/`
- Composables: `app/composables/`
- Type definitions: `types/` (if exists)
