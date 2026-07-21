import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const readSource = (path) => readFileSync(resolve(path), 'utf8');

const homeSource = readSource('modules/user/pages/home/UserHomePage.jsx');
const sidebarSource = readSource('modules/user/components/UserLeftSidebar.jsx');
const profileSidebarSource = readSource('modules/user/components/UserHomeProfileSidebar.jsx');

test('desktop profile sidebar opens a centered red logout confirmation from the chevron action', () => {
  const homeSidebarCall = homeSource.match(/<UserLeftSidebar[\s\S]*?\/>/)?.[0] || '';
  const profileSidebarCall = sidebarSource.match(/<UserHomeProfileSidebar[\s\S]*?\/>/)?.[0] || '';

  assert.match(homeSidebarCall, /onLogout=\{onLogout\}/);

  assert.match(sidebarSource, /onLogout,/);
  assert.match(profileSidebarCall, /onLogout=\{onLogout\}/);

  assert.doesNotMatch(profileSidebarSource, /LogOut/);
  assert.match(profileSidebarSource, /logoutDialogOpen/);
  assert.match(profileSidebarSource, /aria-label="Open profile actions"/);
  assert.match(profileSidebarSource, /role="dialog"/);
  assert.match(profileSidebarSource, /aria-modal="true"/);
  assert.match(profileSidebarSource, /fixed inset-0/);
  assert.match(profileSidebarSource, /items-center justify-center/);
  assert.match(profileSidebarSource, /Are you sure you want to log out\?/);
  assert.doesNotMatch(profileSidebarSource, /You will need to sign in again to continue using KapIT\./);
  assert.match(profileSidebarSource, />\s*Cancel\s*</);
  assert.match(profileSidebarSource, />\s*Log out\s*</);
  assert.match(profileSidebarSource, /bg-\[#dc2626\]/);
  assert.match(profileSidebarSource, /onLogout\?\.\(\)/);
  assert.doesNotMatch(profileSidebarSource, /bottom-full/);
  assert.doesNotMatch(profileSidebarSource, /Account actions/);
  assert.doesNotMatch(profileSidebarSource, /Tap the red button/);
});
