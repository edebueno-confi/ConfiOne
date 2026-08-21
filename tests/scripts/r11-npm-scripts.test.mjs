import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, sep } from 'node:path';
import test from 'node:test';
import {
  buildPgTapCommand,
  resolvePgTapPaths,
  REPOSITORY_ROOT,
} from '../../scripts/run-pgtap-file.mjs';

const packageJson = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));

test('todos os scripts npm node apontam para arquivos existentes', () => {
  const missing = [];

  for (const [name, command] of Object.entries(packageJson.scripts ?? {})) {
    for (const match of command.matchAll(/node\s+([\w\-./]+\.mjs)/g)) {
      if (!existsSync(join(REPOSITORY_ROOT, match[1]))) missing.push(`${name} -> ${match[1]}`);
    }
  }

  assert.deepEqual(missing, []);
});

test('runner pgTAP aceita somente SQL dentro de supabase/tests', () => {
  const resolved = resolvePgTapPaths(['supabase/tests/001_phase1_identity_tenancy_rls.sql']);

  assert.deepEqual(resolved, [`supabase${sep}tests${sep}001_phase1_identity_tenancy_rls.sql`]);
  assert.throws(
    () => resolvePgTapPaths(['package.json']),
    /PGTAP_FILE_BLOCKED/,
  );
  assert.throws(
    () => resolvePgTapPaths(['supabase/tests/does-not-exist.sql']),
    /PGTAP_FILE_INVALID/,
  );
});

test('runner pgTAP força execução local sem aceitar alvo remoto', () => {
  const paths = resolvePgTapPaths(['supabase/tests/001_phase1_identity_tenancy_rls.sql']);
  const command = buildPgTapCommand(paths, REPOSITORY_ROOT);

  assert.equal(command.args.at(-2), '--local');
  assert.equal(command.args.at(-1), paths[0]);
  assert.equal(command.args.includes('--linked'), false);
  assert.equal(command.args.includes('--db-url'), false);
});
