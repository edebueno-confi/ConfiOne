import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { canOpenInternalRoute } from '../../apps/web/src/features/auth/internal-route-access.ts';
import { loadQaEnv, readLocalSupabaseStatus } from '../../scripts/local-qa/assert-local-supabase.mjs';
import { readQaPassword } from '../../scripts/local-qa/credentials.mjs';

const platformAdminWithoutScreenGrants = {
  roles: ['platform_admin'],
  screenKeys: [],
  hasCustomerPortalAccess: false,
  hasInternalActionAreaAccess: false,
  hasCsPortfolioAccess: false,
};

const authenticatedNonAdminWithoutWorkspace = {
  roles: [],
  screenKeys: [],
  hasCustomerPortalAccess: false,
  hasInternalActionAreaAccess: false,
  hasCsPortfolioAccess: false,
};

test('platform_admin válido não depende de screen grant para abrir o Admin Console publicado', () => {
  assert.equal(
    canOpenInternalRoute('/admin/analytics', platformAdminWithoutScreenGrants),
    true,
  );
  assert.equal(
    canOpenInternalRoute('/admin', platformAdminWithoutScreenGrants),
    true,
  );
});

test('usuário autenticado sem role ou workspace continua em deny by default', () => {
  assert.equal(
    canOpenInternalRoute('/admin/analytics', authenticatedNonAdminWithoutWorkspace),
    false,
  );
});

const qa = loadQaEnv();
const localStatus = readLocalSupabaseStatus({ ...process.env, ...qa });
const adminGateSource = fs.readFileSync('apps/web/src/features/auth/AdminGate.tsx', 'utf8');
const authApiSource = fs.readFileSync('apps/web/src/features/auth/auth-api.ts', 'utf8');
const authContextSource = fs.readFileSync('apps/web/src/features/auth/auth-context.tsx', 'utf8');
const routerSource = fs.readFileSync('apps/web/src/app/router.tsx', 'utf8');

async function localLogin(email, password) {
  const response = await fetch(`${localStatus.API_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: localStatus.ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200, `login local falhou: ${response.status}`);
  return response.json();
}

async function localJson(path, accessToken, options = {}) {
  const response = await fetch(`${localStatus.API_URL}${path}`, {
    ...options,
    headers: {
      apikey: localStatus.ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const body = await response.text();
  assert.equal(response.ok, true, `${path} falhou: ${response.status} ${body.slice(0, 240)}`);
  return body ? JSON.parse(body) : null;
}

function routeContextFromBackend(profileRow, workspaceRows) {
  return {
    roles: profileRow?.roles ?? [],
    screenKeys: (workspaceRows ?? []).map((row) => row.screen_key).filter(Boolean),
    hasCustomerPortalAccess: false,
    hasInternalActionAreaAccess: false,
    hasCsPortfolioAccess: false,
  };
}

test('admin autenticado sem grants materializados atravessa guard e rota publicada', async () => {
  const session = await localLogin(
    qa.LOCAL_QA_ADMIN_EMAIL ?? 'ede.oliveira@confi.com.vc',
    readQaPassword('LOCAL_QA_ADMIN_PASSWORD'),
  );
  const profileRows = await localJson(
    '/rest/v1/vw_admin_auth_context?select=id,is_active,roles',
    session.access_token,
  );
  const workspaceRows = await localJson(
    '/rest/v1/rpc/rpc_internal_actor_workspace_context',
    session.access_token,
    { method: 'POST', body: '{}' },
  );
  const profile = profileRows?.[0];

  assert.equal(profile?.id, session.user.id);
  assert.equal(profile?.is_active, true);
  assert.ok(profile?.roles?.includes('platform_admin'));
  assert.ok(Array.isArray(workspaceRows));

  // A sessão e o role vêm do backend real; o conjunto vazio representa
  // precisamente a ausência de grant materializado que causou o incidente.
  // Não reutilizar os grants existentes do fixture, pois isso esconderia a
  // regressão caso o bypass de platform_admin fosse removido.
  const context = routeContextFromBackend(profile, []);
  assert.deepEqual(context.screenKeys, []);
  assert.equal(canOpenInternalRoute('/admin/analytics', context), true);
  assert.equal(canOpenInternalRoute('/admin', context), true);

  const sessionIdentity = await localJson('/auth/v1/user', session.access_token);
  assert.equal(sessionIdentity.id, session.user.id);
  assert.match(adminGateSource, /canOpenInternalRoute\(location\.pathname/);
  assert.match(routerSource, /path: '\/admin',[\s\S]*?<AdminGate>/);
});

test('usuário local sem autorização mantém sessão e recebe deny sem alterar perfil', async () => {
  const noAdminEmail = qa.LOCAL_QA_DENIED_EMAIL ?? qa.LOCAL_QA_CLIENT_EMAIL ?? 'qa.local.denied@genius.local';
  const noAdminPassword = qa.LOCAL_QA_DENIED_EMAIL
    ? readQaPassword('LOCAL_QA_DENIED_PASSWORD')
    : readQaPassword('LOCAL_QA_CLIENT_PASSWORD');
  const session = await localLogin(
    noAdminEmail,
    noAdminPassword,
  );
  const profileRows = await localJson(
    '/rest/v1/vw_admin_auth_context?select=id,is_active,roles',
    session.access_token,
  );
  const workspaceRows = await localJson(
    '/rest/v1/rpc/rpc_internal_actor_workspace_context',
    session.access_token,
    { method: 'POST', body: '{}' },
  );
  const profile = profileRows?.[0];

  assert.ok(!profile || profile.id === session.user.id);
  assert.equal(profile?.is_active ?? true, true);
  assert.deepEqual(profile?.roles ?? [], []);
  assert.deepEqual(workspaceRows ?? [], []);
  assert.equal(
    canOpenInternalRoute('/admin/analytics', routeContextFromBackend(profile, workspaceRows)),
    false,
  );
  const sessionIdentity = await localJson('/auth/v1/user', session.access_token);
  assert.equal(sessionIdentity.id, session.user.id);
});

test('contratos de perfil inativo, sessão e recepção permanecem distintos', () => {
  assert.match(authApiSource, /if \(!authContext\.is_active\)/);
  assert.match(authApiSource, /reason: 'inactive-profile'/);
  assert.match(authApiSource, /rpc\('rpc_internal_actor_workspace_context'\)/);
  assert.match(authApiSource, /from\('vw_admin_auth_context'\)/);
  assert.match(authContextSource, /phase: 'denied'/);
  assert.match(authContextSource, /signOutAdminSession/);
  assert.match(fs.readFileSync('apps/web/src/features/auth/AccessDeniedPage.tsx', 'utf8'), /inactive-profile/);
  assert.match(fs.readFileSync('apps/web/src/features/auth/post-login-redirect.ts', 'utf8'), /hasReceptionAccess: true/);
});
