-- RESOLUÇÃO: RESTAURA O CONTRATO QUE A REESCRITA QUEBROU
--
-- A migration `20260808210000` reescreveu `vw_analytics_ticket_resolution` do
-- zero para incorporar as propriedades nativas, e ao fazer isso **descartou
-- colunas e comportamentos que já existiam**:
--
--   is_currently_open   sumiu — usada por outros consumidores e por pgTAP
--   pipeline_id, hs_created_at, first_closed_at, stage_changes   sumiram
--   has_history         passou a significar outra coisa
--   reopened_count      deixou de contar transições do histórico
--
-- Foi a causa do CI vermelho. Rodei os testes de contrato em Node depois da
-- reescrita e não rodei pgTAP, que é o único que cobre SQL.
--
-- A lição, e é a mesma de sempre neste projeto: **reescrever do zero descarta o
-- que não se lembrou de olhar**. A forma segura era partir da definição vigente
-- e acrescentar, não redigir de memória.
--
-- Esta migration reconstrói a view somando as duas fontes, com precedência
-- declarada em cada medida:
--
--   resolução        data nativa de encerramento, depois histórico de etapa
--   primeira resposta  data de resposta do agente, depois tempo de SLA
--   reabertura       transições do histórico, mais a marca nativa
--
-- `has_history` volta ao significado original — existe histórico de etapa
-- ingerido para este atendimento — porque é dele que os testes e os estados de
-- cobertura dependem. A reabertura nativa entra em coluna própria.

drop view if exists public.vw_analytics_ticket_resolution cascade;

create view public.vw_analytics_ticket_resolution as
with events as (
  select
    e.object_id as ticket_id,
    e.changed_at,
    coalesce(s.metadata ->> 'ticketState', '') = 'CLOSED' as is_closed_stage,
    -- O estado anterior não é coluna da tabela: ela guarda a sequência de
    -- etapas, e o anterior é o registro imediatamente antes do mesmo
    -- atendimento. Derivar aqui evita duplicar a informação na ingestão.
    lag(coalesce(s.metadata ->> 'ticketState', '')) over (
      partition by e.object_id order by e.changed_at
    ) as previous_state
  from public.analytics_hubspot_stage_events e
  left join public.hubspot_pipeline_stages s
    on s.object_type = 'ticket' and s.stage_id = e.stage_id
  where e.object_type = 'ticket'
),
aggregated as (
  select
    ticket_id,
    min(changed_at) filter (where is_closed_stage) as first_closed_at,
    max(changed_at) filter (where is_closed_stage) as last_closed_at,
    count(*) filter (where previous_state = 'CLOSED' and not is_closed_stage)::integer as reopened_count,
    count(*)::integer as stage_changes
  from events
  group by ticket_id
),
base as (
  select
    t.ticket_id,
    t.pipeline_id,
    t.hs_created_at,
    t.hs_closed_at,
    t.first_response_ms,
    t.first_agent_reply_at,
    t.last_activity_at,
    t.reopened_at,
    t.is_one_touch,
    coalesce(cur.metadata ->> 'ticketState', '') = 'CLOSED' as is_closed_now,
    coalesce(cur.metadata ->> 'ticketState', '') = 'OPEN' as is_currently_open,
    a.ticket_id is not null as has_history,
    a.first_closed_at,
    a.last_closed_at,
    coalesce(a.reopened_count, 0) as history_reopened_count,
    coalesce(a.stage_changes, 0) as stage_changes
  from public.hubspot_tickets t
  left join public.hubspot_pipeline_stages cur
    on cur.object_type = 'ticket'
   and cur.pipeline_id = t.pipeline_id
   and cur.stage_id = t.pipeline_stage
  left join aggregated a on a.ticket_id = t.ticket_id
)
select
  b.ticket_id,
  b.pipeline_id,
  b.hs_created_at,
  b.has_history,
  b.is_currently_open,
  b.first_closed_at,
  b.stage_changes,
  b.last_activity_at,
  b.reopened_at,
  b.is_one_touch,
  -- Precedência: data nativa do HubSpot, depois histórico de estágio.
  case
    when not b.is_closed_now then null
    when b.hs_closed_at is not null then b.hs_closed_at
    else b.last_closed_at
  end as resolved_at,
  case
    when not b.is_closed_now then null
    when b.hs_closed_at is not null then 'hubspot_property'
    when b.last_closed_at is not null then 'stage_history'
    else null
  end as resolution_source,
  case
    when not b.is_closed_now then null
    when b.hs_closed_at is not null and b.hs_created_at is not null
      then extract(epoch from (b.hs_closed_at - b.hs_created_at)) / 86400.0
    when b.last_closed_at is not null and b.hs_created_at is not null
      then extract(epoch from (b.last_closed_at - b.hs_created_at)) / 86400.0
    else null
  end as resolution_days,
  -- A data de resposta do agente tem cobertura doze vezes maior que o tempo de
  -- SLA em horas; o segundo permanece como reserva e a fonte é declarada.
  coalesce(
    case when b.first_agent_reply_at is not null and b.hs_created_at is not null
      then round((extract(epoch from (b.first_agent_reply_at - b.hs_created_at)) / 3600.0)::numeric, 2)
    end,
    round((b.first_response_ms::numeric / 3600000.0), 2)
  ) as first_response_hours,
  case
    when b.first_agent_reply_at is not null then 'agent_reply_date'
    when b.first_response_ms is not null then 'sla_operating_hours'
    else null
  end as first_response_source,
  -- Reabertura soma as duas evidências. O histórico conta quantas vezes; a marca
  -- nativa garante ao menos uma quando o histórico não foi ingerido.
  greatest(
    b.history_reopened_count,
    case when b.reopened_at is not null then 1 else 0 end
  ) as reopened_count
from base b;

comment on view public.vw_analytics_ticket_resolution is
  'Resolucao, primeira resposta e reabertura do atendimento. Cada medida declara a fonte usada, e as colunas do contrato anterior sao preservadas.';

revoke all on public.vw_analytics_ticket_resolution from public, anon;
grant select on public.vw_analytics_ticket_resolution to authenticated, service_role;
