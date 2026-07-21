import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCompanyProperties, buildCsMigrationPreflight, countCsMigrationPlan, matchCsCompany, normalizeDigits, resolveOwnerId } from '../../supabase/functions/_shared/cs-migration.ts';

test('normaliza IDs decimais vindos do Sheets sem alterar o identificador', () => {
  assert.equal(normalizeDigits('4147148759.0'), '4147148759');
  assert.equal(normalizeDigits('15.315.817/0001-26'), '15315817000126');
});

test('aplica somente propriedades conhecidas da empresa HubSpot', () => {
  assert.deepEqual(buildCompanyProperties({ nome_plataforma: 'Acme', cnpj: '12.345.678/0001-90', mrr_mensal: 'R$ 1.250,50', ativo: 'Sim', status_contrato: 'Ativo', tipo_mrr: 'Mensal' }, '123'), {
    name: 'Acme',
    cnpj: '12.345.678/0001-90',
    aftersale___mrr: '1250.50',
    tipo_de_mrr: 'Mensal',
    status_do_cliente___aftersale: 'Sim',
    status_do_contrato: 'Ativo',
    cs_owner___aftersale: '123',
  });
});

test('prioriza ID, depois CNPJ/nome único, e preserva ambiguidade', () => {
  const companies = [
    { id: '10', properties: { name: 'Acme', cnpj: '12345678000190' } },
    { id: '11', properties: { name: 'Acme', cnpj: '99999999000190' } },
  ];
  assert.equal(matchCsCompany({ hubspot_id: '10.0', cnpj: '00000000000000', nome_plataforma: 'Outro' }, companies).method, 'hubspot_id');
  assert.equal(matchCsCompany({ cnpj: '99999999000190', nome_plataforma: 'Outro' }, companies).company?.id, '11');
  assert.equal(matchCsCompany({ nome_plataforma: 'Acme' }, companies).status, 'ambiguous');
});

test('resolve owner somente quando o nome for único', () => {
  const owners = [{ ownerId: '123', fullName: 'Mary Laurentino' }, { ownerId: '456', fullName: 'Rodolfo Turra' }];
  assert.equal(resolveOwnerId('Mary Laurentino', owners), '123');
  assert.equal(resolveOwnerId('Inexistente', owners), null);
});

test('conta o plano usando os nomes das colunas do ledger SQL', () => {
  assert.deepEqual(countCsMigrationPlan([
    { status: 'planned', operation: 'update' },
    { status: 'planned', operation: 'create' },
    { status: 'ambiguous', operation: null },
    { status: 'skipped', operation: null },
    { status: 'failed', operation: null },
  ]), {
    total_rows: 5,
    planned_rows: 2,
    ambiguous_rows: 1,
    create_rows: 1,
    update_rows: 1,
    skipped_rows: 1,
    failed_rows: 1,
  });
});

test('marca dry-run com cache vazia como exigindo reidratação e não liberado para aplicar', () => {
  assert.deepEqual(buildCsMigrationPreflight('dry_run', 606, 606, 0, 0), {
    mode: 'dry_run',
    sourceRows: 606,
    validSourceRows: 606,
    hubspotCompaniesLoaded: 0,
    hubspotOwnersLoaded: 0,
    companyCatalog: 'local_cache',
    requiresRehydrate: true,
    canApply: false,
  });
});

test('considera aplicação elegível somente quando o catálogo HubSpot tem empresas', () => {
  const preflight = buildCsMigrationPreflight('apply', 606, 593, 10161, 14);
  assert.equal(preflight.companyCatalog, 'hubspot_live');
  assert.equal(preflight.requiresRehydrate, false);
  assert.equal(preflight.canApply, true);
});
