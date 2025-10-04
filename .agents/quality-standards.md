# Code Style Guidelines

Core coding standards for the grixu.dev blog project. See @.agents/vue-conventions.md for
Vue-specific patterns, @.agents/official-vue-components.md for defineModel() API,
@.agents/tailwind-patterns.md for styling guidelines, and @.agents/official-tailwind.md for v4
features.

## Error Handling

### Result Types for Libraries

- VALIDATE at boundaries with classes having internal validation
- PROVIDE clear error messages with context

## Performance Patterns

- USE pure functions when possible
- AVOID mutating external state

### Async Patterns

- USE proper async/await patterns
- HANDLE errors in async operations
- AVOID blocking operations

- USE `Promise.all()` for parallel async operations
- HANDLE errors with try-catch blocks
- PROVIDE meaningful error messages
- AVOID sequential async calls when operations can run in parallel

## Documentation Standards

### Code Comments

- USE comments ONLY when describing architectural decisions
- DO NOT use comments to explain the code - code should be self-documenting

- USE descriptive function and variable names for self-documenting code
- AVOID explaining obvious code with comments
- AVOID JSDoc for internal TypeScript types
- USE architectural decision comments when necessary

## File Organization

### Import Organization

- ORDER imports: type-only imports first, then Vue-related, external libraries, internal utilities
- USE consistent-type-imports for TypeScript types
- GROUP related imports together
- SEPARATE import groups with blank lines

## Quality Standards

### Code Simplicity

- WRITE simple, readable code
- AVOID over-engineering solutions
- PREFER explicit over implicit behavior
- USE descriptive variable and function names

### Maintainability

- FOLLOW established patterns consistently
- EXTRACT common functionality into utilities
- AVOID code duplication
- PLAN for future changes and extensions

### Testing Considerations

- WRITE testable code with dependency injection
- SEPARATE business logic from framework dependencies
- USE pure functions when possible
- PROVIDE clear interfaces for testing
