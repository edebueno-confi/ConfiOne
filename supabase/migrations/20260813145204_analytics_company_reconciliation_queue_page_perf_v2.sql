-- DASHBOARD-RECONCILIATION-QUEUE-PAGE-PERF-V2
-- Calcula candidatos somente para a pagina solicitada. O resumo continua
-- global e a ordenacao publica da fila permanece inalterada.

begin;

do $$
declare
  v_definition text;
begin
  v_definition := pg_get_functiondef(
    'public.rpc_analytics_company_reconciliation_queue(integer,integer)'::regprocedure
  );

  if position('), items as (' in v_definition) = 0
    or position('from rows_with_decisions r' in v_definition) = 0
    or position('), paged_items as (' in v_definition) = 0
    or position('limit greatest(1, least(p_limit, 500))' in v_definition) = 0 then
    raise exception 'Contrato inesperado de rpc_analytics_company_reconciliation_queue';
  end if;

  v_definition := replace(
    v_definition,
    '), items as (',
    '), paged_rows as (' || chr(10)
    || '    select *' || chr(10)
    || '    from rows_with_decisions' || chr(10)
    || '    order by case when confirmed_company_id is not null then ''confirmed'' else ''pending'' end,' || chr(10)
    || '      coalesce(source_name, source_trade_name, ''Cliente OMIE '' || coalesce(omie_client_code, ''sem codigo''))' || chr(10)
    || '    limit greatest(1, least(p_limit, 500))' || chr(10)
    || '    offset greatest(p_offset, 0)' || chr(10)
    || '  ), items as ('
  );

  v_definition := replace(v_definition, 'from rows_with_decisions r', 'from paged_rows r');

  v_definition := replace(
    v_definition,
    '), paged_items as (' || chr(10)
    || '    select value' || chr(10)
    || '    from items' || chr(10)
    || '    order by value ->> ''status'', value ->> ''source_name''' || chr(10)
    || '    limit greatest(1, least(p_limit, 500))' || chr(10)
    || '    offset greatest(p_offset, 0)' || chr(10)
    || '  )',
    '), paged_items as (' || chr(10)
    || '    select value' || chr(10)
    || '    from items' || chr(10)
    || '  )'
  );

  execute v_definition;
end;
$$;

comment on function public.rpc_analytics_company_reconciliation_queue(integer, integer) is
  'Fila de governanca HubSpot OMIE com candidatos calculados somente para a pagina solicitada; o resumo permanece global e sugestoes continuam pendentes ate decisao humana.';

commit;
