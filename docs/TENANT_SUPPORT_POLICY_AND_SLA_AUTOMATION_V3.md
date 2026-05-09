# Tenant Support Policy And SLA Automation V3

## Objetivo
Fechar governanca interna de SLA por tenant para tickets B2B, mantendo o backend como fonte da verdade e sem transformar SLA em promessa publica automatica.

## Decisoes do corte
- `ticket_sla_policies` passou a aceitar `tenant_id` explicito e `business_calendar_id`.
- Politicas especificas do tenant vencem o fallback global controlado.
- O fallback global permanece para nao quebrar tickets existentes.
- Calendario de negocio MVP foi criado como metadata governada; o calculo de prazo continua em minutos corridos neste corte.
- Pausa de SLA nao foi implementada porque a regra de produto para estados pausados ainda nao esta formalizada.
- Nenhuma notificacao externa, timer decorativo ou escalonamento automatico foi criado.

## Backend
Novas estruturas:
- `business_calendars`
- `business_calendar_weekly_hours`
- `business_calendar_holidays`

Alteracoes em `ticket_sla_policies`:
- `tenant_id`
- `business_calendar_id`
- `archived_at`

Helpers e regras:
- `app_private.resolve_ticket_sla_policy(tenant_id, category_id, priority, severity)` aplica precedencia tenant > global.
- `app_private.apply_ticket_sla` recalcula `sla_policy_id`, `first_response_due_at` e `resolution_due_at` no backend.
- `app_private.ticket_sla_status` segue derivando `sem politica`, `dentro do prazo`, `em risco`, `violado` e `encerrado para SLA`.

## Views e RPCs
Read models finais:
- `vw_support_ticket_sla_context`
- `vw_support_tickets_queue`
- `vw_support_ticket_detail`
- `vw_admin_ticket_sla_policies`

RPCs finais:
- `rpc_admin_upsert_business_calendar`
- `rpc_admin_upsert_ticket_sla_policy`
- `rpc_admin_archive_ticket_sla_policy`
- `rpc_support_recalculate_ticket_sla`

## Frontend
- `/support/queue` exibe politica e prazo de SLA vindos do read model.
- `/support/tickets/:ticketId` exibe status, politica aplicada, origem da politica, primeira resposta, resolucao e calendario no rail operacional.
- O frontend nao calcula prazo, nao cria timer e nao decide status de SLA.

## Fixture QA
A fixture local passou a incluir:
- calendario tenant-aware criado por RPC administrativa;
- policy tenant-aware para `support-qa-a`;
- ticket em risco;
- ticket violado;
- tenant sem policy propria usando fallback global.

## Limites mantidos
- Sem calendario util completo no calculo de prazo.
- Sem feriado/excecao aplicado ao calculo.
- Sem pausa de SLA.
- Sem UI administrativa complexa para policies.
- Sem notificacao externa.

## Testes
Cobertura adicionada em `supabase/tests/027_tenant_support_policy_and_sla_automation.sql`:
- policy por tenant aplicada;
- fallback global quando nao ha policy propria;
- policy especifica por categoria/prioridade/severidade;
- due dates calculadas no backend;
- status em risco e violado derivados no backend;
- cross-tenant bloqueado;
- policy inativa ignorada;
- mutacao administrativa gera audit log;
- recalc gera `ticket_event`;
- DML direto bloqueado.

## Riscos restantes
- Calculo por horario util real ainda depende de regra de produto/engenharia.
- Pausa de SLA por status precisa decisao objetiva.
- Notificacao ou automacao de breach continua fora do escopo.
- Admin UI para SLA policies deve ser lote proprio, se priorizado.
