import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const readSource = (path) => readFileSync(resolve(path), 'utf8');

const stylesSource = readSource('src/globals.css');
const homeSource = readSource('modules/user/pages/home/UserHomePage.jsx');
const navbarSource = readSource('modules/user/components/navigation/desktop/UserDesktopNavbar.jsx');
const jobsSource = readSource('modules/user/pages/jobs/UserJobsPage.jsx');
const projectsSource = readSource('modules/user/pages/projects/UserProjectsPage.jsx');
const messagesSource = readSource('modules/shared/components/messages/MessagesInbox.jsx');

test('desktop user workspace defines equivalent light and dark semantic tokens', () => {
  assert.match(homeSource, /user-dashboard-shell/);
  assert.match(stylesSource, /--user-canvas: #f4f6f5/);
  assert.match(stylesSource, /--user-surface: #ffffff/);
  assert.match(stylesSource, /--user-text-strong: #18211c/);
  assert.match(stylesSource, /--user-primary: #356447/);
  assert.match(stylesSource, /html\.dark \.user-dashboard-shell/);
  assert.match(stylesSource, /--user-canvas: #101512/);
  assert.match(stylesSource, /--user-surface: #171d19/);
  assert.doesNotMatch(stylesSource, /html:not\(\.dark\) \.user-dashboard-shell[\s\S]*background-color: #fff/);
});

test('desktop navigation is a full-width app bar with persistent search and account actions', () => {
  assert.match(navbarSource, /h-\[68px\]/);
  assert.match(navbarSource, /Search people, companies, projects, or jobs/);
  assert.match(navbarSource, /aria-current=\{isActive \? 'page'/);
  assert.match(navbarSource, /Open account menu/);
  assert.doesNotMatch(navbarSource, /PillNavButton/);
  assert.match(homeSource, /hideDesktopProfileControl=\{false\}/);
});

test('desktop jobs use list and detail while the existing mobile deck remains available', () => {
  assert.match(jobsSource, /function DesktopJobsWorkspace/);
  assert.match(jobsSource, /grid-cols-\[minmax\(360px,0\.82fr\)_minmax\(0,1\.18fr\)\]/);
  assert.match(jobsSource, /function DesktopJobResult/);
  assert.match(jobsSource, /function DesktopJobPreview/);
  assert.match(jobsSource, /max-w-\[min\(100%,1040px\)\] space-y-6 xl:hidden/);
});

test('desktop projects use a portfolio grid while preserving the existing mobile layout', () => {
  assert.match(projectsSource, /function DesktopProjectsWorkspace/);
  assert.match(projectsSource, /grid grid-cols-2 gap-4 2xl:grid-cols-3/);
  assert.match(projectsSource, /Start your project portfolio/);
  assert.match(projectsSource, /max-w-\[min\(100%,1120px\)\] xl:hidden/);
});

test('messages desktop styling is scoped to the user variant', () => {
  assert.match(messagesSource, /isCompanyVariant \?[\s\S]*: 'user-messages-workspace/);
  assert.match(messagesSource, /user-messages-frame/);
  assert.match(messagesSource, /user-messages-list/);
  assert.match(messagesSource, /data-active=\{active \? 'true' : 'false'\}/);
  assert.match(stylesSource, /\.user-messages-workspace \.user-message-row\[data-active='true'\]/);
});
