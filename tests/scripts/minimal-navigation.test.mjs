import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import path from 'node:path';

import {
  buildMinimalNavigation,
  resolveMinimalRouteLabel,
} from '../../apps/web/src/features/navigation/minimal-navigation.ts';
import { setReleaseSurfaceModeForTests } from '../../apps/web/src/app/release-surface.mjs';

// This suite describes the navigation of the complete system, which is preserved
// in the repository. The reduced release sidebar is covered on its own by
// tests/scripts/release-surface.test.mjs.
setReleaseSurfaceModeForTests('full');

function itemIds(navigation) {
  return navigation.flatMap((section) => section.items.map((item) => item.id));
}

test('keeps non-MVP CS workspace out of the primary shell', () => {
  const navigation = buildMinimalNavigation({
    pathname: '/cs/portfolio',
    permissions: {
      isPlatformAdmin: false,
      roles: [],
      hasCsPortfolioAccess: true,
    },
  });

  assert.deepEqual(itemIds(navigation), []);
});

test('keeps support routes out of the primary MVP shell', () => {
  const navigation = buildMinimalNavigation({
    pathname: '/support/queue',
    permissions: {
      isPlatformAdmin: false,
      roles: ['support_agent'],
    },
  });

  assert.deepEqual(itemIds(navigation), []);
});

test('shows only the MVP surfaces to platform admins', () => {
  const navigation = buildMinimalNavigation({
    pathname: '/admin/tenants',
    permissions: {
      isPlatformAdmin: true,
      hasCsPortfolioAccess: true,
      hasInternalActionAreaAccess: true,
    },
  });

  const ids = itemIds(navigation);

  assert.deepEqual(ids, ['engineering-workspace', 'development-control', 'admin-analytics', 'admin-knowledge', 'admin-cockpit', 'admin-settings', 'admin-access']);
  assert.equal(ids.includes('admin-access'), true);
  assert.equal(ids.includes('admin-tenants'), false);
  assert.equal(ids.includes('support-queue'), false);
});

test('builds navigation from contextual screen grants for a non-admin user', () => {
  const navigation = buildMinimalNavigation({
    pathname: '/admin/analytics',
    permissions: {
      isPlatformAdmin: false,
      roles: [],
      screenKeys: ['home', 'analytics', 'knowledge', 'product_docs'],
    },
  });

  const ids = itemIds(navigation);
  assert.deepEqual(ids, ['admin-analytics', 'admin-knowledge']);
});

test('resolves a short operational label for the current route', () => {
  assert.equal(resolveMinimalRouteLabel('/support/queue'), 'Fila operacional');
  assert.equal(resolveMinimalRouteLabel('/admin/access'), 'Acessos e áreas');
  assert.equal(resolveMinimalRouteLabel('/support/tickets/ticket-1'), 'Ticket');
});

test('support home nao oferece atalho para configuracoes administrativas', () => {
  const source = fs.readFileSync(
    path.resolve('apps/web/src/features/home/HomePage.tsx'),
    'utf8',
  );

  assert.doesNotMatch(
    source,
    /to=["']\/admin\/settings["']/,
    'o suporte nao deve apontar para uma configuracao protegida pelo Admin Console',
  );
});

test('sidebar colapsada usa flyout sobreposto acessivel para os grupos autorizados', () => {
  const source = fs.readFileSync(
    path.resolve('apps/web/src/features/navigation/MinimalAppShell.tsx'),
    'utf8',
  );

  assert.match(source, /gso-nav-flyout/, 'o rail colapsado precisa abrir um flyout proprio');
  assert.match(source, /aria-modal="true"/, 'o flyout precisa anunciar o contexto modal');
  assert.match(source, /event\.key === 'Escape'/, 'o flyout precisa fechar no Escape');
  assert.match(source, /pointerdown/, 'o flyout precisa fechar no clique fora');
  assert.match(source, /onNavigate=\{closeFlyout\}/, 'a selecao de uma rota precisa fechar o flyout');
});
