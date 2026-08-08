-- CONCILIACAO MANUAL HUBSPOT <-> OMIE
--
-- Similaridade de nome só propõe uma candidata. Este registro é a decisão de
-- uma pessoa autorizada e vive exclusivamente no nosso banco: nenhum dado é
-- escrito no HubSpot ou no OMIE.

create table public.analytics_company_reconciliation_decisions (
  id uuid primary key default extensions.gen_random_uuid(),
  source_key text not null,
  source_name text not null,
  source_tax_id text,
  company_id text not null references public.hubspot_companies(company_id),
  status text not null check (status in ('confirmed', 'discarded', 'revoked')),
  evidence text not null,
  decided_by_user_id uuid not null references auth.users(id),
  decided_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (source_key, company_id)
);

create unique index analytics_company_reconciliation_one_confirmed_idx
  on public.analytics_company_reconciliation_decisions (source_key)
  where status = 'confirmed';

create index analytics_company_reconciliation_source_idx
  on public.analytics_company_reconciliation_decisions (source_key, status);

alter table public.analytics_company_reconciliation_decisions enable row level security;
create policy analytics_company_reconciliation_decisions_admin_read
  on public.analytics_company_reconciliation_decisions for select to authenticated
  using (app_private.has_global_role('platform_admin'::public.platform_role));

revoke all on public.analytics_company_reconciliation_decisions from public, anon, authenticated;

create table audit.company_reconciliation_decision_events (
  id uuid primary key default extensions.gen_random_uuid(),
  decision_id uuid references public.analytics_company_reconciliation_decisions(id),
  source_key text not null,
  company_id text not null,
  event_type text not null check (event_type in ('confirmed', 'discarded', 'revoked')),
  evidence text not null,
  actor_user_id uuid not null references auth.users(id),
  occurred_at timestamptz not null default timezone('utc', now())
);

revoke all on audit.company_reconciliation_decision_events from public, anon, authenticated;

create or replace function app_private.company_reconciliation_source_key(
  p_name text,
  p_tax_id text
)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when nullif(regexp_replace(coalesce(p_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
      then 'tax:' || regexp_replace(p_tax_id, '[^0-9]', '', 'g')
    when app_private.normalize_company_name(p_name) is not null
      then 'name:' || app_private.normalize_company_name(p_name)
    else null
  end;
$$;

revoke all on function app_private.company_reconciliation_source_key(text, text) from public, anon, authenticated;
grant execute on function app_private.company_reconciliation_source_key(text, text) to service_role;

create or replace function public.rpc_analytics_company_reconciliation_queue(
  p_limit integer default 100,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  with source_rows as (
    select
      app_private.company_reconciliation_source_key(f.client_name, f.client_tax_id) as source_key,
      max(nullif(btrim(f.client_name), '')) as source_name,
      max(nullif(btrim(f.client_tax_id), '')) as source_tax_id,
      count(*)::integer as title_count,
      coalesce(sum(f.balance), 0)::numeric as total_balance
    from public.analytics_finance_receivables f
    where app_private.company_reconciliation_source_key(f.client_name, f.client_tax_id) is not null
    group by 1
  ), rows_with_decisions as (
    select s.*, d.company_id as confirmed_company_id, d.status as decision_status
    from source_rows s
    left join public.analytics_company_reconciliation_decisions d
      on d.source_key = s.source_key and d.status = 'confirmed'
  ), items as (
    select jsonb_build_object(
      'source_key', r.source_key,
      'source_name', r.source_name,
      'source_tax_id', r.source_tax_id,
      'title_count', r.title_count,
      'total_balance', r.total_balance,
      'status', case when r.confirmed_company_id is not null then 'confirmed' else 'pending' end,
      'candidates', coalesce(c.payload, '[]'::jsonb)
    ) as value
    from rows_with_decisions r
    left join lateral (
      select jsonb_agg(jsonb_build_object(
        'company_id', c.company_id,
        'company_name', c.name,
        'tax_id', c.tax_id,
        'score', round(case
          when regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = nullif(regexp_replace(coalesce(r.source_tax_id, ''), '[^0-9]', '', 'g'), '')
            and nullif(regexp_replace(coalesce(r.source_tax_id, ''), '[^0-9]', '', 'g'), '') is not null then 1.0
          when app_private.normalize_company_name(c.name) = app_private.normalize_company_name(r.source_name) then 0.9
          else extensions.similarity(app_private.normalize_company_name(c.name), app_private.normalize_company_name(r.source_name))
        end::numeric, 3),
        'reason', case
          when regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = nullif(regexp_replace(coalesce(r.source_tax_id, ''), '[^0-9]', '', 'g'), '')
            and nullif(regexp_replace(coalesce(r.source_tax_id, ''), '[^0-9]', '', 'g'), '') is not null then 'cnpj_exato'
          when app_private.normalize_company_name(c.name) = app_private.normalize_company_name(r.source_name) then 'nome_exato'
          else 'nome_similar'
        end,
        'decision', coalesce(d.status, 'suggested')
      ) order by c.company_id) as payload
      from (
        select c.*
        from public.hubspot_companies c
        where c.company_id = r.confirmed_company_id
           or regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = nullif(regexp_replace(coalesce(r.source_tax_id, ''), '[^0-9]', '', 'g'), '')
           or app_private.normalize_company_name(c.name) = app_private.normalize_company_name(r.source_name)
           or extensions.similarity(app_private.normalize_company_name(c.name), app_private.normalize_company_name(r.source_name)) >= 0.4
        order by case when c.company_id = r.confirmed_company_id then 0 else 1 end,
          extensions.similarity(app_private.normalize_company_name(c.name), app_private.normalize_company_name(r.source_name)) desc
        limit 10
      ) c
      left join public.analytics_company_reconciliation_decisions d
        on d.source_key = r.source_key and d.company_id = c.company_id
      where coalesce(d.status, '') <> 'discarded' or c.company_id = r.confirmed_company_id
    ) c on true
  ), paged_items as (
    select value
    from items
    order by value ->> 'status', value ->> 'source_name'
    limit greatest(1, least(p_limit, 500))
    offset greatest(p_offset, 0)
  )
  select jsonb_build_object(
    'summary', jsonb_build_object(
      'total', (select count(*) from source_rows),
      'confirmed', (select count(*) from rows_with_decisions where confirmed_company_id is not null),
      'pending', (select count(*) from rows_with_decisions where confirmed_company_id is null)
    ),
    'items', coalesce((select jsonb_agg(value order by value ->> 'status', value ->> 'source_name') from paged_items), '[]'::jsonb)
  ) into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

create or replace function public.rpc_admin_decide_company_reconciliation(
  p_source_key text,
  p_source_name text,
  p_source_tax_id text,
  p_company_id text,
  p_decision text,
  p_evidence text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_source_key text := nullif(btrim(p_source_key), '');
  v_decision text := lower(nullif(btrim(p_decision), ''));
  v_evidence text := nullif(btrim(p_evidence), '');
  v_id uuid;
  v_replaced record;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if v_source_key is null or v_decision not in ('confirmed', 'discarded') or v_evidence is null then
    raise exception 'Origem, decisao e evidencia sao obrigatorias.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.hubspot_companies where company_id = p_company_id) then
    raise exception 'Empresa HubSpot nao encontrada.' using errcode = 'P0002';
  end if;

  if v_decision = 'confirmed' then
    for v_replaced in
      update public.analytics_company_reconciliation_decisions
        set status = 'revoked', updated_at = timezone('utc', now())
        where source_key = v_source_key and status = 'confirmed' and company_id <> p_company_id
        returning id, company_id
    loop
      insert into audit.company_reconciliation_decision_events (
        decision_id, source_key, company_id, event_type, evidence, actor_user_id
      ) values (
        v_replaced.id, v_source_key, v_replaced.company_id, 'revoked',
        'Substituida por nova confirmacao: ' || v_evidence, auth.uid()
      );
    end loop;
  end if;

  insert into public.analytics_company_reconciliation_decisions as d (
    source_key, source_name, source_tax_id, company_id, status, evidence, decided_by_user_id
  ) values (
    v_source_key, coalesce(nullif(btrim(p_source_name), ''), v_source_key), nullif(btrim(p_source_tax_id), ''),
    p_company_id, v_decision, v_evidence, auth.uid()
  ) on conflict (source_key, company_id) do update
    set status = excluded.status, evidence = excluded.evidence, decided_by_user_id = excluded.decided_by_user_id,
        decided_at = timezone('utc', now()), updated_at = timezone('utc', now())
  returning id into v_id;

  insert into audit.company_reconciliation_decision_events (
    decision_id, source_key, company_id, event_type, evidence, actor_user_id
  ) values (v_id, v_source_key, p_company_id, v_decision, v_evidence, auth.uid());

  return jsonb_build_object('decision_id', v_id, 'source_key', v_source_key, 'company_id', p_company_id, 'status', v_decision);
end;
$$;

create or replace function public.rpc_admin_revoke_company_reconciliation(
  p_source_key text,
  p_evidence text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_source_key text := nullif(btrim(p_source_key), '');
  v_evidence text := nullif(btrim(p_evidence), '');
  v_decision public.analytics_company_reconciliation_decisions%rowtype;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if v_source_key is null or v_evidence is null then
    raise exception 'Origem e evidencia sao obrigatorias.' using errcode = '22023';
  end if;

  update public.analytics_company_reconciliation_decisions
    set status = 'revoked', evidence = v_evidence, updated_at = timezone('utc', now())
    where source_key = v_source_key and status = 'confirmed'
    returning * into v_decision;
  if v_decision.id is null then
    raise exception 'Nenhuma confirmacao ativa encontrada.' using errcode = 'P0002';
  end if;

  insert into audit.company_reconciliation_decision_events (
    decision_id, source_key, company_id, event_type, evidence, actor_user_id
  ) values (v_decision.id, v_source_key, v_decision.company_id, 'revoked', v_evidence, auth.uid());

  return jsonb_build_object('decision_id', v_decision.id, 'source_key', v_source_key, 'status', 'revoked');
end;
$$;

revoke all on function public.rpc_analytics_company_reconciliation_queue(integer, integer) from public, anon;
revoke all on function public.rpc_admin_decide_company_reconciliation(text, text, text, text, text, text) from public, anon;
revoke all on function public.rpc_admin_revoke_company_reconciliation(text, text) from public, anon;
grant execute on function public.rpc_analytics_company_reconciliation_queue(integer, integer) to authenticated, service_role;
grant execute on function public.rpc_admin_decide_company_reconciliation(text, text, text, text, text, text) to authenticated, service_role;
grant execute on function public.rpc_admin_revoke_company_reconciliation(text, text) to authenticated, service_role;

comment on function public.rpc_analytics_company_reconciliation_queue(integer, integer) is
  'Fila read-only de candidatos HubSpot para identidades financeiras OMIE. Similaridade e sugestao; so decisao confirmada vale como vinculo.';
