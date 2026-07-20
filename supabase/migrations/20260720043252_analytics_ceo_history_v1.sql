-- Historico executivo: compara o recorte atual com o periodo imediatamente
-- anterior de mesma duracao. A agregacao reutiliza o snapshot canonico para
-- manter as mesmas regras de HubSpot, OMIE e reconciliacao.
create or replace function public.rpc_analytics_ceo_history(
  p_from date default null,
  p_to date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_from date := coalesce(p_from, date_trunc('month', current_date)::date);
  current_to date := coalesce(p_to, current_date);
  period_days integer;
  previous_from date;
  previous_to date;
  current_payload jsonb;
  previous_payload jsonb;
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado ao Historico Executivo';
  end if;

  if current_to < current_from then
    raise exception 'Periodo invalido: data final anterior a data inicial';
  end if;

  period_days := (current_to - current_from) + 1;
  previous_to := current_from - 1;
  previous_from := previous_to - period_days + 1;

  current_payload := public.rpc_analytics_ceo_snapshot(current_from, current_to);
  previous_payload := public.rpc_analytics_ceo_snapshot(previous_from, previous_to);

  return jsonb_build_object(
    'current_from', current_from,
    'current_to', current_to,
    'previous_from', previous_from,
    'previous_to', previous_to,
    'current', current_payload,
    'previous', previous_payload
  );
end;
$$;

comment on function public.rpc_analytics_ceo_history(date, date) is
  'Compara a visao executiva atual com o periodo anterior de mesma duracao, reutilizando o snapshot canonico.';

revoke all on function public.rpc_analytics_ceo_history(date, date) from public, anon;
grant execute on function public.rpc_analytics_ceo_history(date, date) to authenticated, service_role;
