/**
 * Contrato de tema da barra lateral.
 *
 * Ate 2026-08-07 a barra lateral era pintada com literais escuros aplicados nos
 * dois temas: no claro ela ficava incoerente com o resto da tela. Este teste
 * impede a reintroducao desses literais fora do bloco escuro.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(here, '../../apps/web/src/index.css'), 'utf8');

/** Regras da barra lateral que valem para os dois temas. */
function sharedSidebarRules() {
  return css
    .split('\n')
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => /^\s*\.gso-sidebar|^\s*\.gso-nav-link|^\s*\.gso-sidebar-nav/.test(line))
    .filter(({ line }) => !line.includes("data-theme='dark'"));
}

test('as regras compartilhadas da barra lateral nao usam cor literal', () => {
  const offenders = sharedSidebarRules()
    .filter(({ line }) => {
      const declarations = line.slice(line.indexOf('{') + 1);
      return /#[0-9A-Fa-f]{3,8}\b|rgba?\(/.test(declarations);
    })
    .map(({ line, number }) => `${number}: ${line.trim().slice(0, 90)}`);

  assert.deepEqual(offenders, [], `cor literal em regra compartilhada:\n${offenders.join('\n')}`);
});

test('os tokens da barra lateral existem nos dois temas', () => {
  const tokens = [
    '--sidebar-text',
    '--sidebar-text-strong',
    '--sidebar-text-muted',
    '--sidebar-item-hover',
    '--sidebar-item-active-bg',
    '--sidebar-item-active-text',
    '--sidebar-card-bg',
    '--sidebar-search-bg',
    '--sidebar-menu-bg',
    '--sidebar-divider',
  ];

  for (const token of tokens) {
    const declarations = css.match(new RegExp(`^\\s*${token}:`, 'gm')) ?? [];
    assert.ok(declarations.length >= 2, `${token} precisa ser declarado nas camadas claro e escuro`);
  }
});

test('o item ativo do menu segue o tom primario do blueprint no tema claro', () => {
  // A primeira declaracao do token no arquivo e a do tema claro; a do escuro
  // vem depois, no bloco que sobrescreve.
  const lightBackground = css.indexOf('--sidebar-item-active-bg:');
  const darkBackground = css.indexOf('--sidebar-item-active-bg:', lightBackground + 1);
  assert.ok(lightBackground > -1 && darkBackground > lightBackground, 'o token precisa existir nos dois temas');

  const lightBlock = css.slice(lightBackground, darkBackground);
  assert.match(lightBlock, /--sidebar-item-active-bg:\s*#EEF2FF;/, 'fundo do item ativo');
  assert.match(lightBlock, /--sidebar-item-active-text:\s*#2563EB;/, 'tinta do item ativo');
});
