const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const matcherModuleUrl = pathToFileURL(
  path.join(repoRoot, 'frontend', 'modules', 'shared', 'utils', 'chatbotMatcher.js')
).href;

test('normalizeChatInput lowercases, trims, and normalizes punctuation', async () => {
  const { normalizeChatInput } = await import(matcherModuleUrl);
  assert.equal(normalizeChatInput(' HELLO!!! '), 'hello');
});

test('normalizeChatInput handles casual typing and common typos', async () => {
  const { normalizeChatInput } = await import(matcherModuleUrl);
  assert.equal(normalizeChatInput('gud evening'), 'good evening');
  assert.equal(normalizeChatInput('suport hlp'), 'support help');
});

test('resolveChatbotResponse recognizes greeting variants', async () => {
  const { resolveChatbotResponse } = await import(matcherModuleUrl);
  const result = resolveChatbotResponse('hiii');
  assert.equal(result.kind, 'intent');
  assert.equal(result.intentId, 'greeting');
  assert.ok(typeof result.response === 'string' && result.response.length > 0);
});

test('resolveChatbotResponse recognizes auth-related support queries', async () => {
  const { resolveChatbotResponse } = await import(matcherModuleUrl);
  const result = resolveChatbotResponse('I forgot password');
  assert.equal(result.kind, 'intent');
  assert.equal(result.intentId, 'reset-password');
});

test('resolveChatbotResponse recognizes platform questions', async () => {
  const { resolveChatbotResponse } = await import(matcherModuleUrl);
  const result = resolveChatbotResponse('How do I upload my resume?');
  assert.equal(result.kind, 'intent');
  assert.equal(result.intentId, 'upload-resume');
});

test('resolveChatbotResponse recognizes company account capability questions', async () => {
  const { resolveChatbotResponse } = await import(matcherModuleUrl);
  const result = resolveChatbotResponse('What can company accounts do?');
  assert.equal(result.kind, 'intent');
  assert.equal(result.intentId, 'company-features');
});

test('resolveChatbotResponse detects nonsense or random inputs', async () => {
  const { resolveChatbotResponse } = await import(matcherModuleUrl);
  const symbols = resolveChatbotResponse('@@@!!!');
  const numbers = resolveChatbotResponse('123123');
  assert.equal(symbols.kind, 'nonsense');
  assert.equal(numbers.kind, 'nonsense');
});

test('resolveChatbotResponse falls back naturally for unknown questions', async () => {
  const { resolveChatbotResponse } = await import(matcherModuleUrl);
  const result = resolveChatbotResponse('Explain quantum tomato protocol now');
  assert.equal(result.kind, 'fallback');
  assert.match(result.response, /help|rephrase|accounts|jobs|pricing/i);
});

test('resolveChatbotErrorResponse uses user-friendly error copy', async () => {
  const { resolveChatbotErrorResponse } = await import(matcherModuleUrl);
  const response = resolveChatbotErrorResponse('anything');
  assert.match(response, /wrong on our side|trouble processing/i);
});
