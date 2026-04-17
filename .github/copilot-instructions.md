# GitHub Copilot Instructions (KapIT)

Use context engineering by default for every task.

## Workflow

1. Read only relevant files and symbols before coding.
2. Build a concise context summary:
   - objective
   - constraints
   - impacted files
   - assumptions
3. Follow existing architecture and naming conventions.
4. Make minimal, focused changes; avoid unrelated refactors.

## Decision Rules

1. Prefer safe assumptions when details are missing.
2. Ask for clarification only when the choice has hidden risk or major behavior impact.

## Verification

1. Run the smallest meaningful validation after edits.
2. Report what changed, why, and validation outcome.
