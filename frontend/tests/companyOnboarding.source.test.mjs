import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

test('company onboarding collects reusable company profile details instead of job-specific hiring intake', () => {
  const source = read('frontend/modules/shared/pages/onboarding/CompanyProfileOnboardingPage.jsx');

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
  assert.match(source, /md:grid-cols-2/);
  assert.match(source, /min-w-0 space-y-5/);
  assert.match(source, /dark:/);
  assert.match(source, /const isDark = theme === 'dark';/);
  assert.match(source, /const resolvedLocation = useMemo\(/);
  assert.match(source, /const submittedLocation = String\(form\.location \|\| resolvedLocation \|\| ''\)\.trim\(\)/);
  assert.match(source, /formatLocation\(form\.city, form\.provinceCode, locationData\.provinceLabelByCode, form\.country\)/);
  assert.match(source, /location: submittedLocation/);
  assert.match(source, /focus-within:border-\[#0f5a48\]/);
  assert.match(source, /const filledFieldClass = 'border-\[#0f5a48\] bg-\[#e8f5f0\] text-\[#0f3f34\] dark:border-\[#176c57\] dark:bg-\[#17382f\] dark:text-\[#e9fbf4\]';/);
  assert.match(source, /className=\{filledFieldShellClass\(submitAttempted && missing\.industry, Boolean\(String\(finalIndustry\)\.trim\(\)\)\)\}/);
  assert.match(source, /className=\{filledFieldShellClass\(submitAttempted && missing\.companySize, Boolean\(String\(form\.companySize\)\.trim\(\)\)\)\}/);
  assert.match(source, /showTriggerSearchIcon=\{false\}/);
  assert.match(source, /showTriggerChevron=\{false\}/);
  assert.match(source, /<div className=\{filledFieldShellClass\(false, Boolean\(String\(form\.website\)\.trim\(\)\)\)\}>/);
  assert.match(source, /<div className=\{filledFieldTextareaShellClass\(false, Boolean\(String\(form\.description\)\.trim\(\)\)\)\}>/);
  assert.doesNotMatch(source, /filledFieldShellClass\(false, true\)/);
  assert.doesNotMatch(source, /filledFieldTextareaShellClass\(false, true\)/);
  assert.match(source, /<Field label="Company logo" optional isDark=\{isDark\}>/);
  assert.match(source, /<Field label="Website" optional isDark=\{isDark\}>/);
  assert.doesNotMatch(source, /Role you're hiring for/);
  assert.doesNotMatch(source, /Which ATS do you use\?/);
  assert.doesNotMatch(source, /Anything else we should know\?/);
  assert.doesNotMatch(source, /Get 10 free profiles/);
  assert.doesNotMatch(source, /Profile context/);
  assert.doesNotMatch(source, /Your name/);
  assert.doesNotMatch(source, /Phone/);
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

test('shared searchable selects keep the filled green shell in both themes', () => {
  const source = read('frontend/modules/shared/components/forms/SearchableSelect.jsx');

  assert.match(source, /const selectedControlClass/);
  assert.match(source, /!bg-\[#e8f5f0\]/);
  assert.match(source, /dark:!bg-\[#17382f\]/);
  assert.match(source, /!border-\[#0f5a48\]/);
  assert.match(source, /dark:!border-\[#176c57\]/);
});
