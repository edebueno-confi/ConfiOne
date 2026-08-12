import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const home = fs.readFileSync('apps/web/src/features/help-center/HelpCenterHomePage.tsx', 'utf8');
const articles = fs.readFileSync('apps/web/src/features/help-center/HelpCenterArticlesPage.tsx', 'utf8');
const article = fs.readFileSync('apps/web/src/features/help-center/HelpCenterArticlePage.tsx', 'utf8');
const states = fs.readFileSync('apps/web/src/features/help-center/public-ui.tsx', 'utf8');
const presentation = fs.readFileSync('apps/web/src/features/help-center/public-presentation.ts', 'utf8');

test('home taxonomy exposes five task categories and no empty reports card', () => {
  assert.match(presentation, /normalized\.includes\('solu'\)/);
  assert.doesNotMatch(home, /title: 'Relat/);
  assert.match(home, /md:grid-cols-2 xl:grid-cols-5/);
});

test('public assets use the article content width', () => {
  const markdown = fs.readFileSync('apps/web/src/features/help-center/markdown.tsx', 'utf8');
  assert.match(markdown, /max-w-\[min\(100%,920px\)\]/);
  assert.match(markdown, /max-h-\[780px\]/);
});

test('home pública usa o mascote oficial como guia da consulta', () => {
  assert.match(home, /GeniusMascot/);
  assert.match(home, /heroMascot\.pose/);
  assert.match(home, /heroMascot\.expression/);
  assert.doesNotMatch(home, /mascotUrl/);
  assert.match(home, /slice\(0, 3\)/);
});

test('lista pública mantém busca, categoria e paginação previsíveis', () => {
  assert.match(articles, /pageSize = 10/);
  assert.match(articles, /searchParams\.get\('page'\)/);
  assert.match(articles, /Paginação de artigos/);
  assert.match(articles, /nextParams\.delete\('page'\)/);
});

test('artigo mantém uma única coluna auxiliar condicional e companion após o conteúdo', () => {
  assert.match(article, /articleSections\.length >= 3/);
  assert.match(article, /pose="present"/);
  assert.match(article, /Próximo passo/);
  assert.doesNotMatch(article, /lg:grid-cols-\[196px_minmax/);
});

test('estados públicos usam linguagem visual sem técnica interna', () => {
  assert.match(states, /resolvedMascotPose/);
  assert.match(states, /expression={resolvedMascotExpression}/);
  assert.match(states, /tone === 'loading' \? 'magic'/);
  assert.match(states, /tone === 'empty' \? 'wink'/);
});
