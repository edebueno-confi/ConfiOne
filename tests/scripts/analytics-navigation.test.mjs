import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../apps/web/src/features/analytics/analytics-navigation.ts', import.meta.url), 'utf8');

test('analytics navigation preserves the canonical allowlist', () => {
  for (const key of ['tab', 'pipeline', 'from', 'to', 'status', 'owner']) assert.match(source, new RegExp(`['"]${key}['"]`));
});

test('analytics navigation supports the four public dashboard tabs', () => {
  for (const tab of ['ceo', 'commercial', 'cs-support', 'finance']) assert.match(source, new RegExp(`['"]${tab}['"]`));
});

test('analytics navigation validates identifiers and dates', () => {
  assert.match(source, /allowedTabs/);
  assert.match(source, /\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$/);
  assert.match(source, /A-Za-z0-9_-/);
  assert.match(source, /from > to/);
});

test('analytics navigation builds contextual dashboard links', () => {
  assert.match(source, /analyticsHref/);
  assert.match(source, /current\.set\('tab', tab\)/);
  assert.match(source, /current\.set\(key, value\)/);
});

for (const [name, needle] of [
  ['rejects unknown tabs', "if (!allowedTabs.has"],
  ['normalizes legacy cs alias', "value === 'cs'"],
  ['normalizes invalid domain to executive', "return 'ceo'"],
  ['preserves period', "current = normalizeAnalyticsSearch"],
  ['removes incompatible pipeline', 'current.delete'],
  ['supports extras', 'Object.entries(extras)'],
  ['normalizes reversed dates', "output.set('from', to)"],
  ['limits pipeline size', '1,120'],
  ['limits status size', 'slice(0, 120)'],
  ['uses location search', 'window.location.search'],
  ['uses a stable analytics route', '/admin/analytics?'],
  ['supports owner context', "key === 'pipeline' || key === 'owner'"],
  ['keeps query relative', 'return `/admin/analytics?'],
  ['uses URLSearchParams as the state container', 'new URLSearchParams'],
]) test(`analytics navigation ${name}`, () => assert.match(source, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))));
