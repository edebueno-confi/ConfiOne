import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const sourceFiles = [
  'apps/web/src/components/minimal-ui.tsx',
  'apps/web/src/components/minimal-states.tsx',
  'apps/web/src/features/login/LoginPage.tsx',
  'apps/web/src/features/navigation/MinimalAppShell.tsx',
  'apps/web/src/features/cs/CsPortfolioPage.tsx',
];

function readSource(path) {
  assert.equal(existsSync(path), true, `Arquivo obrigatório ausente: ${path}`);
  return readFileSync(path, 'utf8');
}

test('keeps the minimal UI free from decorative legacy patterns', () => {
  const source = sourceFiles.map(readSource).join('\n');
  const forbiddenPatterns = [
    ['gradiente linear', /linear-gradient/i],
    ['gradiente radial', /radial-gradient/i],
    ['blur decorativo', /backdrop-blur/i],
    ['elevação decorativa no hover', /hover:translate-y/i],
    ['uppercase com tracking excessivo', /uppercase\s+tracking-\[/i],
  ];

  for (const [label, pattern] of forbiddenPatterns) {
    assert.equal(pattern.test(source), false, `Padrão proibido encontrado: ${label}`);
  }
});

test('requires accessible interaction primitives in the minimal UI', () => {
  const uiSource = readSource('apps/web/src/components/minimal-ui.tsx');
  const stateSource = readSource('apps/web/src/components/minimal-states.tsx');

  assert.match(uiSource, /focus-visible:/);
  assert.match(uiSource, /disabled:/);
  assert.match(uiSource, /<label/);
  assert.match(uiSource, /aria-busy/);
  assert.match(uiSource, /disabled=\{loading \|\| disabled\}/);
  assert.match(stateSource, /role=\{tone === 'critical' \? 'alert' : 'status'\}/);
});

test('keeps the login focused on one primary action', () => {
  const loginSource = readSource('apps/web/src/features/login/LoginPage.tsx');

  assert.doesNotMatch(loginSource, /mascotUrl/);
  assert.doesNotMatch(loginSource, />Limpar</);
  assert.doesNotMatch(loginSource, /noValidate/);
  assert.match(loginSource, /Acesso restrito a contas autorizadas/);
});
