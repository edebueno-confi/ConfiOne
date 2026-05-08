# Customer Account Profile Operational Core V3

## Objetivo
Materializar o nucleo operacional do perfil de cliente B2B como contexto real para Suporte/CS/Admin, sem transformar o Genius Support OS em CRM generico e sem expor segredo, token, endpoint sensivel ou payload tecnico.

## Auditoria inicial
- Tabelas reaproveitadas: `tenants`, `tenant_contacts`, `tickets`, `ticket_messages`, `ticket_events`, `audit.audit_logs`.
- Tabelas do Customer Account Profile ja existentes e reaproveitadas: `customer_account_profiles`, `customer_account_integrations`, `customer_account_features`, `customer_account_customizations`, `customer_account_alerts`.
- Views reaproveitadas: `vw_support_customer_account_context`, `vw_admin_customer_account_profiles`, `vw_support_customer_360`, `vw_support_customer_recent_tickets`, `vw_support_customer_recent_events`.
- RPCs reaproveitadas: `rpc_admin_upsert_customer_account_profile`, `rpc_admin_add_customer_integration`, `rpc_admin_update_customer_integration`, `rpc_admin_add_customer_customization`, `rpc_admin_update_customer_customization`, `rpc_admin_add_customer_account_alert`, `rpc_admin_archive_customer_account_alert`.
- Lacuna fechada neste lote: `rpc_admin_set_customer_feature_flag`, para materializar ou atualizar feature operacional via contrato administrativo auditado.

## Contratos finais
- Leitura Support: `vw_support_customer_account_context`.
- Leitura Admin: `vw_admin_customer_account_profiles`.
- Escrita Admin: RPCs administrativas do Customer Account Profile, restritas a `platform_admin`.
- Escrita Support: bloqueada no MVP; suporte consome contexto seguro, mas nao altera perfil.
- Fixture QA: inclui clientes com perfil completo e cliente sem perfil operacional para validar `Indisponivel`.

## Regras de seguranca
- `tenant_id` explicito em escrita administrativa.
- Tabelas-base com RLS habilitado.
- Grants diretos para app bloqueados nas tabelas-base.
- Mutacoes por RPC `SECURITY DEFINER` com `search_path` fixo.
- Texto de profile, integracoes, features, customizacoes e alertas passa por validacao contra termos sensiveis.
- Auditoria por trigger em tabelas-base.

## Frontend
- `/support/customers` e `/support/customers/:tenantId` consomem read models reais de clientes e perfil operacional.
- `/support/tickets/:ticketId` usa o rail de cliente com resumo seguro de produto/linha, status operacional, tier/plano, integracoes, alertas e customizacoes quando existirem.
- Dados ausentes devem aparecer como `Indisponivel` ou estado honesto de perfil nao cadastrado.
- Nenhuma edicao de perfil foi habilitada no frontend.

## Pendencias
- Definir ownership de edicao alem de `platform_admin`, se Suporte/CS tambem puder manter partes do perfil no futuro.
- Criar UI administrativa governada para edicao de perfil, integracoes, features, customizacoes e alertas.
- Definir historico operacional paginado por tenant se a tela de cliente precisar ir alem de tickets/eventos recentes.
