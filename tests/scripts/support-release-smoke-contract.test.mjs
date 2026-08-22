import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
  new URL('../../scripts/local-qa/support-release-smoke.mjs', import.meta.url),
  'utf8',
);

test('Support Release Smoke cobre perfis, rotas e isolamento de tabela-base', () => {
  for (const role of ['platform_admin', 'support_manager', 'support_agent', 'dashboard_viewer', 'customer_user']) {
    assert.match(source, new RegExp(role));
  }
  for (const route of ['/support/queue', '/support/tickets']) {
    assert.match(source, new RegExp(route.replaceAll('/', '\\/')));
  }
  assert.match(source, /VITE_RELEASE_SURFACE: 'full'/);
  assert.match(source, /local-release-preview\.mjs/);
  assert.match(source, /--enable.*support_queue,support_tickets/);
  assert.match(source, /--disable/);
  assert.match(source, /vw_support_|rpc\/rpc_support_/);
  assert.match(source, /sensitiveBaseTableRequests/);
  assert.match(source, /ticket_messages|ticket_events|ticket_attachments/);
});
