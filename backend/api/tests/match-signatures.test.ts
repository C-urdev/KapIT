const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CURRENT_MATCH_SCORING_VERSION,
  createProfileMatchSignature,
  createJobMatchSignature,
  isMatchCacheValid,
} = require('../utils/matchSignatures');

test('profile signature changes when profile changes', () => {
  const base = {
    full_name: 'Not Jay',
    preferred_role: 'Full Stack Developer',
    bio: 'Builds React and Node apps',
    location: 'Cavite',
    experience_years: 3,
    skills: ['React', 'Node.js', 'TypeScript'],
  };

  const first = createProfileMatchSignature(base);
  const updated = createProfileMatchSignature({ ...base, skills: [...base.skills, 'Next.js'] });
  assert.notEqual(first, updated);
});

test('job signature changes when job data changes', () => {
  const base = {
    title: 'Frontend Developer',
    description: 'Build responsive UIs',
    type: 'Full-time',
    location: 'Remote',
    skills: ['React', 'CSS'],
  };
  const first = createJobMatchSignature(base);
  const updated = createJobMatchSignature({ ...base, description: 'Build responsive UIs with accessibility and testing' });
  assert.notEqual(first, updated);
});

test('cache validity requires matching profile and job signatures', () => {
  const profileSignature = createProfileMatchSignature({ preferred_role: 'Full Stack', skills: ['React'] });
  const jobSignature = createJobMatchSignature({ title: 'Web Developer', skills: ['React'] });
  const metadata = { profileSignature, jobSignature, scoringVersion: CURRENT_MATCH_SCORING_VERSION };

  assert.equal(isMatchCacheValid({ metadata, profileSignature, jobSignature }), true);
  assert.equal(isMatchCacheValid({ metadata, profileSignature: 'different', jobSignature }), false);
  assert.equal(isMatchCacheValid({ metadata, profileSignature, jobSignature: 'different' }), false);
  assert.equal(isMatchCacheValid({ metadata: { profileSignature, jobSignature, scoringVersion: 'v2' }, profileSignature, jobSignature }), false);
});
