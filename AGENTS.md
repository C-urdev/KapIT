# Agent Operating Rules (Always On)

These rules are persistent for this repository and should be applied on every task by default.

## Context Engineering Default

Before implementing or answering, always perform context engineering:

1. Scan only relevant files first (do not load unrelated parts of the repo).
2. Build a concise working context:
   - goal
   - constraints
   - affected files/modules
   - assumptions
3. Reuse prior decisions already present in this repo unless there is a clear reason to change them.
4. Prefer minimal, targeted changes over broad refactors.
5. When requirements are ambiguous, make a safe assumption and proceed.
6. Ask the user only when a decision has hidden risk or major product impact.

## Execution Quality

1. Verify with the fastest meaningful check (build/test/lint/targeted run) after changes.
2. Report what changed, why, and how it was validated.
3. If blocked, surface the exact blocker and propose the next best action.

## Scope Control

1. Keep edits within the smallest necessary file set.
2. Do not rewrite unrelated code.
3. Preserve existing architecture and naming conventions unless requested otherwise.
