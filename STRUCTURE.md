# Project Structure

This project is organized into three main code areas so it is easier to find what belongs to the user side, company side, or both.

## Main Folders

### `src/shared`
Use this for code that is used by both user and company flows.

Examples:
- shared UI components
- shared auth components
- shared context
- shared services
- shared utilities
- shared onboarding pages
- shared public profile pages

### `src/user`
Use this for user-only code.

Examples:
- user dashboard pages
- user navigation
- user profile features
- user post features
- user-only components

### `src/company`
Use this for company-only code.

Examples:
- company dashboard pages
- company sidebar and header
- company hiring features
- company posting flow
- company-only components

## Naming Rules

To make files easier to identify:

- Prefix user-only files with `User` when appropriate
- Prefix company-only files with `Company` when appropriate
- Keep shared files neutral when they are truly shared

Examples:
- `UserHomePage.jsx`
- `UserNavbar.jsx`
- `CompanyDashboardPage.jsx`
- `CompanyLayout.jsx`
- `SearchableSelect.jsx` for shared code

## Folder Guidelines

### Shared
- `src/shared/components`
- `src/shared/pages`
- `src/shared/context`
- `src/shared/services`
- `src/shared/utils`

### User
- `src/user/components`
- `src/user/features`
- `src/user/pages`
- `src/user/layouts`

### Company
- `src/company/components`
- `src/company/features`
- `src/company/pages`
- `src/company/layouts`

## Where To Put New Code

Use this rule:

- If both user and company use it, put it in `src/shared`
- If only the user side uses it, put it in `src/user`
- If only the company side uses it, put it in `src/company`

## Quick Examples

- A reusable modal for both sides: `src/shared/components`
- User account settings: `src/user/features`
- Company job posting page: `src/company/pages`
- Shared auth logic: `src/shared/services`

## Goal

This structure helps keep the project easier to navigate, easier to maintain, and easier to expand without mixing user and company code together.
