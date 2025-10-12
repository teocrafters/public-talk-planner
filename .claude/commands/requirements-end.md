---
description: "Finalize requirements gathering - generate specification only"
allowed-tools:
  - Read
  - Write
---

# End Requirements Gathering

Finalize the current requirement gathering session.

## Instructions:

1. Read requirements/.current-requirement
2. If no active requirement:
   - Show "No active requirement to end"
   - Exit

3. Show current status and ask user intent:

   ```
   ⚠️ Ending requirement: [name]
   Current phase: [phase] ([X/Y] complete)

   What would you like to do?
   1. Generate spec with current information
   2. Mark as incomplete for later
   3. Cancel and delete
   ```

4. Based on choice:

### Option 1: Generate Spec

- Check if .latest-spec exists in requirement folder:
  - If exists, warn: "This requirement has been edited. Generating spec may overwrite changes."
  - Ask: "Continue with original spec generation? (This creates v1, preserving edited versions)"
  - If user confirms, proceed with 10-requirements-spec.md
  - If user cancels, suggest using /requirements-edit to modify latest version
- If no .latest-spec file:
  - Create 10-requirements-spec.md _(SPECIFICATION document, not implementation)_
  - Include all answered questions
  - Add defaults for unanswered with "ASSUMED:" prefix
  - Generate implementation hints _(as guidance for future developer)_
  - Update metadata status to "complete"

**⚠️ CRITICAL REMINDER**: You are creating a SPECIFICATION DOCUMENT, not implementation code. Even
though you have analyzed technical details, your output is documentation that describes what to
build, not the actual build.

### Option 2: Mark Incomplete

- Update metadata status to "incomplete"
- Add "lastUpdated" timestamp
- Create summary of progress
- Note what's still needed

### Option 3: Cancel

- Confirm deletion
- Remove requirement folder
- Clear .current-requirement

## Final Spec Format:

**REMEMBER**: This is a SPECIFICATION document that will guide future implementation!

```markdown
# Requirements Specification: [Name]

Generated: [timestamp] Status: [Complete with X assumptions / Partial]

## Overview

[Problem statement and solution summary]

## Detailed Requirements

### Functional Requirements

[Based on answered questions]

### Technical Requirements

- Affected files: [list with paths] _(to be modified by implementer)_
- New components: [if any] _(to be created by implementer)_
- Database changes: [if any] _(to be implemented by implementer)_

### Verification Requirements

[Testing strategy and verification plan from verification phase]

- Testing approach: [UI/API/Unit/Manual/Mixed based on verification answers]
- Prerequisites: [Test accounts, sample data, credentials required]
- Automated tests: [Browser automation, API testing, unit tests]
- Manual verification: [Steps requiring human validation]
- Success criteria: [How to confirm implementation works correctly]

### Assumptions

[List any defaults used for unanswered questions]

### Implementation Notes

[Specific guidance for implementation] _(instructions for future developer)_

### Acceptance Criteria

[Testable criteria for completion] _(to verify the implementation)_
```

**🎯 WHAT THIS DOCUMENT IS**:

- A blueprint for implementation
- Guidance for future development work
- Documentation of requirements and constraints

**❌ WHAT THIS DOCUMENT IS NOT**:

- Executable code or working software
- Implementation files ready to use
- The actual solution to the problem

5. Create .latest-spec file (if generating new spec):

   ```json
   {
     "version": 1,
     "filename": "10-requirements-spec.md",
     "updated": "[ISO-8601-timestamp]",
     "edit_count": 0
   }
   ```

6. Create .verification-plan file (if verification phase was completed):

   ```json
   {
     "testingStrategy": "[ui|api|unit|manual|mixed]",
     "tools": ["[playwright|curl|jest|manual]"],
     "prerequisites": {
       "credentials": ["[required test accounts]"],
       "testData": ["[sample data needed]"],
       "environment": ["[staging URLs, test databases]"]
     },
     "automatedTests": [
       {
         "type": "[ui|api|unit]",
         "description": "[test description]",
         "steps": ["[test steps]"]
       }
     ],
     "manualTests": [
       {
         "description": "[manual verification description]",
         "steps": ["[manual steps]"]
       }
     ],
     "acceptanceCriteria": {
       "functional": ["[functional requirements to verify]"],
       "visual": ["[visual requirements if applicable]"],
       "performance": ["[performance criteria if applicable]"]
     }
   }
   ```

7. Clear .current-requirement
8. Update requirements/index.md
