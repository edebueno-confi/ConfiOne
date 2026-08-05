import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadQaEnv, readLocalSupabaseStatus } from '../../scripts/local-qa/assert-local-supabase.mjs';
import { readQaPassword } from '../../scripts/local-qa/credentials.mjs';

const qa = loadQaEnv();
const status = readLocalSupabaseStatus({ ...process.env, ...qa });
const url = status.API_URL;
const anonKey = status.ANON_KEY;

async function rest(path, token = anonKey) {
  const response = await fetch(`${url}${path}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await response.text();
  return { status: response.status, body };
}

async function login() {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: qa.LOCAL_QA_ADMIN_EMAIL ?? 'ede.oliveira@confi.com.vc', password: readQaPassword('LOCAL_QA_ADMIN_PASSWORD') }),
  });
  assert.equal(response.status, 200, `login local falhou: ${response.status}`);
  return (await response.json()).access_token;
}

test('read models de Access permanecem estaveis em consultas repetidas', async () => {
  assert.ok(anonKey, 'VITE_SUPABASE_ANON_KEY ausente para o teste local');

  const accessToken = await login();
  for (let index = 0; index < 100; index += 1) {
    const [capabilities, overrides, profiles, capabilityCatalog, capabilityView, overrideView, profileView, catalogView] = await Promise.all([
      rest('/rest/v1/rpc/rpc_admin_list_internal_access_profile_capabilities_v2', accessToken),
      rest('/rest/v1/rpc/rpc_admin_list_internal_access_overrides_v2', accessToken),
      rest('/rest/v1/rpc/rpc_admin_list_internal_access_profiles_v2', accessToken),
      rest('/rest/v1/rpc/rpc_admin_list_internal_access_capabilities_v2', accessToken),
      rest('/rest/v1/vw_admin_access_profile_capabilities?select=access_profile_id,capability_key&limit=1', accessToken),
      rest('/rest/v1/vw_admin_access_overrides?select=override_id,user_id,capability_key&limit=1', accessToken),
      rest('/rest/v1/vw_admin_access_profiles?select=access_profile_id,name&limit=1', accessToken),
      rest('/rest/v1/vw_admin_access_capabilities?select=capability_key,display_name&limit=1', accessToken),
    ]);
    for (const result of [capabilities, overrides, profiles, capabilityCatalog, capabilityView, overrideView, profileView, catalogView]) {
      assert.ok(result.status < 500, `PostgREST retornou ${result.status}: ${result.body.slice(0, 240)}`);
      assert.doesNotMatch(result.body, /PGRST00[01]|database system is in recovery|segmentation fault/i);
    }
  }
});
