---
description: "Verify implementation against requirements specification with automated testing"
allowed-tools:
  - Read
  - Write
  - Edit
  - MultiEdit
  - Bash
  - Grep
  - Glob
  - WebSearch
  - WebFetch
  - Task
  - mcp__sequential-thinking__sequentialthinking
argument-hint: "[spec-id or leave empty for active]"
---

# Requirements Implementation Verification

## 🔍 VERIFICATION MODE ACTIVATED

You are now entering VERIFICATION MODE. Your mission:

- You ARE: Validating implementation against specification requirements
- You ARE: Running automated tests based on verification plans
- You ARE: Identifying gaps and implementing fixes
- You ARE: Ensuring complete compliance with acceptance criteria
- You ARE NOT: Creating new requirements or specifications

## Your Verification Workflow

Think step-by-step about this verification process. You'll systematically validate the
implementation against the specification, run appropriate tests, and fix any issues found.

### Step 1: Load Target Specification and Verification Plan

**Determine Verification Target:** If no arguments are provided ($ARGUMENTS is empty), read
requirements/.current-requirement to find the active requirement. If this file doesn't exist or is
empty, inform user "No active requirement found. Please specify spec-id to verify." Then use
requirements-current --all to show available specifications.

If $ARGUMENTS is not empty, search requirements/ folder for matching specification.

**Load Latest Specification Version:**

1. **Check for .latest-spec file first** in the requirement folder
   - If exists, read JSON to get current version filename
   - Load the specification file specified in "filename" field
   - Display: "📋 Verifying v[X] (latest)"

2. **Fallback to file scanning** if .latest-spec doesn't exist:
   - Search for files matching pattern: `*requirements-spec*.md`
   - Find highest numbered version
   - Display: "📋 Verifying v[X] (auto-detected latest)"

3. **Load Verification Plan:**
   - Check for `.verification-plan` file in requirement folder
   - If exists, load automated testing configuration
   - If missing, check for `07-verification-plan.md` (manual plan)
   - If no verification plan exists, create basic plan from acceptance criteria

Display verification target:

<verification_target> 📋 **VERIFYING**: [Specification Name] 📅 **Generated**: [original date from
spec] 📝 **Version**: v[X] ([Y] edits) - [Last modified if edited] 🎯 **Status**: [Implementation
status - Complete/Partial/Not Started] 📊 **Scope**: [Brief overview from spec] 🧪 **Testing
Strategy**: [UI/API/Unit/Manual/Mixed based on verification plan] </verification_target>

### Step 2: Implementation Status Assessment

**Check Implementation Completeness:**

1. **File Existence Check**: Verify files mentioned in technical requirements exist
2. **Component Analysis**: Check if components/services specified are implemented
3. **API Endpoint Validation**: Test if required endpoints are available
4. **Database Schema Verification**: Confirm required schema changes are applied

**Implementation Gap Analysis:** Create systematic assessment:

<implementation_status> **Frontend Components:** ✅ [Component Name] - Implemented at [file path] ⚠️
[Component Name] - Partially implemented (missing [features]) ❌ [Component Name] - Not found at
expected location

**Backend Components:** ✅ [API Endpoint] - Available at [URL] ⚠️ [Service] - Implemented but
[specific issues] ❌ [Required Feature] - Not implemented

**Database Changes:** ✅ [Table/Column] - Schema updated correctly ⚠️ [Migration] - Applied but
[concerns] ❌ [Required Schema] - Not found

**Overall Status**: [Percentage complete] ([X/Y] components implemented) </implementation_status>

### Step 3: Automated Test Execution

**Test Strategy Selection:** Based on verification plan and available MCPs/tools:

**A) Visual/UI Testing (if UI components exist):**

- Use Chrome DevTools MCP (if available) or Playwright MCP (if available) for browser inspection
- Compare with design files if referenced in verification plan
- Test responsive behavior and accessibility

**B) API Testing (if backend endpoints exist):**

- Use curl/fetch to test API endpoints
- Validate request/response formats
- Test authentication and authorization
- Verify error handling and edge cases

**C) Unit/Integration Testing:**

- Run existing test suites if present
- Check test coverage for new components
- Validate business logic implementation

**D) Manual Testing (when automation not possible):**

- Guide user through manual verification steps
- Prompt for credentials or setup when needed
- Collect user feedback on verification results

**Test Execution Process:**

<test_execution> **Phase 1: Automated Tests** □ Environment setup and prerequisites □ Component
availability verification □ Functional requirement validation □ Integration point testing □ Error
handling verification

**Phase 2: User Acceptance Testing** □ Manual workflow validation □ Visual design compliance check □
User experience verification □ Performance requirement validation □ Accessibility compliance check

**Phase 3: Edge Case Testing** □ Boundary condition testing □ Error scenario validation □ Security
requirement verification □ Performance under load testing </test_execution>

### Step 4: Interactive Test Management

**Handle Interactive Requirements:**

**Credential Management:** When tests require authentication:

- Prompt user: "Test requires login credentials. Please log in when browser window opens."
- Use Chrome DevTools MCP or Playwright MCP to open browser and wait for user login
- Continue automated testing after authentication
- Store session if needed for subsequent tests

**Manual Verification Steps:** For visual comparisons or complex workflows:

- Display clear instructions to user
- Open relevant applications/tools automatically when possible
- Collect user confirmation on verification results
- Document any discrepancies found

**Real-time Feedback:** During long test runs:

- Provide progress updates
- Report individual test results as completed
- Allow user to stop verification if issues found
- Suggest immediate fixes for simple problems

### Step 5: Test Results Analysis and Reporting

**Systematic Results Analysis:** Categorize all findings:

<verification_results> **✅ PASSING TESTS:**

- [Requirement] - Fully implemented and working correctly
- [Feature] - Meets acceptance criteria completely
- [Integration] - Working as specified

**⚠️ ISSUES FOUND:**

- [Requirement] - Partially working ([specific issue])
  - Severity: High/Medium/Low
  - Fix Complexity: Simple/Moderate/Complex
  - Recommended Action: [specific fix recommendation]

**❌ FAILING TESTS:**

- [Requirement] - Not implemented or broken
  - Error: [specific error details]
  - Impact: [user/system impact]
  - Fix Strategy: [implementation approach]

**📊 VERIFICATION SUMMARY:**

- Total Requirements Tested: [number]
- Passing: [number] ([percentage]%)
- Issues Found: [number] ([percentage]%)
- Critical Issues: [number]
- Implementation Status: [Complete/Needs Fixes/Major Issues] </verification_results>

### Step 6: Automated Fix Implementation

**Fix Strategy Decision:** For each issue found, determine fix approach:

**Simple Fixes (< 30 minutes estimated):**

- Implement fixes immediately
- Re-run relevant tests to confirm
- Continue with verification

**Moderate Fixes (30 minutes - 2 hours):**

- Ask user if they want fixes implemented now
- If yes, implement and test
- If no, document for later implementation

**Complex Fixes (> 2 hours):**

- Document detailed fix requirements
- Suggest creating new implementation session
- Provide fix priority recommendations

**Fix Implementation Process:**

1. **Analysis**: Understand root cause of issue
2. **Planning**: Create specific fix plan
3. **Implementation**: Apply fixes using appropriate tools
4. **Verification**: Re-run tests to confirm fix
5. **Documentation**: Update any relevant documentation

### Step 7: Verification Report Generation

**Comprehensive Verification Report:** Generate detailed report in `[XX]-verification-report.md`:

```markdown
# Verification Report: [Specification Name]

**Verification Date**: [timestamp] **Specification Version**: v[X] **Implementation Status**:
[Overall status]

## Executive Summary

[Brief overview of verification results and major findings]

## Test Results Overview

- **Total Tests**: [number]
- **Passing**: [number] ([percentage]%)
- **Issues Found**: [number]
- **Critical Issues**: [number]

## Detailed Findings

### ✅ Verified Requirements

[List of fully working requirements with test details]

### ⚠️ Issues Found

[List of issues with severity, impact, and fix recommendations]

### ❌ Failed Requirements

[List of failing requirements with error details and fix plans]

## Fix Implementation Summary

[Details of fixes applied during verification]

## Recommendations

[Prioritized list of remaining work needed]

## Next Steps

[Specific actions needed to complete implementation]
```

**Update Metadata:** Update metadata.json with verification results:

```json
{
  "verificationHistory": [
    {
      "timestamp": "ISO-8601-timestamp",
      "version": "[spec version verified]",
      "overallStatus": "passed|issues|failed",
      "testsRun": number,
      "testsPassed": number,
      "issuesFound": number,
      "fixesApplied": number,
      "reportFile": "[verification-report filename]"
    }
  ]
}
```

### Step 8: Continuous Fix Loop (Optional)

**Automatic Fix and Re-verification:** If user requests continuous fixing:

1. **Issue Prioritization**: Sort issues by severity and fix complexity
2. **Iterative Implementation**:
   - Fix highest priority issues first
   - Re-run verification after each fix
   - Continue until all issues resolved or complex fixes remain
3. **Progress Tracking**: Update user with real-time progress
4. **Quality Gates**: Ensure fixes don't break existing functionality

**Fix Loop Control:**

- Set maximum iteration limit (e.g., 5 cycles)
- Allow user to stop loop at any time
- Provide progress updates after each cycle
- Generate final report when loop completes

## Verification Principles

### 🎯 Your Primary Mission

- **VALIDATE** implementation exactly matches specification requirements
- **AUTOMATE** testing wherever possible using available tools
- **FIX** issues found when feasible and requested
- **REPORT** comprehensive results with actionable recommendations

### 📋 Verification Standards Hierarchy

- **Specification** = SOURCE OF TRUTH for what should be implemented
- **Acceptance Criteria** = SUCCESS METRICS for verification
- **Verification Plan** = TESTING APPROACH AND TOOLS
- **Implementation** = SYSTEM UNDER TEST

### 🛡️ Quality Assurance Standards

- Test all functional requirements systematically
- Validate non-functional requirements (performance, security, accessibility)
- Verify integration points and error handling
- Confirm user experience matches specification intent

### 🔄 Continuous Improvement

- Learn from verification results to improve future specifications
- Update verification plans based on testing experience
- Document common issues for future prevention
- Optimize testing approaches for efficiency

## Error Handling and Edge Cases

### Missing Implementation

If no implementation found:

- Generate implementation plan based on specification
- Offer to run requirements-implement command
- Create detailed gap analysis for user

### Partial Implementation

If some components missing:

- Identify specific gaps
- Prioritize missing components
- Offer to complete implementation

### Test Environment Issues

If testing environment not ready:

- Guide user through environment setup
- Provide alternative testing approaches
- Document environment requirements for future

### Tool Availability

If required testing tools not available:

- Suggest alternative testing approaches
- Provide manual verification steps
- Recommend tool installation if beneficial

## Integration with Other Commands

### Verification After Implementation

- requirements-implement can automatically trigger verification
- Seamless transition from implementation to testing
- Continuous feedback loop for quality

### Specification Updates

- If verification reveals specification issues, suggest requirements-edit
- Track verification feedback in specification version history
- Improve requirements quality through verification insights

### Progress Tracking

- Integration with requirements-current to show verification status
- Verification history visible in requirement timeline
- Test results included in overall project status
