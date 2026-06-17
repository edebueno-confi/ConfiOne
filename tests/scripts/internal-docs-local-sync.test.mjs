import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildInternalDocsSyncApplyEnv,
  parseSupabaseStatusEnv,
} from '../../scripts/documentation/sync-internal-documents-local.mjs';

test('parses local Supabase status env without exposing unrelated secrets', () => {
  const parsed = parseSupabaseStatusEnv(`
API_URL="http://127.0.0.1:54321"
SERVICE_ROLE_KEY="local-service-role"
SECRET_KEY="local-secret"
S3_PROTOCOL_ACCESS_KEY_SECRET="local-s3-secret"
`);

  assert.deepEqual(parsed, {
    API_URL: 'http://127.0.0.1:54321',
    SERVICE_ROLE_KEY: 'local-service-role',
  });
});

test('builds apply environment only for loopback Supabase', () => {
  const env = buildInternalDocsSyncApplyEnv({
    API_URL: 'http://127.0.0.1:54321',
    SERVICE_ROLE_KEY: 'local-service-role',
  });

  assert.equal(env.INTERNAL_DOCS_SYNC_APPLY, '1');
  assert.equal(env.SUPABASE_URL, 'http://127.0.0.1:54321');
  assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, 'local-service-role');
});

test('rejects remote Supabase URLs for local internal docs sync', () => {
  assert.throws(
    () =>
      buildInternalDocsSyncApplyEnv({
        API_URL: 'https://project.supabase.co',
        SERVICE_ROLE_KEY: 'remote-service-role',
      }),
    /local Supabase/,
  );
});
