import { runSqlBatch } from './sql.mjs';

const scenario = process.argv[2] ?? 'baseline';
const supported = new Set(['baseline', 'empty', 'partial', 'stale', 'unavailable', 'zero-real']);
if (!supported.has(scenario)) {
  console.error(`LOCAL_QA_SCENARIO_UNAVAILABLE: ${scenario}`);
  process.exit(2);
}

const sqlByScenario = {
  baseline: 'select 1;',
  empty: `
    begin;
    delete from public.analytics_finance_receivables where source_key = 'local_qa_finance' and source_record_id like 'qa-local-%';
    delete from public.hubspot_tickets where ticket_id like 'qa-local-hub-ticket-%';
    delete from public.hubspot_deals where deal_id like 'qa-local-deal-%';
    commit;`,
  partial: `
    begin;
    delete from public.hubspot_tickets where ticket_id in ('qa-local-hub-ticket-02','qa-local-hub-ticket-03');
    update public.analytics_finance_receivables set is_partial = true where source_key = 'local_qa_finance' and source_record_id = 'qa-local-receivable-03';
    commit;`,
  stale: `
    begin;
    update public.hubspot_tickets set synced_at = timezone('utc', now()) - interval '90 days' where ticket_id like 'qa-local-hub-ticket-%';
    update public.hubspot_deals set synced_at = timezone('utc', now()) - interval '90 days' where deal_id like 'qa-local-deal-%';
    update public.analytics_finance_receivables set effective_at = timezone('utc', now()) - interval '90 days' where source_key = 'local_qa_finance' and source_record_id like 'qa-local-%';
    commit;`,
  unavailable: `
    begin;
    update public.analytics_source_config set is_active = false where hubspot_pipeline_id in ('qa-local-commercial','qa-local-cs');
    delete from public.analytics_finance_receivables where source_key = 'local_qa_finance' and source_record_id like 'qa-local-%';
    commit;`,
  'zero-real': `
    begin;
    update public.analytics_finance_receivables set net_amount = 0, received_amount = 0, balance = 0, is_cancelled = false where source_key = 'local_qa_finance' and source_record_id like 'qa-local-%';
    delete from public.hubspot_deals where deal_id like 'qa-local-deal-%';
    delete from public.hubspot_tickets where ticket_id like 'qa-local-hub-ticket-%';
    commit;`,
};

runSqlBatch(sqlByScenario[scenario]);
console.log(JSON.stringify({ environment: 'local', scenario, deterministic: true, reversible: true, data_source: 'local_qa', external_sync: false, restore: scenario === 'baseline' ? null : 'npm run local:qa:hydrate' }));
