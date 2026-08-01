import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendRoot = resolve(import.meta.dirname, '..');
const previewSource = readFileSync(
  resolve(frontendRoot, 'modules/shared/pages/employers/EmployerProductPreview.jsx'),
  'utf8'
);
const stylesSource = readFileSync(resolve(frontendRoot, 'src/globals.css'), 'utf8');

test('employer landing preview presents the company talent search workspace', () => {
  assert.match(previewSource, /Talent search/);
  assert.match(previewSource, /Search by role, skill, or location/);
  assert.match(previewSource, /company-workspace-list-surface/);
  assert.match(previewSource, /company-workspace-detail-surface/);
  assert.match(previewSource, /<CompanyDeveloperCard[\s\S]*selected/);
  assert.match(previewSource, /<CompanyJobCard[\s\S]*onViewDetails/);
});

test('employer landing preview inherits the dashboard workspace tokens', () => {
  assert.match(stylesSource, /\.employer-product-preview\s*\{/);
  assert.match(stylesSource, /--workspace-primary: #356447/);
  assert.match(stylesSource, /html\.dark \.employer-product-preview/);
});
