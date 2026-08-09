import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const settings = fs.readFileSync(path.join(repoRoot, 'apps/web/src/features/settings/SettingsPage.tsx'), 'utf8');
const providerCard = fs.readFileSync(path.join(repoRoot, 'apps/web/src/features/settings/integrations/IntegrationProviderCard.tsx'), 'utf8');

test('Configurações estabiliza grupos visíveis e não cria loop de recarga', () => {
  assert.match(settings, /useMemo/);
  assert.match(settings, /const visibleGroups = useMemo\(/);
  assert.match(settings, /selectedId !== next/);
  assert.match(settings, /\[isDashboardViewer, location\.pathname, selectedId, visibleGroups\]/);
  assert.match(settings, /if \(selected\.id === 'integracoes'\) void loadIntegrations\(\);/);
  assert.match(settings, /if \(selected\.id === 'categorias'\) void loadCategories\(\);/);
  assert.doesNotMatch(settings, /const hasGroup = \(id: string\) => visibleGroups\.some/);
});

test('provedores não usam cor de domínio para comunicar operação ou financeiro', () => {
  assert.match(providerCard, /<UiBadge tone="neutral">\{eyebrow\}<\/UiBadge>/);
  assert.match(providerCard, /tone="neutral"/);
  assert.doesNotMatch(providerCard, /variant === 'finance' \? 'accent' : 'primary'/);
});
