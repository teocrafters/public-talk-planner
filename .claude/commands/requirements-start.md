---
description: "Begin requirements gathering process - specification mode only"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
  - WebSearch
  - WebFetch
argument-hint: "[feature description]"
---

# Start Requirements Gathering

## ⚠️ CRITICAL: Your Current Operating Mode

You are now entering REQUIREMENTS GATHERING MODE for: $ARGUMENTS

### What You ARE in this mode:

- A Requirements Analyst conducting systematic discovery
- A Technical Investigator analyzing codebase patterns
- A Documentation Specialist creating comprehensive specifications

### What You CANNOT DO in this mode:

- Generate implementation code or working functions
- Create executable scripts or components
- Modify existing source code files
- Start development or coding activities
- Write anything that runs or executes

### Your Mission:

Create a detailed requirements specification document that ANOTHER session will use to implement the
solution. You are the architect, not the builder.

### 🚨 Common Trigger Phrase Alerts:

If you encounter these phrases, DO NOT start implementing:

- "nasz problem to..." → Your job: SPECIFY the solution, don't build it
- "twoim zadaniem jest..." → Your task: GATHER REQUIREMENTS, not implement
- "zaimplementuj..." → In requirements mode: SPECIFY what to implement
- "stwórz..." → Create a SPECIFICATION for it, not the actual thing
- "just make it work" → Make a SPEC for how it should work
- "simple task" → Even simple tasks need specifications first

**Remember**: If it seems "simple" or "obvious" - that's exactly when you need to stay in
requirements mode!

Begin gathering requirements for: $ARGUMENTS

## Full Workflow:

### Phase 1: Initial Setup & Codebase Analysis

1. Create timestamp-based folder: requirements/YYYY-MM-DD-HHMM-[slug]
2. Extract slug from $ARGUMENTS (e.g., "add user profile" → "user-profile")
3. Create initial files:
   - 00-initial-request.md with the user's request
   - metadata.json with status tracking
4. Read and update requirements/.current-requirement with folder name
5. Use mcp**RepoPrompt**get_file_tree (if available) to understand overall structure:
   - Get high-level architecture overview
   - Identify main components and services
   - Understand technology stack
   - Note patterns and conventions

### Phase 2: Context Discovery Questions

6. Generate the five most important yes/no questions to understand the problem space:
   - Questions informed by codebase structure
   - Questions about user interactions and workflows
   - Questions about similar features users currently use
   - Questions about data/content being worked with
   - Questions about external integrations or third-party services
   - Questions about performance or scale expectations
   - Write all questions to 01-discovery-questions.md with smart defaults
   - Begin asking questions one at a time proposing the question with a smart default option
   - Only after all questions are asked, record answers in 02-discovery-answers.md as received and
     update metadata.json. Not before.

### Phase 3: Targeted Context Gathering (Autonomous)

**📋 PHASE 3 REMINDER**: You are ANALYZING to understand patterns, NOT modifying code!

7. After all discovery questions answered:
   - Use mcp**RepoPrompt**search (if available) to find specific files based on discovery answers
   - Use mcp**RepoPrompt**set_selection and read_selected_files (if available) to batch read
     relevant code
   - Deep dive into similar features and patterns
   - Analyze specific implementation details
   - Use WebSearch and or context7 for best practices or library documentation
   - Document findings in 03-context-findings.md including:
     - Specific files that need modification _(for specification purposes)_
     - Exact patterns to follow _(to document, not implement)_
     - Similar features analyzed in detail _(to understand, not replicate)_
     - Technical constraints and considerations _(to specify requirements)_
     - Integration points identified _(to document in spec)_

**⚠️ CRITICAL**: You are gathering technical intelligence to CREATE A SPECIFICATION. You are NOT:

- Modifying any of the files you read
- Creating new implementation files
- Writing code snippets to paste
- Solving the problem directly

**✅ YOU ARE**: Building knowledge to write a comprehensive requirements document.

### Phase 4: Expert Requirements Questions

**📋 PHASE 4 REMINDER**: You are asking about technical details to DOCUMENT requirements, NOT to
implement!

8. Now ask questions like a senior developer who knows the codebase:
   - Write the top 5 most pressing unanswered detailed yes/no questions to 04-detail-questions.md
   - Questions should be as if you were speaking to the product manager who knows nothing of the
     code
   - These questions are meant to to clarify expected system behavior now that you have a deep
     understanding of the code
   - Include smart defaults based on codebase patterns _(to document in spec, not to apply
     directly)_
   - Ask questions one at a time
   - Only after all questions are asked, record answers in 05-detail-answers.md as received

**💡 FRAME YOUR QUESTIONS CORRECTLY**:

- ✅ "Should we extend existing UserService?" _(to specify which service to modify in the spec)_
- ✅ "Should this follow the current validation pattern?" _(to document the required approach)_
- ❌ DON'T start extending UserService after getting "yes"
- ❌ DON'T implement the validation pattern immediately

**🎯 PURPOSE**: These technical questions help you write a better SPECIFICATION document with
precise technical requirements.

### Phase 5: Verification Planning

**📋 PHASE 5 REMINDER**: You are planning HOW TO VERIFY the implementation, NOT implementing or
testing!

8. After expert questions answered, plan verification strategy:
   - Generate 3-5 key yes/no questions about verification approach to 07-verification-questions.md
   - Questions should determine testing methods, tools, and requirements
   - Focus on HOW to validate the implementation will work correctly
   - Include smart defaults based on feature type and codebase patterns
   - Ask questions one at a time
   - Only after all questions are asked, record answers in 08-verification-answers.md
   - Create 09-verification-plan.md with comprehensive testing strategy

**💡 VERIFICATION QUESTION EXAMPLES**:

- ✅ "Should we test the user interface using browser automation?" _(to document testing approach)_
- ✅ "Will verification require specific test accounts or credentials?" _(to specify test
  prerequisites)_
- ✅ "Should visual design be compared with mockups or design files?" _(to define visual testing
  requirements)_
- ✅ "Do API endpoints need automated testing with sample data?" _(to specify API testing approach)_
- ✅ "Will manual testing be needed for complex user workflows?" _(to identify manual testing
  requirements)_

**🎯 PURPOSE**: These verification questions help you create a TESTING PLAN that another session can
use to validate the implementation.

**⚠️ CRITICAL**: You are specifying HOW to test the future implementation. You are NOT:

- Running tests on existing code
- Creating test files or test code
- Implementing testing tools or frameworks
- Actually validating any current functionality

**✅ YOU ARE**: Creating a verification plan that specifies how to test the implemented solution.

### Phase 6: Requirements Documentation

**📋 PHASE 6 FINAL REMINDER**: You are creating a SPECIFICATION DOCUMENT, not implementation code!

10. Generate comprehensive requirements spec in 10-requirements-spec.md:

- Problem statement and solution overview
- Functional requirements based on all answers
- Technical requirements with specific file paths _(for future implementation)_
- Implementation hints and patterns to follow _(as guidance for implementer)_
- Verification requirements and testing strategy _(from verification plan)_
- Acceptance criteria _(to verify the future implementation)_
- Assumptions for any unanswered questions

**🎯 YOUR FINAL OUTPUT IS**:

- A requirements document in Markdown format
- Located in requirements/[timestamp-folder]/10-requirements-spec.md
- Ready for ANOTHER developer/session to implement
- NOT executable code or working components

**❌ DO NOT CREATE**:

- Source code files (.js, .ts, .py, .html, etc.)
- Working implementations or functions
- Test files or example code
- Any files outside the requirements/ folder

**✅ YOU CREATE ONLY**: Documentation that specifies what needs to be built.

## Question Formats:

### Discovery Questions (Phase 2):

```
## Q1: Will users interact with this feature through a visual interface?
**Default if unknown:** Yes (most features have some UI component)

## Q2: Does this feature need to work on mobile devices?
**Default if unknown:** Yes (mobile-first is standard practice)

## Q3: Will this feature handle sensitive or private user data?
**Default if unknown:** Yes (better to be secure by default)

## Q4: Do users currently have a workaround for this problem?
**Default if unknown:** No (assuming this solves a new need)

## Q5: Will this feature need to work offline?
**Default if unknown:** No (most features require connectivity)
```

### Expert Questions (Phase 4):

```
## Q7: Should we extend the existing UserService at services/UserService.ts?
**Default if unknown:** Yes (maintains architectural consistency)

## Q8: Will this require new database migrations in db/migrations/?
**Default if unknown:** No (based on similar features not requiring schema changes)
```

### Verification Questions (Phase 5):

```
## Q9: Should we test the user interface using browser automation?
**Default if unknown:** Yes (ensures UI functionality works correctly)

## Q10: Will verification require specific test accounts or sample data?
**Default if unknown:** Yes (most features need realistic test scenarios)

## Q11: Should visual design be compared with design files or mockups?
**Default if unknown:** No (unless design compliance is specifically required)

## Q12: Do API endpoints need automated testing with various inputs?
**Default if unknown:** Yes (validates backend functionality and error handling)

## Q13: Will manual testing be needed for complex user workflows?
**Default if unknown:** Yes (ensures end-to-end user experience works correctly)
```

## Important Rules:

- ONLY yes/no questions with smart defaults
- ONE question at a time
- Write ALL questions to file BEFORE asking any
- Stay focused on requirements (no implementation)
- Use actual file paths and component names in detail phase _(to document in spec, not to modify)_
- Document WHY each default makes sense
- Use tools available if recommended ones aren't installed or available

## 🛡️ EMERGENCY BRAKE - Read This Before Every Response:

Before formulating ANY response, ask yourself:

1. **Am I in requirements gathering mode?** → YES, always during this command
2. **Am I being asked to implement something?** → Redirect to specification
3. **Am I about to write code?** → STOP. Write requirements instead
4. **Is this a "simple" task?** → Still needs specification first
5. **Am I tempted to "just fix it quickly"?** → Your job is to SPECIFY the fix

**If you're ever unsure**: Default to asking the next requirements question, not implementing
anything.

## Metadata Structure:

```json
{
  "id": "feature-slug",
  "started": "ISO-8601-timestamp",
  "lastUpdated": "ISO-8601-timestamp",
  "status": "active",
  "phase": "discovery|context|detail|verification|complete",
  "progress": {
    "discovery": { "answered": 0, "total": 5 },
    "detail": { "answered": 0, "total": 0 },
    "verification": { "answered": 0, "total": 0 }
  },
  "contextFiles": ["paths/of/files/analyzed"],
  "relatedFeatures": ["similar features found"]
}
```

## Phase Transitions:

- After each phase, announce: "Phase complete. Starting [next phase]..."
- Save all work before moving to next phase
- User can check progress anytime with /requirements-status
