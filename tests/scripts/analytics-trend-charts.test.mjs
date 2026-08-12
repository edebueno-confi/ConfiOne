import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const charts = await readFile(
  new URL('../../apps/web/src/features/analytics/charts/AnalyticsTrendCharts.tsx', import.meta.url),
  'utf8',
);

// Estas asserções nasceram de defeitos vistos na tela, não imaginados. Cada uma
// corresponde a uma forma concreta de o gráfico afirmar mais do que o dado diz.

test('nenhuma série usa interpolação suave', () => {
  // `monotone` desenha picos e vales entre dois meses que ninguém mediu. Numa
  // série mensal esparsa isso é invenção visual: a curva afirma uma trajetória
  // que o dado não contém.
  assert.doesNotMatch(charts, /type="monotone"/);
  assert.doesNotMatch(charts, /type=\{'monotone'\}/);
});

test('toda série declarada tem nome legível', () => {
  // Sem `name`, a legenda e o tooltip mostram o identificador técnico do campo.
  const seriesSemNome = [...charts.matchAll(/<(Bar|Line|Area)\b[\s\S]*?\/>/g)]
    .map((match) => match[0])
    .filter((bloco) => !/\bname="/.test(bloco));
  assert.deepEqual(seriesSemNome, [], 'toda Bar, Line e Area precisa de name em português');
});

test('nenhum nome de série vaza vocabulário técnico', () => {
  const nomes = [...charts.matchAll(/\bname="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(nomes.length >= 8, 'os três gráficos somam ao menos oito séries nomeadas');
  for (const nome of nomes) {
    assert.doesNotMatch(nome, /_|^[a-z]+$/, `nome de série técnico na tela: ${nome}`);
  }
});

test('os três gráficos têm legenda', () => {
  const legendas = charts.match(/<Legend\b/g) ?? [];
  assert.equal(legendas.length, 3, 'Suporte, Comercial e Financeiro precisam de legenda');
});

test('medidas de ordem de grandeza diferente ficam em eixos separados', () => {
  // Fila acumulada, taxa de conversão e previsto de vencimento cresceriam muito
  // acima do movimento mensal e achatariam as barras contra o zero.
  for (const eixo of ['fila', 'taxa', 'previsto']) {
    assert.match(charts, new RegExp(`yAxisId="${eixo}"[\\s\\S]{0,200}orientation="right"`),
      `o eixo ${eixo} precisa existir do lado direito`);
  }
});

test('cada grid de gráfico multi-eixo fica ligado ao eixo principal', () => {
  // Recharts 3 deixou a resolução do eixo do CartesianGrid determinística;
  // sem esse vínculo, as linhas horizontais podem deixar de ser desenhadas.
  for (const eixo of ['mes', 'qtd', 'mov']) {
    assert.match(charts, new RegExp(`<CartesianGrid[^>]*yAxisId="${eixo}"`),
      `o grid precisa apontar para o eixo ${eixo}`);
  }
});

test('o zero do saldo tem linha de referência', () => {
  // Sem ela, um saldo negativo parece apenas uma barra menor.
  assert.match(charts, /<ReferenceLine[^>]*y=\{0\}/);
});

test('a taxa não liga pontos por cima de período sem encerramento', () => {
  assert.match(charts, /connectNulls=\{false\}/);
});

test('valores monetários usam a formatação em real, não número cru', () => {
  assert.match(charts, /formatCurrencyBRL\(number\)/);
});
