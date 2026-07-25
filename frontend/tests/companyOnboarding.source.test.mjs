import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

test('company onboarding collects reusable company profile details instead of job-specific hiring intake', () => {
  const source = read('frontend/modules/shared/pages/onboarding/CompanyProfileOnboardingPage.jsx');

  assert.match(source, /Your name/);
  assert.match(source, /Work email/);
  assert.match(source, /Company logo/);
  assert.match(source, /Company type/);
  assert.match(source, /Company size/);
  assert.match(source, /Website/);
  assert.match(source, /Country/);
  assert.match(source, /About the company/);
  assert.match(source, /Save company profile/);
  assert.match(source, /Complete your company profile/);
  assert.match(source, /max-w-5xl/);
  assert.match(source, /dark:/);
  assert.match(source, /const isDark = theme === 'dark';/);
  assert.match(source, /backgroundColor: isDark \? '#20262a' : '#ffffff'/);
  assert.match(source, /backgroundColor: isDark \? '#176c57' : '#0f5a48'/);
  assert.doesNotMatch(source, /Role you're hiring for/);
  assert.doesNotMatch(source, /Which ATS do you use\?/);
  assert.doesNotMatch(source, /Anything else we should know\?/);
  assert.doesNotMatch(source, /Get 10 free profiles/);
  assert.doesNotMatch(source, /onboardingMode:\s*'hiring-intake'/);
  assert.doesNotMatch(source, /max-w-2xl/);
  assert.doesNotMatch(source, /max-w-\[790px\]/);
});

test('company post job owns the role-specific hiring workflow fields', () => {
  const source = read('frontend/modules/company/pages/CompanyPostJobPage.jsx');

  assert.match(source, /Hiring workflow/);
  assert.match(source, /ATS used \(optional\)/);
  assert.match(source, /Hiring timeline \(optional\)/);
  assert.match(source, /Must-haves \(optional\)/);
  assert.match(source, /Dealbreakers \(optional\)/);
  assert.match(source, /ats:\s*String\(form\.ats/);
  assert.match(source, /hiringTimeline:\s*String\(form\.hiringTimeline/);
  assert.match(source, /mustHaves:\s*String\(form\.mustHaves/);
  assert.match(source, /dealbreakers:\s*String\(form\.dealbreakers/);
});
