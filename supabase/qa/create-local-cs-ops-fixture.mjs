import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { resolveSupabaseCliCommand } from '../../scripts/lib/supabase-cli-command.mjs';

const WORKBOOK = process.env.CS_OPS_WORKBOOK ?? 'C:\\Users\\edebu\\Downloads\\CS Ops _ Carteiras e Clusters -v2.xlsx';
const PYTHON = process.env.CODEX_PYTHON ?? 'C:\\Users\\edebu\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';
const SOURCE = 'cs_ops_workbook_20260719';
const PRODUCT_ID = '4d4e0c1d-7f38-4c28-9b9f-2f5b5fc9d901';
const PLAN_ID = '5e5f1d2e-8a49-4d39-acaf-3f6c6fdad012';
const CSM_USERS = [
  { key: 'sirlei', match: /sirlei/i, email: 'qa.local.cs-sirlei@genius.local', password: 'Local-QA-CS-Sirlei-2026!', name: 'Sirlei Cândido' },
  { key: 'mary', match: /mary|laurentino/i, email: 'qa.local.cs-mary@genius.local', password: 'Local-QA-CS-Mary-2026!', name: 'Mary Laurentino' },
  { key: 'rodolfo', match: /rodolfo|turra/i, email: 'qa.local.cs-rodolfo@genius.local', password: 'Local-QA-CS-Rodolfo-2026!', name: 'Rodolfo Turra' },
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function sqlEscape(value) {
  return String(value ?? '').replaceAll("'", "''");
}

function sqlText(value) {
  return value === null || value === undefined || String(value).trim() === '' ? 'null' : `'${sqlEscape(value)}'`;
}

function sqlJson(value) {
  return `'${sqlEscape(JSON.stringify(value ?? {}))}'::jsonb`;
}

function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function digits(value) {
  return String(value ?? '').replace(/\.0+$/, '').replace(/\D/g, '');
}

function slugify(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'cliente';
}

function segmentKey(value) {
  return slugify(value).replaceAll('-', '_').slice(0, 48) || 'sem_csm';
}

function stableUuid(namespace, value) {
  const hex = createHash('sha1').update(`${namespace}:${value}`).digest('hex').slice(0, 32).split('');
  hex[12] = '5';
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const raw = hex.join('');
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
}

function runProcess(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: process.env, maxBuffer: 12 * 1024 * 1024, ...options });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) fail([result.stderr, result.stdout].filter(Boolean).join('\n'));
  return result.stdout?.trim() ?? '';
}

function cli(args) {
  return resolveSupabaseCliCommand(args);
}

function query(sql) {
  const dir = mkdtempSync(join(tmpdir(), 'gso-cs-ops-seed-'));
  const file = join(dir, 'query.sql');
  writeFileSync(file, `${sql.trim()}\n`, 'utf8');
  try {
    const resolved = cli(['db', 'query', '--local', '--file', file, '--output', 'json']);
    const output = runProcess(resolved.command, resolved.args);
    if (!output) return { rows: [] };
    if (/^(INSERT|UPDATE|DELETE|BEGIN|COMMIT|SET|RESET|DO)\b/i.test(output)) return { rows: [] };
    const parsed = JSON.parse(output);
    if (Array.isArray(parsed)) return { rows: parsed.at(-1)?.rows ?? parsed };
    return parsed?.rows ? parsed : { rows: [] };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function executeBlock(sql) {
  query(`do $$ begin\n${sql.trim()}\nend $$;`);
}

function localEnv() {
  const resolved = cli(['status', '-o', 'env']);
  const output = runProcess(resolved.command, resolved.args);
  const values = Object.fromEntries(output.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
    return match ? [[match[1], match[2]]] : [];
  }));
  if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(values.API_URL ?? '') || !values.SERVICE_ROLE_KEY) {
    fail('Seed bloqueado: o script aceita somente Supabase local com SERVICE_ROLE_KEY local.');
  }
  return values;
}

function readWorkbook() {
  const code = String.raw`
import json, sys
from openpyxl import load_workbook
path=sys.argv[1]
wb=load_workbook(path, read_only=False, data_only=True)
ws=wb['BD_Clientes']
headers=[str(c.value).strip() if c.value is not None else '' for c in ws[4]]
rows=[]
for row_number in range(5, (ws.max_row or 0)+1):
    values=[ws.cell(row_number, column).value for column in range(1, (ws.max_column or 0)+1)]
    if not any(v not in (None, '') for v in values[:25]):
        continue
    item={headers[index] or f'col_{index+1}': values[index] for index in range(min(len(headers), len(values)))}
    item['_source_row_number']=row_number
    rows.append(item)
print(json.dumps(rows, ensure_ascii=False, default=str))
`;
  const output = runProcess(PYTHON, ['-c', code, WORKBOOK], { maxBuffer: 20 * 1024 * 1024 });
  try {
    return JSON.parse(output);
  } catch {
    fail('Não foi possível interpretar a extração da aba BD_Clientes.');
  }
}

async function ensureAuthUser(env, user) {
  const existing = query(`select id::text as id from auth.users where lower(email) = lower('${sqlEscape(user.email)}') limit 1;`).rows?.[0];
  const response = await fetch(`${env.API_URL}/auth/v1/admin/users${existing?.id ? `/${existing.id}` : ''}`, {
    method: existing?.id ? 'PUT' : 'POST',
    headers: { apikey: env.SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password, email_confirm: true, user_metadata: { full_name: user.name, name: user.name, locale: 'pt-BR', timezone: 'America/Sao_Paulo' } }),
  });
  if (!response.ok) fail(`Falha ao criar usuário local ${user.email}: HTTP ${response.status} ${await response.text()}`);
  const authUser = await response.json();
  query(`insert into public.profiles (id, full_name, email, locale, timezone, is_active) values ('${sqlEscape(authUser.id)}'::uuid, '${sqlEscape(user.name)}', '${sqlEscape(user.email)}'::citext, 'pt-BR', 'America/Sao_Paulo', true) on conflict (id) do update set full_name=excluded.full_name,email=excluded.email,is_active=true,updated_at=timezone('utc',now());`);
  return authUser.id;
}

function buildRecords(rows, ownerIds) {
  const seen = new Set();
  return rows.flatMap((row) => {
    const clientId = digits(row.Cliente_ID) || `row-${row._source_row_number}`;
    const sourceRecordId = seen.has(clientId) ? `${clientId}-${row._source_row_number}` : clientId;
    seen.add(clientId);
    const displayName = String(row.Nome_Plataforma ?? row.Razao_Social ?? `Cliente ${clientId}`).trim();
    const legalName = String(row.Razao_Social ?? displayName).trim();
    const active = normalize(row.Ativo) === 'sim';
    const test = normalize(row.Teste) === 'sim';
    const churn = normalize(row.Churn_Registrado) === 'sim';
    const tenantStatus = active && !churn ? 'active' : test || churn ? 'suspended' : 'archived';
    const cluster = String(row.Cluster_Final ?? row.Cluster_Sugerido ?? 'Sem CSM dedicado').trim();
    const portfolio = String(row.Carteira_Final ?? row.Carteira_Sugerida ?? 'Sem carteira ativa').trim();
    const responsible = String(row.Responsavel_Final ?? '').trim();
    const owner = CSM_USERS.find((candidate) => candidate.match.test(responsible));
    const ownerId = owner ? ownerIds[owner.key] : null;
    const health = String(row.Health ?? row.Farol ?? 'Indisponível').trim();
    const priority = /^p[1-4]$/i.test(String(row.Prioridade_CS ?? '')) ? String(row.Prioridade_CS).toLowerCase() : health.toLowerCase() === 'vermelho' ? 'p1' : 'p3';
    const mrr = Number(row.MRR_Mensal ?? row.Valor_MRR ?? 0);
    const slug = `csops-${slugify(sourceRecordId)}-${slugify(displayName)}`.slice(0, 95);
    const tenantId = stableUuid('csops-tenant', sourceRecordId);
    const contactId = stableUuid('csops-contact', sourceRecordId);
    const subscriptionId = stableUuid('csops-subscription', sourceRecordId);
    const ticketId = stableUuid('csops-ticket', sourceRecordId);
    const messageId = stableUuid('csops-message', sourceRecordId);
    const assignmentId = stableUuid('csops-assignment', sourceRecordId);
    const eventId = stableUuid('csops-event', sourceRecordId);
    const actionId = stableUuid('csops-action', sourceRecordId);
    return [{ sourceRecordId, sourceRow: row._source_row_number, displayName, legalName, active, test, churn, tenantStatus, cluster, portfolio, responsible, ownerId, health, priority, mrr: Number.isFinite(mrr) ? mrr : 0, slug, tenantId, contactId, subscriptionId, ticketId, messageId, assignmentId, eventId, actionId, cnpj: row.CNPJ ? String(row.CNPJ) : null, hubspotId: row.Hubspot_ID ? digits(row.Hubspot_ID) : null, service: row.Servico ? String(row.Servico) : null, migrationStatus: row.Status_Migracao ? String(row.Status_Migracao) : null }];
  });
}

function runBatch(records, actorId, ownerIds) {
  const productAndSegments = `
    insert into public.commercial_products (id, product_key, display_name, description, status, created_by_user_id, updated_by_user_id)
    values ('${PRODUCT_ID}'::uuid, 'after_sale_cs_ops', 'After Sale / CS Ops', 'Catálogo local para seed da operação de Customer Success.', 'active'::public.commercial_product_status, '${actorId}'::uuid, '${actorId}'::uuid)
    on conflict (product_key) do update set display_name=excluded.display_name,status=excluded.status,updated_by_user_id=excluded.updated_by_user_id;
    insert into public.commercial_product_plans (id, product_id, plan_key, display_name, description, status, created_by_user_id, updated_by_user_id)
    values ('${PLAN_ID}'::uuid, '${PRODUCT_ID}'::uuid, 'cs_ops_seed', 'CS Ops | Seed local', 'Plano técnico para validar carteira, tickets e ações.', 'active'::public.commercial_product_plan_status, '${actorId}'::uuid, '${actorId}'::uuid)
    on conflict (product_id, plan_key) do update set display_name=excluded.display_name,status=excluded.status,updated_by_user_id=excluded.updated_by_user_id;
  `;
  executeBlock(productAndSegments);

  const segmentRows = [...new Map(records.map((r) => [segmentKey(r.cluster), r.cluster])).entries()];
  query(`insert into public.customer_segments (key,label,description,color_token,sort_order,is_active) values ${segmentRows.map(([key,label], index) => `('${sqlEscape(key)}','${sqlEscape(label)}','Cluster importado da planilha CS Ops.','${index % 2 ? 'info' : 'warning'}',${index},true)`).join(',')} on conflict (key) do update set label=excluded.label,description=excluded.description,is_active=true;`);

  const batchSize = 40;
  for (let offset = 0; offset < records.length; offset += batchSize) {
    const batch = records.slice(offset, offset + batchSize);
    executeBlock(`
      insert into public.tenants (id,slug,legal_name,display_name,status,created_by_user_id,updated_by_user_id)
      values ${batch.map((r) => `('${r.tenantId}'::uuid,'${sqlEscape(r.slug)}','${sqlEscape(r.legalName)}','${sqlEscape(r.displayName)}','${r.tenantStatus}'::public.tenant_status,'${actorId}'::uuid,'${actorId}'::uuid)`).join(',')}
      on conflict do nothing;
      update public.tenants t set legal_name=s.legal_name,display_name=s.display_name,status=s.status,updated_by_user_id='${actorId}'::uuid,updated_at=timezone('utc',now()) from (values ${batch.map((r) => `('${sqlEscape(r.slug)}','${sqlEscape(r.legalName)}','${sqlEscape(r.displayName)}','${r.tenantStatus}'::public.tenant_status)`).join(',')}) s(slug,legal_name,display_name,status) where lower(t.slug)=lower(s.slug);
      insert into public.customer_account_profiles (tenant_id,product_line,operational_status,account_tier,internal_notes,operational_flags,created_by_user_id,updated_by_user_id)
      select t.id,'after_sale'::public.customer_product_line,case when t.status='active'::public.tenant_status then 'active'::public.customer_operational_status when t.status='suspended'::public.tenant_status then 'limited'::public.customer_operational_status else 'legacy'::public.customer_operational_status end,s.cluster,s.notes,s.flags,'${actorId}'::uuid,'${actorId}'::uuid from (values ${batch.map((r) => `('${sqlEscape(r.slug)}','${sqlEscape(r.cluster)}','${sqlEscape(JSON.stringify({ source: SOURCE, source_row: r.sourceRow, source_record_id: r.sourceRecordId, portfolio: r.portfolio, responsible: r.responsible, health: r.health, priority: r.priority, cnpj: r.cnpj, hubspot_id: r.hubspotId, mrr: r.mrr, service: r.service, migration_status: r.migrationStatus }) )}'::text,'${sqlEscape(JSON.stringify({ high_touch_account: /key accounts|enterprise|estrateg/i.test(r.portfolio), custom_operational_flow: Boolean(r.service), financial_attention_required: normalize(r.health) === 'vermelho', restricted_support_window: false, integration_sensitive_account: Boolean(r.service) }))}'::jsonb)`).join(',')}) s(slug,cluster,notes,flags) join public.tenants t on lower(t.slug)=lower(s.slug) on conflict (tenant_id) do update set product_line=excluded.product_line,operational_status=excluded.operational_status,account_tier=excluded.account_tier,internal_notes=excluded.internal_notes,operational_flags=excluded.operational_flags,updated_by_user_id=excluded.updated_by_user_id,updated_at=timezone('utc',now());
      insert into public.customer_segment_assignments (tenant_id,segment_id,assigned_by_user_id)
      select t.id,cs.id,'${actorId}'::uuid from (values ${batch.map((r) => `('${sqlEscape(r.slug)}','${sqlEscape(segmentKey(r.cluster))}')`).join(',')}) s(slug,segment_key) join public.tenants t on lower(t.slug)=lower(s.slug) join public.customer_segments cs on cs.key=s.segment_key on conflict (tenant_id) do update set segment_id=excluded.segment_id,assigned_by_user_id=excluded.assigned_by_user_id,updated_at=timezone('utc',now());
      insert into public.tenant_contacts (id,tenant_id,full_name,is_primary,is_active,created_by_user_id,updated_by_user_id)
      select '${batch[0].contactId}'::uuid,t.id,'CS Ops | Contato principal','true','true','${actorId}'::uuid,'${actorId}'::uuid from public.tenants t where t.slug='${sqlEscape(batch[0].slug)}' and not exists (select 1 from public.tenant_contacts c where c.tenant_id=t.id and c.is_primary and c.is_active);
      ${batch.slice(1).map((r) => `insert into public.tenant_contacts (id,tenant_id,full_name,is_primary,is_active,created_by_user_id,updated_by_user_id) select '${r.contactId}'::uuid,t.id,'CS Ops | Contato principal',true,true,'${actorId}'::uuid,'${actorId}'::uuid from public.tenants t where t.slug='${sqlEscape(r.slug)}' and not exists (select 1 from public.tenant_contacts c where c.tenant_id=t.id and c.is_primary and c.is_active);`).join('\n')}
    `);
    executeBlock(`
      insert into public.customer_product_subscriptions (id,tenant_id,product_id,plan_id,status,started_at,contract_reference,source,notes_internal,metadata,created_by_user_id,updated_by_user_id)
      select s.id,t.id,'${PRODUCT_ID}'::uuid,'${PLAN_ID}'::uuid,s.status,timezone('utc',now()),s.contract_reference,'${SOURCE}',s.notes,s.metadata,'${actorId}'::uuid,'${actorId}'::uuid from (values ${batch.map((r) => `('${r.subscriptionId}'::uuid,'${sqlEscape(r.slug)}',case when '${r.tenantStatus}'='active' then 'active'::public.customer_product_subscription_status when '${r.tenantStatus}'='suspended' then 'suspended'::public.customer_product_subscription_status else 'cancelled'::public.customer_product_subscription_status end,'${sqlEscape(r.hubspotId ?? '')}','${sqlEscape(`Carteira: ${r.portfolio}; Responsável: ${r.responsible || 'não definido'}`)}',${sqlJson({ source: SOURCE, source_row: r.sourceRow, source_record_id: r.sourceRecordId, mrr: r.mrr, service: r.service })})`).join(',')}) s(id,slug,status,contract_reference,notes,metadata) join public.tenants t on lower(t.slug)=lower(s.slug) where not exists (select 1 from public.customer_product_subscriptions current where current.tenant_id=t.id and current.product_id='${PRODUCT_ID}'::uuid and current.archived_at is null);
      insert into public.customer_product_internal_owners (id,subscription_id,owner_user_id,area_key,owner_role,status,notes_internal,created_by_user_id,updated_by_user_id)
      select '${batch[0].subscriptionId}'::uuid,sub.id,null,'customer_success','cs_owner'::public.customer_product_internal_owner_role,'active'::public.customer_product_internal_owner_status,'Sem responsável identificado na planilha.', '${actorId}'::uuid,'${actorId}'::uuid from public.customer_product_subscriptions sub where false;
      ${batch.filter((r) => r.ownerId).map((r) => `insert into public.customer_product_internal_owners (id,subscription_id,owner_user_id,area_key,owner_role,status,notes_internal,created_by_user_id,updated_by_user_id) select '${stableUuid('csops-owner', r.sourceRecordId)}'::uuid,sub.id,'${r.ownerId}'::uuid,'customer_success','cs_owner'::public.customer_product_internal_owner_role,'active'::public.customer_product_internal_owner_status,'Responsável importado da coluna Responsavel_Final da planilha CS Ops.','${actorId}'::uuid,'${actorId}'::uuid from public.customer_product_subscriptions sub where sub.id='${r.subscriptionId}'::uuid on conflict do nothing;`).join('\n')}
    `);
    executeBlock(`
      insert into public.tickets (id,tenant_id,requester_contact_id,title,description,source,status,priority,severity,created_by_user_id,assigned_to_user_id,conversation_type_key)
      select '${batch[0].ticketId}'::uuid,t.id,c.id,'CS Ops | Acompanhamento da carteira','Registro local derivado da planilha CS Ops; origem ${SOURCE}; linha ${batch[0].sourceRow}.','internal'::public.ticket_source,'${batch[0].ownerId ? 'in_progress' : 'new'}'::public.ticket_status,'${batch[0].priority === 'p1' ? 'urgent' : batch[0].priority === 'p2' ? 'high' : 'normal'}'::public.ticket_priority,'${batch[0].health.toLowerCase() === 'vermelho' ? 'high' : 'medium'}'::public.ticket_severity,'${actorId}'::uuid,${batch[0].ownerId ? `'${batch[0].ownerId}'::uuid` : 'null'},'solicitacao' from public.tenants t join public.tenant_contacts c on c.tenant_id=t.id and c.is_primary and c.is_active where t.id='${batch[0].tenantId}'::uuid on conflict (id) do update set title=excluded.title,description=excluded.description,status=excluded.status,priority=excluded.priority,severity=excluded.severity,assigned_to_user_id=excluded.assigned_to_user_id,updated_by_user_id='${actorId}'::uuid,updated_at=timezone('utc',now());
      ${batch.slice(1).map((r) => `insert into public.tickets (id,tenant_id,requester_contact_id,title,description,source,status,priority,severity,created_by_user_id,assigned_to_user_id,conversation_type_key) select '${r.ticketId}'::uuid,t.id,c.id,'CS Ops | Acompanhamento da carteira','Registro local derivado da planilha CS Ops; origem ${SOURCE}; linha ${r.sourceRow}.','internal'::public.ticket_source,'${r.ownerId ? 'in_progress' : 'new'}'::public.ticket_status,'${r.priority === 'p1' ? 'urgent' : r.priority === 'p2' ? 'high' : 'normal'}'::public.ticket_priority,'${r.health.toLowerCase() === 'vermelho' ? 'high' : 'medium'}'::public.ticket_severity,'${actorId}'::uuid,${r.ownerId ? `'${r.ownerId}'::uuid` : 'null'},'solicitacao' from public.tenants t join public.tenant_contacts c on c.tenant_id=t.id and c.is_primary and c.is_active where t.id='${r.tenantId}'::uuid on conflict (id) do update set title=excluded.title,description=excluded.description,status=excluded.status,priority=excluded.priority,severity=excluded.severity,assigned_to_user_id=excluded.assigned_to_user_id,updated_by_user_id='${actorId}'::uuid,updated_at=timezone('utc',now());`).join('\n')}
      insert into public.ticket_messages (id,tenant_id,ticket_id,visibility,body,created_by_user_id,metadata) select '${batch[0].messageId}'::uuid,'${batch[0].tenantId}'::uuid,'${batch[0].ticketId}'::uuid,'internal'::public.message_visibility,'Seed local CS Ops materializado para teste da operação.','${actorId}'::uuid,${sqlJson({ source: SOURCE, kind: 'seed' })} where not exists (select 1 from public.ticket_messages where id='${batch[0].messageId}'::uuid);
      insert into public.ticket_events (id,tenant_id,ticket_id,event_type,visibility,actor_user_id,message_id,metadata) select '${batch[0].eventId}'::uuid,'${batch[0].tenantId}'::uuid,'${batch[0].ticketId}'::uuid,'ticket_created'::public.ticket_event_type,'internal'::public.message_visibility,'${actorId}'::uuid,'${batch[0].messageId}'::uuid,${sqlJson({ source: SOURCE, kind: 'seed' })} where not exists (select 1 from public.ticket_events where id='${batch[0].eventId}'::uuid);
      ${batch.filter((r) => r.ownerId).map((r) => `insert into public.ticket_assignments (id,tenant_id,ticket_id,assignment_kind,assigned_to_user_id,assigned_by_user_id) values ('${r.assignmentId}'::uuid,'${r.tenantId}'::uuid,'${r.ticketId}'::uuid,'assigned'::public.ticket_assignment_kind,'${r.ownerId}'::uuid,'${actorId}'::uuid) on conflict (id) do nothing;`).join('\n')}
      ${batch.map((r) => `insert into public.internal_actions (id,tenant_id,ticket_id,target_area,support_type,priority,status,summary,context,requested_by_user_id,assigned_area_user_id,updated_by_user_id) values ('${r.actionId}'::uuid,'${r.tenantId}'::uuid,'${r.ticketId}'::uuid,'customer_success','information_request'::public.internal_action_support_type,'${r.priority === 'p1' ? 'urgent' : r.priority === 'p2' ? 'high' : 'normal'}'::public.ticket_priority,'${r.ownerId ? 'assigned' : 'open'}'::public.internal_action_status,'CS Ops | Revisar carteira de ${sqlEscape(r.displayName)}','Ação local derivada da planilha ${SOURCE}, linha ${r.sourceRow}. Cluster: ${sqlEscape(r.cluster)}; carteira: ${sqlEscape(r.portfolio)}; health: ${sqlEscape(r.health)}.','${actorId}'::uuid,${r.ownerId ? `'${r.ownerId}'::uuid` : 'null'},'${actorId}'::uuid) on conflict (id) do update set status=excluded.status,priority=excluded.priority,summary=excluded.summary,context=excluded.context,assigned_area_user_id=excluded.assigned_area_user_id,updated_by_user_id=excluded.updated_by_user_id,updated_at=timezone('utc',now());`).join('\n')}
    `);
    console.log(`[cs-ops-seed] ${Math.min(offset + batchSize, records.length)}/${records.length}`);
  }
}

const env = localEnv();
const actor = query("select p.id::text as id from public.profiles p join public.user_global_roles r on r.user_id=p.id where r.role='platform_admin'::public.platform_role and p.is_active order by p.created_at limit 1;").rows?.[0];
if (!actor?.id) fail('Nenhum platform_admin local encontrado. Execute antes o fixture de admin local.');
const ownerIds = {};
for (const user of CSM_USERS) ownerIds[user.key] = await ensureAuthUser(env, user);
const rows = readWorkbook();
const records = buildRecords(rows, ownerIds);
if (!records.length) fail('A planilha não possui registros válidos na aba BD_Clientes.');
runBatch(records, actor.id, ownerIds);
const verification = query(`select (select count(*)::int from public.tenants where slug like 'csops-%') as tenants,(select count(*)::int from public.customer_account_profiles p join public.tenants t on t.id=p.tenant_id where t.slug like 'csops-%') as customer_profiles,(select count(*)::int from public.customer_product_subscriptions s join public.tenants t on t.id=s.tenant_id where t.slug like 'csops-%') as subscriptions,(select count(*)::int from public.tickets t where t.title='CS Ops | Acompanhamento da carteira') as tickets,(select count(*)::int from public.internal_actions a join public.tenants t on t.id=a.tenant_id where t.slug like 'csops-%') as actions,(select count(*)::int from public.customer_product_internal_owners o join public.customer_product_subscriptions s on s.id=o.subscription_id join public.tenants t on t.id=s.tenant_id where t.slug like 'csops-%') as owners;`);
console.log(JSON.stringify({ fixture: 'local-cs-ops-workbook', source: SOURCE, workbook: WORKBOOK, source_rows: rows.length, materialized: verification.rows?.[0] ?? null, local_only: true }, null, 2));
