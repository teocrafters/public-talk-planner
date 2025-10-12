# E2E Testing Patterns

Comprehensive End-to-End testing guidelines for the Public Talk Planner project using Playwright.

## Core Testing Principles

- USE Playwright fixtures pattern for all reusable test utilities
- REQUIRE data-testid attributes on all interactive elements
- FOLLOW ESM module syntax exclusively
- IMPLEMENT component-first development workflow
- MAINTAIN test isolation and independence
- LEVERAGE Playwright's built-in features over custom solutions

## Mandatory Test Selector Strategy

### Requirements

- ADD data-testid attributes to ALL interactive elements during component development
- USE data-testid as primary selector strategy for all test locators
- NEVER use fragile selectors like CSS classes, element attributes, or text content
- APPLY consistent naming convention: `{feature}-{element}-{type}`

### Naming Convention

- USE kebab-case for all data-testid values
- STRUCTURE names hierarchically: `{feature}-{element}-{type}`
- PROVIDE context through feature prefix: `auth-email-input`, `talk-title-input`
- USE descriptive element names: `submit-button`, `cancel-button`, `email-input`
- INCLUDE type suffix when element type isn't obvious: `-input`, `-button`, `-menu`, `-dialog`

### When to Add Test IDs

- ADD data-testid during initial component implementation
- INCLUDE test IDs in component requirements from start
- VERIFY test ID presence before marking component complete
- DOCUMENT all test IDs in component file comments or props interface
- UPDATE test IDs when component structure changes significantly

### Why This Strategy

- STABILITY: Test IDs remain stable during refactoring, styling changes, or content updates
- CLARITY: Explicit test attributes separate testing concerns from implementation details
- MAINTAINABILITY: Clear naming convention makes test code self-documenting
- RELIABILITY: Eliminates false positives from CSS framework updates or translation changes

## Playwright Fixtures Pattern

### Core Requirements

- USE Playwright's `test.extend()` API for creating reusable test utilities
- ORGANIZE fixtures in `tests/fixtures/` directory
- IMPLEMENT Page Object Models as fixtures, not standalone classes
- COMBINE multiple fixture modules using `mergeTests()` and `mergeExpects()`
- EXPORT single `test` and `expect` from `tests/fixtures/index.ts`

### Fixture Organization

- CREATE separate fixture files per feature domain
- NAME fixture files descriptively: `auth-fixtures.ts`, `talks-fixtures.ts`
- EXPORT fixture definitions from domain files
- MERGE all fixtures in `tests/fixtures/index.ts`
- IMPORT test and expect from merged fixtures in test files

### Fixture Lifecycle

- USE test-scoped fixtures for resources needing isolation between tests
- USE worker-scoped fixtures for expensive resources shared across tests
- LEVERAGE automatic setup and teardown capabilities
- AVOID manual cleanup in test files when fixtures can handle it
- IMPLEMENT fixture dependencies through Playwright's dependency injection

### Page Object Models as Fixtures

- IMPLEMENT Page Object Models (POMs) as fixture classes
- ENCAPSULATE page interactions within POM methods
- INJECT necessary fixtures (like page or authenticatedPage) as POM dependencies
- RETURN POM instances from fixture definitions
- ORGANIZE POM methods logically by user workflow

### Why Fixtures Pattern

- AUTOMATIC SETUP/TEARDOWN: Playwright handles lifecycle management automatically
- TYPE SAFETY: Full TypeScript support with proper type inference
- DEPENDENCY INJECTION: Built-in pattern for providing test dependencies
- PARALLELIZATION: Fixtures respect Playwright's parallel execution model
- OFFICIAL PATTERN: Follows Playwright's recommended approach for test utilities

## ESM Module Requirements

### Import Syntax Rules

- USE `import` statements exclusively in all test files
- NEVER use `require()` in ESM context
- ADD `with { type: "json" }` assertion for all JSON imports
- FOLLOW project's `type: module` configuration
- USE dynamic `import()` for conditional module loading

### Why ESM Syntax

- PROJECT STANDARD: Codebase uses `type: module` in package.json
- CONSISTENCY: Matches frontend and backend module patterns
- TOOLING SUPPORT: Better support in modern JavaScript tooling
- SPECIFICATION COMPLIANCE: Follows ECMAScript module specification

## Component Development Rules

### Test-Ready Component Requirements

- INCLUDE data-testid attributes in initial component implementation
- ADD test IDs to all interactive elements: buttons, inputs, links, menus
- DOCUMENT test IDs in component file or props interface
- FOLLOW established naming convention for test IDs
- VERIFY test ID presence before considering component complete

### Interactive Element Identification

- IDENTIFY all user-actionable elements in component
- ADD data-testid to form inputs, submit buttons, cancel buttons
- ADD data-testid to navigation links, dropdown menus, dialogs
- ADD data-testid to dynamic content areas that tests will verify
- INCLUDE data-testid on parent containers when testing lists or groups

### Documentation Requirements

- DOCUMENT all data-testid values in component
- USE inline comments near elements with test IDs
- LIST all test IDs in component documentation block
- UPDATE documentation when adding or changing test IDs
- REFERENCE fixture integration requirements if applicable

### Why Component-First Approach

- EFFICIENCY: Eliminates retroactive updates to components
- CONSISTENCY: Ensures all components follow test ID convention
- PLANNING: Forces consideration of testing needs during development
- QUALITY: Improves component API design with testability in mind

## Test Development Workflow

### Three-Step Process

1. IMPLEMENT component with data-testid attributes from start
2. CREATE or UPDATE fixtures for reusable patterns and Page Object Models
3. WRITE tests using fixtures and established test IDs

### Component Development Phase

- DESIGN component with testability in mind
- ADD data-testid to all interactive elements
- DOCUMENT test IDs in component file
- VERIFY component renders correctly with test IDs
- MARK component as test-ready

### Fixture Development Phase

- IDENTIFY reusable patterns in test scenarios
- CREATE or UPDATE fixture files for common utilities
- IMPLEMENT Page Object Models for complex page interactions
- MERGE new fixtures into central exports
- DOCUMENT fixture usage patterns

### Test Writing Phase

- IMPORT test and expect from merged fixtures
- USE established data-testid values for selectors
- LEVERAGE fixtures for authentication, navigation, common actions
- IMPLEMENT test scenarios using Page Object Models
- VERIFY tests run reliably and independently

### Why This Workflow

- PREVENTS REWORK: Components are test-ready before tests are written
- REDUCES DUPLICATION: Fixtures created based on actual test needs
- IMPROVES QUALITY: Clear separation between setup, action, and assertion
- MAINTAINS CONSISTENCY: Established patterns followed across all tests

## Test Isolation and Independence

### Isolation Requirements

- ENSURE each test can run independently in any order
- USE fixtures to provide fresh state for each test
- AVOID dependencies between test cases
- CLEAN UP test data using fixture teardown
- LEVERAGE Playwright's automatic browser context isolation

### State Management

- USE test-scoped fixtures for test-specific state
- RESET application state between tests when necessary
- AVOID relying on previous test outcomes
- IMPLEMENT proper authentication setup for protected routes
- CLEAR browser storage when state must be fresh

### Why Isolation Matters

- RELIABILITY: Tests pass consistently regardless of execution order
- DEBUGGING: Failures are easier to diagnose without cross-test dependencies
- PARALLELIZATION: Tests can run in parallel without conflicts
- MAINTAINABILITY: Tests remain independent when codebase changes

## Authentication Patterns

### Setup File Requirements

- CREATE authentication setup files in `tests/auth/` directory
- USE `test.use({ storageState })` for authenticated contexts
- AUTHENTICATE once per project using Playwright's authentication mechanism
- STORE authentication state in `.auth/` directory
- CONFIGURE different roles with separate setup files

### Authentication Fixtures

- CREATE authenticatedPage fixture for tests requiring authentication
- INJECT authentication state through fixture dependencies
- HANDLE authentication errors gracefully
- PROVIDE role-specific authenticated fixtures when needed

### Why Authentication Fixtures

- EFFICIENCY: Authenticate once, reuse across tests
- CONSISTENCY: Centralized authentication logic
- MAINTAINABILITY: Single source of truth for auth patterns
- PERFORMANCE: Faster test execution with shared authentication

## Performance Optimization

### Test Execution Speed

- USE worker-scoped fixtures for expensive setup
- SHARE authentication state across tests
- MINIMIZE unnecessary navigation and waiting
- LEVERAGE Playwright's parallel execution
- AVOID redundant API calls in test setup

### Resource Management

- CLEAN UP resources using fixture teardown
- REUSE browser contexts when appropriate
- AVOID creating unnecessary page instances
- IMPLEMENT efficient selector strategies
- USE test timeouts appropriately

### Why Performance Matters

- DEVELOPER EXPERIENCE: Faster feedback during development
- CI/CD EFFICIENCY: Reduced pipeline execution time
- COST: Lower resource consumption in CI environments
- SCALABILITY: Test suite grows without proportional slowdown

## Error Handling and Debugging

### Failure Diagnosis

- USE descriptive test names that explain expected behavior
- IMPLEMENT meaningful error messages in assertions
- LEVERAGE Playwright's automatic screenshots on failure
- USE `test.step()` for complex test scenarios
- LOG relevant context when tests fail

### Debugging Strategies

- RUN tests with `--debug` flag for interactive debugging
- USE Playwright Inspector for step-by-step execution
- ENABLE trace recording for failed tests
- REVIEW automatic screenshots and videos
- CHECK browser console logs for errors

### Why Debugging Support

- EFFICIENCY: Faster issue resolution during test failures
- CLARITY: Understanding test failures without running locally
- MAINTENANCE: Easier updates when application changes
- CONFIDENCE: Better understanding of test coverage

## Quality Assurance

### Test Reliability

- VERIFY tests pass consistently across multiple runs
- AVOID flaky tests by using proper wait strategies
- USE Playwright's auto-waiting features
- IMPLEMENT appropriate timeout configurations
- TEST edge cases and error conditions

### Coverage Considerations

- TEST happy paths with common user workflows
- TEST error conditions and validation failures
- TEST authentication and authorization boundaries
- TEST responsive behavior across viewport sizes
- TEST accessibility requirements when applicable

### Why Quality Standards

- CONFIDENCE: Reliable tests provide accurate feedback
- MAINTAINABILITY: High-quality tests require less maintenance
- DOCUMENTATION: Tests serve as living documentation
- REGRESSION PREVENTION: Comprehensive tests catch regressions early
