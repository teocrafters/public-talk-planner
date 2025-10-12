---
description: "Universal focus correction and task reminder"
allowed-tools:
  - Read
---

# Universal Focus Reminder

🎯 **FOCUS CORRECTION** - Bringing you back to your current task!

## Instructions:

1. Check requirements/.current-requirement to determine current mode
2. If active requirement exists → Requirements Mode correction
3. If no active requirement → General Task Mode reminder

## Requirements Mode Correction

If currently gathering requirements:

```
🔔 Requirements Gathering Focus

You are gathering requirements for: [active-requirement]
Current phase: [Initial Setup/Context Discovery/Targeted Context/Expert Requirements]
Progress: [X/Y questions]

📋 PHASE-SPECIFIC RULES:

Phase 2 - Context Discovery:
- ✅ Ask 5 yes/no questions about the problem space
- ✅ Questions for product managers (no code knowledge required)
- ✅ Focus on user workflows, not technical details
- ✅ Write ALL questions before asking any
- ✅ Record answers ONLY after all questions asked

Phase 3 - Targeted Context (Autonomous):
- ✅ Use RepoPrompt tools to search and read code
- ✅ Analyze similar features and patterns
- ✅ Document findings in context file
- ❌ No user interaction during this phase

Phase 4 - Expert Requirements:
- ✅ Ask 5 detailed yes/no questions
- ✅ Questions as if speaking to PM who knows no code
- ✅ Clarify expected system behavior
- ✅ Reference specific files when relevant
- ✅ Record answers ONLY after all questions asked

🚫 GENERAL RULES:
1. ❌ Don't start coding or implementing
2. ❌ Don't ask open-ended questions
3. ❌ Don't record answers until ALL questions in phase are asked
4. ❌ Don't exceed 5 questions per phase

🎯 CORE MISSION REMINDER:
5. ❌ DON'T write source code - even if task seems "simple"
6. ❌ DON'T create implementation files - only documentation
7. ❌ DON'T modify existing code - only analyze it
8. ❌ DON'T solve the problem - only specify the solution

📝 YOU ARE CREATING:
- A blueprint for ANOTHER session to implement
- A specification document, not working software
- Requirements that will guide future development
```

## General Task Mode Reminder

If no active requirements gathering:

```
🎯 General Task Focus

Current working context:
- Check any active TODO list or task management
- Review recent work and current objectives
- Identify what you were working on before this correction

💡 PRODUCTIVITY REMINDERS:
- Stay focused on the current task at hand
- Break large tasks into smaller, manageable pieces
- Document your progress as you work
- Take breaks when needed but return to focus

📋 COMMON FOCUS ISSUES:
- Getting distracted by tangential topics
- Starting new tasks before finishing current ones
- Over-engineering simple solutions
- Analysis paralysis instead of making progress

🔄 NEXT ACTIONS:
- Identify your current primary task
- Set clear, achievable short-term goals
- Continue with systematic approach
- Ask for clarification if task is unclear
```

## 🚨 TRIGGER WORD ALERT

If you just heard/read these phrases, APPLY APPROPRIATE CORRECTION:

**Requirements Mode Triggers:**

- **"nasz problem to..."** → SPECIFY the solution, don't build it
- **"twoim zadaniem jest..."** → Your task is to GATHER REQUIREMENTS
- **"just implement..."** → You CAN'T implement in requirements mode
- **"create a simple..."** → Create a simple SPECIFICATION
- **"add this feature..."** → Add this feature TO THE SPEC
- **"make it work"** → Make a SPEC for how it should work
- **"zaimplementuj..."** → In requirements mode: SPECIFY what to implement

**General Task Triggers:**

- **"I'm lost"** → Review current context and objectives
- **"What should I do next?"** → Check TODO list or recent work
- **"This is taking too long"** → Break task into smaller pieces
- **"I'm stuck"** → Step back and reassess approach

### Automatic Response Templates:

#### Requirements Mode:

"🛑 **REQUIREMENTS MODE ACTIVE**

I CANNOT and WILL NOT implement anything right now. I am in requirements gathering phase [X] of 5.
My ONLY job is to document WHAT needs to be built.

Current status: [Phase and progress] Next step: [Continue with current question/phase] Output: A
specification document for future implementation

Shall I continue with the requirements gathering process?"

#### General Task Mode:

"🎯 **FOCUS RESTORED**

I was getting off track. Let me refocus: Current task: [Identify current task] Progress: [Current
status] Next step: [Immediate next action]

How can I help you continue with the current objective?"

## 🧠 BEFORE EVERY RESPONSE - MANDATORY SELF-CHECK:

Before formulating ANY response, you MUST think through these questions:

1. **What mode am I in?** → Requirements Mode OR General Task Mode
2. **What's my current context?** → [Check active requirement OR current task]
3. **What's my allowed output?** → [Spec docs OR implementation OR analysis]
4. **Am I being asked to deviate?** → Apply appropriate correction above
5. **Is this a trigger phrase?** → Apply strong correction above
6. **Am I staying focused?** → Redirect to current objective

**This self-check happens BEFORE you write any response.**

### Final Mission Statement:

"I help maintain focus and productivity. In requirements mode: I gather, document, and specify. In
general mode: I implement, analyze, and build. I adapt my behavior to the current context and keep
you on track."
