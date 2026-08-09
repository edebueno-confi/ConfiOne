import { loadQaEnv, readLocalSupabaseStatus, assertLocalSupabaseEnvironment } from './assert-local-supabase.mjs';

const qa = loadQaEnv();
const status = readLocalSupabaseStatus({ ...process.env, ...qa });
assertLocalSupabaseEnvironment({ ...process.env, ...qa }, { status });

const login = await fetch(`${status.API_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: status.ANON_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: qa.LOCAL_QA_ADMIN_EMAIL, password: qa.LOCAL_QA_ADMIN_PASSWORD }),
});
if (!login.ok) throw new Error(`LOCAL_QA_HUBSPOT_START_LOGIN_FAILED: ${login.status}`);
const session = await login.json();
const response = await fetch(`${status.API_URL}/functions/v1/hubspot-orchestrator-start`, {
  method: 'POST',
  headers: { apikey: status.ANON_KEY, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
  body: '{}',
});
if (response.status !== 202) throw new Error(`LOCAL_QA_HUBSPOT_START_FAILED: expected=202 actual=${response.status}`);

console.log(JSON.stringify({ environment: 'local', hubspotManualStart: 'accepted', status: response.status }));
