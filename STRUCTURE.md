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
- `src/user/components/navigation/desktop`
- `src/user/components/navigation/mobile`
- `src/user/components/desktop`
- `src/user/components/mobile`
- `src/user/features`
- `src/user/pages`
- `src/user/layouts`

### Company
- `src/company/components`
- `src/company/components/layout/desktop`
- `src/company/components/layout/mobile`
- `src/company/components/desktop`
- `src/company/components/mobile`
- `src/company/features`
- `src/company/pages`
- `src/company/layouts`

## View Requirements

For every new feature added to the user side or company side:

- Always create both a mobile view and a desktop/PC view
- Do not leave a new feature with only one responsive layout
- Mobile and desktop designs can share logic, but the UI structure and layout should be intentionally designed for each screen size
- If a feature is used by both user and company flows, both sides must still have complete mobile and desktop implementations

Recommended organization:

- Put shared business logic in `features`, `services`, or shared hooks/helpers
- Put mobile-specific UI in `mobile` folders when the UI differs clearly on small screens
- Put desktop-specific UI in `desktop` folders when the UI differs clearly on larger screens
- Keep one feature complete only when both screen experiences are built

## Where To Put New Code

Use this rule:

- If both user and company use it, put it in `src/shared`
- If only the user side uses it, put it in `src/user`
- If only the company side uses it, put it in `src/company`

## Quick Examples

- A reusable modal for both sides: `src/shared/components`
- User account settings: `src/user/features`
- User account settings mobile UI: `src/user/components/mobile`
- User account settings desktop UI: `src/user/components/desktop`
- User mobile navigation: `src/user/components/navigation/mobile`
- User desktop navigation: `src/user/components/navigation/desktop`
- Company job posting page: `src/company/pages`
- Company job posting mobile UI: `src/company/components/mobile`
- Company job posting desktop UI: `src/company/components/desktop`
- Company mobile layout pieces: `src/company/components/layout/mobile`
- Company desktop layout pieces: `src/company/components/layout/desktop`
- Shared auth logic: `src/shared/services`

## Goal

This structure helps keep the project easier to navigate, easier to maintain, and easier to expand without mixing user and company code together.
