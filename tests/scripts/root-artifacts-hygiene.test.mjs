import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  scanRootArtifacts,
  DEFAULT_ALLOWED_ROOT_FILES,
  DEFAULT_ALLOWED_ROOT_DIRECTORIES,
} from '../../scripts/ci/check-root-artifacts.mjs';

async function makeFixture() {
  return mkdtemp(join(tmpdir(), 'gso-root-hygiene-'));
}

test('aceita entradas canônicas e temporárias explicitamente permitidas', async () => {
  const rootDir = await makeFixture();
  await writeFile(join(rootDir, 'README.md'), '# GSO');
  await mkdir(join(rootDir, '.tmp'));
  await mkdir(join(rootDir, 'docs'));

  const result = await scanRootArtifacts(rootDir);

  assert.deepEqual(result.violations, []);
  assert.ok(DEFAULT_ALLOWED_ROOT_FILES.has('README.md'));
  assert.ok(DEFAULT_ALLOWED_ROOT_DIRECTORIES.has('.tmp'));
});

test('reporta screenshot, log e arquivo não classificado sem alterar a raiz', async () => {
  const rootDir = await makeFixture();
  await writeFile(join(rootDir, 'evidence.png'), 'png');
  await writeFile(join(rootDir, 'sync.log'), 'log');
  await writeFile(join(rootDir, 'seed-functional-log.txt'), 'log');

  const result = await scanRootArtifacts(rootDir);

  assert.deepEqual(
    result.violations.map(({ name, kind }) => ({ name, kind })),
    [
      { name: 'evidence.png', kind: 'file' },
      { name: 'seed-functional-log.txt', kind: 'file' },
      { name: 'sync.log', kind: 'file' },
    ],
  );
  assert.deepEqual(result.entriesAfter, ['evidence.png', 'seed-functional-log.txt', 'sync.log']);
});

test('permite uma exceção explícita sem silenciar outros desvios', async () => {
  const rootDir = await makeFixture();
  await writeFile(join(rootDir, 'approved-evidence.png'), 'png');
  await writeFile(join(rootDir, 'unclassified.md'), 'draft');

  const result = await scanRootArtifacts(rootDir, {
    allowedFiles: ['approved-evidence.png'],
  });

  assert.deepEqual(result.violations.map(({ name }) => name), ['unclassified.md']);
});

