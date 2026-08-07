import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const base = new URL('../../apps/web/src/features/analytics/', import.meta.url);
const read = (name) => readFile(new URL(name, base), 'utf8');

const [commercial, support, executive, customerSuccess, grid, contract] = await Promise.all([
  read('AnalyticsCommercialPage.tsx'),
  read('AnalyticsCsPage.tsx'),
  read('AnalyticsCeoPage.tsx'),
  read('AnalyticsCustomerSuccessPage.tsx'),
  read('AnalyticsKpiGrid.tsx'),
  read('analytics-kpi-contract.mjs'),
]);

const surfaces = [
  ['Comercial', commercial, 'getCommercialKpisV2'],
  ['Suporte', support, 'getSupportKpisV2'],
  ['Resumo', executive, 'getExecutiveKpisV2'],
  ['Customer Success', customerSuccess, 'getCustomerSuccessKpisV2'],
];

test('as quatro áreas consomem os read models de KPI', () => {
  for (const [nome, source, leitor] of surfaces) {
    assert.match(source, new RegExp(leitor), `${nome} precisa consumir ${leitor}`);
  }
});

test('nenhuma tela lê o payload cru: a tradução passa pelo contrato', () => {
  for (const [nome, source] of surfaces) {
    // Nenhuma tela pode inspecionar estado ou motivo diretamente.
    assert.equal(/\-> *'kpis'/.test(source), false, `${nome} não pode navegar o payload`);
    assert.equal(/\.state === 'unavailable'/.test(source), false, `${nome} não pode comparar estado cru`);
    assert.equal(/'awaiting_history'/.test(source), false, `${nome} não pode conhecer o código de estado`);
  }
  // A grade e a página de carteira usam apenas as funções do contrato.
  assert.match(grid, /formatKpiValue|describeKpiLimitation|describeKpiBasis/);
});

test('as superfícies não expõem nome de propriedade, endpoint ou termo de infraestrutura', () => {
  const proibidos = [
    'aftersale___mrr',
    'status_do_cliente___aftersale',
    'notes_last_contacted',
    'hs_time_to_first_response_in_operating_hours',
    'closed_date',
    'ListarContasReceber',
    'app.omie.com.br',
    'Edge Function',
    'service_role',
    'statement_timeout',
  ];
  for (const [nome, source] of surfaces) {
    for (const termo of proibidos) {
      assert.equal(source.includes(termo), false, `${nome} não pode conter "${termo}"`);
    }
  }
  for (const termo of proibidos) {
    assert.equal(grid.includes(termo), false, `a grade não pode conter "${termo}"`);
    assert.equal(contract.includes(termo), false, `o contrato não pode conter "${termo}"`);
  }
});

test('cada indicador declarado tem rótulo em linguagem de negócio', () => {
  // Um descritor sem rótulo legível deixaria a chave técnica vazar para a tela.
  const descritores = [...commercial, ...support, ...executive]
    .join('')
    .match(/\{ key: '[a-z_0-9]+', label: '[^']+'/g) ?? [];
  assert.ok(descritores.length >= 20, 'as três telas devem declarar seus indicadores');
  for (const item of descritores) {
    const rotulo = item.match(/label: '([^']+)'/)[1];
    assert.equal(/_/.test(rotulo), false, `rótulo com aparência técnica: ${rotulo}`);
    assert.ok(rotulo.length > 3, `rótulo curto demais: ${rotulo}`);
  }
});

test('a grade distingue parcial de indisponível no tom do cartão', () => {
  assert.match(grid, /entry\.state === 'partial' \? 'warning'/);
  assert.match(grid, /AnalyticsKpiLimitations/);
});
