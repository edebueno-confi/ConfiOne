/**
 * Contrato do indicador de posicao.
 *
 * Padrao definido em `docs/design/GENIUS_COLOR_STANDARD_V1.md`: azul e cor de
 * acao, magenta da marca e indicador de posicao. Este teste impede que as duas
 * superficies que marcam selecao — abas do Dashboard e abas de Configuracoes —
 * voltem a divergir.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../apps/web/src');
const indexCss = readFileSync(resolve(root, 'index.css'), 'utf8');
const settingsCss = readFileSync(resolve(root, 'features/settings/settings-ui.css'), 'utf8');

test('o token de selecao existe nos dois temas e vem da marca', () => {
  const declarations = indexCss.match(/^\s*--selection-accent:.*$/gm) ?? [];
  assert.equal(declarations.length, 2, 'precisa ser declarado no claro e no escuro');
  for (const declaration of declarations) {
    assert.match(declaration, /var\(--color-brand-magenta\)/, 'a origem e a paleta da marca');
  }
});

test('as abas do Dashboard usam o token de selecao, sem gradiente', () => {
  const rules = indexCss
    .split('}')
    .filter((block) => block.includes("gso-workspace-tab[aria-current='page']::after"));

  assert.ok(rules.length >= 2, 'as duas variantes de aba do Dashboard precisam existir');
  for (const rule of rules) {
    assert.match(rule, /background:\s*var\(--selection-accent\)/, 'o traco vem do token');
    assert.doesNotMatch(rule, /linear-gradient/, 'traco de 2px nao carrega gradiente');
  }
});

test('as abas de Configuracoes usam o mesmo token, nao o azul de acao', () => {
  const rule = settingsCss
    .split('}')
    .find((block) => block.includes("gso-ui-tab[aria-selected='true']"));

  assert.ok(rule, 'a regra da aba selecionada precisa existir');
  assert.match(rule, /border-bottom-color:\s*var\(--selection-accent\)/, 'o traco vem do token');
  assert.doesNotMatch(rule, /var\(--ui-primary\)/, 'azul e cor de acao, nao de posicao');
});

test('o trilho do item ativo da barra lateral segue o mesmo token', () => {
  const declarations = indexCss.match(/^\s*--sidebar-item-active-rail:.*$/gm) ?? [];
  assert.equal(declarations.length, 2, 'precisa ser declarado no claro e no escuro');
  for (const declaration of declarations) {
    assert.match(declaration, /var\(--selection-accent\)/, 'um unico indicador em todo o produto');
  }
});

test('nenhum indicador de posicao voltou a usar literal rosa', () => {
  const offenders = [...indexCss.matchAll(/^.*(?:aria-current|active-rail).*$/gm)]
    .map(([line]) => line)
    .filter((line) => /#f472b6|#ec4899|#e63aa8|#f062bd/i.test(line));

  assert.deepEqual(offenders, [], `literal rosa em indicador de posicao:\n${offenders.join('\n')}`);
});
