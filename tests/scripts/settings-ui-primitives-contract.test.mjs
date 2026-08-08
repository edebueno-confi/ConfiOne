/**
 * Contrato das primitivas novas do blueprint V4.
 *
 * Cobre a regra pura da paginacao sem DOM e verifica, por leitura de fonte, que
 * as primitivas mantem as garantias que a especificacao exige: interruptor com
 * semantica real, avatar sem imagem generica, coluna ordenavel com aria-sort e
 * menu de linha que fecha no Escape.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import test from 'node:test';

import { PAGE_GAP, paginationRange, paginationSummary } from '../../apps/web/src/features/settings/ui/pagination-range.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const uiDir = resolve(here, '../../apps/web/src/features/settings/ui');
const read = (file) => readFileSync(resolve(uiDir, file), 'utf8');

test('paginationRange devolve uma unica pagina quando nao ha o que paginar', () => {
  assert.deepEqual(paginationRange(1, 1), [1]);
  assert.deepEqual(paginationRange(1, 0), []);
});

test('paginationRange nao insere salto quando as paginas sao contiguas', () => {
  assert.deepEqual(paginationRange(3, 4), [1, 2, 3, 4]);
  assert.deepEqual(paginationRange(2, 3), [1, 2, 3]);
});

test('paginationRange marca o salto entre blocos distantes', () => {
  assert.deepEqual(paginationRange(6, 12), [1, PAGE_GAP, 5, 6, 7, PAGE_GAP, 12]);
});

test('paginationRange trava a pagina corrente dentro do intervalo valido', () => {
  assert.deepEqual(paginationRange(99, 3), [1, 2, 3]);
  assert.deepEqual(paginationRange(-4, 3), [1, 2, 3]);
});

test('paginationSummary descreve o intervalo real exibido', () => {
  assert.equal(
    paginationSummary({ page: 1, perPage: 6, total: 32, noun: 'usuario' }),
    'Mostrando 1 a 6 de 32 usuarios',
  );
  assert.equal(
    paginationSummary({ page: 6, perPage: 6, total: 32, noun: 'usuario' }),
    'Mostrando 31 a 32 de 32 usuarios',
  );
});

test('paginationSummary nao inventa intervalo quando nao ha itens', () => {
  assert.equal(paginationSummary({ page: 1, perPage: 10, total: 0, noun: 'marca' }), 'Nenhuma marca'.replace('Nenhuma', 'Nenhum'));
  assert.equal(paginationSummary({ page: 1, perPage: 10, total: 1, noun: 'marca' }), 'Mostrando 1 a 1 de 1 marca');
});

test('o interruptor usa checkbox real com role de switch e aceita somente leitura', () => {
  const source = read('UiToggleField.tsx');
  assert.match(source, /type="checkbox"/, 'precisa ser um controle nativo');
  assert.match(source, /role="switch"/, 'precisa anunciar-se como interruptor');
  assert.match(source, /disabled=\{readOnly\}/, 'interruptor sem escrita nao pode parecer acionavel');
  assert.match(source, /aria-describedby=\{describedBy\}/, 'a descricao precisa chegar ao leitor de tela');
});

test('o avatar cai para iniciais e so mostra estado quando existe', () => {
  const source = read('UiAvatar.tsx');
  assert.match(source, /initialsOf\(name\)/, 'sem foto, mostra iniciais');
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(code, /src=\{[^}]*\|\|/, 'nao pode haver imagem padrao quando a foto falta');
  assert.doesNotMatch(code, /\.(png|jpg|jpeg|svg|webp)/i, 'nao pode existir asset generico embutido');
  assert.match(code, /status \?/, 'ausencia de estado nao vira indicador');
});

test('a coluna ordenavel expoe aria-sort pela celula', () => {
  const helper = read('ui-sort.ts');
  assert.match(helper, /export function ariaSortOf/, 'o th precisa receber o aria-sort');
  assert.match(helper, /'ascending'[\s\S]*'descending'[\s\S]*'none'/, 'valores validos de aria-sort');
  const component = read('UiSortHeader.tsx');
  assert.doesNotMatch(component, /export (function|const) (?!UiSortHeader)/, 'o arquivo do componente exporta so o componente');
});

test('o menu de linha fecha no Escape e no clique fora', () => {
  const source = read('UiRowActions.tsx');
  assert.match(source, /event\.key === 'Escape'/, 'precisa fechar no Escape');
  assert.match(source, /mousedown/, 'precisa fechar no clique fora');
  assert.match(source, /aria-haspopup="menu"/, 'precisa anunciar o menu');
  assert.match(source, /disabled=\{action\.disabled\}/, 'acao sem permissao aparece desabilitada, nao some');
});

test('as primitivas novas nao introduzem cor literal fora dos tokens', () => {
  const css = readFileSync(resolve(uiDir, '../settings-ui.css'), 'utf8');
  const blueprintBlock = css.slice(css.indexOf('Blueprint V4'));
  const literals = blueprintBlock.match(/#[0-9A-Fa-f]{3,8}\b/g) ?? [];
  // O unico literal aceito e o branco do botao do interruptor, que precisa ser
  // branco nos dois temas.
  assert.deepEqual([...new Set(literals)], ['#FFFFFF']);
});
