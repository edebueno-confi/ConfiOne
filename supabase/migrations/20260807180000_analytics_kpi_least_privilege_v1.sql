-- ANALYTICS-KPI-LEAST-PRIVILEGE-V1
--
-- Correção de privilégio encontrada pelos testes pgTAP deste mesmo lote.
--
-- O problema
-- ----------
-- O Supabase concede privilégios padrão ao papel `authenticated` em toda tabela
-- nova criada no schema `public`. As migrations anteriores deste lote revogaram
-- apenas de `public` e `anon`, então as tabelas novas ficaram com DELETE,
-- INSERT, UPDATE, TRUNCATE, REFERENCES e TRIGGER liberados para qualquer usuário
-- autenticado.
--
-- Na prática a RLS já barrava a escrita, porque nenhuma policy de INSERT,
-- UPDATE ou DELETE foi criada. Mas privilégio concedido e não usado é risco
-- latente: basta alguém adicionar uma policy permissiva no futuro para o buraco
-- abrir sem revisão.
--
-- A convenção do projeto, verificada em `hubspot_tickets`,
-- `analytics_finance_receivables` e `analytics_source_config`, é não conceder
-- nenhum privilégio direto a `authenticated`. A leitura do Dashboard acontece
-- pelas RPCs, que são `security definer` e aplicam a autorização em
-- `app_private.can_read_analytics()`.
--
-- Este lote alinha as cinco tabelas novas a essa convenção. As policies de RLS
-- são preservadas como defesa em profundidade.

revoke all on table public.analytics_kpi_settings from authenticated;
revoke all on table public.analytics_kpi_daily_snapshot from authenticated;
revoke all on table public.analytics_hubspot_associations from authenticated;
revoke all on table public.analytics_hubspot_stage_events from authenticated;
revoke all on table public.analytics_hubspot_history_sync_state from authenticated;

-- Reforço explícito sobre os papéis públicos, caso um privilégio padrão novo
-- seja introduzido em uma versão futura da plataforma.
revoke all on table public.analytics_kpi_settings from public, anon;
revoke all on table public.analytics_kpi_daily_snapshot from public, anon;
revoke all on table public.analytics_hubspot_associations from public, anon;
revoke all on table public.analytics_hubspot_stage_events from public, anon;
revoke all on table public.analytics_hubspot_history_sync_state from public, anon;

-- O serviço continua sendo o único papel com escrita.
grant select, insert, update on table public.analytics_kpi_settings to service_role;
grant select, insert, update on table public.analytics_kpi_daily_snapshot to service_role;
grant select, insert, update, delete on table public.analytics_hubspot_associations to service_role;
grant select, insert, update, delete on table public.analytics_hubspot_stage_events to service_role;
grant select, insert, update on table public.analytics_hubspot_history_sync_state to service_role;

-- As views deste lote são `security_invoker`, portanto a leitura direta por um
-- usuário autenticado já dependeria de privilégio nas tabelas de origem, que ele
-- não tem. Elas existem para as RPCs `security definer`; o acesso direto é
-- revogado para não deixar caminho lateral aberto.
revoke all on public.vw_analytics_customer_base from authenticated, anon, public;
revoke all on public.vw_analytics_customer_financial_link from authenticated, anon, public;
revoke all on public.vw_analytics_ticket_resolution from authenticated, anon, public;
revoke all on public.vw_analytics_ticket_company from authenticated, anon, public;

grant select on public.vw_analytics_customer_base to service_role;
grant select on public.vw_analytics_customer_financial_link to service_role;
grant select on public.vw_analytics_ticket_resolution to service_role;
grant select on public.vw_analytics_ticket_company to service_role;

comment on table public.analytics_kpi_settings is
  'Decisões de negócio que os KPIs não podem inferir do dado: fonte oficial de MRR, regra de cliente ativo, timezone e limiares. Linha única. Sem privilégio direto para usuário autenticado: a leitura passa por rpc_analytics_kpi_settings.';
