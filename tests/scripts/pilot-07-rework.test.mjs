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
  assert.match(home, /Sugestões do Gênio/);
  assert.doesNotMatch(home, /Pergunte ao Gênio como título/);
});

test('Gênio conduz a consulta com fala reativa e poses semânticas', () => {
  assert.match(home, /heroAssistantState/);
  assert.match(home, /Sugestões do Gênio/);
  assert.match(home, /Consultando a documentação/);
  assert.match(home, /Encontrei caminhos para você/);
  assert.match(home, /pose: 'think'/);
  assert.match(home, /pose: 'present'/);
  assert.match(home, /pose: 'shrug'/);
  assert.doesNotMatch(home, /CONSULTA GUIADA|Consulta guiada/);
});

test('sugestões ficam no bloco do Gênio, não junto ao campo de busca', () => {
  const mascotIndex = home.indexOf('data-testid="hero-mascot"');
  const suggestionsIndex = home.indexOf('data-testid="hero-suggestions"');
  assert.ok(mascotIndex > -1 && suggestionsIndex > mascotIndex);
  assert.match(home, /data-testid="hero-companion"/);
});

test('home segue a composição visual aprovada para a consulta assistida', () => {
  assert.match(home, /Bem-vindo à Central de Ajuda/);
  assert.match(home, /data-testid="hero-title-highlight"/);
  assert.match(home, /Consulta assistida por IA/);
  assert.match(home, /Estou pronto para ajudar com sua consulta\./);
  assert.match(home, /Gênio disponível/);
  assert.match(home, /Sugestões do Gênio/);
  assert.match(home, /Explorar/);
  assert.match(home, /data-testid="featured-article-card"/);
});
