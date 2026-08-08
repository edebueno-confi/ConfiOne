-- Os read models executivos podem ultrapassar o teto de 8s do papel
-- authenticated sob concorrencia. O orcamento e local a cada RPC: nao altera
-- o timeout global, nem o de outras consultas do PostgREST.

alter function public.rpc_analytics_ceo_snapshot(date, date)
  set statement_timeout to '30s';

alter function public.rpc_analytics_ceo_history(date, date)
  set statement_timeout to '30s';

alter function public.rpc_analytics_executive_kpis_v2(date, date)
  set statement_timeout to '30s';
