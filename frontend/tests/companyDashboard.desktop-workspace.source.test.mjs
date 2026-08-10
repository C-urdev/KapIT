import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendRoot = resolve(import.meta.dirname, '..');
const readSource = (path) => readFileSync(resolve(frontendRoot, path), 'utf8');
const readOptionalSource = (path) => {
  try {
    return readSource(path);
  } catch (error) {
    if (error?.code === 'ENOENT') return '';
    throw error;
  }
};

const stylesSource = readSource('src/globals.css');
const layoutSource = readSource('modules/company/layouts/CompanyLayout.jsx');
const headerSource = readSource('modules/company/components/layout/desktop/CompanyDesktopHeader.jsx');
const sidebarSource = readSource('modules/company/components/layout/desktop/CompanyDesktopSidebar.jsx');
const dashboardSource = readSource('modules/company/pages/CompanyDashboardPage.jsx');
const jobsSource = readSource('modules/company/pages/CompanyManageJobsPage.jsx');
const applicantsSource = readSource('modules/company/pages/CompanyApplicantsPage.jsx');
const applicantCardSource = readSource('modules/company/components/CompanyApplicantCard.jsx');
const overflowMenuSource = readOptionalSource('modules/company/components/CompanyOverflowMenu.jsx');
const workspaceControlsSource = readSource('modules/company/components/CompanyWorkspaceControls.jsx');
const searchSource = readSource('modules/company/pages/CompanySearchDevelopersPage.jsx');
const settingsSource = readSource('modules/company/pages/CompanySettingsPage.jsx');
const postJobSource = readSource('modules/company/pages/CompanyPostJobPage.jsx');
const helpSource = readSource('modules/shared/pages/help/HelpPage.jsx');
const messagesSource = readSource('modules/shared/components/messages/MessagesInbox.jsx');

test('company desktop shell uses the shared workspace token contract in light and dark mode', () => {
  assert.match(layoutSource, /company-dashboard-shell/);
  assert.match(layoutSource, /xl:flex/);
  assert.match(layoutSource, /xl:h-\[100dvh\]/);
  assert.match(layoutSource, /xl:items-stretch/);
  assert.match(layoutSource, /xl:overflow-hidden/);
  assert.match(layoutSource, /xl:overflow-y-auto/);
  assert.match(stylesSource, /\.company-dashboard-shell/);
  assert.match(stylesSource, /--workspace-canvas: #f4f6f5/);
  assert.match(stylesSource, /--workspace-surface: #ffffff/);
  assert.match(stylesSource, /--workspace-primary: #356447/);
  assert.match(stylesSource, /html\.dark \.company-dashboard-shell/);
  assert.match(stylesSource, /--workspace-canvas: #09090b/);
  assert.match(stylesSource, /--workspace-surface: #121212/);
  assert.match(stylesSource, /--workspace-primary: #7db08a/);
});

test('company desktop navigation is employer-specific and keeps mobile chrome intact', () => {
  assert.match(sidebarSource, /Talent Search/);
  assert.match(sidebarSource, /Help Center/);
  assert.match(sidebarSource, /Log out/);
  assert.match(headerSource, /Search developers/);
  assert.match(headerSource, /Post a job/);
  assert.match(headerSource, /COMPANY_PATHS\.notifications/);
  assert.match(layoutSource, /CompanyMobileMenuDrawer/);
  assert.match(layoutSource, /CompanyMobileBottomNav/);
});

test('company search app bar submits into the existing talent search route', () => {
  assert.match(headerSource, /URLSearchParams/);
  assert.match(headerSource, /COMPANY_PATHS\.search/);
  assert.match(searchSource, /params\.get\('query'\)/);
});

test('company operational pages use the desktop workspace primitives', () => {
  assert.match(dashboardSource, /Hiring overview/);
  assert.match(dashboardSource, /CompanyPeriodSelect/);
  assert.match(dashboardSource, /CompanyStatStrip/);
  assert.match(workspaceControlsSource, /company-workspace-period-control/);
  assert.match(workspaceControlsSource, /company-workspace-stat-strip/);
  assert.match(stylesSource, /company-workspace-filter-strip/);
  assert.match(stylesSource, /company-workspace-tab-button/);
  assert.match(stylesSource, /company-workspace-control :is\(input, select, textarea\):focus-visible/);
  assert.match(settingsSource, /company-workspace-page/);
  assert.match(postJobSource, /company-workspace-form/);
  assert.match(helpSource, /help-workspace-page/);
  assert.match(helpSource, /help-workspace-composer/);
  assert.match(stylesSource, /\.help-workspace-page/);
});

test('company messages have a dedicated desktop workspace variant', () => {
  assert.match(messagesSource, /company-messages-workspace/);
  assert.match(stylesSource, /\.company-messages-workspace/);
  assert.match(stylesSource, /\.company-message-row\[data-active='true'\]/);
});

test('company desktop page headers keep one global posting action and compact local controls', () => {
  assert.doesNotMatch(dashboardSource, /company-workspace-header-actions/);
  assert.doesNotMatch(jobsSource, /company-workspace-header-actions/);
  assert.match(dashboardSource, /company-workspace-page-heading-row/);
  assert.match(jobsSource, /company-workspace-page-heading-row/);
  assert.match(jobsSource, /company-jobs-filter-toolbar/);
});

test('dashboard date range uses a labeled dropdown in the header utility position', () => {
  assert.match(dashboardSource, /CompanyPeriodSelect/);
  assert.match(dashboardSource, /\{ label: 'Last 7 days', value: 7 \}/);
  assert.match(workspaceControlsSource, /export function CompanyPeriodSelect/);
  assert.match(workspaceControlsSource, /createPortal/);
  assert.match(workspaceControlsSource, /aria-haspopup="menu"/);
  assert.match(workspaceControlsSource, /role="menuitemradio"/);
  assert.match(workspaceControlsSource, /aria-checked/);
  assert.match(workspaceControlsSource, /event\.key === 'Escape'/);
  assert.match(workspaceControlsSource, /event\.key === 'ArrowDown'/);
  assert.match(workspaceControlsSource, /closest\('\.company-dashboard-shell'\)/);
  assert.doesNotMatch(workspaceControlsSource, /<select/);
  assert.match(stylesSource, /\.company-workspace-period-select/);
  assert.match(stylesSource, /\.company-workspace-period-menu-popover/);
  assert.match(stylesSource, /\.company-workspace-period-select-trigger\[data-open='true'\]/);
  assert.doesNotMatch(dashboardSource, /variant="quiet"/);
});

test('company desktop segmented controls expose grouped selection state', () => {
  assert.match(workspaceControlsSource, /CompanySegmentedControl/);
  assert.match(workspaceControlsSource, /role="group"/);
  assert.match(workspaceControlsSource, /aria-pressed/);
  assert.match(applicantsSource, /label="Applicant view"/);
});

test('company applicant pipeline keeps zero values visually empty', () => {
  assert.match(applicantsSource, /company-review-pipeline/);
  assert.match(applicantsSource, /value === 0 \? 0/);
  assert.doesNotMatch(applicantsSource, /Math\.max\(8,/);
});

test('company row overflow actions are accessible and destructive actions stay explicit', () => {
  assert.match(overflowMenuSource, /aria-haspopup="menu"/);
  assert.match(overflowMenuSource, /aria-expanded/);
  assert.match(overflowMenuSource, /event\.key === 'Escape'/);
  assert.match(overflowMenuSource, /createPortal/);
  assert.match(overflowMenuSource, /closest\('\.company-dashboard-shell'\)/);
  assert.match(jobsSource, /CompanyOverflowMenu/);
  assert.match(jobsSource, /Close job/);
  assert.match(jobsSource, /Delete job/);
  assert.match(applicantCardSource, /Review application/);
  assert.match(applicantCardSource, /More actions for/);
});

test('company account popover keeps logout and removes profile and pricing entries', () => {
  assert.match(sidebarSource, /label="Log out"/);
  assert.doesNotMatch(sidebarSource, /label="Company profile"/);
  assert.doesNotMatch(sidebarSource, /label="Pricing"/);
});

test('collapsed company sidebar shows the KapIT logo until the sidebar toggle is hovered or focused', () => {
  assert.match(sidebarSource, /group\/sidebar-brand/);
  assert.match(sidebarSource, /: \(\s*<span[\s\S]*?<KapITLogo className="h-7 w-auto"/);
  assert.match(sidebarSource, /group-hover\/sidebar-brand:opacity-0/);
  assert.match(sidebarSource, /group-focus-within\/sidebar-brand:opacity-0/);
  assert.match(sidebarSource, /absolute left-1\/2 top-1\/2 -translate-x-1\/2 -translate-y-1\/2 opacity-0/);
  assert.match(sidebarSource, /group-hover\/sidebar-brand:opacity-100/);
  assert.match(sidebarSource, /group-focus-within\/sidebar-brand:opacity-100/);
});
