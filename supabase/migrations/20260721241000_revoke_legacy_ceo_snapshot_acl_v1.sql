-- A funcao legada so deve ser chamada internamente pelo wrapper executivo.
-- O wrapper usa o contexto do owner; usuarios autenticados devem passar pelo
-- contrato protegido que aplica can_read_analytics().
revoke execute on function public.rpc_analytics_ceo_snapshot_legacy(date, date)
  from public, anon, authenticated;

grant execute on function public.rpc_analytics_ceo_snapshot_legacy(date, date)
  to service_role;

