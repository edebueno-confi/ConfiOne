-- Impede chamadas simultâneas ao método Contas a Receber do OMIE.
-- A API do provedor rejeita requisições concorrentes/repetidas; a garantia
-- precisa existir no banco para cobrir cliques duplicados e cron + manual.

update public.analytics_finance_sync_runs
set
  status = 'failed',
  error_message = coalesce(error_message, 'Execucao abandonada pelo worker e encerrada automaticamente.'),
  finished_at = coalesce(finished_at, timezone('utc', now()))
where status = 'processing'
  and started_at < timezone('utc', now()) - interval '15 minutes';

create unique index if not exists analytics_finance_sync_runs_one_processing_idx
  on public.analytics_finance_sync_runs (status)
  where status = 'processing';

comment on index public.analytics_finance_sync_runs_one_processing_idx is
  'Garante uma unica execucao OMIE em andamento e evita REDUNDANT/8020 no provedor.';
