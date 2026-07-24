import assert from 'node:assert/strict';
import test from 'node:test';

import { buildHelpCenterCategoryHref } from '../../apps/web/src/features/help-center/help-center-navigation.ts';
import fs from 'node:fs';

const helpCenterPage = fs.readFileSync('apps/web/src/features/help-center/HelpCenterPage.tsx', 'utf8');
const publicUi = fs.readFileSync('apps/web/src/features/help-center/public-ui.tsx', 'utf8');

test('CTA do portal aponta para a area autenticada local', () => {
  assert.match(helpCenterPage, /const portalHref = '\/portal';/);
  assert.match(publicUi, /<Link[^>]*to=\{portalHref\}/);
  assert.doesNotMatch(publicUi, /href=\{portalHref\}[^]*target="_blank"/);
});

test('gera link de categoria sem duplicar o caminho da central', () => {
  assert.equal(
    buildHelpCenterCategoryHref('genius', 'category-id', 'integração'),
    '/help/genius/articles?category=category-id',
  );
});

test('gera busca textual quando não há categoria resolvida', () => {
  assert.equal(
    buildHelpCenterCategoryHref('genius', null, 'integração'),
    '/help/genius/articles?q=integra%C3%A7%C3%A3o',
  );
});
