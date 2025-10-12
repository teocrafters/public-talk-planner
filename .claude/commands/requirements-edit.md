---
description: "Edit existing requirements specification with versioning"
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
  - WebSearch
  - WebFetch
argument-hint: "[requirement-id]"
---

# Edit Requirements Specification

## ⚠️ CRITICAL: Your Current Operating Mode

You are now entering REQUIREMENTS EDITING MODE for: $ARGUMENTS

### What You ARE in this mode:

- A Requirements Analyst modifying existing specifications
- A Change Impact Investigator analyzing effects of modifications
- A Documentation Specialist updating comprehensive specifications

### What You CANNOT DO in this mode:

- Generate implementation code or working functions
- Create executable scripts or components
- Modify existing source code files
- Start development or coding activities
- Write anything that runs or executes

### Your Mission:

Update an existing requirements specification document while maintaining version control and
tracking changes. You are evolving the specification, not implementing it.

## Full Workflow:

### Phase 1: Load Target Requirement

1. Parse $ARGUMENTS to identify which requirement to edit
2. If $ARGUMENTS is empty:
   - Check requirements/.current-requirement
   - If no active requirement, show error and available requirements
   - Exit with suggestion to specify requirement-id
3. Search requirements/ folder for matching requirement:
   - Look for folders containing $ARGUMENTS text
   - Load the requirement folder
4. Find the latest specification version:
   - Check for .latest-spec file first
   - If exists, load the version specified
   - If not exists, find highest numbered _requirements-spec_.md file
   - Pattern: 10-requirements-spec.md, 15-requirements-spec-v2.md, 20-requirements-spec-v3.md, etc.
5. Load metadata.json to understand current state and edit history
6. Display current requirement status:

```
📋 Editing Requirement: [name]
📅 Original: [start date] | Last Modified: [if edited]
📊 Current Version: v[X] ([Y] edits made)
🎯 Status: [complete/incomplete]

Current Specification Summary:
[Brief overview from loaded spec]

Edit History:
- v1: Original specification
- v2: [edit 1 summary if exists]
- v3: [edit 2 summary if exists]
```

### Phase 2: Capture Change Request

7. Ask user what they want to change:

   ```
   ## What changes do you want to make to this requirement?

   Please describe:
   - What you want to add, modify, or remove
   - Why these changes are needed
   - Any new context or constraints

   **Current requirement covers:**
   [List main functional areas from current spec]
   ```

8. Create edit request file with next available number:
   - Calculate next edit number from existing files
   - Create `[XX]-edit-[N]-request.md` where XX is next number, N is edit count
   - Document the user's requested changes
   - Include timestamp and current spec version being modified

### Phase 3: Impact Analysis

**📋 PHASE 3 REMINDER**: You are ANALYZING impacts to update SPECIFICATIONS, NOT implementing
changes!

9. Analyze the impact of requested changes:
   - Review current specification sections affected
   - Identify new requirements that emerge from changes
   - Spot conflicts or contradictions with existing requirements
   - Consider technical implications for future implementation
   - Use WebSearch/WebFetch for best practices if needed
   - Document findings in `[XX+1]-edit-[N]-impact.md` including:
     - Affected sections of current specification
     - New functional requirements emerging
     - New technical requirements needed
     - Potential conflicts or integration challenges
     - Assumptions that need validation

**⚠️ CRITICAL**: You are gathering intelligence about WHAT needs to change in the specification. You
are NOT:

- Implementing the requested changes
- Writing code or creating components
- Solving technical problems directly
- Modifying implementation files

**✅ YOU ARE**: Building understanding to create an updated requirements specification.

### Phase 4: Clarifying Questions

**📋 PHASE 4 REMINDER**: You are asking about changes to DOCUMENT updated requirements, NOT to
implement!

10. Generate targeted questions about the changes:
    - Write 3-5 specific yes/no questions to `[XX+2]-edit-[N]-questions.md`
    - Focus on ambiguities or gaps in the change request
    - Ask about technical approach preferences based on impact analysis
    - Include smart defaults based on current spec and codebase patterns
    - Questions should clarify expected behavior after changes
    - Ask questions one at a time with smart defaults
    - Only after all questions are asked, record answers in `[XX+3]-edit-[N]-answers.md`

**💡 FRAME YOUR QUESTIONS CORRECTLY**:

- ✅ "Should we extend the existing validation to cover the new fields?" _(to specify in updated
  spec)_
- ✅ "Should this new feature follow the current authentication pattern?" _(to document
  requirements)_
- ❌ DON'T start extending validation after getting "yes"
- ❌ DON'T implement authentication patterns immediately

**🎯 PURPOSE**: These questions help you write a better UPDATED SPECIFICATION with precise technical
requirements.

### Phase 5: Generate Updated Specification

**📋 PHASE 5 FINAL REMINDER**: You are creating an UPDATED SPECIFICATION DOCUMENT, not
implementation code!

11. Generate new specification version in `[XX+4]-requirements-spec-v[N+1].md`:
    - Start with current specification as base
    - Integrate all requested changes
    - Add new requirements from impact analysis
    - Incorporate answers from clarifying questions
    - Update all affected sections:
      - Problem statement and solution overview (if changed)
      - Functional requirements (integrate new/modified features)
      - Technical requirements (add new components/APIs)
      - Implementation hints (update for new requirements)
      - Acceptance criteria (add criteria for changes)
      - Assumptions (document any new assumptions)
    - Add change summary section at top:

      ```
      ## Changes in Version [N+1]
      **Modified from**: v[N]
      **Change Date**: [timestamp]
      **Change Summary**: [brief description]

      **New Requirements Added:**
      - [list new functional requirements]

      **Modified Requirements:**
      - [list changed requirements with before/after]

      **Removed Requirements:**
      - [list any removed requirements]
      ```

12. Update .latest-spec file to point to new version:

    ```json
    {
      "version": [N+1],
      "filename": "[XX+4]-requirements-spec-v[N+1].md",
      "updated": "[ISO-8601-timestamp]",
      "edit_count": [N],
      "previous_version": "[previous-filename]"
    }
    ```

13. Update metadata.json with edit history:

    ```json
    {
      "id": "feature-slug",
      "started": "original-timestamp",
      "lastUpdated": "current-timestamp",
      "status": "active",
      "phase": "complete",
      "currentVersion": [N+1],
      "editHistory": [
        {
          "editNumber": [N],
          "timestamp": "current-timestamp",
          "summary": "brief description of changes",
          "filesModified": ["list of requirement sections affected"],
          "specVersion": [N+1]
        }
      ]
    }
    ```

14. Display completion summary:

```
✅ Requirements specification updated successfully!

📋 New Version: v[N+1]
📅 Updated: [timestamp]
🔄 Changes Applied: [brief summary]

📄 Files Created/Updated:
- [XX]-edit-[N]-request.md (change request)
- [XX+1]-edit-[N]-impact.md (impact analysis)
- [XX+2]-edit-[N]-questions.md (clarifying questions)
- [XX+3]-edit-[N]-answers.md (your answers)
- [XX+4]-requirements-spec-v[N+1].md (updated specification)
- .latest-spec (version pointer)
- metadata.json (edit history)

🚀 Next Steps:
- Review updated specification: /requirements-current [requirement-id]
- Begin implementation: /requirements-implement [requirement-id]
- Make more changes: /requirements-edit [requirement-id]
```

**🎯 YOUR FINAL OUTPUT IS**:

- An updated requirements document in Markdown format
- Clear tracking of what changed and why
- Preserved history of all previous versions
- Ready for ANOTHER developer/session to implement the updated solution

**❌ DO NOT CREATE**:

- Source code files (.js, .ts, .py, .html, etc.)
- Working implementations or functions
- Test files or example code
- Any files outside the requirements/ folder

**✅ YOU CREATE ONLY**: Updated documentation that specifies the evolved requirements.

## Question Formats:

### Change-Focused Questions:

```
## Q1: Should the new [feature] integrate with the existing [system] at [file-path]?
**Default if unknown:** Yes (maintains architectural consistency)

## Q2: Should the modified [component] preserve the current [behavior]?
**Default if unknown:** Yes (maintains backward compatibility)

## Q3: Will the new [requirement] need the same [constraint] as existing [feature]?
**Default if unknown:** Yes (maintains consistency with current patterns)
```

## Important Rules:

- ONLY yes/no questions with smart defaults
- ONE question at a time
- Write ALL questions to file BEFORE asking any
- Focus on changes and their impacts (no implementation)
- Use actual file paths and component names from current spec
- Document WHY each default makes sense for the changes
- Version files numerically and track changes

## File Naming Pattern:

```
Original: 10-requirements-spec.md
Edit 1:   07-edit-1-request.md → 11-requirements-spec-v2.md
Edit 2:   12-edit-2-request.md → 16-requirements-spec-v3.md
Edit 3:   17-edit-3-request.md → 21-requirements-spec-v4.md
```

## Metadata Structure Update:

```json
{
  "id": "feature-slug",
  "started": "ISO-8601-timestamp",
  "lastUpdated": "ISO-8601-timestamp",
  "status": "active",
  "phase": "complete",
  "currentVersion": 3,
  "progress": {
    "discovery": { "answered": 5, "total": 5 },
    "detail": { "answered": 8, "total": 8 }
  },
  "contextFiles": ["paths/of/files/analyzed"],
  "relatedFeatures": ["similar features found"],
  "editHistory": [
    {
      "editNumber": 1,
      "timestamp": "ISO-8601-timestamp",
      "summary": "Added OAuth2 authentication support",
      "filesModified": ["authentication", "user-management"],
      "specVersion": 2
    },
    {
      "editNumber": 2,
      "timestamp": "ISO-8601-timestamp",
      "summary": "Added multi-tenant support",
      "filesModified": ["database", "api-endpoints"],
      "specVersion": 3
    }
  ]
}
```

## 🛡️ EMERGENCY BRAKE - Read This Before Every Response:

Before formulating ANY response, ask yourself:

1. **Am I in requirements editing mode?** → YES, always during this command
2. **Am I being asked to implement something?** → Redirect to updated specification
3. **Am I about to write code?** → STOP. Write updated requirements instead
4. **Am I solving or specifying?** → SPECIFY the updated requirements only
5. **Am I tempted to "just implement the change"?** → Your job is to SPECIFY the change

**If you're ever unsure**: Default to continuing with the requirements editing process, not
implementing anything.
