import { assertLocalSupabaseEnvironment, loadQaEnv, readLocalSupabaseStatus } from './assert-local-supabase.mjs';
import { readQaPassword } from './credentials.mjs';

const qa = loadQaEnv();
const status = readLocalSupabaseStatus({ ...process.env, ...qa });
assertLocalSupabaseEnvironment({ ...process.env, ...qa }, { status });

const apiUrl = status.API_URL;
const anonKey = status.ANON_KEY;
const ticketId = '55555555-5555-4555-8555-000000000001';

const personas = [
  ['admin', qa.LOCAL_QA_ADMIN_EMAIL, 'LOCAL_QA_ADMIN_PASSWORD'],
  ['dashboard_viewer', qa.LOCAL_QA_DASHBOARD_VIEWER_EMAIL, 'LOCAL_QA_DASHBOARD_VIEWER_PASSWORD'],
  ['support_manager', qa.LOCAL_QA_SUPPORT_MANAGER_EMAIL, 'LOCAL_QA_SUPPORT_MANAGER_PASSWORD'],
  ['support_agent', qa.LOCAL_QA_SUPPORT_AGENT_EMAIL, 'LOCAL_QA_SUPPORT_AGENT_PASSWORD'],
  ['customer_user', qa.LOCAL_QA_CLIENT_EMAIL, 'LOCAL_QA_CLIENT_PASSWORD'],
];

async function request(path, options = {}, token) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  let rowCount = null;
  if (response.status >= 200 && response.status < 300) {
    try {
      const payload = await response.json();
      rowCount = Array.isArray(payload)
        ? payload.length
        : payload == null
          ? 0
          : typeof payload === 'object'
            ? Object.keys(payload).length
            : 1;
    } catch {
      rowCount = null;
    }
  }
  return { status: response.status, rowCount };
}

async function login(email, password) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`LOCAL_QA_BACKEND_LOGIN_FAILED: ${response.status}`);
  const payload = await response.json();
  return payload.access_token;
}

const checks = [];
for (const [role, email, passwordKey] of personas) {
  const token = await login(email, readQaPassword(passwordKey));
  const rows = [
    ['tenants', 'GET', '/rest/v1/tenants?select=id,slug&order=slug'],
    ['memberships', 'GET', '/rest/v1/tenant_memberships?select=tenant_id,user_id,role,status'],
    ['tickets', 'GET', '/rest/v1/tickets?select=id,tenant_id&order=created_at.desc&limit=50'],
    ['internal_messages', 'GET', `/rest/v1/ticket_messages?select=id,ticket_id,visibility&ticket_id=eq.${ticketId}&visibility=eq.internal`],
    ['schedules', 'GET', '/rest/v1/analytics_integration_schedule?select=id,enabled,frequency'],
    ['source_config', 'GET', '/rest/v1/analytics_source_config?select=id,domain_key,object_type'],
    ['ceo_snapshot', 'POST', '/rest/v1/rpc/rpc_analytics_ceo_snapshot', { p_from: '2026-07-01', p_to: '2026-07-31' }],
  ];
  for (const [operation, method, path, body] of rows) {
    const result = await request(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) }, token);
    checks.push({ role, operation, status: result.status, rowCount: result.rowCount });
  }

  const writes = [
    ['public_message', { p_ticket_id: ticketId, p_body: `[QA E2E] resposta publica ${role}` }],
    ['internal_note', { p_ticket_id: ticketId, p_body: `[QA E2E] nota interna ${role}` }],
  ];
  for (const [operation, body] of writes) {
    const result = await request(`/rest/v1/rpc/${operation === 'public_message' ? 'rpc_add_ticket_message' : 'rpc_add_internal_ticket_note'}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }, token);
    checks.push({ role, operation, status: result.status, rowCount: result.rowCount });
  }
}

console.log(JSON.stringify({ environment: 'local', jwt: true, checks }));
