import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const analyticsUi = fs.readFileSync('apps/web/src/features/analytics/analytics-ui.tsx', 'utf8');
const ceoPage = fs.readFileSync('apps/web/src/features/analytics/AnalyticsCeoPage.tsx', 'utf8');
const commercialPage = fs.readFileSync('apps/web/src/features/analytics/AnalyticsCommercialPage.tsx', 'utf8');
const articlePage = fs.readFileSync('apps/web/src/features/help-center/HelpCenterArticlePage.tsx', 'utf8');
const markdown = fs.readFileSync('apps/web/src/features/help-center/markdown.tsx', 'utf8');

test('contadores quantitativos usam regra compartilhada quando exibem substantivo', () => {
  assert.match(analyticsUi, /export function formatCountLabel/);
  assert.match(ceoPage, /formatCountLabel\(\s*data\.commercial\.wonDeals,\s*"negócio ganho",\s*"negócios ganhos"/s);
  assert.match(commercialPage, /owner\.lostDeals\.toLocaleString\('pt-BR'\)/);
  assert.doesNotMatch(ceoPage, /\$\{c\.wonDeals\.toLocaleString\('pt-BR'\)\} ganhos/);
});

test('normalização editorial remove leads repetidos e evita numeração no heading de passos', () => {
  assert.match(articlePage, /isLikelyDuplicateLead/);
  assert.match(markdown, /normalized\.push\(`### \$\{sentenceCase\}`\)/);
  assert.match(markdown, /normalized\.push\(`- \$\{line\}`\)/);
  assert.match(markdown, /observa\[cç\]\[aã\]/);
});
