import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  assertLocalSupabaseEnvironment,
  loadQaEnv,
  readLocalSupabaseStatus,
} from './assert-local-supabase.mjs';
import { runSql, runSqlBatch, sqlEscape } from './sql.mjs';

const qa = loadQaEnv();
const required = [
  'LOCAL_QA_ADMIN_EMAIL', 'LOCAL_QA_ADMIN_PASSWORD',
  'LOCAL_QA_DASHBOARD_VIEWER_EMAIL', 'LOCAL_QA_DASHBOARD_VIEWER_PASSWORD',
  'LOCAL_QA_SUPPORT_MANAGER_EMAIL', 'LOCAL_QA_SUPPORT_MANAGER_PASSWORD',
  'LOCAL_QA_SUPPORT_AGENT_EMAIL', 'LOCAL_QA_SUPPORT_AGENT_PASSWORD',
  'LOCAL_QA_CLIENT_EMAIL', 'LOCAL_QA_CLIENT_PASSWORD',
];
for (const key of required) if (!qa[key]) throw new Error(`LOCAL_QA_CONFIG_MISSING: ${key}`);

const status = readLocalSupabaseStatus({ ...process.env, ...qa });
assertLocalSupabaseEnvironment({ ...process.env, ...qa }, { status });

async function provisionUser(email, password, fullName) {
  const lookup = runSql(`select id::text as id from auth.users where lower(email) = lower('${sqlEscape(email)}') limit 1;`);
  const userId = lookup.rows?.[0]?.id;
  const url = `${status.API_URL}/auth/v1/admin/users${userId ? `/${userId}` : ''}`;
  const response = await fetch(url, {
    method: userId ? 'PUT' : 'POST',
    headers: { apikey: status.SERVICE_ROLE_KEY, Authorization: `Bearer ${status.SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: fullName, name: fullName, locale: 'pt-BR', timezone: 'America/Sao_Paulo', local_qa: true } }),
  });
  if (!response.ok) throw new Error(`LOCAL_QA_AUTH_FAILED: ${response.status}`);
  const payload = await response.json();
  return payload.id ?? userId;
}

const users = {
  admin: await provisionUser(qa.LOCAL_QA_ADMIN_EMAIL, qa.LOCAL_QA_ADMIN_PASSWORD, 'QA Local Administrador'),
  viewer: await provisionUser(qa.LOCAL_QA_DASHBOARD_VIEWER_EMAIL, qa.LOCAL_QA_DASHBOARD_VIEWER_PASSWORD, 'QA Local Dashboard Viewer'),
  manager: await provisionUser(qa.LOCAL_QA_SUPPORT_MANAGER_EMAIL, qa.LOCAL_QA_SUPPORT_MANAGER_PASSWORD, 'QA Local Support Manager'),
  agent: await provisionUser(qa.LOCAL_QA_SUPPORT_AGENT_EMAIL, qa.LOCAL_QA_SUPPORT_AGENT_PASSWORD, 'QA Local Support Agent'),
  client: await provisionUser(qa.LOCAL_QA_CLIENT_EMAIL, qa.LOCAL_QA_CLIENT_PASSWORD, 'QA Local Cliente Aurora'),
};

const tenantIds = {
  aurora: '11111111-1111-4111-8111-111111111111',
  horizonte: '22222222-2222-4222-8222-222222222222',
  atlas: '33333333-3333-4333-8333-333333333333',
};
const contactIds = {
  aurora: '11111111-aaaa-4aaa-8aaa-111111111111',
  horizonte: '22222222-aaaa-4aaa-8aaa-222222222222',
  atlas: '33333333-aaaa-4aaa-8aaa-333333333333',
};
const productId = '44444444-4444-4444-8444-444444444444';
const planIds = { basic: '44444444-aaaa-4aaa-8aaa-444444444441', growth: '44444444-aaaa-4aaa-8aaa-444444444442', enterprise: '44444444-aaaa-4aaa-8aaa-444444444443' };
const ticketSeed = [
  ['aurora', 'new', 'low', 'Dentro do prazo'], ['aurora', 'in_progress', 'normal', 'Dentro do prazo'], ['aurora', 'waiting_customer', 'high', 'Próximo do vencimento'], ['aurora', 'resolved', 'normal', 'Dentro do prazo'], ['aurora', 'closed', 'low', 'Dentro do prazo'],
  ['horizonte', 'triage', 'high', 'Próximo do vencimento'], ['horizonte', 'waiting_engineering', 'urgent', 'Vencido'], ['horizonte', 'in_progress', 'high', 'Próximo do vencimento'], ['horizonte', 'waiting_support', 'normal', 'Dentro do prazo'], ['horizonte', 'resolved', 'normal', 'Vencido'],
  ['atlas', 'new', 'critical', 'Vencido'], ['atlas', 'triage', 'urgent', 'Vencido'], ['atlas', 'in_progress', 'high', 'Vencido'], ['atlas', 'waiting_customer', 'normal', 'Próximo do vencimento'], ['atlas', 'closed', 'high', 'Vencido'],
  ['aurora', 'new', 'normal', 'Dentro do prazo'], ['horizonte', 'waiting_customer', 'low', 'Próximo do vencimento'], ['atlas', 'resolved', 'high', 'Vencido'],
];
const ticketRows = ticketSeed.map(([tenant, state, priority, sla], index) => {
  const id = `55555555-5555-4555-8555-${String(index + 1).padStart(12, '0')}`;
  const closed = state === 'closed';
  const assignee = index % 3 === 0 ? users.manager : index % 3 === 1 ? users.agent : null;
  const persistedPriority = priority === 'critical' ? 'urgent' : priority;
  return `('${id}', '${tenantIds[tenant]}', '${contactIds[tenant]}', '[QA LOCAL] ${sla} — acompanhamento operacional ${index + 1}', 'Fixture local determinística para validar fila, SLA, prioridade e isolamento de tenant.', 'portal'::public.ticket_source, '${state}'::public.ticket_status, '${persistedPriority}'::public.ticket_priority, '${priority === 'critical' ? 'critical' : priority === 'urgent' ? 'high' : 'medium'}'::public.ticket_severity, '${users.admin}', ${assignee ? `'${assignee}'` : 'null'}, ${closed ? "timezone('utc', now())" : 'null'}, ${closed ? "timezone('utc', now())" : 'null'}, ${closed ? "'QA LOCAL encerrado'" : 'null'})`;
});

const sql = `
begin;
insert into public.tenants (id, slug, legal_name, display_name, status, data_region, created_by_user_id, updated_by_user_id)
values
 ('${tenantIds.aurora}', 'qa-local-aurora', 'QA Aurora Comércio — Local', 'QA Aurora Comércio', 'active', 'sa-east-1', '${users.admin}', '${users.admin}'),
 ('${tenantIds.horizonte}', 'qa-local-horizonte', 'QA Horizonte Digital — Local', 'QA Horizonte Digital', 'active', 'sa-east-1', '${users.admin}', '${users.admin}'),
 ('${tenantIds.atlas}', 'qa-local-atlas', 'QA Atlas Operações — Local', 'QA Atlas Operações', 'active', 'sa-east-1', '${users.admin}', '${users.admin}')
on conflict (id) do update set display_name = excluded.display_name, status = excluded.status, updated_by_user_id = excluded.updated_by_user_id;

insert into public.user_global_roles (user_id, role, created_by_user_id, updated_by_user_id)
values
 ('${users.admin}', 'platform_admin'::public.platform_role, '${users.admin}', '${users.admin}'),
 ('${users.viewer}', 'dashboard_viewer'::public.platform_role, '${users.admin}', '${users.admin}'),
 ('${users.manager}', 'support_manager'::public.platform_role, '${users.admin}', '${users.admin}'),
 ('${users.agent}', 'support_agent'::public.platform_role, '${users.admin}', '${users.admin}')
on conflict (user_id, role) do update set updated_by_user_id = excluded.updated_by_user_id;

insert into public.tenant_memberships (tenant_id, user_id, role, status, invited_by_user_id, created_by_user_id, updated_by_user_id)
select t.id, '${users.manager}', 'tenant_viewer'::public.tenant_role, 'active'::public.membership_status, '${users.admin}', '${users.admin}', '${users.admin}'
from public.tenants t where t.id in ('${tenantIds.aurora}', '${tenantIds.horizonte}', '${tenantIds.atlas}')
on conflict (tenant_id, user_id) do update set status = 'active'::public.membership_status, role = excluded.role, updated_by_user_id = excluded.updated_by_user_id;
insert into public.tenant_memberships (tenant_id, user_id, role, status, invited_by_user_id, created_by_user_id, updated_by_user_id)
select t.id, '${users.agent}', 'tenant_viewer'::public.tenant_role, 'active'::public.membership_status, '${users.admin}', '${users.admin}', '${users.admin}'
from public.tenants t where t.id in ('${tenantIds.aurora}', '${tenantIds.horizonte}')
on conflict (tenant_id, user_id) do update set status = 'active'::public.membership_status, role = excluded.role, updated_by_user_id = excluded.updated_by_user_id;
insert into public.tenant_memberships (tenant_id, user_id, role, status, invited_by_user_id, created_by_user_id, updated_by_user_id)
values ('${tenantIds.aurora}', '${users.client}', 'customer_user'::public.tenant_role, 'active'::public.membership_status, '${users.admin}', '${users.admin}', '${users.admin}')
on conflict (tenant_id, user_id) do update set status = 'active'::public.membership_status, role = 'customer_user'::public.tenant_role, updated_by_user_id = excluded.updated_by_user_id;

insert into public.tenant_contacts (id, tenant_id, linked_user_id, full_name, email, job_title, is_primary, is_active, created_by_user_id, updated_by_user_id)
values
 ('${contactIds.aurora}', '${tenantIds.aurora}', '${users.client}', 'QA Local Cliente Aurora', '${sqlEscape(qa.LOCAL_QA_CLIENT_EMAIL)}', 'Contato de QA', true, true, '${users.admin}', '${users.admin}'),
 ('${contactIds.horizonte}', '${tenantIds.horizonte}', null, 'QA Local Horizonte', 'horizonte.qa.local@genius.local', 'Contato de QA', true, true, '${users.admin}', '${users.admin}'),
 ('${contactIds.atlas}', '${tenantIds.atlas}', null, 'QA Local Atlas', 'atlas.qa.local@genius.local', 'Contato de QA', true, true, '${users.admin}', '${users.admin}')
on conflict (id) do update set linked_user_id = excluded.linked_user_id, is_active = true, updated_by_user_id = excluded.updated_by_user_id;

insert into public.customer_account_profiles (tenant_id, product_line, operational_status, account_tier, internal_notes, operational_flags, created_by_user_id, updated_by_user_id)
values
 ('${tenantIds.aurora}', 'genius_returns', 'active', 'basic', '[QA LOCAL] Cliente saudável.', '{"high_touch_account":false,"financial_attention_required":false}'::jsonb, '${users.admin}', '${users.admin}'),
 ('${tenantIds.horizonte}', 'genius_returns', 'limited', 'growth', '[QA LOCAL] Cliente em atenção.', '{"high_touch_account":true,"financial_attention_required":true}'::jsonb, '${users.admin}', '${users.admin}'),
 ('${tenantIds.atlas}', 'genius_returns', 'limited', 'enterprise', '[QA LOCAL] Cliente crítico.', '{"high_touch_account":true,"financial_attention_required":true,"integration_sensitive_account":true}'::jsonb, '${users.admin}', '${users.admin}')
on conflict (tenant_id) do update set operational_status = excluded.operational_status, account_tier = excluded.account_tier, internal_notes = excluded.internal_notes, operational_flags = excluded.operational_flags, updated_by_user_id = excluded.updated_by_user_id;
insert into public.customer_account_features (tenant_id, feature_key, enabled, source, notes, created_by_user_id, updated_by_user_id)
select t.id, 'returns_portal', true, 'local_qa', '[QA LOCAL] Portal habilitado para teste.', '${users.admin}', '${users.admin}' from public.tenants t where t.id = '${tenantIds.aurora}' and not exists (select 1 from public.customer_account_features f where f.tenant_id=t.id and lower(f.feature_key)='returns_portal');
insert into public.customer_account_alerts (id, tenant_id, severity, title, description, active, created_by_user_id, updated_by_user_id)
values ('66666666-6666-4666-8666-666666666661', '${tenantIds.horizonte}', 'warning', '[QA LOCAL] SLA próximo do vencimento', 'Fixture local para validar alerta de atendimento.', true, '${users.admin}', '${users.admin}'), ('66666666-6666-4666-8666-666666666662', '${tenantIds.atlas}', 'critical', '[QA LOCAL] Pendência financeira', 'Fixture local para validar alerta crítico.', true, '${users.admin}', '${users.admin}')
on conflict (id) do update set active=true, updated_by_user_id=excluded.updated_by_user_id;

insert into public.tickets (id, tenant_id, requester_contact_id, title, description, source, status, priority, severity, created_by_user_id, assigned_to_user_id, resolved_at, closed_at, close_reason)
values ${ticketRows.join(',\n')}
on conflict (id) do update set tenant_id=excluded.tenant_id, title=excluded.title, status=excluded.status, priority=excluded.priority, severity=excluded.severity, assigned_to_user_id=excluded.assigned_to_user_id, resolved_at=excluded.resolved_at, closed_at=excluded.closed_at, close_reason=excluded.close_reason, updated_by_user_id='${users.admin}';
insert into public.ticket_messages (id, tenant_id, ticket_id, visibility, body, created_by_user_id, metadata)
select ('77777777-7777-4777-8777-' || lpad(row_number() over (order by t.id)::text, 12, '0'))::uuid, t.tenant_id, t.id, 'customer'::public.message_visibility, '[QA LOCAL] Mensagem pública sintética para validar histórico.', coalesce(t.assigned_to_user_id, '${users.admin}'), '{"fixture":true}'::jsonb from public.tickets t where t.id in (${ticketRows.map((_, index) => `'55555555-5555-4555-8555-${String(index + 1).padStart(12, '0')}'`).join(',')}) and not exists (select 1 from public.ticket_messages m where m.ticket_id=t.id and m.metadata->>'fixture'='true');

insert into public.commercial_products (id, product_key, display_name, description, status, created_by_user_id, updated_by_user_id) values ('${productId}', 'genius_returns', 'Genius Returns', 'Produto sintético para QA local.', 'active', '${users.admin}', '${users.admin}') on conflict (id) do update set status='active', updated_by_user_id=excluded.updated_by_user_id;
insert into public.commercial_product_plans (id, product_id, plan_key, display_name, description, status, sort_order, created_by_user_id, updated_by_user_id) values ('${planIds.basic}', '${productId}', 'basic', 'Plano básico QA', 'Fixture local.', 'active', 1, '${users.admin}', '${users.admin}'), ('${planIds.growth}', '${productId}', 'growth', 'Plano intermediário QA', 'Fixture local.', 'active', 2, '${users.admin}', '${users.admin}'), ('${planIds.enterprise}', '${productId}', 'enterprise', 'Plano enterprise QA', 'Fixture local.', 'active', 3, '${users.admin}', '${users.admin}') on conflict (id) do update set status='active', updated_by_user_id=excluded.updated_by_user_id;
insert into public.customer_product_subscriptions (id, tenant_id, product_id, plan_id, status, started_at, renewal_at, contract_reference, source, notes_internal, metadata, created_by_user_id, updated_by_user_id) values ('88888888-8888-4888-8888-888888888881', '${tenantIds.aurora}', '${productId}', '${planIds.basic}', 'active', current_date - 30, current_date + 335, 'qa-local-aurora', 'local_qa', '[QA LOCAL] Subscription ativa.', '{"fixture":true}', '${users.admin}', '${users.admin}'), ('88888888-8888-4888-8888-888888888882', '${tenantIds.horizonte}', '${productId}', '${planIds.growth}', 'suspended', current_date - 45, current_date + 320, 'qa-local-horizonte', 'local_qa', '[QA LOCAL] Subscription em atenção.', '{"fixture":true}', '${users.admin}', '${users.admin}'), ('88888888-8888-4888-8888-888888888883', '${tenantIds.atlas}', '${productId}', '${planIds.enterprise}', 'active', current_date - 60, current_date + 305, 'qa-local-atlas', 'local_qa', '[QA LOCAL] Subscription ativa com alerta.', '{"fixture":true}', '${users.admin}', '${users.admin}') on conflict (id) do update set status=excluded.status, renewal_at=excluded.renewal_at, updated_by_user_id=excluded.updated_by_user_id;

-- Pipelines sintéticos ficam INATIVOS de propósito.
--
-- A tabela analytics_source_config e o contrato que a sincronizacao HubSpot le
-- para saber quais pipelines buscar na API real. Marcar um pipeline ficticio
-- como ativo fazia a sincronizacao real falhar com 404 em
-- GET /crm/v3/pipelines/deals/qa-local-commercial e tambem rompia o contrato
-- coberto por 052_analytics_hubspot_pipe_alignment.sql, que exige exatamente
-- seis pipelines de CS ativos.
--
-- Eles continuam registrados para que as fixtures tenham referência de
-- proveniência; a leitura do Dashboard usa os snapshots hidratados, não este
-- config. Ativar um pipeline sintético é decisão manual e explícita.
insert into public.analytics_source_config (domain_key, object_type, hubspot_pipeline_id, label, is_active) values ('commercial','deal','qa-local-commercial','QA Local Comercial',false), ('cs','ticket','qa-local-cs','QA Local Suporte',false) on conflict (domain_key, object_type, hubspot_pipeline_id) do update set is_active=false, label=excluded.label;
insert into public.hubspot_owners (owner_id, email, first_name, last_name, full_name, raw) values ('qa-local-owner-01','owner-01@qa.local','QA','Owner 01','QA Local Owner 01','{"fixture":true}'::jsonb), ('qa-local-owner-02','owner-02@qa.local','QA','Owner 02','QA Local Owner 02','{"fixture":true}'::jsonb), ('qa-local-owner-03','owner-03@qa.local','QA','Owner 03','QA Local Owner 03','{"fixture":true}'::jsonb) on conflict (owner_id) do update set full_name=excluded.full_name, raw=excluded.raw;
insert into public.hubspot_pipeline_stages (object_type,pipeline_id,stage_id,label,display_order,is_closed,is_won,metadata) values ('deal','qa-local-commercial','qa-stage-open','Aberto',1,false,false,'{"fixture":true}'::jsonb),('deal','qa-local-commercial','qa-stage-won','Ganho',2,true,true,'{"fixture":true}'::jsonb),('deal','qa-local-commercial','qa-stage-lost','Perdido',3,true,false,'{"fixture":true}'::jsonb),('ticket','qa-local-cs','qa-stage-new','Novo',1,false,false,'{"fixture":true}'::jsonb),('ticket','qa-local-cs','qa-stage-progress','Em andamento',2,false,false,'{"fixture":true}'::jsonb),('ticket','qa-local-cs','qa-stage-closed','Fechado',3,true,false,'{"fixture":true}'::jsonb) on conflict (object_type,pipeline_id,stage_id) do update set label=excluded.label, metadata=excluded.metadata;
insert into public.hubspot_companies (company_id,name,domain,tax_id,client_status,contract_status,raw) values ('qa-local-company-aurora','QA Aurora Comércio','qa-local-aurora.local','qa-local-tax-aurora','active','active','{"fixture":true}'::jsonb),('qa-local-company-horizonte','QA Horizonte Digital','qa-local-horizonte.local','qa-local-tax-horizonte','attention','active','{"fixture":true}'::jsonb),('qa-local-company-atlas','QA Atlas Operações','qa-local-atlas.local','qa-local-tax-atlas','critical','limited','{"fixture":true}'::jsonb) on conflict (company_id) do update set name=excluded.name, raw=excluded.raw;
insert into public.hubspot_deals (deal_id,pipeline_id,dealstage,owner_id,amount_home,dealtype,deal_name,hs_created_at,raw) values ('qa-local-deal-01','qa-local-commercial','qa-stage-open','qa-local-owner-01',12000,'newbusiness','[QA LOCAL] Aurora expansão',current_date-20,'{"fixture":true}'::jsonb),('qa-local-deal-02','qa-local-commercial','qa-stage-won','qa-local-owner-02',25000,'renewal','[QA LOCAL] Horizonte renovação',current_date-40,'{"fixture":true}'::jsonb),('qa-local-deal-03','qa-local-commercial','qa-stage-lost','qa-local-owner-03',8000,'newbusiness','[QA LOCAL] Atlas perdido',current_date-60,'{"fixture":true}'::jsonb) on conflict (deal_id) do update set dealstage=excluded.dealstage, amount_home=excluded.amount_home, raw=excluded.raw;
insert into public.hubspot_tickets (ticket_id,pipeline_id,pipeline_stage,source_type,priority,hs_created_at,raw) values ('qa-local-hub-ticket-01','qa-local-cs','qa-stage-new','portal','high',current_date-3,'{"fixture":true}'::jsonb),('qa-local-hub-ticket-02','qa-local-cs','qa-stage-progress','internal','urgent',current_date-8,'{"fixture":true}'::jsonb),('qa-local-hub-ticket-03','qa-local-cs','qa-stage-closed','portal','normal',current_date-15,'{"fixture":true}'::jsonb) on conflict (ticket_id) do update set pipeline_stage=excluded.pipeline_stage, raw=excluded.raw;
delete from public.analytics_finance_receivables where source_key='local_qa_finance' and source_record_id like 'qa-local-%';
insert into public.analytics_finance_receivables (source_key,source_record_id,status_original,aging_bucket,document_number,client_name,net_amount,received_amount,balance,due_date,raw_payload,is_cancelled,is_partial) values
 ('local_qa_finance','qa-local-receivable-01','A vencer','a_vencer','QA-001','QA Aurora Comércio',1000,0,1000,current_date+10,'{"fixture":true}'::jsonb,false,false),('local_qa_finance','qa-local-receivable-02','Vence hoje','vence_hoje','QA-002','QA Aurora Comércio',800,0,800,current_date,'{"fixture":true}'::jsonb,false,false),('local_qa_finance','qa-local-receivable-03','Atrasado','atrasado','QA-003','QA Horizonte Digital',2500,0,2500,current_date-12,'{"fixture":true}'::jsonb,false,false),('local_qa_finance','qa-local-receivable-04','Recebido','recebido','QA-004','QA Horizonte Digital',1800,1800,0,current_date-30,'{"fixture":true}'::jsonb,false,false),('local_qa_finance','qa-local-receivable-05','Recebido parcialmente','recebido_parcialmente','QA-005','QA Atlas Operações',3000,1200,1800,current_date-5,'{"fixture":true}'::jsonb,false,true),('local_qa_finance','qa-local-receivable-06','Cancelado','cancelado','QA-006',null,0,0,0,current_date-20,'{"fixture":true}'::jsonb,true,false)
on conflict (source_key,source_record_id) do update set status_original=excluded.status_original, aging_bucket=excluded.aging_bucket, balance=excluded.balance, raw_payload=excluded.raw_payload;
update public.analytics_integration_schedule set enabled=false, frequency='off', last_run_at=null, last_status=null, last_message='Fixture local: sincronização externa desativada.' where id=true;
do $$ begin
  if not exists (select 1 from public.knowledge_categories) then
    insert into public.knowledge_categories (id,visibility,name,slug,description,created_by_user_id,updated_by_user_id) values ('99999999-9999-4999-8999-999999999991','public','QA Local','qa-local','Conteúdo sintético exclusivo para QA local.','${users.admin}','${users.admin}');
    insert into public.knowledge_articles (id,category_id,visibility,status,title,slug,summary,body_md,published_at,created_by_user_id,updated_by_user_id) values ('99999999-aaaa-4aaa-8aaa-999999999991','99999999-9999-4999-8999-999999999991','public','published','[QA LOCAL] Como validar o portal','qa-local-como-validar-o-portal','Artigo sintético para validar a navegação pública.','# QA LOCAL\\n\\nConteúdo sintético para testes locais.',timezone('utc', now()),'${users.admin}','${users.admin}'), ('99999999-aaaa-4aaa-8aaa-999999999992','99999999-9999-4999-8999-999999999991','internal','draft','[QA LOCAL] Procedimento interno','qa-local-procedimento-interno','Artigo interno sintético.','# QA LOCAL\\n\\nNão publicar.',null,'${users.admin}','${users.admin}');
  end if;
end $$;
commit;`;

runSqlBatch(sql);
mkdirSync('output/local-qa', { recursive: true });
writeFileSync('output/local-qa/accounts.txt', [
  'URL: http://127.0.0.1:54321',
  `Administrador: ${qa.LOCAL_QA_ADMIN_EMAIL} | senha local configurada`,
  `Dashboard viewer: ${qa.LOCAL_QA_DASHBOARD_VIEWER_EMAIL} | senha local configurada`,
  `Support manager: ${qa.LOCAL_QA_SUPPORT_MANAGER_EMAIL} | senha local configurada`,
  `Support agent: ${qa.LOCAL_QA_SUPPORT_AGENT_EMAIL} | senha local configurada`,
  `Cliente: ${qa.LOCAL_QA_CLIENT_EMAIL} | empresa QA Aurora Comércio`,
  `Última hidratação: ${new Date().toISOString()}`,
].join('\n'), 'utf8');
console.log(JSON.stringify({ environment: 'local', hydrated: true, users: 5, tenants: 3, tickets: 18, external_sync: false }));
