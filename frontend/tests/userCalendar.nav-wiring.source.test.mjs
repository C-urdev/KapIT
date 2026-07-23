import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const readSource = (path) => readFileSync(resolve(path), 'utf8');

const homeSource = readSource('modules/user/pages/home/UserHomePage.jsx');
const lazyViewsSource = readSource('modules/user/pages/home/userHomeLazyViews.ts');
const navbarSource = readSource('modules/user/components/UserNavbar.jsx');
const desktopNavbarSource = readSource('modules/user/components/navigation/desktop/UserDesktopNavbar.jsx');
const sidebarSource = readSource('modules/user/components/UserLeftSidebar.jsx');
const calendarSource = readSource('modules/user/pages/calendar/UserCalendarPage.jsx');

test('desktop user navbar exposes settings, notifications, and profile actions', () => {
  assert.match(navbarSource, /<UserDesktopNavbar[\s\S]*user=\{user\}/);
  assert.match(navbarSource, /<UserDesktopNavbar[\s\S]*onOpenSettings=\{onOpenSettings\}/);
  assert.match(navbarSource, /<UserDesktopNavbar[\s\S]*onOpenNotifications=\{\(\) => setActiveNav\?\.\('notifications'\)\}/);
  assert.match(navbarSource, /<UserDesktopNavbar[\s\S]*onOpenMyProfile=\{onOpenMyProfile\}/);
  assert.match(desktopNavbarSource, /icon=\{Settings\}[\s\S]*ariaLabel="Open settings"/);
  assert.match(desktopNavbarSource, /icon=\{Bell\}[\s\S]*ariaLabel="Open notifications"/);
  assert.match(desktopNavbarSource, /aria-label="Open user profile"/);
});

test('calendar is a first-class user dashboard tab with local notes', () => {
  assert.match(homeSource, /'calendar'/);
  assert.match(homeSource, /activeNav === 'calendar'[\s\S]*<UserCalendarPage user=\{user\} \/>/);
  assert.match(lazyViewsSource, /UserCalendarPage = lazy\(\(\) => import\('@userPages\/calendar\/UserCalendarPage'\)\)/);
  assert.match(sidebarSource, /\{ id: 'calendar', label: 'Calendar', icon: CalendarDays \}/);
  assert.match(calendarSource, /kapit_user_calendar_entries/);
  assert.match(calendarSource, /Add to calendar/);
  assert.match(calendarSource, /Day notes/);
});

test('desktop sidebar utility group is More without the old settings utility button', () => {
  assert.match(sidebarSource, />More<\/p>/);
  assert.doesNotMatch(sidebarSource, /label="Settings"/);
  assert.doesNotMatch(sidebarSource, /onOpenSettings/);
});
