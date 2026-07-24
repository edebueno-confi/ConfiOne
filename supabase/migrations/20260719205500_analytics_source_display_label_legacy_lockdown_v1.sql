-- O RPC legado permanece apenas como dependencia interna do wrapper com
-- fallback de rotulo. Ele nao deve ser um contrato publico do Dashboard.

revoke all on function public.rpc_analytics_cs_snapshot_alias_legacy(date, date, text, text, text[])
  from public, anon, authenticated, service_role;

comment on function public.rpc_analytics_cs_snapshot_alias_legacy(date, date, text, text, text[]) is
  'Implementacao legada interna; consumidores devem usar o snapshot CS com fallback de rotulo.';
