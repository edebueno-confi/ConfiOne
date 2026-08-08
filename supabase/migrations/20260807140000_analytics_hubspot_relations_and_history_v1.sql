-- ANALYTICS-HUBSPOT-RELATIONS-AND-HISTORY-V1
--
-- Desbloqueia os dois achados do discovery de 2026-08-07:
--
-- 1. Nenhuma association era ingerida. Ticket ↔ Company e Deal ↔ Company não
--    existiam no read model, o que bloqueava tickets por cliente, MRR com
--    ticket crítico, MRR com SLA vencido e pipeline de expansão por cliente.
--
-- 2. A conta não preenche `closedate` em tickets: 31.530 encerrados, zero com
--    data. Ficou provado que `hs_lastmodifieddate` não serve de substituto —
--    19.888 dos 31.530 se concentram em três dias de julho de 2026, rastro de
--    operação em massa, com mediana de 912 dias entre criação e modificação.
--    A reconstrução correta vem do histórico da propriedade de estágio, que o
--    HubSpot mantém e devolve por `propertiesWithHistory`.
--
-- Este lote cria apenas o destino canônico e o read model derivado. A ingestão
-- vive nos adapters. Nada aqui altera, remove ou renomeia objeto existente.

-- ---------------------------------------------------------------------------
-- 1. Associations
-- ---------------------------------------------------------------------------

create table if not exists public.analytics_hubspot_associations (
  from_object_type text not null,
  from_id text not null,
  to_object_type text not null,
  to_id text not null,
  association_label text null,
  synced_at timestamptz not null default timezone('utc', now()),
  primary key (from_object_type, from_id, to_object_type, to_id),
  constraint analytics_hubspot_associations_from_type check (
    from_object_type in ('tickets', 'deals')
  ),
  constraint analytics_hubspot_associations_to_type check (
    to_object_type in ('companies', 'contacts')
  )
);

comment on table public.analytics_hubspot_associations is
  'Associations do HubSpot em forma canônica. A chave primária composta torna a ingestão idempotente: reprocessar a mesma página não duplica vínculo.';

create index if not exists analytics_hubspot_associations_to_idx
  on public.analytics_hubspot_associations (to_object_type, to_id);

alter table public.analytics_hubspot_associations enable row level security;

drop policy if exists analytics_hubspot_associations_read on public.analytics_hubspot_associations;
create policy analytics_hubspot_associations_read
  on public.analytics_hubspot_associations
  for select
  to authenticated
  using (app_private.can_read_analytics());

revoke all on table public.analytics_hubspot_associations from public, anon;
grant select on table public.analytics_hubspot_associations to authenticated;
grant select, insert, update, delete on table public.analytics_hubspot_associations to service_role;

-- ---------------------------------------------------------------------------
-- 2. Eventos de estágio
-- ---------------------------------------------------------------------------
--
-- Um evento por mudança de estágio, com a data real da transição vinda do
-- histórico de propriedade do HubSpot. Isto é histórico reconstruído da fonte,
-- não inferido do estado atual.

create table if not exists public.analytics_hubspot_stage_events (
  object_type text not null,
  object_id text not null,
  changed_at timestamptz not null,
  stage_id text not null,
  pipeline_id text null,
  source text not null default 'hubspot_property_history',
  ingested_at timestamptz not null default timezone('utc', now()),
  primary key (object_type, object_id, changed_at),
  constraint analytics_hubspot_stage_events_object_type check (
    object_type in ('ticket', 'deal')
  )
);

comment on table public.analytics_hubspot_stage_events is
  'Transições de estágio reconstruídas do histórico de propriedade do HubSpot. Chave por (objeto, instante) garante idempotência da reingestão.';

create index if not exists analytics_hubspot_stage_events_object_idx
  on public.analytics_hubspot_stage_events (object_type, object_id, changed_at);

create index if not exists analytics_hubspot_stage_events_changed_idx
  on public.analytics_hubspot_stage_events (object_type, changed_at);

alter table public.analytics_hubspot_stage_events enable row level security;

drop policy if exists analytics_hubspot_stage_events_read on public.analytics_hubspot_stage_events;
create policy analytics_hubspot_stage_events_read
  on public.analytics_hubspot_stage_events
  for select
  to authenticated
  using (app_private.can_read_analytics());

revoke all on table public.analytics_hubspot_stage_events from public, anon;
grant select on table public.analytics_hubspot_stage_events to authenticated;
grant select, insert, update, delete on table public.analytics_hubspot_stage_events to service_role;

-- Controle de progresso da ingestão de histórico, para permitir retomada sem
-- refazer 34 mil objetos a cada execução.
create table if not exists public.analytics_hubspot_history_sync_state (
  object_type text primary key,
  last_object_id text null,
  objects_processed integer not null default 0,
  events_ingested integer not null default 0,
  completed_at timestamptz null,
  started_at timestamptz null,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint analytics_hubspot_history_sync_state_object_type check (
    object_type in ('ticket', 'deal')
  )
);

comment on table public.analytics_hubspot_history_sync_state is
  'Marca d''água da ingestão de histórico de estágio, por tipo de objeto. Permite retomar de onde parou em vez de reprocessar tudo.';

alter table public.analytics_hubspot_history_sync_state enable row level security;

drop policy if exists analytics_hubspot_history_sync_state_read on public.analytics_hubspot_history_sync_state;
create policy analytics_hubspot_history_sync_state_read
  on public.analytics_hubspot_history_sync_state
  for select
  to authenticated
  using (app_private.can_read_analytics());

revoke all on table public.analytics_hubspot_history_sync_state from public, anon;
grant select on table public.analytics_hubspot_history_sync_state to authenticated;
grant select, insert, update on table public.analytics_hubspot_history_sync_state to service_role;

-- ---------------------------------------------------------------------------
-- 3. Read model derivado: resolução de ticket
-- ---------------------------------------------------------------------------
--
-- Deriva do histórico o que a conta não fornece em propriedade:
--   - resolved_at   : primeira entrada em estágio com ticketState = CLOSED
--   - reopened_count: transições CLOSED → OPEN
--   - is_currently_open, para reconciliar com o estado corrente
--
-- Tickets sem histórico ingerido não aparecem com data nula por engano: a
-- coluna `has_history` distingue "não tem histórico" de "não foi resolvido".

create or replace view public.vw_analytics_ticket_resolution
with (security_invoker = true)
as
with events as (
  select
    e.object_id as ticket_id,
    e.changed_at,
    e.stage_id,
    coalesce(s.metadata ->> 'ticketState', '') = 'CLOSED' as is_closed_stage,
    lag(coalesce(s.metadata ->> 'ticketState', '')) over (
      partition by e.object_id order by e.changed_at
    ) as previous_state
  from public.analytics_hubspot_stage_events e
  left join public.hubspot_pipeline_stages s
    on s.object_type = 'ticket' and s.stage_id = e.stage_id
  where e.object_type = 'ticket'
),
aggregated as (
  select
    ticket_id,
    min(changed_at) filter (where is_closed_stage) as first_closed_at,
    max(changed_at) filter (where is_closed_stage) as last_closed_at,
    count(*) filter (
      where previous_state = 'CLOSED' and not is_closed_stage
    )::integer as reopened_count,
    count(*)::integer as stage_changes
  from events
  group by ticket_id
)
select
  t.ticket_id,
  t.pipeline_id,
  t.hs_created_at,
  a.ticket_id is not null as has_history,
  coalesce(cur.metadata ->> 'ticketState', '') = 'OPEN' as is_currently_open,
  -- Só publica data de resolução para ticket que está encerrado agora.
  case
    when coalesce(cur.metadata ->> 'ticketState', '') = 'CLOSED' then a.last_closed_at
    else null
  end as resolved_at,
  a.first_closed_at,
  coalesce(a.reopened_count, 0) as reopened_count,
  coalesce(a.stage_changes, 0) as stage_changes,
  case
    when coalesce(cur.metadata ->> 'ticketState', '') = 'CLOSED'
      and a.last_closed_at is not null
      and t.hs_created_at is not null
    then round(extract(epoch from (a.last_closed_at - t.hs_created_at)) / 86400.0, 2)
    else null
  end as resolution_days
from public.hubspot_tickets t
left join public.hubspot_pipeline_stages cur
  on cur.object_type = 'ticket'
 and cur.pipeline_id = t.pipeline_id
 and cur.stage_id = t.pipeline_stage
left join aggregated a on a.ticket_id = t.ticket_id;

comment on view public.vw_analytics_ticket_resolution is
  'Data de resolução e reabertura de ticket derivadas do histórico de estágio, já que a conta não preenche a data de fechamento. has_history distingue ausência de histórico de ausência de resolução.';

revoke all on public.vw_analytics_ticket_resolution from public, anon;
grant select on public.vw_analytics_ticket_resolution to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Read model derivado: cliente por ticket e por negócio
-- ---------------------------------------------------------------------------

create or replace view public.vw_analytics_ticket_company
with (security_invoker = true)
as
select
  t.ticket_id,
  t.pipeline_id,
  t.priority,
  t.hs_created_at,
  coalesce(s.metadata ->> 'ticketState', '') = 'OPEN' as is_open,
  t.time_to_first_response_sla_status,
  t.time_to_close_sla_status,
  a.to_id as company_id
from public.hubspot_tickets t
join public.hubspot_pipeline_stages s
  on s.object_type = 'ticket' and s.pipeline_id = t.pipeline_id and s.stage_id = t.pipeline_stage
left join public.analytics_hubspot_associations a
  on a.from_object_type = 'tickets'
 and a.from_id = t.ticket_id
 and a.to_object_type = 'companies';

comment on view public.vw_analytics_ticket_company is
  'Ticket com a empresa associada, quando a association já foi ingerida. company_id nulo significa vínculo ausente, nunca empresa desconhecida inventada.';

revoke all on public.vw_analytics_ticket_company from public, anon;
grant select on public.vw_analytics_ticket_company to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Cobertura de ingestão, para o produto declarar estado parcial com honestidade
-- ---------------------------------------------------------------------------

create or replace function public.rpc_analytics_relations_coverage()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when app_private.can_read_analytics() then
    jsonb_build_object(
      'ticket_company', jsonb_build_object(
        'total', (select count(*) from public.hubspot_tickets),
        'linked', (
          select count(distinct from_id) from public.analytics_hubspot_associations
          where from_object_type = 'tickets' and to_object_type = 'companies'
        )
      ),
      'deal_company', jsonb_build_object(
        'total', (select count(*) from public.hubspot_deals),
        'linked', (
          select count(distinct from_id) from public.analytics_hubspot_associations
          where from_object_type = 'deals' and to_object_type = 'companies'
        )
      ),
      'ticket_history', jsonb_build_object(
        'total', (select count(*) from public.hubspot_tickets),
        'with_history', (
          select count(distinct object_id) from public.analytics_hubspot_stage_events
          where object_type = 'ticket'
        ),
        'resolved_with_date', (
          select count(*) from public.vw_analytics_ticket_resolution where resolved_at is not null
        )
      ),
      'deal_history', jsonb_build_object(
        'total', (select count(*) from public.hubspot_deals),
        'with_history', (
          select count(distinct object_id) from public.analytics_hubspot_stage_events
          where object_type = 'deal'
        )
      ),
      'sync_state', coalesce((
        select jsonb_object_agg(object_type, jsonb_build_object(
          'objects_processed', objects_processed,
          'events_ingested', events_ingested,
          'completed_at', completed_at,
          'updated_at', updated_at
        ))
        from public.analytics_hubspot_history_sync_state
      ), '{}'::jsonb)
    )
  else '{}'::jsonb end;
$$;

comment on function public.rpc_analytics_relations_coverage() is
  'Cobertura real da ingestão de associations e de histórico de estágio. É a fonte que permite ao Dashboard declarar dado parcial em vez de apresentar número incompleto como definitivo.';

revoke all on function public.rpc_analytics_relations_coverage() from public, anon;
grant execute on function public.rpc_analytics_relations_coverage() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. Escrita em lote pelo serviço, idempotente
-- ---------------------------------------------------------------------------

create or replace function public.rpc_service_upsert_hubspot_associations(
  p_from_object_type text,
  p_to_object_type text,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted integer := 0;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Payload inválido.' using errcode = '22023';
  end if;

  insert into public.analytics_hubspot_associations as a (
    from_object_type, from_id, to_object_type, to_id, association_label, synced_at
  )
  select
    p_from_object_type,
    row_value ->> 'from_id',
    p_to_object_type,
    row_value ->> 'to_id',
    nullif(row_value ->> 'label', ''),
    timezone('utc', now())
  from jsonb_array_elements(p_rows) as row_value
  where nullif(row_value ->> 'from_id', '') is not null
    and nullif(row_value ->> 'to_id', '') is not null
  on conflict (from_object_type, from_id, to_object_type, to_id) do update
    set association_label = excluded.association_label,
        synced_at = excluded.synced_at;

  get diagnostics v_inserted = row_count;
  return jsonb_build_object('accepted', v_inserted);
end;
$$;

comment on function public.rpc_service_upsert_hubspot_associations(text, text, jsonb) is
  'Gravação idempotente de associations em lote. Restrita a service_role.';

revoke all on function public.rpc_service_upsert_hubspot_associations(text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.rpc_service_upsert_hubspot_associations(text, text, jsonb)
  to service_role;

create or replace function public.rpc_service_upsert_hubspot_stage_events(
  p_object_type text,
  p_rows jsonb,
  p_last_object_id text default null,
  p_objects_processed integer default 0,
  p_completed boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted integer := 0;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Payload inválido.' using errcode = '22023';
  end if;

  insert into public.analytics_hubspot_stage_events as e (
    object_type, object_id, changed_at, stage_id, pipeline_id, source
  )
  select
    p_object_type,
    row_value ->> 'object_id',
    (row_value ->> 'changed_at')::timestamptz,
    row_value ->> 'stage_id',
    nullif(row_value ->> 'pipeline_id', ''),
    'hubspot_property_history'
  from jsonb_array_elements(p_rows) as row_value
  where nullif(row_value ->> 'object_id', '') is not null
    and nullif(row_value ->> 'changed_at', '') is not null
    and nullif(row_value ->> 'stage_id', '') is not null
  on conflict (object_type, object_id, changed_at) do update
    set stage_id = excluded.stage_id,
        pipeline_id = coalesce(excluded.pipeline_id, e.pipeline_id),
        ingested_at = timezone('utc', now());

  get diagnostics v_inserted = row_count;

  insert into public.analytics_hubspot_history_sync_state as s (
    object_type, last_object_id, objects_processed, events_ingested,
    started_at, completed_at, updated_at
  )
  values (
    p_object_type,
    p_last_object_id,
    greatest(coalesce(p_objects_processed, 0), 0),
    v_inserted,
    timezone('utc', now()),
    case when p_completed then timezone('utc', now()) else null end,
    timezone('utc', now())
  )
  on conflict (object_type) do update
    set last_object_id = case when p_completed then null else coalesce(excluded.last_object_id, s.last_object_id) end,
        objects_processed = case when p_completed then s.objects_processed + excluded.objects_processed
                                 else s.objects_processed + excluded.objects_processed end,
        events_ingested = s.events_ingested + excluded.events_ingested,
        completed_at = case when p_completed then timezone('utc', now()) else null end,
        started_at = coalesce(s.started_at, excluded.started_at),
        updated_at = timezone('utc', now());

  return jsonb_build_object('accepted', v_inserted, 'completed', p_completed);
end;
$$;

comment on function public.rpc_service_upsert_hubspot_stage_events(text, jsonb, text, integer, boolean) is
  'Gravação idempotente de eventos de estágio com avanço da marca d''água de retomada. Restrita a service_role.';

revoke all on function public.rpc_service_upsert_hubspot_stage_events(text, jsonb, text, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.rpc_service_upsert_hubspot_stage_events(text, jsonb, text, integer, boolean)
  to service_role;
