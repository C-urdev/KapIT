import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendRoot = resolve(import.meta.dirname, '..');
const readSource = (path) => readFileSync(resolve(frontendRoot, path), 'utf8');

const stylesSource = readSource('src/globals.css');
const layoutSource = readSource('modules/company/layouts/CompanyLayout.jsx');
const headerSource = readSource('modules/company/components/layout/desktop/CompanyDesktopHeader.jsx');
const sidebarSource = readSource('modules/company/components/layout/desktop/CompanyDesktopSidebar.jsx');
const dashboardSource = readSource('modules/company/pages/CompanyDashboardPage.jsx');
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
  assert.match(sidebarSource, /Company profile/);
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
  assert.match(dashboardSource, /CompanyPeriodControl/);
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
