import test from 'node:test';
import assert from 'node:assert/strict';
import { assertLocalSupabaseEnvironment } from '../../scripts/local-qa/assert-local-supabase.mjs';

const localStatus = { API_URL: 'http://127.0.0.1:54321', DB_URL: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' };

test('permite localhost e 127.0.0.1 somente com confirmação explícita', () => {
  assert.doesNotThrow(() => assertLocalSupabaseEnvironment({ ALLOW_LOCAL_QA_RESET: 'true', SUPABASE_URL: 'http://localhost:54321' }, { status: { ...localStatus, API_URL: 'http://localhost:54321' } }));
  assert.doesNotThrow(() => assertLocalSupabaseEnvironment({ ALLOW_LOCAL_QA_RESET: 'true', SUPABASE_URL: 'http://127.0.0.1:54321' }, { status: localStatus }));
  assert.throws(() => assertLocalSupabaseEnvironment({ ALLOW_LOCAL_QA_RESET: 'false', SUPABASE_URL: 'http://127.0.0.1:54321' }, { status: localStatus }), /LOCAL_QA_BLOCKED/);
});

test('bloqueia URL e project ref remotos', () => {
  assert.throws(() => assertLocalSupabaseEnvironment({ ALLOW_LOCAL_QA_RESET: 'true', SUPABASE_URL: 'https://example.supabase.co' }, { status: localStatus }), /localhost/);
  assert.throws(() => assertLocalSupabaseEnvironment({ ALLOW_LOCAL_QA_RESET: 'true', SUPABASE_PROJECT_REF: 'remote-ref' }, { status: localStatus }), /project ref remoto/);
  assert.throws(() => assertLocalSupabaseEnvironment({ ALLOW_LOCAL_QA_RESET: 'true' }, { status: { API_URL: 'https://example.supabase.co', DB_URL: 'postgresql://remote' } }), /Supabase CLI/);
});
