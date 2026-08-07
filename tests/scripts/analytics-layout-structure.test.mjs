import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const base = new URL('../../apps/web/src/features/analytics/', import.meta.url);
const read = (name) => readFile(new URL(name, base), 'utf8');

const [ceo, comercial, suporte, carteira, financeiro, grid] = await Promise.all([
  read('AnalyticsCeoPage.tsx'),
  read('AnalyticsCommercialPage.tsx'),
  read('AnalyticsCsPage.tsx'),
  read('AnalyticsCustomerSuccessPage.tsx'),
  read('AnalyticsFinancePage.tsx'),
  read('AnalyticsKpiBoard.tsx'),
]);

/** Índice da primeira ocorrência, ou -1. */
const at = (source, pattern) => source.search(pattern);

const comFiltro = [
  ['Visão Geral', ceo, /gso-hd-filter-bar/],
  ['Comercial', comercial, /<AnalyticsFiltersBar/],
  ['Suporte', suporte, /<AnalyticsFiltersBar/],
];

test('o filtro sempre precede os indicadores que ele governa', () => {
  // Ler um número antes de saber qual recorte ele cobre é o caminho mais curto
  // para uma decisão errada. Em toda aba com filtro, o recorte vem primeiro.
  for (const [nome, source, filtro] of comFiltro) {
    const posFiltro = at(source, filtro);
    const posKpis = at(source, /<AnalyticsKpiBoard/);
    assert.ok(posFiltro > -1, `${nome} precisa ter barra de filtros`);
    assert.ok(posKpis > -1, `${nome} precisa exibir indicadores`);
    assert.ok(
      posFiltro < posKpis,
      `${nome}: o filtro aparece depois dos indicadores; inverta a ordem`,
    );
  }
});

test('a limitação vem depois dos indicadores que ela explica', () => {
  for (const [nome, source] of [['Visão Geral', ceo], ['Comercial', comercial], ['Suporte', suporte], ['Carteira', carteira]]) {
    const posKpis = at(source, /<AnalyticsKpiBoard/);
    const posLimites = at(source, /<AnalyticsBoardLimitations/);
    assert.ok(posLimites > -1, `${nome} precisa declarar as limitações da leitura`);
    assert.ok(posKpis < posLimites, `${nome}: a limitação aparece antes do que explica`);
  }
});

test('toda aba usa o mesmo invólucro de área', () => {
  for (const [nome, source] of [['Visão Geral', ceo], ['Comercial', comercial], ['Suporte', suporte], ['Carteira', carteira], ['Financeiro', financeiro]]) {
    const usaFrame = /AnalyticsHdDomainFrame/.test(source) || /ExecutiveHdCanvas/.test(source);
    assert.ok(usaFrame, `${nome} precisa usar o invólucro padrão de área`);
  }
});

test('a ausência de filtro em Carteira é intencional e está justificada', () => {
  // Todos os indicadores da carteira são posição de hoje, não fluxo de período.
  // Um seletor de datas ali sugeriria um recorte que não existe.
  assert.equal(/<AnalyticsFiltersBar/.test(carteira), false);
  assert.match(carteira, /não há filtro de período/);
});

test('o painel organiza por coorte, não por importância solta', () => {
  // Faixa com título próprio é o que impede posição de hoje e fluxo do período
  // serem lidos como a mesma coisa.
  assert.match(grid, /bands: BoardBand\[\]/);
  assert.match(grid, /A coorte organiza o espaço/);
  assert.match(grid, /A confiabilidade vive dentro do número/);
});
