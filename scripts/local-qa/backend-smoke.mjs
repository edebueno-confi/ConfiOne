import { assertLocalSupabaseEnvironment, loadQaEnv, readLocalSupabaseStatus } from './assert-local-supabase.mjs';
import { readQaPassword } from './credentials.mjs';

const qa = loadQaEnv();
const status = readLocalSupabaseStatus({ ...process.env, ...qa });
assertLocalSupabaseEnvironment({ ...process.env, ...qa }, { status });

const apiUrl = status.API_URL;
const anonKey = status.ANON_KEY;
const ids = {
  horizonTicket: '55555555-5555-4555-8555-000000000017',
  atlasTicket: '55555555-5555-4555-8555-000000000012',
  auroraTicket: '55555555-5555-4555-8555-000000000001',
};

const personas = [
  { role: 'platform_admin', email: qa.LOCAL_QA_ADMIN_EMAIL, password: 'LOCAL_QA_ADMIN_PASSWORD' },
  { role: 'dashboard_viewer', email: qa.LOCAL_QA_DASHBOARD_VIEWER_EMAIL, password: 'LOCAL_QA_DASHBOARD_VIEWER_PASSWORD' },
  { role: 'support_manager', email: qa.LOCAL_QA_SUPPORT_MANAGER_EMAIL, password: 'LOCAL_QA_SUPPORT_MANAGER_PASSWORD' },
  { role: 'support_agent', email: qa.LOCAL_QA_SUPPORT_AGENT_EMAIL, password: 'LOCAL_QA_SUPPORT_AGENT_PASSWORD' },
  { role: 'customer_user', email: qa.LOCAL_QA_CLIENT_EMAIL, password: 'LOCAL_QA_CLIENT_PASSWORD' },
];

const expectation = (expectedStatuses, expectedRows) => ({ expectedStatuses, expectedRows });
const matrix = {
  platform_admin: {
    tenants: expectation([200], { min: 3 }), memberships: expectation([200], { min: 6 }),
    tickets: expectation([403], { exact: null }), internal_messages: expectation([403], { exact: null }),
    schedules: expectation([200], { min: 1 }), source_config: expectation([403], { exact: null }),
    ceo_snapshot: expectation([200], { min: 1 }), public_message: expectation([200], { min: 1 }), internal_note: expectation([200], { min: 1 }),
    allowed_ticket: expectation([200], { min: 1 }), other_tenant: expectation([200], { min: 1 }),
  },
  dashboard_viewer: {
    tenants: expectation([200], { exact: 0 }), memberships: expectation([200], { exact: 0 }),
    tickets: expectation([403], { exact: null }), internal_messages: expectation([403], { exact: null }),
    schedules: expectation([200], { exact: 0 }), source_config: expectation([403], { exact: null }),
    ceo_snapshot: expectation([200], { min: 1 }), public_message: expectation([400], { exact: null }), internal_note: expectation([400], { exact: null }),
    allowed_ticket: expectation([200], { exact: 0 }), other_tenant: expectation([200], { exact: 0 }),
  },
  support_manager: {
    tenants: expectation([200], { min: 3 }), memberships: expectation([200], { min: 3 }),
    tickets: expectation([403], { exact: null }), internal_messages: expectation([403], { exact: null }),
    schedules: expectation([200], { exact: 0 }), source_config: expectation([403], { exact: null }),
    ceo_snapshot: expectation([200], { exact: 0 }), public_message: expectation([200], { min: 1 }), internal_note: expectation([200], { min: 1 }),
    allowed_ticket: expectation([200], { min: 1 }), other_tenant: expectation([200], { min: 1 }),
  },
  support_agent: {
    tenants: expectation([200], { min: 2 }), memberships: expectation([200], { min: 2 }),
    tickets: expectation([403], { exact: null }), internal_messages: expectation([403], { exact: null }),
    schedules: expectation([200], { exact: 0 }), source_config: expectation([403], { exact: null }),
    ceo_snapshot: expectation([200], { exact: 0 }), public_message: expectation([200], { min: 1 }), internal_note: expectation([200], { min: 1 }),
    allowed_ticket: expectation([200], { min: 1 }), other_tenant: expectation([200], { exact: 0 }),
  },
  customer_user: {
    tenants: expectation([200], { exact: 1 }), memberships: expectation([200], { exact: 1 }),
    tickets: expectation([403], { exact: null }), internal_messages: expectation([403], { exact: null }),
    schedules: expectation([200], { exact: 0 }), source_config: expectation([403], { exact: null }),
    ceo_snapshot: expectation([200], { exact: 0 }), public_message: expectation([400], { exact: null }), internal_note: expectation([400], { exact: null }),
    allowed_ticket: expectation([200], { min: 1 }), other_tenant: expectation([200], { exact: 0 }),
  },
};

async function request(path, options, token) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { apikey: anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  let rowCount = null;
  if (response.ok) {
    try {
      const payload = await response.json();
      rowCount = Array.isArray(payload) ? payload.length : payload == null ? 0 : typeof payload === 'object' ? Object.keys(payload).length : 1;
    } catch { rowCount = null; }
  }
  return { status: response.status, rowCount };
}

async function login(email, password) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`LOCAL_QA_BACKEND_LOGIN_FAILED: ${response.status}`);
  return (await response.json()).access_token;
}

function assertResult(result, expected) {
  const statusOk = expected.expectedStatuses.includes(result.status);
  const rowExpectation = expected.expectedRows;
  const rowsOk = rowExpectation.exact === null
    ? result.rowCount === null
    : rowExpectation.exact !== undefined
      ? result.rowCount === rowExpectation.exact
      : result.rowCount !== null && result.rowCount >= rowExpectation.min;
  return statusOk && rowsOk;
}

const checks = [];
for (const persona of personas) {
  const token = await login(persona.email, readQaPassword(persona.password));
  const rows = [
    ['tenants', 'GET', '/rest/v1/tenants?select=id,slug&order=slug'],
    ['memberships', 'GET', '/rest/v1/tenant_memberships?select=tenant_id,user_id,role,status'],
    ['tickets', 'GET', '/rest/v1/tickets?select=id,tenant_id&order=created_at.desc&limit=50'],
    ['internal_messages', 'GET', `/rest/v1/ticket_messages?select=id,ticket_id,visibility&ticket_id=eq.${ids.horizonTicket}&visibility=eq.internal`],
    ['schedules', 'GET', '/rest/v1/analytics_integration_schedule?select=id,enabled,frequency'],
    ['source_config', 'GET', '/rest/v1/analytics_source_config?select=id,domain_key,object_type'],
    ['ceo_snapshot', 'POST', '/rest/v1/rpc/rpc_analytics_ceo_snapshot', { p_from: '2026-07-01', p_to: '2026-07-31' }],
    [
      'allowed_ticket',
      'GET',
      `/rest/v1/${persona.role === 'customer_user' ? 'vw_customer_portal_ticket_detail' : 'vw_support_ticket_detail'}?${persona.role === 'customer_user' ? 'ticket_id' : 'id'}=eq.${persona.role === 'customer_user' ? ids.auroraTicket : ids.horizonTicket}`,
    ],
    [
      'other_tenant',
      'GET',
      `/rest/v1/${persona.role === 'customer_user' ? 'vw_customer_portal_ticket_detail' : 'vw_support_ticket_detail'}?${persona.role === 'customer_user' ? 'ticket_id' : 'id'}=eq.${ids.atlasTicket}`,
    ],
  ];
  for (const [operation, method, path, body] of rows) {
    const result = await request(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) }, token);
    const expected = matrix[persona.role][operation];
    const passed = assertResult(result, expected);
    checks.push({ role: persona.role, resource: operation, method, endpoint: path.split('?')[0], expected, status: result.status, rowCount: result.rowCount, result: passed ? 'PASS' : 'FAIL' });
    if (!passed) throw new Error(`LOCAL_QA_BACKEND_ASSERTION_FAILED: ${persona.role}/${operation} expected=${JSON.stringify(expected)} actual=${JSON.stringify(result)}`);
  }
  for (const [operation, rpc] of [['public_message', 'rpc_add_ticket_message'], ['internal_note', 'rpc_add_internal_ticket_note']]) {
    const body = operation === 'public_message'
      ? { p_ticket_id: ids.horizonTicket, p_body: `[QA E2E] resposta publica ${persona.role}` }
      : { p_ticket_id: ids.horizonTicket, p_body: `[QA E2E] nota interna ${persona.role}` };
    const result = await request(`/rest/v1/rpc/${rpc}`, { method: 'POST', body: JSON.stringify(body) }, token);
    const expected = matrix[persona.role][operation];
    const passed = assertResult(result, expected);
    checks.push({ role: persona.role, resource: operation, method: 'POST', endpoint: `/rest/v1/rpc/${rpc}`, expected, status: result.status, rowCount: result.rowCount, result: passed ? 'PASS' : 'FAIL' });
    if (!passed) throw new Error(`LOCAL_QA_BACKEND_ASSERTION_FAILED: ${persona.role}/${operation} expected=${JSON.stringify(expected)} actual=${JSON.stringify(result)}`);
  }
}

console.log(JSON.stringify({ environment: 'local', assertions: true, checks }));
