import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const repositoryRoot = join(import.meta.dirname, '..', '..');
const migrationsRoot = join(repositoryRoot, 'supabase', 'migrations');
const allowlist = JSON.parse(await readFile(join(repositoryRoot, '.review', 'rls-deny-all-allowlist.json'), 'utf8'));
const migrationText = (await Promise.all(
  (await readdir(migrationsRoot)).filter((name) => name.endsWith('.sql')).map((name) => readFile(join(migrationsRoot, name), 'utf8')),
)).join('\n');

const rlsTables = new Set([...migrationText.matchAll(/alter\s+table\s+(?:public\.)?([a-z0-9_]+)\s+enable\s+row\s+level\s+security/gi)].map((match) => match[1]));
const policyTables = new Set([...migrationText.matchAll(/create\s+policy\s+"?[^"\n]+"?\s+on\s+(?:public\.)?([a-z0-9_]+)/gi)].map((match) => match[1]));
const noPolicyTables = [...rlsTables].filter((table) => !policyTables.has(table)).sort();
const allowlistedTables = [...allowlist.tables].sort();

test('allowlist R-14 cobre exatamente as tabelas RLS sem policy detectadas', () => {
  assert.equal(allowlist.version, 1);
  assert.equal(allowlist.gate, 'RLS_WITHOUT_POLICY');
  assert.equal(new Set(allowlist.tables).size, allowlist.tables.length);
  assert.deepEqual(allowlistedTables, noPolicyTables);
});

test('cada declaracao R-14 possui motivo e revogacao de acesso interativo', () => {
  for (const table of allowlist.tables) {
    assert.equal(typeof allowlist.reasons[table], 'string', `${table} sem motivo`);
    assert.ok(allowlist.reasons[table].trim().length >= 20, `${table} com motivo insuficiente`);
    assert.match(
      migrationText,
      new RegExp(`revoke\\s+all\\s+on\\s+[^;]*public\\.${table}\\b[^;]*\\bpublic\\b[^;]*\\banon\\b[^;]*\\bauthenticated\\b`, 'i'),
      `${table} sem revogacao explicita de public/anon/authenticated`,
    );
  }
});
