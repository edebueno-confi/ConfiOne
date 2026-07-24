import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mapCustomerRelationshipSnapshot,
  normalizeCustomerRelationshipPage,
} from '../../apps/web/src/features/customers/customer-relationship-model.ts';

test('normaliza totais e proveniência do contrato de relacionamento HubSpot', () => {
  const result = mapCustomerRelationshipSnapshot({
    contract_version: 'customer_relationship_v1',
    source_of_truth: 'hubspot_cache',
    economic_groups: [{ group_id: 'g-1' }],
    legal_entities: [{ company_id: 'c-1' }, { company_id: 'c-2' }],
    deals: [{ deal_id: 'd-1' }, { deal_id: 'd-2' }, { deal_id: 'd-3' }],
    meta: {
      economic_groups_total: 4,
      legal_entities_total: 602,
      deals_total: 1148,
      page_limit: 100,
      page_offset: 200,
    },
  });

  assert.deepEqual(result, {
    contractVersion: 'customer_relationship_v1',
    sourceOfTruth: 'hubspot_cache',
    economicGroupsTotal: 4,
    legalEntitiesTotal: 602,
    dealsTotal: 1148,
    pageLimit: 100,
    pageOffset: 200,
  });
});

test('trata fonte indisponível e payloads incompletos como dados indisponíveis', () => {
  const result = mapCustomerRelationshipSnapshot({
    contract_version: 'customer_relationship_v1',
    source_of_truth: 'unavailable',
    economic_groups: 'invalid',
    legal_entities: null,
    deals: {},
    meta: null,
  });

  assert.equal(result.sourceOfTruth, 'unavailable');
  assert.equal(result.economicGroupsTotal, 0);
  assert.equal(result.legalEntitiesTotal, 0);
  assert.equal(result.dealsTotal, 0);
  assert.equal(result.pageLimit, 0);
  assert.equal(result.pageOffset, 0);
});

test('limita a página do contrato para não carregar o catálogo inteiro', () => {
  assert.deepEqual(normalizeCustomerRelationshipPage(999, -10), { limit: 100, offset: 0 });
  assert.deepEqual(normalizeCustomerRelationshipPage(25, 200), { limit: 25, offset: 200 });
});
