import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const api = await readFile(resolve(root, 'apps/web/src/features/analytics/analytics-api.ts'), 'utf8');
const migration = await readFile(resolve(root, 'supabase/migrations/20260725120000_analytics_runtime_contract_hardening_v1.sql'), 'utf8');

assert.equal(api.includes(".from('analytics_spreadsheet_import_runs')"), false);
assert.equal(api.match(/\.from\('vw_analytics_spreadsheet_import_runs_read'\)/g)?.length, 2);
assert.match(migration, /vw_analytics_spreadsheet_import_runs_read/);
assert.match(migration, /grant select on public\.vw_analytics_spreadsheet_import_runs_read to authenticated/);
assert.match(migration, /payload ->> 'id'\) ~\* '\^\[0-9a-f\]\{8\}/);

console.log('analytics-runtime-contract: ok');
