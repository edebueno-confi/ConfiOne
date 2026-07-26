-- RELEASE-04.1 follow-up: os workers escrevem somente no staging privado.
-- A promoção continua encapsulada no RPC service_role; usuários não recebem
-- acesso direto às tabelas de staging.
grant select, insert, update on public.analytics_cs_ticket_staging to service_role;
grant select, insert, update on public.analytics_hubspot_deal_staging to service_role;
