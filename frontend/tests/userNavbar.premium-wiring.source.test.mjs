import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const readSource = (path) => readFileSync(resolve(path), 'utf8');

const homeSource = readSource('modules/user/pages/home/UserHomePage.jsx');
const navbarSource = readSource('modules/user/components/UserNavbar.jsx');
const desktopNavbarSource = readSource('modules/user/components/navigation/desktop/UserDesktopNavbar.jsx');

test('premium button handler is forwarded from the home shell into the desktop navbar', () => {
  assert.match(homeSource, /<UserNavbar[\s\S]*onOpenPremium=\{\(\) => setPremiumPopupOpen\(true\)\}/);
  assert.match(navbarSource, /onOpenPremium,/);
  assert.match(navbarSource, /<UserDesktopNavbar[\s\S]*onOpenPremium=\{onOpenPremium\}/);
  assert.match(desktopNavbarSource, /onOpenPremium,/);
  assert.match(desktopNavbarSource, /onClick=\{onOpenPremium\}/);
});
