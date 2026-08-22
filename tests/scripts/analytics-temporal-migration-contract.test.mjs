import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const migration = fs.readFileSync(
  new URL('../../supabase/migrations/20260821100000_analytics_temporal_semantics_timezone_v1.sql', import.meta.url),
  'utf8',
);

test('migration temporal não usa contagem sobreposta de timestamp e timestamptz', () => {
  assert.match(migration, /v_definition := replace\(v_definition, v_old, v_new\);/);
  assert.match(migration, /position\(v_old in v_definition\) > 0/);
  assert.doesNotMatch(migration, /v_new_count_after - v_new_count_before/);
});
