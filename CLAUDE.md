# Claude Project Instructions

Apply these rules by default for all tasks in this repository.

## Context Engineering

1. Load only relevant files first.
2. Create a short working context before editing:
   - objective
   - constraints
   - likely root cause (for bugfixes)
   - files/modules to touch
3. Reuse established patterns in the codebase.
4. Prefer minimal edits over broad rewrites.
5. Ask questions only when the decision is risky or product-impacting; otherwise proceed with a safe assumption.

## Validation and Reporting

1. Run the fastest meaningful validation after edits.
2. Summarize:
   - what changed
   - why it solves the request
   - what was validated
3. If validation cannot run, say why and provide the next best verification step.
