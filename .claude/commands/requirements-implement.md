---
description: "Begin implementation based on requirements specification"
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
argument-hint: "[spec-id or leave empty for active]"
---

# Begin Requirements Implementation

## 🚀 IMPLEMENTATION MODE ACTIVATED

You are now entering IMPLEMENTATION MODE. Your mission has changed:

- You ARE: Implementing the solution based on the specification
- You ARE: Coordinating with subagents for specialized tasks
- You ARE: Building working, tested software
- You ARE NOT: Gathering more requirements or creating specs

## Your Implementation Workflow

Think step-by-step about this implementation process. You'll coordinate the entire journey from
specification to working software, managing context, subagents, and quality gates throughout.

### Step 1: Load and Verify the Target Specification

First, determine which specification to implement. If no arguments are provided ($ARGUMENTS is
empty), read the requirements/.current-requirement file to find the active requirement. If this file
doesn't exist or is empty, inform the user "No active requirement found. Please specify a spec-id to
implement." Then use the requirements-current command with --all flag to show available
specifications, and suggest they use: /requirements-implement [spec-id]

If $ARGUMENTS is not empty, search the requirements/ folder for a specification matching $ARGUMENTS.
Look for folders containing the $ARGUMENTS text in their names, then find the latest specification
version:

**Find Latest Specification Version:**

1. **Check for .latest-spec file first** in the requirement folder
   - If exists, read the JSON to get the current version filename
   - Load the specification file specified in the "filename" field
   - Display version info: "📋 Loading v[X] (latest)"

2. **Fallback to file scanning** if .latest-spec doesn't exist:
   - Search for files matching pattern: `*requirements-spec*.md`
   - Find highest numbered version: 10-requirements-spec.md, 15-requirements-spec-v2.md,
     20-requirements-spec-v3.md, etc.
   - Load the highest numbered specification file
   - Display: "📋 Loading v[X] (auto-detected latest)"

3. **Error handling**:
   - If no specification files found, inform user: "No specification found in [folder]. Use
     /requirements-start to create one."
   - If multiple potential matches, list them and ask user to be more specific

Once you've loaded a specification, display this summary to confirm what you're implementing:

<implementation_target> 📋 **IMPLEMENTING**: [Specification Name from the loaded spec] 📅
**Generated**: [original date from spec metadata] 📝 **Version**: v[X] ([Y] edits) - [Last modified
date if edited] 🎯 **Status**: [Complete/Partial based on spec completeness] 📊 **Scope**: [Brief
1-2 sentence overview from the spec's overview section] </implementation_target>

### Step 2: Load Project Context

Next, gather the essential project context that will guide your implementation decisions. This
context is crucial for ensuring your implementation follows existing patterns and conventions.

Check for project context files in this priority order:

1. ./CLAUDE.md (project-specific context - most important)
2. ./.claude/context.md (alternative location)
3. ./README.md (fallback project information)

If you find CLAUDE.md, read it thoroughly and incorporate its guidance throughout the
implementation. This file contains vital information about how to build software in this specific
project. Display: "📖 Project context loaded from CLAUDE.md"

If no context files exist, display this warning: "⚠️ No CLAUDE.md found. Implementation may lack
project-specific guidance." Then suggest: "Consider creating CLAUDE.md with project architecture
overview, coding conventions, key directories, testing approach, and deployment considerations."

### Step 3: Verify Specification Completeness

Before proceeding, ensure the specification provides sufficient guidance for implementation. A
complete specification should include:

✅ **Functional Requirements** - What the user-facing features should do ✅ **Technical
Requirements** - How to implement (APIs, components, architecture) ✅ **Acceptance Criteria** - How
to validate the implementation works correctly

If any of these sections are missing or incomplete, inform the user: "Specification appears
incomplete. Missing sections: [list what's missing]. Proceed anyway? Note that missing sections may
require making assumptions during implementation." Wait for user confirmation before continuing.

### Step 4: Analyze Implementation Scope

Now think step-by-step about what needs to be built. Break down the specification into implementable
components so you can plan the work effectively.

Analyze the specification and create an implementation breakdown:

<implementation_analysis> **Frontend Components Needed:**

- Review the spec's functional requirements and identify UI components, pages, forms, and user
  interactions
- Example: "Login form, dashboard component, settings page, notification toasts"

**Backend Components Needed:**

- Extract API endpoints, services, models, and business logic from technical requirements
- Example: "Authentication API, user service, email service, database models for User and Session"

**Database Changes Required:**

- Identify schema changes, migrations, or new tables from the technical requirements
- Example: "Add password_reset_tokens table, add email_verified column to users"

**Testing Requirements:**

- Extract testing needs from the acceptance criteria
- Example: "Unit tests for auth service, integration tests for login flow, E2E tests for password
  reset"

**Infrastructure/DevOps:**

- Note any deployment, configuration, or environment needs
- Example: "Email service configuration, rate limiting setup, security headers"
  </implementation_analysis>

### Step 5: Plan Subagent Coordination Strategy

Based on your implementation analysis, decide how to approach the work. Consider the complexity and
scope to determine if you should handle everything yourself or coordinate with specialized
subagents.

**Available Approaches:**

**A) Single Agent Implementation:**

- Handle all tasks in the current session
- Best for: Simple specifications, fewer than 5 files, single domain (frontend OR backend)
- Advantages: Unified context, faster for small tasks, no coordination overhead
- Disadvantages: May hit context limits, no specialized expertise

**B) Delegated Implementation:**

- Coordinate with specialized subagents using the Task tool
- Best for: Complex specifications, multiple domains, more than 10 files
- Advantages: Specialized expertise, parallel work, better organization
- Disadvantages: Context coordination complexity

Think about the scope from your analysis above. If it involves both frontend and backend work,
multiple components, or extensive testing, choose the delegated approach.

**Recommended Approach:** Based on your analysis, state whether you recommend A or B and explain
your reasoning.

If you choose the delegated approach, plan your delegation:

<delegation_plan> **Frontend Agent Tasks:** Specific UI components and user interactions **Backend
Agent Tasks:** API endpoints, services, and business logic **Database Agent Tasks:** Schema changes
and migrations **Testing Agent Tasks:** Test implementation and validation

**Coordination Strategy:**

1. Architecture setup and core structure
2. Parallel development of components
3. Integration and testing
4. Validation against acceptance criteria </delegation_plan>

### Step 6: Create Implementation Plan

Now create a structured implementation plan that breaks the work into logical phases. This plan will
guide you through the implementation and help track progress.

Based on your analysis, create a phase-by-phase implementation plan:

<implementation_plan> **Phase 1: Foundation (Architecture & Setup)** □ Set up project structure (if
creating new components) □ Create core configuration files □ Set up database schema/migrations □
Establish error handling patterns

**Phase 2: Core Implementation** □ Backend APIs and business logic □ Frontend components and views □
Data layer and models □ Authentication/authorization (if required)

**Phase 3: Integration & Features** □ Connect frontend to backend □ Implement user workflows □ Add
validation and error handling □ Style and UX polish

**Phase 4: Testing & Validation** □ Unit tests for core functionality □ Integration tests for
workflows □ Manual testing against acceptance criteria □ Performance and edge case testing

**Priority Order:** Order the tasks by dependency (what must be built first) and risk (what's most
likely to cause issues). </implementation_plan>

### Step 7: Begin Implementation

You're now ready to start building! Execute your implementation plan while maintaining quality and
staying true to the specification.

**Implementation Approach:** Use either single-agent or delegated approach based on your
coordination strategy from Step 5.

**Context Preservation Strategy:**

- Keep the specification as your source of truth for WHAT to build
- Reference CLAUDE.md project context for HOW to build it (patterns, conventions)
- Maintain your implementation plan for progress tracking

**Quality Gates:**

- Validate each phase before proceeding to the next
- Ensure all code follows project conventions from CLAUDE.md
- Verify all functionality maps to acceptance criteria from the specification

**Implementation Guardrails:** ⚠️ Don't deviate from the specification without explicit user
approval ⚠️ Don't skip testing unless explicitly requested ⚠️ Don't ignore project conventions from
CLAUDE.md ⚠️ Ask for clarification if any spec requirements are ambiguous

**Start Implementation:** Begin with Phase 1 - Foundation. Start with the first task from your
implementation plan and work through each task systematically.

## Progress Tracking Throughout Implementation

### During Implementation - Maintain Context and Provide Updates

As you work through your implementation plan, provide regular progress updates to keep the user
informed and maintain context across the session.

Provide status updates in this format:

<implementation_progress> **Current Phase:** Phase [1-4] - [Phase name] **Completed Tasks:** [X] out
of [Y] total tasks **Current Focus:** [Brief description of what you're working on now]

**Next Actions:**

- [Immediate next step you'll take]
- [Following step after that]

**Issues/Blockers:**

- [Any problems encountered or ambiguities discovered]

**Quality Checkpoints:** ✅ Code follows project patterns from CLAUDE.md ✅ Implementation matches
specification requirements ✅ Tests passing (where implemented) ⏳ Integration working (when
reached) </implementation_progress>

### Subagent Coordination (When Using Delegation)

If you chose the delegated approach in Step 5, coordinate carefully with specialized subagents to
ensure quality and integration.

**When delegating tasks to subagents using the Task tool:**

1. **Provide clear task boundaries** - Define exactly what the subagent should work on
2. **Include essential context:**
   - Relevant section from the current specification
   - Applicable patterns and conventions from CLAUDE.md
   - Integration requirements with other components
3. **Specify expected deliverables** - Be clear about what files, functions, or components should be
   created
4. **Request progress updates** - Ask for status reports during long-running tasks
5. **Validate integration points** - Test that subagent work integrates correctly with other
   components

**Use this template when delegating:**

Task: [Specific focused task description] Context: [Relevant specification section + CLAUDE.md
patterns that apply] Requirements: [Specific requirements from the specification] Integration: [How
this component connects with others being built] Deliverable: [Expected output files or components]

## Key Implementation Principles

### 🎯 Your Primary Mission

- **IMPLEMENT** the specification exactly as written - don't re-interpret or extend it
- **USE** project context from CLAUDE.md to ensure consistency with existing code
- **COORDINATE** with subagents efficiently when using the delegated approach
- **VALIDATE** against acceptance criteria throughout the implementation process

### 📋 Context Management Hierarchy

- **Specification** = SOURCE OF TRUTH for WHAT to build
- **CLAUDE.md** = GUIDANCE for HOW to build it (patterns, conventions, standards)
- **Implementation Plan** = SEQUENCE for WHEN to build each part

### 🛡️ Quality Assurance Standards

- Validate each phase before proceeding to the next
- Ensure all code follows the project conventions established in CLAUDE.md
- Verify all functionality directly maps to acceptance criteria from the specification
- Treat testing as integral to development, not an afterthought

### 🔄 Communication and Feedback

- Provide regular progress updates using the format above
- Ask for clarification when requirements are ambiguous or unclear
- Validate major architectural decisions with the user before implementing
- Be ready to adjust your approach based on user feedback
