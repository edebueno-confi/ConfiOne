import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { KPI_LABELS, findForbiddenTerms, kpiLabel } from '../../apps/web/src/features/analytics/analytics-vocabulary.mjs';

const base = new URL('../../apps/web/src/features/analytics/', import.meta.url);
const read = (name) => readFile(new URL(name, base), 'utf8');

const pages = Object.fromEntries(await Promise.all(
  ['AnalyticsCommercialPage.tsx', 'AnalyticsCsPage.tsx', 'AnalyticsCeoPage.tsx', 'AnalyticsCustomerSuccessPage.tsx']
    .map(async (name) => [name, await read(name)]),
));

test('um conceito tem exatamente um nome', () => {
  const labels = Object.values(KPI_LABELS);
  const duplicados = labels.filter((label, index) => labels.indexOf(label) !== index);
  assert.deepEqual(duplicados, [], `rótulos repetidos no glossário: ${duplicados.join(', ')}`);
});

test('nenhum indicador cai no rótulo de emergência', () => {
  // Uma chave sem rótulo canônico exporia nome interno na tela.
  for (const [chave, rotulo] of Object.entries(KPI_LABELS)) {
    assert.notEqual(rotulo, kpiLabel('__inexistente__'), `${chave} sem rótulo`);
    assert.equal(/_/.test(rotulo), false, `rótulo com aparência técnica: ${rotulo}`);
  }
  assert.equal(kpiLabel('__inexistente__'), 'Indicador sem nome definido');
});

test('o vocabulário decidido é respeitado nas telas', () => {
  // "Negócio" para comercial e "atendimento" para suporte foram decididos em
  // 2026-08-07. Sinônimos na interface reabrem a ambiguidade que causou a
  // duplicidade original.
  for (const [nome, source] of Object.entries(pages)) {
    const textos = [
      ...(source.match(/label="([^"]+)"/g) ?? []),
      ...(source.match(/title="([^"]+)"/g) ?? []),
      ...(source.match(/hint="([^"]+)"/g) ?? []),
      ...(source.match(/hint: '([^']+)'/g) ?? []),
      ...(source.match(/description="([^"]+)"/g) ?? []),
    ];
    for (const texto of textos) {
      const proibidos = findForbiddenTerms(texto);
      assert.deepEqual(proibidos, [], `${nome} usa termo fora do glossário em ${texto}: ${proibidos.join(', ')}`);
    }
  }
});

test('nenhuma tela declara o mesmo indicador duas vezes', () => {
  for (const [nome, source] of Object.entries(pages)) {
    const chaves = (source.match(/\{ key: '([a-z_0-9]+)'/g) ?? []).map((m) => m.match(/'([^']+)'/)[1]);
    const duplicadas = chaves.filter((k, i) => chaves.indexOf(k) !== i);
    assert.deepEqual(duplicadas, [], `${nome} repete indicador: ${duplicadas.join(', ')}`);
  }
});

test('a hierarquia limita os indicadores de decisão a quatro', () => {
  // Mais que isso deixa de ser hierarquia e vira lista.
  for (const [nome, source] of Object.entries(pages)) {
    for (const bloco of source.match(/const \w+_PRIMARY: KpiDescriptor\[\] = \[[\s\S]*?\];/g) ?? []) {
      const itens = (bloco.match(/\{ key:/g) ?? []).length;
      assert.ok(itens <= 4, `${nome} tem ${itens} indicadores primários; o limite é 4`);
    }
  }
});
