import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const routeAccess = await readFile(
  new URL('../../apps/web/src/features/auth/internal-route-access.ts', import.meta.url),
  'utf8',
);
const adminGate = await readFile(
  new URL('../../apps/web/src/features/auth/AdminGate.tsx', import.meta.url),
  'utf8',
);
const authApi = await readFile(
  new URL('../../apps/web/src/features/auth/auth-api.ts', import.meta.url),
  'utf8',
);
const authContext = await readFile(
  new URL('../../apps/web/src/features/auth/auth-context.tsx', import.meta.url),
  'utf8',
);
const accessDenied = await readFile(
  new URL('../../apps/web/src/features/auth/AccessDeniedPage.tsx', import.meta.url),
  'utf8',
);

test('contrato de regressão mantém publicação antes da autorização e deny by default', () => {
  assert.match(routeAccess, /isRoutePublishedInRelease\(routePathname\)/);
  assert.match(routeAccess, /roles\.includes\('platform_admin'\)/);
  assert.match(routeAccess, /return false;/);
  assert.match(adminGate, /canOpenInternalRoute\(location\.pathname/);
});

test('contrato de regressão consulta contexto real e diferencia perfil inativo', () => {
  assert.match(authApi, /vw_admin_auth_context/);
  assert.match(authApi, /rpc_internal_actor_workspace_context/);
  assert.match(authApi, /reason: 'inactive-profile'/);
  assert.match(authContext, /refreshGate/);
});

test('contrato de regressão preserva fallback seguro de acesso negado', () => {
  assert.match(accessDenied, /to="\/login"/);
  assert.match(accessDenied, /to="\/inicio"/);
  assert.match(accessDenied, /fromAccessDenied: true/);
});
