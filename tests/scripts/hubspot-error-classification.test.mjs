import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const runner = await readFile(new URL('../../supabase/functions/_shared/hubspot-cs-runner.ts', import.meta.url), 'utf8');
const worker = await readFile(new URL('../../supabase/functions/hubspot-orchestrator-worker/index.ts', import.meta.url), 'utf8');
const migration = await readFile(new URL('../../supabase/migrations/20260802190000_hubspot_error_sanitization_v1.sql', import.meta.url), 'utf8');

test('HubSpot classifica autenticação sem expor erro bruto ao frontend', () => {
  assert.match(runner, /code: 'authentication_error'/);
  assert.match(runner, /authentication credentials\|authentication required\|unauthorized\|forbidden/);
  assert.match(runner, /A autenticação do HubSpot foi recusada/);
  assert.match(runner, /jsonResponse\(\{ error: classified\.sanitizedMessage, code: classified\.code \}/);
  assert.doesNotMatch(runner, /jsonResponse\(\{ error: sanitized \}/);
});

test('worker persiste classificação interna e mensagem sanitizada no run', () => {
  assert.match(worker, /internal_error_code: f\.code/);
  assert.match(worker, /provider_code: f\.providerCode/);
  assert.match(worker, /internal_message: f\.internalMessage/);
  assert.match(worker, /sanitized_error: f\.sanitizedMessage/);
  assert.match(worker, /p_error_message:f\.sanitizedMessage/);
  assert.doesNotMatch(worker, /p_error_message:f\.message/);
});

test('read model HubSpot não projeta mensagem interna bruta', () => {
  assert.match(migration, /run\.sanitized_error/);
  assert.match(migration, /A atualização do HubSpot não foi concluída/);
  assert.doesNotMatch(migration, /run\.error_message/);
});
