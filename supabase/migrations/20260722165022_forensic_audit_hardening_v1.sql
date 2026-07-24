-- Hardening derivado da auditoria forense de 2026-07-22.

-- Leitura do Analytics continua separada das escritas administrativas.
create or replace function public.rpc_admin_set_integration_schedule(
  p_enabled boolean,
  p_frequency text
)
returns public.analytics_integration_schedule
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved public.analytics_integration_schedule;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'Acesso negado. Requer platform_admin.' using errcode = '42501';
  end if;
  if p_frequency not in ('off', 'hourly', 'daily') then
    raise exception 'Frequencia invalida.' using errcode = '22023';
  end if;
  update public.analytics_integration_schedule
  set enabled = coalesce(p_enabled, false), frequency = p_frequency,
      updated_at = timezone('utc', now()), updated_by_user_id = auth.uid()
  where id = true returning * into saved;
  return saved;
end;
$$;

create or replace function public.rpc_admin_upsert_analytics_source_config(
  p_id uuid default null,
  p_domain_key text default null,
  p_object_type text default null,
  p_hubspot_pipeline_id text default null,
  p_label text default null,
  p_is_active boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.analytics_source_config;
  v_domain text := lower(trim(coalesce(p_domain_key, '')));
  v_object text := lower(trim(coalesce(p_object_type, '')));
  v_pipeline text := trim(coalesce(p_hubspot_pipeline_id, ''));
  v_label text := nullif(trim(coalesce(p_label, '')), '');
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'Acesso negado. Requer platform_admin.' using errcode = '42501';
  end if;
  if v_domain not in ('commercial', 'cs') then raise exception 'domain_key invalido'; end if;
  if v_object not in ('deal', 'ticket') then raise exception 'object_type invalido'; end if;
  if v_pipeline !~ '^[0-9]+$' then raise exception 'hubspot_pipeline_id deve conter apenas numeros'; end if;
  if p_id is null then
    insert into public.analytics_source_config (domain_key, object_type, hubspot_pipeline_id, label, is_active)
    values (v_domain, v_object, v_pipeline, v_label, coalesce(p_is_active, true)) returning * into v_row;
  else
    update public.analytics_source_config
    set domain_key=v_domain, object_type=v_object, hubspot_pipeline_id=v_pipeline,
        label=v_label, is_active=coalesce(p_is_active, true)
    where id=p_id returning * into v_row;
    if v_row.id is null then raise exception 'configuracao nao encontrada'; end if;
  end if;
  return to_jsonb(v_row);
end;
$$;

create or replace function public.rpc_admin_upsert_managed_integration(
  p_integration_key text, p_label text, p_provider text, p_mode text,
  p_is_enabled boolean, p_config jsonb default '{}'::jsonb, p_secret text default null
)
returns public.vw_admin_managed_integrations
language plpgsql security definer set search_path = ''
as $$
declare actor uuid := auth.uid(); existing public.managed_integrations; saved public.managed_integrations; secret_id uuid;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'Acesso negado. Requer platform_admin.' using errcode = '42501';
  end if;
  if nullif(trim(p_integration_key), '') is null or nullif(trim(p_label), '') is null
     or p_provider not in ('hubspot', 'omie', 'google_sheets', 'spreadsheet_upload', 'github')
     or p_mode not in ('api', 'manual', 'hybrid') then
    raise exception 'Configuracao de integracao invalida.' using errcode = '22023';
  end if;
  select * into existing from public.managed_integrations where integration_key=trim(p_integration_key) for update;
  secret_id := existing.credential_secret_id;
  if nullif(trim(coalesce(p_secret, '')), '') is not null then
    if secret_id is null then secret_id := vault.create_secret(trim(p_secret), 'gso_' || trim(p_integration_key), p_label);
    else perform vault.update_secret(secret_id, trim(p_secret), 'gso_' || trim(p_integration_key), p_label); end if;
  end if;
  insert into public.managed_integrations (integration_key,label,provider,mode,is_enabled,config,credential_secret_id,credential_updated_at,created_by_user_id,updated_by_user_id)
  values (trim(p_integration_key),trim(p_label),p_provider,p_mode,coalesce(p_is_enabled,false),coalesce(p_config,'{}'::jsonb),secret_id,
    case when nullif(trim(coalesce(p_secret,'')), '') is not null then timezone('utc',now()) else existing.credential_updated_at end,actor,actor)
  on conflict (integration_key) do update set label=excluded.label,provider=excluded.provider,mode=excluded.mode,is_enabled=excluded.is_enabled,config=excluded.config,credential_secret_id=excluded.credential_secret_id,credential_updated_at=excluded.credential_updated_at,updated_by_user_id=actor,updated_at=timezone('utc',now())
  returning * into saved;
  return (saved.id,saved.integration_key,saved.label,saved.provider,saved.mode,saved.is_enabled,saved.config,saved.credential_secret_id is not null,saved.credential_updated_at,saved.last_run_at,coalesce(saved.last_run_status,'never'),saved.last_error_message,saved.updated_at)::public.vw_admin_managed_integrations;
end;
$$;

-- Configuracoes administrativas precisam deixar trilha append-only.
drop trigger if exists analytics_source_config_audit_row_change on public.analytics_source_config;
create trigger analytics_source_config_audit_row_change
after insert or update or delete on public.analytics_source_config
for each row execute function audit.capture_row_change();
drop trigger if exists analytics_integration_schedule_audit_row_change on public.analytics_integration_schedule;
create trigger analytics_integration_schedule_audit_row_change
after insert or update or delete on public.analytics_integration_schedule
for each row execute function audit.capture_row_change();

-- O título passa a indicar se ainda pertence ao último snapshot completo.
alter table public.analytics_finance_receivables
  add column if not exists is_current boolean not null default true;
create index if not exists analytics_finance_receivables_current_idx
  on public.analytics_finance_receivables (source_key, is_current, balance);

create table if not exists public.analytics_hubspot_omie_property_sync_runs (
  id uuid primary key default extensions.gen_random_uuid(), mode text not null check (mode in ('dry_run','apply')),
  status text not null default 'requested' check (status in ('requested','running','completed','partial','failed')),
  requested_by_user_id uuid references auth.users(id) on delete set null,
  total_rows integer not null default 0, updated_rows integer not null default 0, failed_rows integer not null default 0,
  started_at timestamptz not null default timezone('utc',now()), finished_at timestamptz, error_message text
);
create table if not exists public.analytics_hubspot_omie_property_sync_items (
  id uuid primary key default extensions.gen_random_uuid(), run_id uuid not null references public.analytics_hubspot_omie_property_sync_runs(id) on delete cascade,
  company_id text not null, status text not null check (status in ('planned','updated','failed','skipped')),
  before_payload jsonb, after_payload jsonb, error_message text, created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now())
);
create table if not exists public.analytics_hubspot_property_setup_runs (
  id uuid primary key default extensions.gen_random_uuid(), mode text not null check (mode in ('dry_run','apply')),
  status text not null default 'requested' check (status in ('requested','running','completed','partial','failed')),
  requested_by_user_id uuid references auth.users(id) on delete set null,
  total_rows integer not null default 0, created_rows integer not null default 0, failed_rows integer not null default 0,
  started_at timestamptz not null default timezone('utc',now()), finished_at timestamptz, error_message text
);
create table if not exists public.analytics_hubspot_property_setup_items (
  id uuid primary key default extensions.gen_random_uuid(), run_id uuid not null references public.analytics_hubspot_property_setup_runs(id) on delete cascade,
  property_name text not null, status text not null check (status in ('planned','created','exists','failed')),
  before_payload jsonb, after_payload jsonb, error_message text, created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now())
);
alter table public.analytics_hubspot_omie_property_sync_runs enable row level security;
alter table public.analytics_hubspot_omie_property_sync_items enable row level security;
alter table public.analytics_hubspot_property_setup_runs enable row level security;
alter table public.analytics_hubspot_property_setup_items enable row level security;
create policy analytics_hubspot_omie_property_sync_runs_read on public.analytics_hubspot_omie_property_sync_runs for select to authenticated using (app_private.has_global_role('platform_admin'::public.platform_role));
create policy analytics_hubspot_omie_property_sync_items_read on public.analytics_hubspot_omie_property_sync_items for select to authenticated using (app_private.has_global_role('platform_admin'::public.platform_role));
create policy analytics_hubspot_property_setup_runs_read on public.analytics_hubspot_property_setup_runs for select to authenticated using (app_private.has_global_role('platform_admin'::public.platform_role));
create policy analytics_hubspot_property_setup_items_read on public.analytics_hubspot_property_setup_items for select to authenticated using (app_private.has_global_role('platform_admin'::public.platform_role));
revoke all on public.analytics_hubspot_omie_property_sync_runs, public.analytics_hubspot_omie_property_sync_items, public.analytics_hubspot_property_setup_runs, public.analytics_hubspot_property_setup_items from public, anon;
grant select on public.analytics_hubspot_omie_property_sync_runs, public.analytics_hubspot_omie_property_sync_items, public.analytics_hubspot_property_setup_runs, public.analytics_hubspot_property_setup_items to authenticated, service_role;
grant insert, update on public.analytics_hubspot_omie_property_sync_runs, public.analytics_hubspot_omie_property_sync_items, public.analytics_hubspot_property_setup_runs, public.analytics_hubspot_property_setup_items to service_role;
create trigger analytics_hubspot_omie_property_sync_runs_audit after insert or update on public.analytics_hubspot_omie_property_sync_runs for each row execute function audit.capture_row_change();
create trigger analytics_hubspot_omie_property_sync_items_audit after insert or update on public.analytics_hubspot_omie_property_sync_items for each row execute function audit.capture_row_change();
create trigger analytics_hubspot_property_setup_runs_audit after insert or update on public.analytics_hubspot_property_setup_runs for each row execute function audit.capture_row_change();
create trigger analytics_hubspot_property_setup_items_audit after insert or update on public.analytics_hubspot_property_setup_items for each row execute function audit.capture_row_change();

-- Rollup inclui toda empresa com CNPJ conhecido; empresas sem título aberto recebem zeros.
create or replace function public.rpc_analytics_finance_company_rollup()
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare result jsonb; v_source_key text;
begin
  if not (app_private.can_read_analytics() or auth.uid() is null) then raise exception 'Acesso negado.' using errcode='42501'; end if;
  select case when exists(select 1 from public.analytics_finance_receivables where source_key='omie_receivables_api') then 'omie_receivables_api'
    else (select source_key from public.analytics_finance_receivables where source_key <> 'omie_receivables_api' order by created_at desc limit 1) end into v_source_key;
  select coalesce(jsonb_agg(jsonb_build_object('company_id',c.company_id,'company_name',c.name,'saldo_aberto',coalesce(x.saldo_aberto,0),'saldo_vencido',coalesce(x.saldo_vencido,0),'titulos_abertos',coalesce(x.titulos_abertos,0),'atraso_medio_dias',coalesce(x.atraso_medio_dias,0),'situacao',coalesce(x.situacao,'a_vencer')) order by coalesce(x.saldo_aberto,0) desc),'[]'::jsonb) into result
  from public.hubspot_companies c
  left join lateral (select round(sum(f.balance)::numeric,2) saldo_aberto, round(coalesce(sum(f.balance) filter(where f.aging_bucket='atrasado'),0)::numeric,2) saldo_vencido, count(*)::integer titulos_abertos, coalesce(round(avg(current_date-f.due_date) filter(where f.aging_bucket='atrasado' and f.due_date is not null),0),0)::integer atraso_medio_dias, case when coalesce(sum(f.balance) filter(where f.aging_bucket='atrasado'),0)=0 then 'a_vencer' when sum(f.balance) filter(where f.aging_bucket='atrasado') >= 0.5*sum(f.balance) then 'critico' else 'vencido' end situacao from public.analytics_finance_receivables f where v_source_key is not null and f.source_key=v_source_key and f.is_current and f.balance > 0 and regexp_replace(coalesce(c.tax_id,''),'[^0-9]','','g') = regexp_replace(coalesce(f.client_tax_id,''),'[^0-9]','','g') and nullif(regexp_replace(coalesce(f.client_tax_id,''),'[^0-9]','','g'),'') is not null) x on true
  where nullif(regexp_replace(coalesce(c.tax_id,''),'[^0-9]','','g'),'') is not null;
  return result;
end; $$;

-- CNPJ raiz identifica possivel grupo/filial, nao duplicata exata.
create or replace function public.rpc_analytics_company_candidates(
  p_tax_id text default null, p_name text default null, p_trade_name text default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare result jsonb; d text; nm text; nt text;
begin
  if not (app_private.can_read_analytics() or auth.uid() is null) then raise exception 'Acesso negado.' using errcode='42501'; end if;
  d := regexp_replace(coalesce(p_tax_id,''),'[^0-9]','','g'); nm := coalesce(app_private.normalize_company_name(p_name),''); nt := coalesce(app_private.normalize_company_name(p_trade_name),'');
  select coalesce(jsonb_agg(jsonb_build_object('company_id',company_id,'name',name,'tax_id',tax_id,'reason',reason,'score',round(score::numeric,3)) order by score desc),'[]'::jsonb) into result
  from (select s.company_id,s.name,s.tax_id,r.reason,r.score from (select c.company_id,c.name,c.tax_id,regexp_replace(coalesce(c.tax_id,''),'[^0-9]','','g') hd,coalesce(app_private.normalize_company_name(c.name),'') cn from public.hubspot_companies c) s cross join lateral (select case when d<>'' and s.hd=d then 'cnpj_exato' when d<>'' and length(d)>=8 and s.hd<>'' and left(s.hd,8)=left(d,8) then 'possivel_grupo_filial' when length(s.cn)>=4 and ((nm<>'' and ((' '||nm||' ') like ('% '||s.cn||' %') or (' '||s.cn||' ') like ('% '||nm||' %'))) or (nt<>'' and ((' '||nt||' ') like ('% '||s.cn||' %') or (' '||s.cn||' ') like ('% '||nt||' %')))) then 'nome_contido' when greatest(extensions.similarity(s.cn,nm),case when nt<>'' then extensions.similarity(s.cn,nt) else 0 end)>=0.4 then 'nome_similar' else null end reason, case when d<>'' and s.hd=d then 1.0 when d<>'' and length(d)>=8 and s.hd<>'' and left(s.hd,8)=left(d,8) then 0.7 when length(s.cn)>=4 and ((nm<>'' and ((' '||nm||' ') like ('% '||s.cn||' %') or (' '||s.cn||' ') like ('% '||nm||' %'))) or (nt<>'' and ((' '||nt||' ') like ('% '||s.cn||' %') or (' '||s.cn||' ') like ('% '||nt||' %')))) then 0.8 else greatest(extensions.similarity(s.cn,nm),case when nt<>'' then extensions.similarity(s.cn,nt) else 0 end) end score) r where r.reason is not null order by r.score desc limit 10) q;
  return result;
end; $$;
