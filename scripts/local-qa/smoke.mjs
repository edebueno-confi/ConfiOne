import { assertLocalSupabaseEnvironment, loadQaEnv, readLocalSupabaseStatus } from './assert-local-supabase.mjs';

const qa = loadQaEnv();
const status = readLocalSupabaseStatus({ ...process.env, ...qa });
assertLocalSupabaseEnvironment({ ...process.env, ...qa }, { status });
const accounts = [
  ['admin', qa.LOCAL_QA_ADMIN_EMAIL, qa.LOCAL_QA_ADMIN_PASSWORD],
  ['dashboard_viewer', qa.LOCAL_QA_DASHBOARD_VIEWER_EMAIL, qa.LOCAL_QA_DASHBOARD_VIEWER_PASSWORD],
  ['support_manager', qa.LOCAL_QA_SUPPORT_MANAGER_EMAIL, qa.LOCAL_QA_SUPPORT_MANAGER_PASSWORD],
  ['support_agent', qa.LOCAL_QA_SUPPORT_AGENT_EMAIL, qa.LOCAL_QA_SUPPORT_AGENT_PASSWORD],
  ['customer_user', qa.LOCAL_QA_CLIENT_EMAIL, qa.LOCAL_QA_CLIENT_PASSWORD],
];
const results = [];
for (const [role, email, password] of accounts) {
  const response = await fetch(`${status.API_URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: status.ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  if (!response.ok) throw new Error(`LOCAL_QA_LOGIN_FAILED: ${role}`);
  const session = await response.json();
  results.push({ role, authenticated: Boolean(session.access_token) });
}
console.log(JSON.stringify({ environment: 'local', smoke: 'auth', results }));
