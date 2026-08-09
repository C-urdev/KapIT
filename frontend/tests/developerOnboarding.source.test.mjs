import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

test('developer onboarding source is question-first and removes phone, location, and links from the final onboarding details form', () => {
  const source = read('frontend/modules/shared/pages/onboarding/DeveloperProfileOnboardingPage.jsx');

  assert.match(source, /Expected salary range/i);
  assert.match(source, /up to 3 preferred roles/i);
  assert.doesNotMatch(source, /Phone Number/);
  assert.doesNotMatch(source, /Province/);
  assert.doesNotMatch(source, /City \/ Municipality/);
  assert.doesNotMatch(source, /Portfolio Website/);
  assert.doesNotMatch(source, /LinkedIn/);
  assert.doesNotMatch(source, /Other Links/);
});

test('developer settings source still owns phone, location, and links after onboarding is simplified', () => {
  const source = read('frontend/modules/user/features/profile/UserAccountSettingsModal.jsx');

  assert.match(source, /Phone Number/);
  assert.match(source, /Province/);
  assert.match(source, /City \/ Municipality/);
  assert.match(source, /Portfolio Website/);
  assert.match(source, /LinkedIn/);
  assert.match(source, /Other Links/);
  assert.match(source, /up to 3 preferred roles/i);
});

test('user and public profile sources render preferred roles instead of only a single desired job label', () => {
  const myProfileSource = read('frontend/modules/user/features/profile/UserMyProfilePage.jsx');
  const publicProfileSource = read('frontend/modules/shared/pages/public-profile/PublicProfilePage.jsx');

  assert.match(myProfileSource, /preferredRoles/);
  assert.match(publicProfileSource, /preferredRoles/);
});

test('developer onboarding uses the approved professional card treatment', () => {
  const source = read('frontend/modules/shared/pages/onboarding/DeveloperProfileOnboardingPage.jsx');

  assert.match(source, /value: 'yes', label: 'Yes', icon:/);
  assert.match(source, /value: 'open', label: 'No', icon:/);
  assert.match(source, /min-h-\[430px\]/);
  assert.match(source, /SelectionCount/);
  assert.match(source, /tabular-nums/);
  assert.match(source, /yearsLabel/);
  assert.doesNotMatch(source, /getQuestionDescription/);
  assert.doesNotMatch(source, /description:/);
  assert.doesNotMatch(source, /helper:/);
  assert.doesNotMatch(source, /transition-all/);
  assert.doesNotMatch(source, /bg-gradient-to-r/);
  assert.doesNotMatch(source, />Final review</i);
  assert.doesNotMatch(source, /Matching jobs between/);
});
