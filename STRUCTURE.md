# Project Structure

This project is organized into three main code areas so it is easier to find what belongs to the user side, company side, or both.

## Main Folders

### `apps/web-next/src/shared`
Use this for code that is used by both user and company flows.

Examples:
- shared UI components
- shared auth components
- shared context
- shared services
- shared utilities
- shared onboarding pages
- shared public profile pages

### `apps/web-next/src/user`
Use this for user-only code.

Examples:
- user dashboard pages
- user navigation
- user profile features
- user post features
- user-only components

### `apps/web-next/src/company`
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
- `apps/web-next/src/shared/components`
- `apps/web-next/src/shared/pages`
- `apps/web-next/src/shared/context`
- `apps/web-next/src/shared/services`
- `apps/web-next/src/shared/utils`

### User
- `apps/web-next/src/user/components`
- `apps/web-next/src/user/components/navigation/desktop`
- `apps/web-next/src/user/components/navigation/mobile`
- `apps/web-next/src/user/components/desktop`
- `apps/web-next/src/user/components/mobile`
- `apps/web-next/src/user/features`
- `apps/web-next/src/user/pages`
- `apps/web-next/src/user/layouts`

### Company
- `apps/web-next/src/company/components`
- `apps/web-next/src/company/components/layout/desktop`
- `apps/web-next/src/company/components/layout/mobile`
- `apps/web-next/src/company/components/desktop`
- `apps/web-next/src/company/components/mobile`
- `apps/web-next/src/company/features`
- `apps/web-next/src/company/pages`
- `apps/web-next/src/company/layouts`

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

- If both user and company use it, put it in `apps/web-next/src/shared`
- If only the user side uses it, put it in `apps/web-next/src/user`
- If only the company side uses it, put it in `apps/web-next/src/company`

## Quick Examples

- A reusable modal for both sides: `apps/web-next/src/shared/components`
- User account settings: `apps/web-next/src/user/features`
- User account settings mobile UI: `apps/web-next/src/user/components/mobile`
- User account settings desktop UI: `apps/web-next/src/user/components/desktop`
- User mobile navigation: `apps/web-next/src/user/components/navigation/mobile`
- User desktop navigation: `apps/web-next/src/user/components/navigation/desktop`
- Company job posting page: `apps/web-next/src/company/pages`
- Company job posting mobile UI: `apps/web-next/src/company/components/mobile`
- Company job posting desktop UI: `apps/web-next/src/company/components/desktop`
- Company mobile layout pieces: `apps/web-next/src/company/components/layout/mobile`
- Company desktop layout pieces: `apps/web-next/src/company/components/layout/desktop`
- Shared auth logic: `apps/web-next/src/shared/services`

## Goal

This structure helps keep the project easier to navigate, easier to maintain, and easier to expand without mixing user and company code together.
