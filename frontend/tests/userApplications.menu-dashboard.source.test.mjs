import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const readSource = (path) => readFileSync(resolve(path), 'utf8');

const sidebarSource = readSource('modules/user/components/UserLeftSidebar.jsx');
const centerFeedSource = readSource('modules/user/pages/home/UserCenterFeed.jsx');
const homeSource = readSource('modules/user/pages/home/UserHomePage.jsx');

test('applications is a main menu page and dashboard summary cards are removed', () => {
  const navItemsBlock = sidebarSource.match(/const navItems = \[[\s\S]*?\];/)?.[0] || '';

  assert.match(navItemsBlock, /id: 'applications', label: 'Applications'/);
  assert.match(homeSource, /activeNav === 'applications'/);
  assert.match(homeSource, /<UserApplicationsPanel/);

  assert.doesNotMatch(centerFeedSource, /aria-label="Career activity"/);
  assert.doesNotMatch(centerFeedSource, /CareerSummary/);
  assert.doesNotMatch(centerFeedSource, /Track submitted roles/);
  assert.doesNotMatch(centerFeedSource, /Review opportunities/);
  assert.doesNotMatch(centerFeedSource, /Build your portfolio/);
});
