import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const readSource = (path) => readFileSync(resolve(path), 'utf8');

const helpSource = readSource('modules/shared/pages/help/HelpPage.jsx');
const feedbackSource = readSource('modules/user/pages/feedback/UserFeedbackPage.jsx');

test('help and feedback pages use matching undivided desktop card headers', () => {
  assert.match(helpSource, /mx-auto w-full max-w-\[min\(100%,1040px\)\] py-3 xl:py-6/);
  assert.match(helpSource, /<button[\s\S]*<ArrowLeft className="h-4 w-4" \/>[\s\S]*Back/);
  assert.match(helpSource, /<section className="user-desktop-flat-surface overflow-hidden rounded-\[24px\]/);
  assert.match(helpSource, /<h1 className="mt-2 text-2xl font-semibold tracking-tight text-\[var\(--user-text-strong\)\] sm:text-3xl">Help<\/h1>/);
  assert.doesNotMatch(helpSource, /user-help-page/);

  assert.doesNotMatch(helpSource, /border-b border-\[var\(--user-border\)\]/);
  assert.doesNotMatch(feedbackSource, /border-b border-\[var\(--user-border\)\]/);
});
