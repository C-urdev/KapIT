import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const readSource = (path) => readFileSync(resolve(path), 'utf8');

const stylesSource = readSource('src/globals.css');
const homeSource = readSource('modules/user/pages/home/UserHomePage.jsx');
const sidebarSource = readSource('modules/user/components/UserLeftSidebar.jsx');
const navbarSource = readSource('modules/user/components/UserNavbar.jsx');

test('desktop user sidebar uses the same app-bar background token as the top navbar', () => {
  assert.match(stylesSource, /--user-appbar: rgba\(34, 39, 43, 0\.7\)/);
  assert.match(navbarSource, /bg-\[var\(--user-appbar\)\]/);
  assert.match(homeSource, /<aside[\s\S]*bg-\[var\(--user-appbar\)\]/);
  assert.match(sidebarSource, /className="flex h-full flex-col bg-transparent"/);
  assert.doesNotMatch(homeSource, /<aside[\s\S]*bg-\[var\(--user-canvas\)\]/);
  assert.doesNotMatch(sidebarSource, /className="flex h-full flex-col bg-\[var\(--user-appbar\)\]"/);
  assert.doesNotMatch(sidebarSource, /className="flex h-full flex-col bg-\[var\(--user-canvas\)\]"/);
});
