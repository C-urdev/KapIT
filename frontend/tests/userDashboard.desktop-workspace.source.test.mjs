import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const readSource = (path) => readFileSync(resolve(path), 'utf8');

const stylesSource = readSource('src/globals.css');
const homeSource = readSource('modules/user/pages/home/UserHomePage.jsx');
const navbarSource = readSource('modules/user/components/navigation/desktop/UserDesktopNavbar.jsx');
const jobsSource = readSource('modules/user/pages/jobs/UserJobsPage.jsx');
const calendarSource = readSource('modules/user/pages/calendar/UserCalendarPage.jsx');
const projectsSource = readSource('modules/user/pages/projects/UserProjectsPage.jsx');
const centerFeedSource = readSource('modules/user/pages/home/UserCenterFeed.jsx');
const applicationsSource = readSource('modules/user/pages/home/UserApplicationsPanel.jsx');
const notificationsSource = readSource('modules/user/pages/notifications/UserNotificationsPage.jsx');
const settingsSource = readSource('modules/user/pages/settings/UserSettingsPage.jsx');
const helpSource = readSource('modules/shared/pages/help/HelpPage.jsx');
const feedbackSource = readSource('modules/user/pages/feedback/UserFeedbackPage.jsx');
const messagesSource = readSource('modules/shared/components/messages/MessagesInbox.jsx');

test('desktop user workspace defines equivalent light and dark semantic tokens', () => {
  assert.match(homeSource, /user-dashboard-shell/);
  assert.match(stylesSource, /--user-canvas: #f4f6f5/);
  assert.match(stylesSource, /--user-surface: #ffffff/);
  assert.match(stylesSource, /--user-text-strong: #18211c/);
  assert.match(stylesSource, /--user-primary: #356447/);
  assert.match(stylesSource, /html\.dark \.user-dashboard-shell/);
  assert.match(stylesSource, /--user-canvas: #09090b/);
  assert.match(stylesSource, /--user-surface: #121212/);
  assert.doesNotMatch(stylesSource, /html:not\(\.dark\) \.user-dashboard-shell[\s\S]*background-color: #fff/);
});

test('desktop navigation is a full-width app bar with persistent search and account actions', () => {
  assert.match(navbarSource, /h-\[68px\]/);
  assert.match(navbarSource, /Search people, companies, projects, or jobs/);
  assert.match(navbarSource, /Open settings/);
  assert.match(navbarSource, /Open notifications/);
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

test('desktop job preview places profile match beside the job header info', () => {
  const previewStart = jobsSource.indexOf('function DesktopJobPreview');
  const previewEnd = jobsSource.indexOf('function SquareJobCard');
  const previewSource = jobsSource.slice(previewStart, previewEnd);

  assert.match(previewSource, /items-start justify-between gap-6 border-b border-\[var\(--user-border\)\] p-5/);
  assert.match(previewSource, /shrink-0 rounded-md border border-\[var\(--user-border\)\] bg-\[var\(--user-surface-subtle\)\] px-4 py-3 text-right/);
  assert.match(previewSource, /<p className="text-xs font-semibold text-\[var\(--user-primary\)\]">Profile match<\/p>/);
  assert.doesNotMatch(previewSource, /rounded-lg border border-\[var\(--user-border\)\] bg-\[var\(--user-surface-subtle\)\] p-4[\s\S]*Profile match/);
  assert.match(previewSource, /<div className="min-h-0 flex-1 overflow-y-auto p-5">/);
  assert.match(previewSource, /<section>\s*<h3 className="user-workspace-section-title">About the role<\/h3>/);
});

test('calendar and jobs stay inside the desktop dashboard workspace instead of scrolling the document', () => {
  assert.match(homeSource, /pagesWithLockedWorkspace = \['jobs', 'calendar', 'saved-jobs', 'applications'\]/);
  assert.match(homeSource, /document\.documentElement\.classList\.add\('user-dashboard-page-lock'\)/);
  assert.match(homeSource, /document\.body\.classList\.add\('user-dashboard-page-lock'\)/);
  assert.match(homeSource, /height: isMobileShellViewport \? undefined : \(isWorkspaceLockedPage \? 'calc\(100dvh - 4rem\)' : undefined\)/);
  assert.match(homeSource, /overflow: isWorkspaceLockedPage && !isMobileShellViewport \? 'hidden' : undefined/);
  assert.match(stylesSource, /html\.user-dashboard-page-lock,\s*html\.user-dashboard-page-lock body[\s\S]*overflow: hidden/);
  assert.match(calendarSource, /flex h-full min-h-0 flex-col/);
  assert.match(calendarSource, /xl:min-h-0 xl:space-y-3 xl:overflow-hidden/);
  assert.match(jobsSource, /hidden h-full min-h-0 w-full flex-col xl:flex/);
  assert.match(jobsSource, /grid min-h-0 flex-1 grid-cols-\[minmax\(360px,0\.82fr\)_minmax\(0,1\.18fr\)\]/);
});

test('calendar title removes the planner eyebrow and job cards only support horizontal swipe gestures', () => {
  assert.doesNotMatch(calendarSource, />Planner</);
  assert.doesNotMatch(jobsSource, /touchAction: isCurrent \? 'pan-y' : 'none'/);
  assert.doesNotMatch(jobsSource, /touchAction: 'pan-y'/);
  assert.match(jobsSource, /touchAction: 'none'/);
});

test('desktop calendar fits the visible workspace without a right-column scrollbar', () => {
  assert.match(calendarSource, /flex h-full min-h-0 flex-col gap-4/);
  assert.match(calendarSource, /xl:grid-cols-\[minmax\(0,1fr\)_360px\]/);
  assert.match(calendarSource, /xl:space-y-3/);
  assert.doesNotMatch(calendarSource, /xl:overflow-y-auto/);
  assert.match(calendarSource, /xl:p-4/);
  assert.match(calendarSource, /xl:h-14/);
  assert.match(calendarSource, /xl:py-4/);
});

test('calendar day notes empty state stays compact in the right rail', () => {
  assert.match(calendarSource, /No notes for this day/);
  assert.match(calendarSource, /xl:h-14/);
  assert.match(calendarSource, /items-center justify-center gap-3/);
  assert.doesNotMatch(calendarSource, /Add an interview, task, reminder, or private note\./);
});

test('user dashboard page headers omit descriptive subtitle copy', () => {
  const headerSubtitles = [
    [centerFeedSource, /Keep your profile active and your next opportunity moving\./],
    [jobsSource, /Search, compare, and review opportunities without losing your place\./],
    [calendarSource, /Keep notes, reminders, interview dates, and application follow-ups in one place\./],
    [projectsSource, /Show the work, tools, and outcomes that represent your experience\./],
    [applicationsSource, /Track every role and its current hiring status\./],
    [notificationsSource, /Review messages, profile activity, and important account updates\./],
    [settingsSource, /Manage your profile, preferences, privacy, and support options\./],
    [helpSource, /Contact KapIT support with account, hiring, payment, or onboarding questions\./],
    [feedbackSource, /tell us what would make the dashboard easier, clearer, or more helpful/],
  ];

  for (const [source, subtitle] of headerSubtitles) {
    assert.doesNotMatch(source, subtitle);
  }
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
