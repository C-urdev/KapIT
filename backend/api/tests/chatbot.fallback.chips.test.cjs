const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveLocalChatbotFallback } = require('../services/chatbotFallbackService');

test('fallback matcher resolves chip prompt: apply for job', () => {
  const result = resolveLocalChatbotFallback({ message: 'How do I apply for a job?' });
  assert.equal(result.intent, 'apply-job');
  assert.match(result.reply, /open jobs|apply/i);
});

test('fallback matcher resolves chip prompt: create account', () => {
  const result = resolveLocalChatbotFallback({ message: 'How do I create an account?' });
  assert.equal(result.intent, 'create-account');
  assert.match(result.reply, /create an account|register|sign up/i);
});

test('fallback matcher resolves chip prompt: reset password', () => {
  const result = resolveLocalChatbotFallback({ message: 'How do I reset my password?' });
  assert.equal(result.intent, 'reset-password');
  assert.match(result.reply, /forgot password|reset/i);
});

test('fallback matcher resolves chip prompt: company accounts', () => {
  const result = resolveLocalChatbotFallback({ message: 'What can company accounts do?' });
  assert.equal(result.intent, 'company-features');
  assert.match(result.reply, /company accounts|post jobs|applicants|message candidates/i);
});

