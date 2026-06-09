import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveLocalSupabaseConfig } from '../../scripts/knowledge/local-supabase-config.mjs';

test('accepts explicit loopback Supabase configuration', () => {
  const config = resolveLocalSupabaseConfig({
    url: 'http://127.0.0.1:54321',
    anonKey: 'test-local-key',
    email: 'qa@example.local',
    password: 'test-password',
  });

  assert.deepEqual(config, {
    url: 'http://127.0.0.1:54321',
    anonKey: 'test-local-key',
    email: 'qa@example.local',
    password: 'test-password',
  });
});

test('rejects non-local Supabase URLs', () => {
  assert.throws(
    () =>
      resolveLocalSupabaseConfig({
        url: 'https://example.supabase.co',
        anonKey: 'test-key',
        email: 'qa@example.local',
        password: 'test-password',
      }),
    /local Supabase/,
  );
});

test('rejects missing credentials without fallback values', () => {
  assert.throws(
    () =>
      resolveLocalSupabaseConfig({
        url: 'http://localhost:54321',
        anonKey: '',
        email: '',
        password: '',
      }),
    /required/,
  );
});
