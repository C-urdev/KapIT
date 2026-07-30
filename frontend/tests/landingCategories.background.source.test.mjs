import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendRoot = resolve(import.meta.dirname, '..');
const categoriesSource = readFileSync(
  resolve(frontendRoot, 'modules/desktop/pages/landing/categories/LandingCategoriesSection.jsx'),
  'utf8'
);
const faqSectionSource = readFileSync(
  resolve(frontendRoot, 'modules/shared/pages/landing/LandingFaqSection.jsx'),
  'utf8'
);
const lampSource = readFileSync(
  resolve(frontendRoot, 'modules/shared/components/effects/Lamp.jsx'),
  'utf8'
);

test('desktop role-finding section matches the user FAQ section background color', () => {
  assert.match(faqSectionSource, /bg-\[#fbfdf9\]/);
  assert.match(faqSectionSource, /dark:bg-\[#15191b\]/);
  assert.match(categoriesSource, /bg-\[#fbfdf9\]/);
  assert.match(categoriesSource, /dark:bg-\[#15191b\]/);
  assert.doesNotMatch(categoriesSource, /bg-\[linear-gradient\(180deg,#fffdfa_0%,#fcfaf5_56%,#f8f3ea_100%\)\]/);
  assert.doesNotMatch(categoriesSource, /dark:bg-\[#101714\]/);
});

test('desktop final CTA section matches the user FAQ section background color', () => {
  assert.match(faqSectionSource, /bg-\[#fbfdf9\]/);
  assert.match(faqSectionSource, /dark:bg-\[#15191b\]/);
  assert.match(lampSource, /bg-\[#fbfdf9\]/);
  assert.match(lampSource, /dark:bg-\[#15191b\]/);
  assert.match(lampSource, /\[--lamp-mask:#fbfdf9\]/);
  assert.match(lampSource, /dark:\[--lamp-mask:#15191b\]/);
  assert.match(lampSource, /\[--lamp-side-mask:#f0ebe0\]/);
  assert.match(lampSource, /dark:\[--lamp-side-mask:#1d2226\]/);
  assert.match(lampSource, /\[--lamp-beam:#588157\]/);
  assert.match(lampSource, /\[--lamp-glow:#6f9b74\]/);
  assert.match(lampSource, /whileInView=\{\{ opacity: 1, width: '30rem' \}\}/);
  assert.match(lampSource, /whileInView=\{\{ width: '22rem', opacity: 1 \}\}/);
  assert.match(lampSource, /className="absolute inset-auto z-50 h-40 w-72 -translate-y-\[7rem\]/);
  assert.match(lampSource, /className="absolute inset-auto z-20 h-44 w-full -translate-y-\[12\.5rem\] bg-\[var\(--lamp-mask\)\]"/);
  assert.match(lampSource, /h-full w-40 bg-\[var\(--lamp-side-mask\)\]/);
  assert.match(lampSource, /\[mask-image:linear-gradient\(to_right,white,transparent\)\]/);
  assert.match(lampSource, /\[mask-image:linear-gradient\(to_left,white,transparent\)\]/);
  assert.doesNotMatch(lampSource, /from-\[#f8f4ec\]/);
  assert.doesNotMatch(lampSource, /translate-y-12 scale-x-150 bg-\[var\(--lamp-mask\)\] blur-2xl/);
  assert.doesNotMatch(lampSource, /\[--lamp-mask:#f0ebe0\]/);
  assert.doesNotMatch(lampSource, /dark:\[--lamp-mask:#1d2226\]/);
});
