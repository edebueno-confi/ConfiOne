import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { buildPostLoginNavigation } from '../../apps/web/src/features/auth/post-login-navigation.ts';
import {
  getReleaseLandingRoute,
  isRoutePublishedInRelease,
  resolveReleaseRedirect,
} from '../../apps/web/src/app/release-surface.mjs';

const routeAccess = await readFile(
  new URL('../../apps/web/src/features/auth/internal-route-access.ts', import.meta.url),
  'utf8',
);
const postLoginRedirect = await readFile(
  new URL('../../apps/web/src/features/auth/post-login-redirect.ts', import.meta.url),
  'utf8',
);
const adminGate = await readFile(
  new URL('../../apps/web/src/features/auth/AdminGate.tsx', import.meta.url),
  'utf8',
);
const accessDenied = await readFile(
  new URL('../../apps/web/src/features/auth/AccessDeniedPage.tsx', import.meta.url),
  'utf8',
);
const homePage = await readFile(
  new URL('../../apps/web/src/features/home/HomePage.tsx', import.meta.url),
  'utf8',
);
const router = await readFile(
  new URL('../../apps/web/src/app/router.tsx', import.meta.url),
  'utf8',
);
const receptionGate = await readFile(
  new URL('../../apps/web/src/features/auth/ReceptionGate.tsx', import.meta.url),
  'utf8',
);
const supportGate = await readFile(
  new URL('../../apps/web/src/features/support/SupportGate.tsx', import.meta.url),
  'utf8',
);

test('landing autenticada usa /inicio e mantém fallback sem autorização', () => {
  assert.equal(getReleaseLandingRoute(), '/inicio');
  assert.equal(isRoutePublishedInRelease('/inicio'), true);
  assert.equal(resolveReleaseRedirect('/inicio'), null);
  assert.match(routeAccess, /hasReceptionAccess === true/);
  assert.match(routeAccess, /return null;/);
  assert.match(postLoginRedirect, /hasReceptionAccess: true/);
  assert.match(postLoginRedirect, /requestedRouteAllowed/);
  assert.match(postLoginRedirect, /'\/inicio'/);
});

test('fallback de acesso negado não volta para login quando a sessão está autenticada', () => {
  const navigation = buildPostLoginNavigation('/inicio', 'missing-authorized-workspace');
  assert.equal(navigation.destination, '/inicio');
  assert.equal(navigation.state?.fromAccessDenied, true);
  assert.equal(navigation.state?.reason, 'missing-authorized-workspace');

  assert.match(accessDenied, /phase === 'authenticated'/);
  assert.match(accessDenied, /to="\/inicio"/);
  assert.match(homePage, /fromAccessDenied/);
});

test('composição da recepção não exige SupportGate nem cria ciclo de redirect', () => {
  const inicioBlock = router.match(/path: '\/inicio',[\s\S]*?children:/)?.[0] ?? '';
  assert.match(inicioBlock, /<ReceptionGate>/);
  assert.doesNotMatch(inicioBlock, /<SupportGate>/);
  assert.match(receptionGate, /phase === 'anonymous'/);
  assert.match(receptionGate, /to="\/login"/);
  assert.match(supportGate, /isSupportOperator/);
});

test('guard mantém estados de loading, erro, sessão expirada e deny separados', () => {
  assert.match(adminGate, /gate\.phase === 'loading'/);
  assert.match(adminGate, /gate\.phase === 'error'/);
  assert.match(adminGate, /sessionExpired/);
  assert.match(adminGate, /gate\.phase === 'denied'/);
  assert.match(adminGate, /refreshGate/);
  assert.match(receptionGate, /sessionExpired/);
  assert.match(receptionGate, /SessionExpiredState/);
  assert.match(receptionGate, /clearSessionExpired/);
});
