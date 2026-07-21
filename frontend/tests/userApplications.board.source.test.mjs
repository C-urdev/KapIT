import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('modules/user/pages/home/UserApplicationsPanel.jsx'), 'utf8');

test('applications page renders a three-column board instead of tabs', () => {
  assert.match(source, /APPLICATION_BOARD_COLUMNS/);
  assert.match(source, /title: 'Applied'/);
  assert.match(source, /title: 'Interview'/);
  assert.match(source, /title: 'Result'/);
  assert.match(source, /aria-label="Application board"/);
  assert.match(source, /function ApplicationColumn/);
  assert.match(source, /function ApplicationCard/);

  assert.doesNotMatch(source, /activeTab/);
  assert.doesNotMatch(source, /const tabs = \[/);
});
