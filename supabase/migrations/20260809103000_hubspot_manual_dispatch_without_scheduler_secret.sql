-- ANALYTICS-HUBSPOT-MANUAL-DISPATCH-WITHOUT-SCHEDULER-SECRET-V1
--
-- A criação de uma execução manual não pode falhar quando o segredo exclusivo
-- do agendamento não estiver presente (por exemplo, no Supabase local). A Edge
-- Function de start encaminha a identidade já autorizada ao dispatcher; o
-- agendamento continua usando o segredo de scheduler quando configurado.

drop trigger if exists hubspot_sync_runs_enqueue_dispatch on public.hubspot_sync_runs;

drop function if exists app_private.enqueue_hubspot_dispatch_after_start();
