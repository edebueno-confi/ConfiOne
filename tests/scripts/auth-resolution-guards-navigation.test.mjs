import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canOpenInternalRoute,
  getDefaultInternalLandingRoute,
} from '../../apps/web/src/features/auth/internal-route-access.ts';
import { buildMinimalNavigation } from '../../apps/web/src/features/navigation/minimal-navigation.ts';

const admin = {
  roles: ['platform_admin'],
  screenKeys: [],
  hasCustomerPortalAccess: false,
  hasInternalActionAreaAccess: false,
  hasCsPortfolioAccess: false,
  hasReceptionAccess: true,
};

test('administrador válido abre somente superfície publicada e recebe landing neutra', () => {
  assert.equal(canOpenInternalRoute('/admin/analytics', admin), true);
  assert.equal(canOpenInternalRoute('/admin/system', admin), false);
  assert.equal(getDefaultInternalLandingRoute(admin), '/inicio');
});

test('rota solicitada sem autorização retorna fallback seguro sem encerrar sessão', () => {
  const viewer = {
    ...admin,
    roles: ['dashboard_viewer'],
    hasReceptionAccess: true,
  };
  assert.equal(canOpenInternalRoute('/admin/settings', viewer), false);
  assert.equal(getDefaultInternalLandingRoute(viewer), '/inicio');
});

test('rota não publicada permanece negada mesmo para administrador', () => {
  assert.equal(canOpenInternalRoute('/support/queue', admin), false);
});

test('menu publicado não apresenta item que o guard rejeita', () => {
  const navigation = buildMinimalNavigation({
    pathname: '/inicio',
    permissions: { isPlatformAdmin: true, roles: admin.roles, screenKeys: [] },
  });
  const destinations = navigation.flatMap((section) => section.items.map((item) => item.to));
  for (const destination of destinations) {
    assert.equal(canOpenInternalRoute(destination, admin), true, destination);
  }
  assert.equal(destinations.includes('/support/queue'), false);
});

test('contexto sem autorização não cria rota operacional por texto ou role implícito', () => {
  const denied = {
    roles: [],
    screenKeys: [],
    hasCustomerPortalAccess: false,
    hasInternalActionAreaAccess: false,
    hasCsPortfolioAccess: false,
    hasReceptionAccess: true,
  };
  assert.equal(canOpenInternalRoute('/admin/analytics', denied), false);
  assert.equal(getDefaultInternalLandingRoute(denied), '/inicio');
});
