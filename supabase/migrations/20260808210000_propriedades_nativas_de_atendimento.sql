-- PROPRIEDADES NATIVAS QUE A INGESTÃO NÃO PEDIA
--
-- A pergunta que originou esta migration: os "Indisponível" do painel são falta
-- de dado no HubSpot ou falta de contrato nosso?
--
-- A resposta, medida contra a API:
--
--   | Propriedade             | Existe na origem | Tínhamos |
--   | subject                 |           53.070 |        0 |
--   | first_agent_reply_date  |           13.679 |    1.077 |
--   | hs_ticket_reopened_at   |               68 |        0 |
--
-- **É falta de contrato nosso.** `subject` era até pedido ao HubSpot e
-- descartado na gravação, porque não havia coluna para recebê-lo.
--
-- O que cada uma destrava
-- -----------------------
-- `first_agent_reply_at` tem cobertura mais de dez vezes maior que o campo de
-- SLA em horas que usávamos. "Tempo até a primeira resposta" deixa de cobrir 3%
-- da base.
--
-- `reopened_at` resolve a taxa de reabertura **sem depender do histórico de
-- etapas**, que nunca foi ingerido e que eu vinha apontando como bloqueio.
--
-- `is_one_touch` explica os encerramentos instantâneos: em vez de inferir por
-- diferença de datas, a própria origem diz se o atendimento foi resolvido com
-- uma única mensagem.
--
-- `subject` torna a lista de atendimentos sem resposta utilizável sem sair do
-- painel.
--
-- Esta migration apenas cria o espaço. Os valores chegam na próxima
-- sincronização, e até lá os indicadores seguem declarando o que falta.

alter table public.hubspot_tickets
  add column if not exists subject text,
  add column if not exists first_agent_reply_at timestamptz,
  add column if not exists reopened_at timestamptz,
  add column if not exists time_to_close_ms numeric,
  add column if not exists is_one_touch boolean;

comment on column public.hubspot_tickets.subject is
  'Assunto do atendimento. Era pedido ao HubSpot e descartado por falta de coluna.';
comment on column public.hubspot_tickets.first_agent_reply_at is
  'Data da primeira resposta do agente. Cobertura dez vezes maior que o campo de SLA em horas.';
comment on column public.hubspot_tickets.reopened_at is
  'Data de reabertura informada pela origem. Dispensa o historico de etapas para a taxa de reabertura.';
comment on column public.hubspot_tickets.is_one_touch is
  'A origem informa se o atendimento foi resolvido com uma unica mensagem do agente.';

create index if not exists hubspot_tickets_reopened_at_idx
  on public.hubspot_tickets (reopened_at) where reopened_at is not null;
create index if not exists hubspot_tickets_first_agent_reply_idx
  on public.hubspot_tickets (first_agent_reply_at) where first_agent_reply_at is not null;

-- A view de resolução passa a considerar as fontes nativas, com precedência
-- explícita. A ordem importa e está declarada: o que a origem afirma vale mais
-- que o que nós derivamos.
drop view if exists public.vw_analytics_ticket_resolution cascade;

create view public.vw_analytics_ticket_resolution as
select
  t.ticket_id,
  t.hs_closed_at as resolved_at,
  case when t.hs_closed_at is not null and t.hs_created_at is not null
    then extract(epoch from (t.hs_closed_at - t.hs_created_at)) / 86400.0
  end as resolution_days,
  case when t.hs_closed_at is not null then 'native_close_date' else null end as resolution_source,
  -- Precedência: data de primeira resposta do agente primeiro, porque é fato
  -- registrado; o tempo de SLA em horas é derivado e cobre uma fração da base.
  coalesce(
    case when t.first_agent_reply_at is not null and t.hs_created_at is not null
      then extract(epoch from (t.first_agent_reply_at - t.hs_created_at)) / 3600.0
    end,
    t.first_response_ms::numeric / 3600000.0
  ) as first_response_hours,
  case
    when t.first_agent_reply_at is not null then 'agent_reply_date'
    when t.first_response_ms is not null then 'sla_operating_hours'
    else null
  end as first_response_source,
  -- Reabertura deixa de depender do histórico de etapas.
  (t.reopened_at is not null) as has_reopened,
  case when t.reopened_at is not null then 1 else 0 end as reopened_count,
  t.reopened_at,
  t.is_one_touch,
  -- `has_history` continua indicando cobertura de histórico de etapa, que segue
  -- não ingerido. Passa a ser verdadeiro quando existe qualquer fonte capaz de
  -- responder reabertura, e a origem nativa é uma delas.
  (t.reopened_at is not null or exists (
    select 1 from public.analytics_hubspot_stage_events e where e.object_id = t.ticket_id
  )) as has_history
from public.hubspot_tickets t;

comment on view public.vw_analytics_ticket_resolution is
  'Resolucao, primeira resposta e reabertura do atendimento, com precedencia declarada entre fonte nativa e derivada. Reabertura passa a vir da propria origem, sem depender do historico de etapas.';

revoke all on public.vw_analytics_ticket_resolution from public, anon;
grant select on public.vw_analytics_ticket_resolution to authenticated, service_role;
