-- Corrige dois contratos de leitura/escrita do runtime local e remoto.
-- 1) IDs não UUID, como o singleton booleano da agenda, não podem quebrar a auditoria.
-- 2) O histórico de importações deve ser lido por read model, não pela tabela bruta.

create or replace function audit.capture_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  payload jsonb;
  target_tenant_id uuid;
  target_entity_id uuid;
begin
  payload := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;

  if payload ? 'tenant_id'
     and nullif(payload ->> 'tenant_id', '') is not null
     and (payload ->> 'tenant_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    target_tenant_id := (payload ->> 'tenant_id')::uuid;
  end if;

  -- audit.audit_logs.entity_id é UUID. IDs legados boolean/textuais continuam
  -- preservados em before_state/after_state, sem abortar a mutação auditada.
  if payload ? 'id'
     and nullif(payload ->> 'id', '') is not null
     and (payload ->> 'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    target_entity_id := (payload ->> 'id')::uuid;
  end if;

  insert into audit.audit_logs (
    occurred_at, actor_user_id, tenant_id, entity_schema, entity_table,
    entity_id, action, before_state, after_state, metadata
  )
  values (
    timezone('utc', now()), auth.uid(), target_tenant_id, tg_table_schema,
    tg_table_name, target_entity_id, lower(tg_op),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end,
    jsonb_build_object('trigger_name', tg_name)
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace view public.vw_analytics_spreadsheet_import_runs_read
with (security_barrier = true)
as
select id, source_id, status, original_filename, total_rows, accepted_rows,
       rejected_rows, created_at, finished_at
from public.analytics_spreadsheet_import_runs
where app_private.has_global_role('platform_admin'::public.platform_role);

revoke all on public.vw_analytics_spreadsheet_import_runs_read from public, anon;
grant select on public.vw_analytics_spreadsheet_import_runs_read to authenticated;

comment on view public.vw_analytics_spreadsheet_import_runs_read is
  'Read model administrativo do histórico de importações, sem exposição direta da tabela bruta.';
