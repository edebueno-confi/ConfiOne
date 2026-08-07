-- ANALYTICS-ASSOCIATIONS-RESUMABLE-V1
--
-- Correção de defeito encontrado na primeira execução real em 2026-08-07.
--
-- O problema
-- ----------
-- `hubspot-associations-sync` aceitava um cursor no corpo da requisição, mas não
-- o persistia. Cada invocação recomeçava do primeiro registro. Como uma execução
-- cabe no orçamento de tempo apenas parcialmente — 34.371 tickets exigem 344
-- páginas —, chamadas repetidas reprocessariam sempre o mesmo início e a
-- ingestão nunca alcançaria o fim da base.
--
-- A ingestão de histórico de estágio já fazia certo, persistindo a marca d'água
-- no banco. Esta migration leva a mesma garantia para os vínculos.
--
-- Não há perda: a gravação sempre foi idempotente pela chave composta, então o
-- reprocessamento não duplicou nada. O defeito era de progresso, não de dado.

create table if not exists public.analytics_hubspot_associations_sync_state (
  object_type text primary key,
  last_object_id text null,
  objects_processed integer not null default 0,
  links_ingested integer not null default 0,
  completed_at timestamptz null,
  started_at timestamptz null,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint analytics_hubspot_associations_sync_state_type check (
    object_type in ('tickets', 'deals')
  )
);

comment on table public.analytics_hubspot_associations_sync_state is
  'Marca d''água da ingestão de vínculos, por tipo de objeto. Permite retomar de onde parou em vez de reprocessar a base inteira a cada execução.';

alter table public.analytics_hubspot_associations_sync_state enable row level security;

drop policy if exists analytics_hubspot_associations_sync_state_read
  on public.analytics_hubspot_associations_sync_state;
create policy analytics_hubspot_associations_sync_state_read
  on public.analytics_hubspot_associations_sync_state
  for select
  to authenticated
  using (app_private.can_read_analytics());

revoke all on table public.analytics_hubspot_associations_sync_state from public, anon, authenticated;
grant select, insert, update on table public.analytics_hubspot_associations_sync_state to service_role;

-- Gravação de vínculos com avanço da marca d'água na mesma transação, para que
-- uma interrupção no meio não pule nem repita objetos.
create or replace function public.rpc_service_upsert_hubspot_associations(
  p_from_object_type text,
  p_to_object_type text,
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

  insert into public.analytics_hubspot_associations_sync_state as s (
    object_type, last_object_id, objects_processed, links_ingested,
    started_at, completed_at, updated_at
  )
  values (
    p_from_object_type,
    p_last_object_id,
    greatest(coalesce(p_objects_processed, 0), 0),
    v_inserted,
    timezone('utc', now()),
    case when p_completed then timezone('utc', now()) else null end,
    timezone('utc', now())
  )
  on conflict (object_type) do update
    set last_object_id = case when p_completed then null
                              else coalesce(excluded.last_object_id, s.last_object_id) end,
        objects_processed = case when p_completed then 0
                                 else s.objects_processed + excluded.objects_processed end,
        links_ingested = s.links_ingested + excluded.links_ingested,
        completed_at = case when p_completed then timezone('utc', now()) else null end,
        started_at = coalesce(s.started_at, excluded.started_at),
        updated_at = timezone('utc', now());

  return jsonb_build_object('accepted', v_inserted, 'completed', p_completed);
end;
$$;

comment on function public.rpc_service_upsert_hubspot_associations(text, text, jsonb, text, integer, boolean) is
  'Gravação idempotente de vínculos em lote, com avanço da marca d''água de retomada na mesma transação. Restrita a service_role.';

revoke all on function public.rpc_service_upsert_hubspot_associations(text, text, jsonb, text, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.rpc_service_upsert_hubspot_associations(text, text, jsonb, text, integer, boolean)
  to service_role;

-- A assinatura antiga de três argumentos é removida para não deixar dois
-- contratos ativos para a mesma operação.
drop function if exists public.rpc_service_upsert_hubspot_associations(text, text, jsonb);

-- A cobertura publicada passa a informar também o progresso da ingestão.
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
      'history_sync_state', coalesce((
        select jsonb_object_agg(object_type, jsonb_build_object(
          'objects_processed', objects_processed,
          'events_ingested', events_ingested,
          'completed_at', completed_at,
          'updated_at', updated_at
        ))
        from public.analytics_hubspot_history_sync_state
      ), '{}'::jsonb),
      'associations_sync_state', coalesce((
        select jsonb_object_agg(object_type, jsonb_build_object(
          'objects_processed', objects_processed,
          'links_ingested', links_ingested,
          'completed_at', completed_at,
          'updated_at', updated_at
        ))
        from public.analytics_hubspot_associations_sync_state
      ), '{}'::jsonb)
    )
  else '{}'::jsonb end;
$$;

revoke all on function public.rpc_analytics_relations_coverage() from public, anon;
grant execute on function public.rpc_analytics_relations_coverage() to authenticated, service_role;
