import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const authServiceSource = readFileSync(
  resolve('modules/shared/services/authService.ts'),
  'utf8'
);
const loginModalSource = readFileSync(
  resolve('modules/shared/components/auth/LoginModal.jsx'),
  'utf8'
);

test('loginUser retries without accountTypeHint for older strict backend validators', () => {
  assert.match(authServiceSource, /isUnsupportedAccountTypeHintError/);
  assert.match(authServiceSource, /delete\s+legacyPayload\.accountTypeHint/);
});

test('LoginModal rejects mismatched accounts after legacy retry login succeeds', () => {
  assert.match(loginModalSource, /getUserAccountType/);
  assert.match(loginModalSource, /logoutUser/);
  assert.match(loginModalSource, /setError\(getAudienceErrorMessage\(normalizedAccountType\)\)/);
});
