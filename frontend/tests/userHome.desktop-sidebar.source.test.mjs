import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const readSource = (path) => readFileSync(resolve(path), 'utf8');
const readOptionalSource = (path) => {
  const absolutePath = resolve(path);
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
};

const homeSource = readSource('modules/user/pages/home/UserHomePage.jsx');
const lazyViewsSource = readSource('modules/user/pages/home/userHomeLazyViews.ts');
const sidebarSource = readSource('modules/user/components/UserLeftSidebar.jsx');
const profileSidebarSource = readSource('modules/user/components/UserHomeProfileSidebar.jsx');
const navbarSource = readSource('modules/user/components/navigation/desktop/UserDesktopNavbar.jsx');
const settingsSource = readSource('modules/user/pages/settings/UserSettingsPage.jsx');
const feedbackSource = readOptionalSource('modules/user/pages/feedback/UserFeedbackPage.jsx');
const chatbotSource = readSource('modules/shared/components/support/FaqChatbot.jsx');
const stylesSource = readSource('src/globals.css');

test('desktop Home uses an unframed left rail and center feed without a right rail', () => {
  assert.match(
    homeSource,
    /xl:flex xl:min-h-\[100dvh\] xl:items-start/
  );
  assert.doesNotMatch(homeSource, /import UserHomeProfileSidebar/);
  assert.doesNotMatch(homeSource, /minmax\(17rem,21rem\)/);
});

test('left rail owns the profile cards, shortcuts, and collapse control without duplicating account actions', () => {
  const labels = ['My Profile', 'My Projects', 'Saved Jobs', 'Applications'];
  let previousIndex = -1;

  for (const label of labels) {
    const index = sidebarSource.indexOf(label);
    assert.ok(index > previousIndex, `${label} should follow the existing shortcut order`);
    previousIndex = index;
  }

  assert.match(
    sidebarSource,
    /aria-label=\{collapsed \? 'Expand sidebar' : 'Collapse sidebar'\}/
  );
  assert.match(sidebarSource, /import UserHomeProfileSidebar/);
  assert.match(sidebarSource, /!collapsed \? \(\s*<UserHomeProfileSidebar/);
  assert.doesNotMatch(sidebarSource, /bg-white\/65/);
  assert.doesNotMatch(sidebarSource, /label="Help"/);
  assert.doesNotMatch(sidebarSource, /label="Log out"/);
  assert.doesNotMatch(sidebarSource, /label: 'Notifications'/);
});

test('left rail groups primary navigation under Menu and renames Home to Dashboard', () => {
  assert.match(sidebarSource, />Menu</);
  assert.match(sidebarSource, /id: 'home', label: 'Dashboard', icon: Home/);
  assert.doesNotMatch(sidebarSource, /id: 'home', label: 'Home'/);
});

test('left rail fills the middle space with settings actions', () => {
  const settingsHeadingIndex = sidebarSource.indexOf('>Settings<');
  const settingsActionIndex = sidebarSource.indexOf('label="Settings"');
  const helpIndex = sidebarSource.indexOf('label="Help Center"');
  const feedbackIndex = sidebarSource.indexOf('label="Feedback"');

  assert.ok(settingsHeadingIndex >= 0, 'Settings section heading should exist');
  assert.ok(settingsActionIndex > settingsHeadingIndex, 'Settings action should follow heading');
  assert.ok(helpIndex > settingsActionIndex, 'Help Center should follow Settings');
  assert.ok(feedbackIndex > helpIndex, 'Feedback should follow Help Center');
  assert.match(sidebarSource, /onOpenSettings/);
  assert.match(sidebarSource, /onOpenHelp/);
  assert.match(sidebarSource, /onOpenFeedback/);
});

test('desktop navbar keeps Home visible without top-right settings or account controls', () => {
  assert.match(navbarSource, /hideProfileControl = false/);
  assert.match(homeSource, /hideDesktopProfileControl=\{false\}/);
  assert.doesNotMatch(navbarSource, /ariaLabel="Open settings"/);
  assert.doesNotMatch(navbarSource, /Open account menu/);
  assert.doesNotMatch(navbarSource, /ChevronDown/);
  assert.doesNotMatch(navbarSource, /AccountAction/);
});

test('desktop navbar imports the Sparkles icon used by the Run AI action', () => {
  assert.match(navbarSource, /import\s*\{[\s\S]*\bSparkles\b[\s\S]*\}\s*from 'lucide-react'/);
  assert.match(navbarSource, /<Sparkles className="h-4 w-4" \/>/);
});

test('desktop topbar places Run AI beside notifications instead of the search box', () => {
  const rightActionCluster = navbarSource.match(/\{!hideProfileControl \? \([\s\S]*?<HeaderIconButton[\s\S]*?icon=\{Bell\}/)?.[0] || '';
  const searchClusterStart = navbarSource.indexOf('<div className="flex min-w-0 flex-1 max-w-[620px] items-center gap-4">');
  const searchClusterEnd = navbarSource.indexOf('{!hideProfileControl ? (');
  const searchCluster = navbarSource.slice(searchClusterStart, searchClusterEnd);

  assert.match(rightActionCluster, /aria-label="Run AI"/);
  assert.match(rightActionCluster, /<Sparkles className="h-4 w-4" \/>/);
  assert.doesNotMatch(searchCluster, /<Sparkles className="h-4 w-4" \/>/);
});

test('desktop topbar only keeps notifications as a standalone icon action', () => {
  assert.match(navbarSource, /import\s*\{[\s\S]*\bBell\b[\s\S]*\}\s*from 'lucide-react'/);
  assert.match(navbarSource, /ariaLabel="Open notifications"/);
  assert.match(navbarSource, /aria-label=\{ariaLabel\}/);
  assert.match(navbarSource, /<HeaderIconButton[\s\S]*icon=\{Bell\}[\s\S]*onClick=\{onOpenNotifications\}/);
  assert.doesNotMatch(navbarSource, /<HeaderIconButton[\s\S]*icon=\{Settings\}/);
  assert.doesNotMatch(navbarSource, /AccountAction icon=\{Settings\}/);
  assert.doesNotMatch(navbarSource, /AccountAction icon=\{HelpCircle\}/);
});

test('settings page keeps FAQ without duplicating Help Center in the settings list', () => {
  const faqIndex = settingsSource.indexOf('Frequently Asked Questions');
  const helpIndex = settingsSource.indexOf('Help Center');

  assert.ok(faqIndex >= 0, 'FAQ row should stay in settings');
  assert.equal(helpIndex, -1, 'Help Center should live in the sidebar settings section only');
  assert.doesNotMatch(settingsSource, /onOpenHelp/);
});

test('left profile sidebar removes premium upgrade cards', () => {
  assert.doesNotMatch(profileSidebarSource, /Upgrade to Premium/);
  assert.doesNotMatch(profileSidebarSource, /View Premium/);
  assert.doesNotMatch(profileSidebarSource, /Premium plan active/);
  assert.doesNotMatch(profileSidebarSource, /onOpenPremium/);
});

test('left profile sidebar follows the compact onboarding hub reference card', () => {
  const onboardingIndex = profileSidebarSource.indexOf('Onboarding hub');
  const profileButtonIndex = profileSidebarSource.indexOf('aria-label="Open profile"');

  assert.match(profileSidebarSource, /Onboarding hub/);
  assert.match(profileSidebarSource, /const profileCompletion = 34/);
  assert.match(profileSidebarSource, /\{profileCompletion\}% Completed/);
  assert.match(profileSidebarSource, /aria-label="Profile completion"/);
  assert.match(profileSidebarSource, /aria-valuenow=\{profileCompletion\}/);
  assert.match(profileSidebarSource, /style=\{\{ width: `\$\{profileCompletion\}%` \}\}/);
  assert.match(profileSidebarSource, /PROGRESS_SEGMENTS/);
  assert.match(profileSidebarSource, /bg-\[#6d28d9\]/);
  assert.match(profileSidebarSource, /<X className="h-3 w-3"/);
  assert.match(profileSidebarSource, /ChevronsUpDown/);
  assert.ok(onboardingIndex >= 0 && profileButtonIndex > onboardingIndex, 'profile row button should be separate below onboarding content');
  assert.doesNotMatch(profileSidebarSource, /accountHandle/);
  assert.doesNotMatch(profileSidebarSource, /user\?\.email/);
  assert.doesNotMatch(profileSidebarSource, /Profile hub/);
  assert.doesNotMatch(profileSidebarSource, /MapPin/);
});

test('feedback sidebar opens a real feedback page', () => {
  assert.match(lazyViewsSource, /UserFeedbackPage/);
  assert.match(lazyViewsSource, /@userPages\/feedback\/UserFeedbackPage/);
  assert.match(homeSource, /'feedback'/);
  assert.match(homeSource, /activeNav === 'feedback'/);
  assert.match(homeSource, /<UserFeedbackPage/);
  assert.match(sidebarSource, /active=\{activeNav === 'feedback'\}/);
  assert.doesNotMatch(homeSource, /mailto:support@kapit\.dev\?subject=KapIT%20Feedback/);
  assert.match(feedbackSource, /export default function UserFeedbackPage/);
  assert.match(feedbackSource, /Share feedback/);
  assert.match(feedbackSource, /<textarea/);
});

test('dashboard chatbot launcher uses a bottom-right dashboard anchor', () => {
  assert.match(chatbotSource, /chatbot-fab-anchor--dashboard/);
  assert.match(chatbotSource, /String\(pathname \|\| ''\)\.startsWith\('\/dashboard\/'\)/);
  assert.match(stylesSource, /\.chatbot-fab-anchor--dashboard/);
  assert.match(stylesSource, /right: max\(1rem, calc\(env\(safe-area-inset-right\) \+ 1rem\)\)/);
  assert.match(stylesSource, /bottom: max\(1rem, calc\(env\(safe-area-inset-bottom\) \+ 1rem\)\)/);
});
