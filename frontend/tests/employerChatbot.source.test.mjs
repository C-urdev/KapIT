import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendRoot = resolve(import.meta.dirname, '..');
const readSource = (relativePath) => readFileSync(resolve(frontendRoot, relativePath), 'utf8');

test('employer landing enables employer chatbot audience', () => {
  const appProvidersSource = readSource('components/AppProviders.jsx');
  const chatbotSource = readSource('modules/shared/components/support/FaqChatbot.jsx');
  const faqSource = readSource('modules/shared/data/employerChatbotFaq.ts');

  assert.match(appProvidersSource, /pathname === '\/for-employers'/);
  assert.match(appProvidersSource, /<FaqChatbot audience=\{isEmployerLandingPage \? 'employer' : 'general'\}/);
  assert.match(chatbotSource, /EMPLOYER_CHATBOT_WELCOME_MESSAGE/);
  assert.match(chatbotSource, /requestChatbotMessage\(trimmed, \{ lastIntent: lastActionableBotIntent, audience \}\)/);
  assert.match(chatbotSource, /Ask about hiring/);
  assert.match(faqSource, /How do I review applicants\?/);
  assert.match(faqSource, /How do I create a company account\?/);
  assert.match(faqSource, /does ai choose/);
  assert.match(faqSource, /search before posting/);
});
