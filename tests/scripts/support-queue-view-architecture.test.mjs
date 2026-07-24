import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../../supabase/migrations/20260723183054_support_ticket_queue_single_pass_hardening.sql', import.meta.url),
  'utf8',
);

test('mantem o enriquecimento da fila em uma passagem relacional', () => {
  assert.doesNotMatch(migration, /\bsla_context\s+as\s*\(/i);
  assert.doesNotMatch(migration, /\bchannel_context\s+as\s*\(/i);
  assert.match(migration, /left join public\.ticket_sla_policies/i);
  assert.match(migration, /join public\.communication_channel_definitions/i);
});
