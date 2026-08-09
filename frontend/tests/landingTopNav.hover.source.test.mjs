import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendRoot = resolve(import.meta.dirname, '..');
const siteTopNavSource = readFileSync(
  resolve(frontendRoot, 'modules/shared/components/navigation/SiteTopNav.jsx'),
  'utf8'
);
const employerDesktopNavSource = readFileSync(
  resolve(frontendRoot, 'modules/desktop/components/navigation/EmployerDesktopNav.jsx'),
  'utf8'
);

test('landing top nav logo and auth actions do not move on hover', () => {
  assert.match(siteTopNavSource, /const brandLinkClass = isDarkTheme/);
  assert.match(siteTopNavSource, /const logoClass = isDarkTheme/);
  assert.match(siteTopNavSource, /const actionButtonClass = isDarkTheme/);
  assert.match(siteTopNavSource, /const employerActionLinkClass = isDarkTheme/);

  assert.doesNotMatch(siteTopNavSource, /brandLinkClass[\s\S]*hover:-translate-y-0\.5/);
  assert.doesNotMatch(siteTopNavSource, /logoClass[\s\S]*group-hover:scale-\[1\.03\]/);
  assert.doesNotMatch(siteTopNavSource, /actionButtonClass[\s\S]*hover:-translate-y-0\.5/);
  assert.doesNotMatch(siteTopNavSource, /employerActionLinkClass[\s\S]*hover:-translate-y-0\.5/);
});

test('employer desktop landing nav controls do not move upward on hover', () => {
  assert.match(employerDesktopNavSource, /const brandLinkClass = isDark/);
  assert.match(employerDesktopNavSource, /const logoClass = isDark/);
  assert.match(employerDesktopNavSource, /const navLinkClass = isDark/);
  assert.doesNotMatch(employerDesktopNavSource, /hover:-translate-y/);
  assert.doesNotMatch(employerDesktopNavSource, /logoClass[\s\S]*group-hover:scale-\[1\.03\]/);
});
