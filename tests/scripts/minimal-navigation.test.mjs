import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMinimalNavigation,
  resolveMinimalRouteLabel,
} from '../../apps/web/src/features/navigation/minimal-navigation.ts';

function itemIds(navigation) {
  return navigation.flatMap((section) => section.items.map((item) => item.id));
}

test('shows only the CS workspace for a CS-authorized user', () => {
  const navigation = buildMinimalNavigation({
    pathname: '/cs/portfolio',
    permissions: {
      isPlatformAdmin: false,
      hasCsPortfolioAccess: true,
    },
  });

  assert.deepEqual(itemIds(navigation), ['cs-portfolio']);
});

test('keeps support routes available inside an authorized support workspace', () => {
  const navigation = buildMinimalNavigation({
    pathname: '/support/queue',
    permissions: {
      isPlatformAdmin: false,
    },
  });

  assert.deepEqual(itemIds(navigation), [
    'home',
    'support-inbox',
    'support-queue',
    'support-tickets',
    'support-customers',
  ]);
});

test('shows complete operational and governance navigation to platform admins', () => {
  const navigation = buildMinimalNavigation({
    pathname: '/admin/tenants',
    permissions: {
      isPlatformAdmin: true,
      hasCsPortfolioAccess: true,
      hasInternalActionAreaAccess: true,
    },
  });

  const ids = itemIds(navigation);

  assert.equal(ids.includes('admin-tenants'), true);
  assert.equal(ids.includes('admin-access'), true);
  assert.equal(ids.includes('admin-system'), true);
  assert.equal(ids.includes('admin-knowledge'), true);
  assert.equal(ids.includes('support-queue'), true);
  assert.equal(ids.includes('cs-portfolio'), true);
});

test('resolves a short operational label for the current route', () => {
  assert.equal(resolveMinimalRouteLabel('/support/queue'), 'Fila operacional');
  assert.equal(resolveMinimalRouteLabel('/admin/access'), 'Acessos');
  assert.equal(resolveMinimalRouteLabel('/support/tickets/ticket-1'), 'Ticket');
});
