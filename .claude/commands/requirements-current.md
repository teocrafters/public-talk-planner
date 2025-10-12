---
description: "View or continue requirements, show specifications"
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
argument-hint: "[spec-id] or --all"
---

# Requirements Central Hub

## 🎯 Dynamic Mode Selection

This command adapts based on your input:

- **No argument**: Show and continue active requirement OR list recent if none active
- **Specific ID** (e.g. `dark-mode`): View details of specific specification (view-only)
- **--all flag**: List all requirements documentation

## Instructions:

### 1. Parse Arguments

- Check $ARGUMENTS for content
- If empty → Mode: Continue Active
- If "--all" → Mode: List All
- If specific text → Mode: View Specific

### 2. Mode: Continue Active (No Arguments)

**⚠️ CRITICAL MODE REMINDER** You are currently in REQUIREMENTS GATHERING MODE.

- You ARE: Continuing to gather and document requirements
- You ARE NOT: Implementing any solutions or writing code
- Your output: Questions and documentation ONLY

If at any point you feel tempted to write code, STOP. Your task is to understand WHAT needs to be
built, not to BUILD it.

#### Steps:

1. Read requirements/.current-requirement
2. If no active requirement:
   - Show message: "No active requirement gathering"
   - Display last 3 completed requirements
   - Suggest /requirements-start [description]
   - Exit

3. If active requirement exists:
   - Read metadata.json for current phase and progress
   - Show formatted status
   - Load appropriate question/answer files
   - **CONTINUE from last unanswered question**

#### Status Display Format:

```
📋 Active Requirement: [name]
Started: [time ago]
📝 Version: v[X] ([Y] edits) - [if edited, show last edit date]
Phase: [Discovery/Detail]
Progress: [X/Y] questions answered

[Show last 3 answered questions with responses]

Next Question:
[Show next unanswered question with default]
```

#### Continuation Flow:

1. Read next unanswered question from file
2. Present to user with default
3. Accept yes/no/idk response
4. Update answer file
5. Update metadata progress
6. Move to next question or phase

   ⚠️ **CRITICAL**: When moving to next phase:
   - **Phase 3** (Context Gathering): You analyze code to UNDERSTAND, not to MODIFY
   - **Phase 4** (Expert Questions): You ask about files to DOCUMENT needs, not to IMPLEMENT
   - **Phase 5** (Final Spec): You generate SPECIFICATION, not SOURCE CODE

#### Phase Transitions:

- Discovery complete → Run context gathering → Generate detail questions
- Detail complete → Generate final requirements spec

**Remember**: Each phase builds toward a SPECIFICATION document, not working code.

#### Common Continuation Pitfalls to AVOID:

##### ❌ WRONG Response Patterns:

- User: "just implement it simply"
  - **WRONG**: "Let me create a simple implementation..."
  - **RIGHT**: "I'm in requirements mode. Let me continue with question 4..."

- User: "nasz problem to X"
  - **WRONG**: "I'll fix that problem by creating..."
  - **RIGHT**: "I understand the problem. Let me ask: Will users need..."

- User: "twoim zadaniem jest to add feature Y"
  - **WRONG**: "I'll add that feature now..."
  - **RIGHT**: "I'm documenting requirements for feature Y. Next question..."

- User: "make it work quickly"
  - **WRONG**: "Let me quickly implement..."
  - **RIGHT**: "I'll continue gathering requirements. Current phase: [X]..."

##### ✅ CORRECT Mindset:

Before EVERY response, ask yourself:

1. **Am I about to write code?** → DON'T
2. **Am I about to create implementation files?** → Only in requirements/ folder
3. **Am I solving or specifying?** → SPECIFY only
4. **Is this a trigger phrase?** → Apply redirect to requirements

**Default behavior**: When in doubt, continue with the next requirements question.

### 3. Mode: View Specific (Argument Provided)

**ℹ️ VIEW-ONLY MODE** You are in VIEW-ONLY MODE for requirements inspection.

- You ARE: Displaying information about specific requirement
- You ARE NOT: Continuing any process or implementing anything
- Your output: Status display ONLY

#### Steps:

1. Search requirements/ folder for requirement matching $ARGUMENTS
   - Look for folders containing the argument text
   - Match against folder names and metadata
2. If found:
   - Load all files from requirement folder
   - Display comprehensive status
   - Show complete history

#### Display Format:

```
📋 Requirement: [name]
⏱️  Duration: [time since start]
📝 Version: v[X] ([Y] edits) | Last Modified: [date if edited]
📊 Phase: [Initial Setup/Context Discovery/Targeted Context/Expert Requirements/Complete]
🎯 Progress: [total answered]/[total questions]

📄 Initial Request:
[Show content from 00-initial-request.md]

🔄 Edit History (if versions > 1):
- v1: Original specification
- v2: [edit 1 summary] - [date]
- v3: [edit 2 summary] - [date]
[Show latest edit details if multiple versions exist]

🏗️ Codebase Overview (Phase 1):
- Architecture: [e.g., React + Node.js + PostgreSQL]
- Main components: [identified services/modules]
- Key patterns: [discovered conventions]

✅ Context Discovery Phase (5/5 complete):
Q1: Will users interact through a visual interface? YES
Q2: Does this need to work on mobile? YES
Q3: Will this handle sensitive data? NO
Q4: Do users have a current workaround? YES (default)
Q5: Will this need offline support? IDK → NO (default)

🔍 Targeted Context Findings:
- Specific files identified: [list key files]
- Similar feature: UserProfile at components/UserProfile.tsx
- Integration points: AuthService, ValidationService
- Technical constraints: Rate limiting required

🎯 Expert Requirements Phase (2/8 answered):
Q1: Use existing ValidationService at services/validation.ts? YES
Q2: Extend UserModel at models/User.ts? YES
Q3: Add new API endpoint to routes/api/v1? [PENDING]
...

📝 Actions:
- Continue: /requirements-current (no arguments)
- Edit specification: /requirements-edit [requirement-id]
- End: /requirements-end
```

#### File Structure Reference:

- 00-initial-request.md - Original user request
- 01-discovery-questions.md - Context discovery questions
- 02-discovery-answers.md - User's answers
- 03-context-findings.md - AI's codebase analysis
- 04-detail-questions.md - Expert requirements questions
- 05-detail-answers.md - User's detailed answers
- 07-verification-questions.md - Testing strategy questions
- 08-verification-answers.md - User's verification preferences
- 09-verification-plan.md - Comprehensive testing strategy
- 10-requirements-spec.md - Final requirements document

**Remember**: This displays requirements gathering progress, NOT implementation progress. All
progress shown relates to building a SPECIFICATION document, not building software.

### 4. Mode: List All (--all flag)

Display all requirements with their status and summaries.

#### Steps:

1. Check requirements/.current-requirement for active requirement
2. List all folders in requirements/ directory
3. For each requirement folder:
   - Read metadata.json
   - Extract key information
   - Format for display

4. Sort by:
   - Active first (if any)
   - Then by status: complete, incomplete
   - Then by date (newest first)

#### Display Format:

```
📚 Requirements Documentation

🔴 ACTIVE: profile-picture-upload
   Version: v1 (0 edits) | Phase: Discovery (3/5) | Started: 30m ago
   Next: Q4 about file restrictions

✅ COMPLETE:
2025-01-26-0900-dark-mode-toggle
   Version: v3 (2 edits) | Status: Ready for implementation | 15 questions answered
   Summary: Full theme system with user preferences (last edit: added custom themes)
   Latest spec: 16-requirements-spec-v3.md
   Linked PR: #234 (merged)

2025-01-25-1400-export-reports
   Version: v1 (0 edits) | Status: Implemented | 22 questions answered
   Summary: PDF/CSV export with filtering

⚠️ INCOMPLETE:
2025-01-24-1100-notification-system
   Version: v2 (1 edit) | Status: Paused at Detail phase (2/8) | Last: 2 days ago
   Summary: Email/push notifications for events (last edit: added Slack integration)
   Latest spec: 11-requirements-spec-v2.md

📈 Statistics:
- Total: 4 requirements
- Complete: 2 (13 avg questions)
- Active: 1
- Incomplete: 1
- Total edits across all requirements: 3
```

#### Additional Features:

1. Show linked artifacts:
   - Development sessions
   - Pull requests
   - Implementation status

2. Highlight stale requirements:
   - Mark if incomplete > 7 days
   - Suggest resuming or ending

3. Quick actions:
   - "View specific: /requirements-current [id]"
   - "Resume active: /requirements-current"
   - "Edit specification: /requirements-edit [id]"
   - "Start new: /requirements-start [description]"

## Important Notes:

- **No arguments**: Active mode with continuation capability
- **Specific argument**: View-only mode for inspection
- **--all flag**: Complete list view mode
- Always maintains SPECIFICATION focus, never implementation focus
