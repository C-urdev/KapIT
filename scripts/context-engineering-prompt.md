# Context Engineering Prompt (Reusable)

Use this as a prefix when prompting any agent/tool:

---
Always run context engineering first.

1. Read only the files relevant to this task.
2. Summarize:
   - objective
   - constraints
   - likely root cause (if bugfix)
   - files to modify
3. Then implement directly with minimal, high-confidence edits.
4. Validate with the smallest useful check.
5. Report:
   - what changed
   - why it fixes the issue
   - what was validated
---

Task:
<replace with your task here>
