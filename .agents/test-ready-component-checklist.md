# Test-Ready Component Checklist

Pre-test verification checklist ensuring components are fully prepared for End-to-End testing.

## Purpose

USE this checklist before marking any component as complete to ensure proper test readiness and
consistent testing patterns across the project.

## Component Development Checklist

### Test Identifier Requirements

- [ ] ALL interactive elements have data-testid attributes
- [ ] ALL form inputs (text, email, password, select, textarea) include data-testid
- [ ] ALL buttons (submit, cancel, action buttons) include data-testid
- [ ] ALL navigation links and menu items include data-testid
- [ ] ALL dialogs, modals, and overlays include data-testid
- [ ] ALL dynamic content areas that tests will verify include data-testid
- [ ] ALL list items or repeating elements include data-testid on container or items

### Naming Convention Verification

- [ ] Test IDs follow kebab-case format
- [ ] Test IDs use `{feature}-{element}-{type}` structure
- [ ] Test IDs provide sufficient context through feature prefix
- [ ] Test IDs use descriptive element names
- [ ] Test IDs include type suffix when element type isn't obvious
- [ ] Test IDs are unique within component scope
- [ ] Test IDs are consistent with existing project patterns

### Documentation Requirements

- [ ] All data-testid values documented in component file
- [ ] Inline comments near elements with test IDs where appropriate
- [ ] Component documentation block lists all test IDs
- [ ] Complex interaction patterns documented for fixture integration
- [ ] Props interface includes test ID references when relevant

### Component Structure Verification

- [ ] Component renders properly with all test IDs present
- [ ] Test IDs remain stable during component state changes
- [ ] Conditional rendering handles test IDs correctly
- [ ] Dynamic content maintains test ID consistency
- [ ] Nested components pass through or generate appropriate test IDs

### Integration Considerations

- [ ] Component integrates with existing fixture patterns (if applicable)
- [ ] Authentication requirements documented for protected components
- [ ] Navigation patterns documented for routing components
- [ ] Form submission patterns documented for form components
- [ ] API interaction patterns documented for data-fetching components

## Before Writing Tests

### Fixture Evaluation

- [ ] Identify reusable patterns that should be extracted into fixtures
- [ ] Determine if component needs dedicated Page Object Model
- [ ] Check if existing fixtures can be reused or need updates
- [ ] Document fixture requirements for component testing
- [ ] Plan fixture integration before writing tests

### Test Scenario Planning

- [ ] Identify happy path user workflows
- [ ] Identify error conditions and edge cases
- [ ] Determine authentication requirements
- [ ] Plan test isolation and independence strategy
- [ ] Consider responsive behavior testing needs

## Component Categories and Requirements

### Form Components

- [ ] All input fields have unique data-testid values
- [ ] Submit and cancel buttons have data-testid
- [ ] Error message containers have data-testid
- [ ] Form validation states are testable
- [ ] Success/failure feedback elements have data-testid

### Navigation Components

- [ ] Menu items have data-testid
- [ ] Dropdown triggers have data-testid
- [ ] Navigation links have data-testid
- [ ] Active state indicators are testable
- [ ] Mobile navigation toggles have data-testid

### List and Table Components

- [ ] Container element has data-testid
- [ ] Individual items have data-testid (if testing specific items)
- [ ] Action buttons within items have data-testid
- [ ] Empty state elements have data-testid
- [ ] Loading state elements have data-testid

### Dialog and Modal Components

- [ ] Dialog container has data-testid
- [ ] Confirm/action buttons have data-testid
- [ ] Cancel/close buttons have data-testid
- [ ] Dialog content areas have data-testid
- [ ] Overlay or backdrop elements testable if needed

### Status and Feedback Components

- [ ] Status indicators have data-testid
- [ ] Toast/notification elements have data-testid
- [ ] Loading spinners or indicators have data-testid
- [ ] Success/error message containers have data-testid
- [ ] Progress indicators have data-testid

## Common Pitfalls to Avoid

- NEVER omit data-testid from interactive elements
- NEVER use inconsistent naming conventions
- NEVER add test IDs retroactively after writing tests
- NEVER rely on CSS classes or attributes as primary selectors
- NEVER skip documentation of test IDs
- NEVER mark component complete without verifying checklist
- NEVER write tests before component is test-ready

## Post-Implementation Verification

- [ ] Component passes visual inspection with test IDs visible in dev tools
- [ ] All test IDs appear in browser DOM when component renders
- [ ] Component behavior remains unchanged after adding test IDs
- [ ] No console errors or warnings related to test IDs
- [ ] Component documentation updated with test ID information

## Context7 References

**For testing documentation, query via Context7**:

- **Playwright**: Locators, selectors, best practices
- **Testing patterns**: Component testing, integration testing
- **Test automation**: Fixture patterns, Page Object Models

**Query examples**:
- "Playwright data-testid selector best practices"
- "Component testing patterns"
- "Test fixture organization"

## References

- E2E testing patterns: `.agents/e2e-testing-patterns.md`
- Frontend guidelines: `app/AGENTS.md`
- Test-ready skill: `test-ready-component-check.md`
- E2E workflow skill: `e2e-test-workflow.md`
