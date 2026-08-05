-- DASHBOARD-RUNTIME-SERVICE-GRANT-HARDENING-V1
-- A RPC de ciclo e uma fronteira interna da Edge Function; nao deve ser
-- executavel diretamente por authenticated.

revoke execute on function public.rpc_service_start_analytics_sync_cycle(text, uuid)
  from public, anon, authenticated;

grant execute on function public.rpc_service_start_analytics_sync_cycle(text, uuid)
  to service_role;
