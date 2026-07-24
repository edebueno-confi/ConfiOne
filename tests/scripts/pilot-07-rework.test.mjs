import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const home = fs.readFileSync('apps/web/src/features/help-center/HelpCenterHomePage.tsx', 'utf8');

test('hero usa tres sugestões derivadas de artigos publicados', () => {
  assert.match(home, /suggestedArticleDefinitions/);
  assert.match(home, /configurar o c[áa]lculo do estorno/i);
  assert.match(home, /automatizar o pagamento de estorno e vale-compra/i);
  assert.match(home, /acompanhar solicita[çc][õo]es de troca e devolu[çc][ãa]o/i);
  assert.match(home, /buildSuggestedArticleLinks/);
  assert.match(home, /to={`\/help\/\$\{spaceSlug\}\/articles\/\$\{article\.slug\}`}/);
});

test('hero renderiza o Gênio uma única vez e mantém resultados fora da composição', () => {
  assert.equal((home.match(/<GeniusMascot/g) ?? []).length, 1);
  assert.match(home, /data-testid="help-home-hero"/);
  assert.match(home, /data-testid="hero-mascot"/);
  assert.match(home, /data-testid="help-home-search-results"/);
  assert.doesNotMatch(home, /<table/);
});

test('hero não duplica CTAs e preserva ações de busca previsíveis', () => {
  assert.match(home, /role="search"/);
  assert.match(home, /setSearchParams\(nextParams/);
  assert.match(home, /nextParams\.delete\('q'\)/);
  assert.match(home, /Sugestões rápidas/);
  assert.doesNotMatch(home, /Pergunte ao Gênio como título/);
});
