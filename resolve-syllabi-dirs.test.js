const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { resolveSyllabiDirs } = require('./resolve-syllabi-dirs');

test('syllabiDir is always derived from the script dir (this tracking repo)', () => {
  const { syllabiDir } = resolveSyllabiDirs({ argv: [], env: {}, scriptDir: '/repo' });
  assert.strictEqual(syllabiDir, path.join('/repo', 'syllabi'));
});

test('coursesDir is derived from a --workspace= argument', () => {
  const { coursesDir } = resolveSyllabiDirs({
    argv: ['--workspace=/ws'],
    env: {},
    scriptDir: '/repo',
  });
  assert.strictEqual(coursesDir, path.join('/ws', '_COURSES Phase 1 - WORKING', 'courses'));
});

test('coursesDir falls back to the SYLLABI_WORKSPACE env var', () => {
  const { coursesDir } = resolveSyllabiDirs({
    argv: [],
    env: { SYLLABI_WORKSPACE: '/envws' },
    scriptDir: '/repo',
  });
  assert.strictEqual(coursesDir, path.join('/envws', '_COURSES Phase 1 - WORKING', 'courses'));
});

test('--workspace= takes precedence over the env var', () => {
  const { coursesDir } = resolveSyllabiDirs({
    argv: ['--workspace=/argws'],
    env: { SYLLABI_WORKSPACE: '/envws' },
    scriptDir: '/repo',
  });
  assert.strictEqual(coursesDir, path.join('/argws', '_COURSES Phase 1 - WORKING', 'courses'));
});

test('coursesDir is null when no workspace is provided (caller must error, not ENOENT a stale path)', () => {
  const { coursesDir } = resolveSyllabiDirs({ argv: [], env: {}, scriptDir: '/repo' });
  assert.strictEqual(coursesDir, null);
});

test('no hardcoded sandbox path leaks through', () => {
  const r = resolveSyllabiDirs({ argv: ['--workspace=/ws'], env: {}, scriptDir: '/repo' });
  assert.ok(!r.syllabiDir.includes('busy-relaxed-dirac'));
  assert.ok(!String(r.coursesDir).includes('busy-relaxed-dirac'));
});
