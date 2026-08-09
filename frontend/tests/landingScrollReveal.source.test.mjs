import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendRoot = resolve(import.meta.dirname, '..');
const readSource = (path) => readFileSync(resolve(frontendRoot, path), 'utf8');

const revealSource = readSource('modules/shared/components/effects/ScrollRevealSection.jsx');
const globalStyles = readSource('src/globals.css');
const revealStyles = globalStyles.slice(
  globalStyles.indexOf('[data-landing-reveal]'),
  globalStyles.indexOf('@keyframes chatTyping'),
);

test('landing reveal observes each motion target instead of only its section', () => {
  assert.match(revealSource, /import \{ animate \} from 'framer-motion'/);
  assert.match(revealSource, /querySelectorAll\('\[data-landing-reveal\]'\)/);
  assert.match(revealSource, /delete target\.dataset\.revealStarted/);
  assert.match(revealSource, /delete target\.dataset\.revealed/);
  assert.match(revealSource, /target\.style\.removeProperty\('opacity'\)/);
  assert.match(revealSource, /target\.style\.removeProperty\('translate'\)/);
  assert.match(revealSource, /target\.style\.removeProperty\('filter'\)/);
  assert.match(revealSource, /targets\.forEach\(\(target\) => observer\.observe\(target\)\)/);
  assert.match(revealSource, /animate\(\s*target/);
  assert.match(revealSource, /target\.dataset\.revealed = 'true'/);
  assert.doesNotMatch(revealSource, /observer\.observe\(element\)/);
});

test('landing reveal preserves component transforms while fading upward', () => {
  assert.match(globalStyles, /\[data-landing-reveal\]\[data-revealed='true'\]/);
  assert.match(globalStyles, /--landing-reveal-distance:\s*4rem/);
  assert.match(revealSource, /translate:\s*'0 0px'/);
  assert.doesNotMatch(globalStyles, /@keyframes landingPartEaseUp[\s\S]*transform:\s*translate3d/);
});

test('landing reveal keeps a visible reduced-motion entrance', () => {
  assert.match(revealSource, /prefersReducedMotion \? 0\.55 : 1\.05/);
  assert.match(globalStyles, /--landing-reveal-distance:\s*1\.5rem/);
  const reducedMotionStyles = revealStyles.slice(revealStyles.indexOf('@media (prefers-reduced-motion: reduce)'));
  const reducedRevealRule = reducedMotionStyles.match(/\[data-landing-reveal\]\s*\{([^}]*)\}/)?.[1] || '';
  assert.doesNotMatch(reducedRevealRule, /animation:\s*none !important/);
});
