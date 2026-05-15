# Secret Scanning Workflow

This project uses `gitleaks` for repository secret detection in CI and local checks.

## CI

- GitHub Actions runs `gitleaks` on every push and pull request using `.gitleaks.toml`.
- The scan fails the workflow if leaks are found.

## Local scan (safe)

1. Keep `.env`, dumps, exports, and key files untracked (already covered by `.gitignore`).
2. Run the existing repository guard:
   - `npm run security:secrets`
3. If you need a full `gitleaks` binary scan:
   - Download a trusted `gitleaks` release from the official project.
   - Run:
     - `gitleaks detect --source . --config .gitleaks.toml --redact`

## Notes

- Never commit real secrets.
- Use `.env.example` placeholders only.
- Rotate any credential immediately if a leak is detected.
