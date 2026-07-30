import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendRoot = resolve(import.meta.dirname, '..');
const readSource = (path) => readFileSync(resolve(frontendRoot, path), 'utf8');
const readOptionalSource = (path) => {
  const absolutePath = resolve(frontendRoot, path);
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
};

const accordionSource = readOptionalSource('modules/shared/pages/landing/LandingFaqList.jsx');
const landingFaqSectionSource = readSource('modules/shared/pages/landing/LandingFaqSection.jsx');
const landingDataSource = readSource('modules/shared/pages/landing/landingData.ts');
const desktopLandingSource = readSource('modules/desktop/pages/landing/LandingPage.jsx');
const mobileLandingSource = readSource('modules/mobile/pages/landing/LandingPage.jsx');
const desktopEmployerSource = readSource('modules/desktop/pages/employers/EmployerLandingPage.jsx');
const mobileEmployerSource = readSource('modules/mobile/pages/employers/EmployerLandingPage.jsx');

test('shared landing FAQ exposes an accessible one-at-a-time accordion', () => {
  assert.match(accordionSource, /useState\(null\)/);
  assert.match(accordionSource, /type="button"/);
  assert.match(accordionSource, /aria-expanded=\{isOpen\}/);
  assert.match(accordionSource, /aria-controls=\{panelId\}/);
  assert.match(accordionSource, /aria-labelledby=\{buttonId\}/);
  assert.match(accordionSource, /ChevronDown/);
  assert.match(accordionSource, /min-h-\[44px\]/);
});

test('shared landing FAQ uses an unboxed chevron affordance', () => {
  assert.match(accordionSource, /ChevronDown/);
  assert.doesNotMatch(accordionSource, /h-10 w-10/);
  assert.doesNotMatch(accordionSource, /rounded-xl border border-\[#cbd9c7\] bg-\[#f5f8f2\]/);
  assert.doesNotMatch(accordionSource, /dark:bg-white\/5/);
});

test('landing FAQ headings use action-oriented copy without the eyebrow label', () => {
  assert.match(landingFaqSectionSource, /Before you start applying/);
  assert.match(
    landingFaqSectionSource,
    /Answers that help you shape your profile, follow matches, and track each application\./
  );
  assert.doesNotMatch(landingFaqSectionSource, /Need a quick answer\?/);
  assert.doesNotMatch(landingFaqSectionSource, /Common questions/);
  assert.doesNotMatch(desktopEmployerSource, /Employer questions/);
  assert.doesNotMatch(mobileEmployerSource, /Employer questions/);
  assert.match(desktopEmployerSource, /Before your team starts hiring/);
  assert.match(mobileEmployerSource, /Before your team starts hiring/);
});

test('user landing FAQ renders as a separate neutral section band without outer divider lines', () => {
  assert.match(landingFaqSectionSource, /bg-\[#fbfdf9\]/);
  assert.match(landingFaqSectionSource, /dark:bg-\[#15191b\]/);
  assert.doesNotMatch(landingFaqSectionSource, /border-y/);
  assert.doesNotMatch(landingFaqSectionSource, /border-\[#e3ddd2\]/);
  assert.doesNotMatch(landingFaqSectionSource, /dark:border-white\/10/);
  assert.doesNotMatch(landingFaqSectionSource, /bg-\[#f6eee2\]/);
  assert.doesNotMatch(landingFaqSectionSource, /rounded-\[2rem\] border border-\[#e5ded2\] bg-white\/70/);
});

test('job seeker questions appear after How KapIT works on desktop and mobile', () => {
  assert.match(landingDataSource, /export const USER_LANDING_FAQ/);
  assert.match(landingDataSource, /How does KapIT match me with roles\?/);
  assert.ok(
    desktopLandingSource.indexOf('<LandingHowItWorksSection />') < desktopLandingSource.indexOf('<LandingFaqSection />')
  );
  assert.ok(
    mobileLandingSource.indexOf('<LandingFaqSection compact />') < mobileLandingSource.indexOf('className="relative mb-8 mt-20 w-full"')
  );
});

test('desktop and mobile employer questions use the shared accordion control', () => {
  assert.match(desktopEmployerSource, /<LandingFaqList items=\{EMPLOYER_FAQ\}/);
  assert.match(mobileEmployerSource, /<LandingFaqList items=\{EMPLOYER_FAQ\}/);
  assert.doesNotMatch(desktopEmployerSource, /<details/);
  assert.doesNotMatch(mobileEmployerSource, /<details/);
});
