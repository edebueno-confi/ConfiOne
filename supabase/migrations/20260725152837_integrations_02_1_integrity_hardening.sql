-- INTEGRATIONS-02.1: contrato defensivo do snapshot OMIE.
alter table public.analytics_finance_sync_runs
  drop constraint if exists analytics_finance_sync_runs_status_check;
alter table public.analytics_finance_sync_runs
  add constraint analytics_finance_sync_runs_status_check check (status in ('processing','completed','partial','empty','failed','abandoned'));
alter table public.analytics_finance_sync_runs
  add column if not exists staged_rows integer not null default 0,
  add column if not exists promoted_rows integer not null default 0,
  add column if not exists batch_count integer not null default 0,
  add column if not exists rejected_by_reason jsonb not null default '{}'::jsonb,
  add column if not exists enrichment jsonb not null default '{}'::jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists promotion_result jsonb;

create or replace function public.rpc_service_promote_omie_snapshot(p_sync_run_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_run public.analytics_finance_sync_runs;
  v_staged integer;
  v_duplicate integer;
  v_promoted integer;
  v_result jsonb;
begin
  if p_sync_run_id is null then raise exception 'sync_run_id obrigatorio'; end if;
  select * into v_run from public.analytics_finance_sync_runs where id = p_sync_run_id for update;
  if not found then raise exception 'Execucao OMIE inexistente'; end if;
  if v_run.status = 'completed' and v_run.promotion_result is not null then return v_run.promotion_result; end if;
  if v_run.status <> 'processing' then raise exception 'Execucao OMIE nao esta em processamento'; end if;
  perform pg_advisory_xact_lock(hashtext('omie_snapshot_promotion'));
  select count(*) into v_staged from public.analytics_finance_receivables_staging where sync_run_id = p_sync_run_id;
  if v_staged <= 0 then raise exception 'Staging OMIE vazio; promocao rejeitada'; end if;
  if v_run.accepted_rows > 0 and v_run.accepted_rows <> v_staged then raise exception 'Contagem staged diverge da contagem aceita'; end if;
  select count(*) into v_duplicate from (select source_key, source_record_id from public.analytics_finance_receivables_staging where sync_run_id = p_sync_run_id group by 1,2 having count(*) > 1) d;
  if v_duplicate > 0 then raise exception 'Identidades duplicadas no staging OMIE'; end if;
  if exists (select 1 from public.analytics_finance_receivables_staging where sync_run_id = p_sync_run_id and source_key <> 'omie_receivables_api') then raise exception 'source_key OMIE nao autorizado'; end if;
  if exists (select 1 from public.analytics_finance_receivables_staging where sync_run_id = p_sync_run_id and identity_version <> 'omie-v3') then raise exception 'Versao de identidade OMIE nao autorizada'; end if;
  update public.analytics_finance_receivables set is_current = false, updated_at = timezone('utc', now()) where source_key = 'omie_receivables_api' and coalesce(is_current, true);
  insert into public.analytics_finance_receivables (source_key,source_record_id,identity_version,status_original,aging_bucket,document_number,client_name,client_trade_name,client_tax_id,net_amount,received_amount,balance,due_date,issued_date,last_received_date,boleto_generated,is_cancelled,is_partial,effective_at,raw_payload,sync_run_id,is_current,updated_at)
  select source_key,source_record_id,identity_version,status_original,aging_bucket,document_number,client_name,client_trade_name,client_tax_id,net_amount,received_amount,balance,due_date,issued_date,last_received_date,boleto_generated,is_cancelled,is_partial,effective_at,raw_payload,sync_run_id,true,timezone('utc', now()) from public.analytics_finance_receivables_staging where sync_run_id = p_sync_run_id
  on conflict (source_key, source_record_id) do update set identity_version=excluded.identity_version,status_original=excluded.status_original,aging_bucket=excluded.aging_bucket,document_number=excluded.document_number,client_name=excluded.client_name,client_trade_name=excluded.client_trade_name,client_tax_id=excluded.client_tax_id,net_amount=excluded.net_amount,received_amount=excluded.received_amount,balance=excluded.balance,due_date=excluded.due_date,issued_date=excluded.issued_date,last_received_date=excluded.last_received_date,boleto_generated=excluded.boleto_generated,is_cancelled=excluded.is_cancelled,is_partial=excluded.is_partial,effective_at=excluded.effective_at,raw_payload=excluded.raw_payload,sync_run_id=excluded.sync_run_id,is_current=true,updated_at=timezone('utc', now());
  get diagnostics v_promoted = row_count;
  v_result := jsonb_build_object('staged', v_staged, 'promoted', v_promoted);
  update public.analytics_finance_sync_runs set status='completed', staged_rows=v_staged, promoted_rows=v_promoted, total_rows=coalesce(total_rows,v_staged), accepted_rows=v_staged, finished_at=timezone('utc',now()), promotion_result=v_result where id=p_sync_run_id;
  delete from public.analytics_finance_receivables_staging where sync_run_id=p_sync_run_id;
  return v_result;
end;
$$;
revoke all on function public.rpc_service_promote_omie_snapshot(uuid) from public, anon, authenticated;
grant execute on function public.rpc_service_promote_omie_snapshot(uuid) to service_role;
