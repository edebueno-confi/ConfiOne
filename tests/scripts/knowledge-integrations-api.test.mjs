import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const migration = fs.readFileSync(
  'supabase/migrations/20260724090000_knowledge_integrations_api_hub_v1.sql',
  'utf8',
);
const links = fs.readFileSync(
  'apps/web/src/features/help-center/help-center-integrations.ts',
  'utf8',
);

const expectedSlugs = [
  'integracoes-e-api-do-genius-returns',
  'qual-recurso-de-integracao-devo-usar',
  'como-autenticar-uma-integracao',
  'como-iniciar-uma-troca-ou-devolucao-pelo-e-commerce',
  'como-importar-uma-solicitacao-criada-em-outro-sistema',
  'como-consultar-processos-e-acompanhar-status',
  'como-integrar-notas-fiscais-de-devolucao',
  'como-informar-avaliacoes-de-produtos',
  'ambientes-de-producao-qa-e-testes',
  'api-docs-swagger-e-referencia-tecnica',
  'erros-comuns-em-integracoes-api',
  'como-solicitar-credenciais-ou-habilitacao',
];

test('hub de integrações contém os artigos públicos previstos', () => {
  assert.match(migration, /name = 'Integrações e API'/);
  for (const slug of expectedSlugs) {
    assert.match(migration, new RegExp(`'${slug}'`));
  }
});

test('referências técnicas usam configuração centralizada', () => {
  for (const token of [
    '{{link:api_docs}}',
    '{{link:api_docs_spec}}',
    '{{link:swagger}}',
    '{{link:production}}',
    '{{link:qa}}',
  ]) {
    assert.match(migration, new RegExp(token.replace(/[{}]/g, '\\$&')));
  }

  assert.match(links, /geniusReturnsIntegrationLinks/);
  assert.doesNotMatch(migration, /eyJhbGciOiJIUzI1Ni/);
  assert.doesNotMatch(migration, /GeniusToken\s*[:=]\s*['"][^'"]+['"]/i);
});

test('operações publicadas pertencem à matriz do API Docs', () => {
  for (const operation of [
    'authenticate',
    'initiate-flow',
    'import-request',
    'get-process',
    'list-processes',
    'add-return-note',
    'update-return-note',
    'deactivate-return-note',
    'list-return-notes',
    'get-return-note',
    'product-rating',
  ]) {
    assert.match(links, new RegExp(`['"]${operation}['"]`));
  }
});
