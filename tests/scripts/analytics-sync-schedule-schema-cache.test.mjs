import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const files = [
  'apps/web/src/features/analytics/analytics-api.ts',
  'supabase/functions/analytics-integration-run/index.ts',
];

for (const relativePath of files) {
  const source = await readFile(resolve(root, relativePath), 'utf8');
  assert.equal(
    source.includes(".from('analytics_integration_schedule')") || source.includes("vw_analytics_integration_schedule_read"),
    true,
    `${relativePath} deve acessar a agenda de integrações`,
  );
  assert.equal(
    source.includes(".eq('id', true)"),
    false,
    `${relativePath} não pode enviar o literal booleano para o filtro id`,
  );
}

const hubspotSync = await readFile(
  resolve(root, 'supabase/functions/hubspot-sync/index.ts'),
  'utf8',
);
assert.match(
  hubspotSync,
  /rpc\('rpc_analytics_hubspot_start_run'/,
  'hubspot-sync deve delegar o início ao orquestrador assíncrono vigente',
);
assert.doesNotMatch(
  hubspotSync,
  /from\(['"]analytics_integration_schedule|vw_analytics_integration_schedule_read/,
  'hubspot-sync não deve duplicar a decisão de agenda do orquestrador',
);

const migration = await readFile(
  resolve(root, 'supabase/migrations/20260720200000_analytics_integration_schedule_v1.sql'),
  'utf8',
);
assert.match(migration, /id boolean primary key/);
assert.match(migration, /check \(id\)/);

console.log('analytics-sync-schedule-schema-cache: ok');
