-- CS enxerga os segmentos das contas da sua carteira (mesma regra do portfolio).

drop policy if exists customer_segment_assignments_select_cs on public.customer_segment_assignments;
create policy customer_segment_assignments_select_cs
on public.customer_segment_assignments for select to authenticated
using (app_private.can_access_cs_customer_portfolio(tenant_id));

-- CS tambem le o catalogo de segmentos (rotulos/cores) para exibir badges.
drop policy if exists customer_segments_select_cs on public.customer_segments;
create policy customer_segments_select_cs
on public.customer_segments for select to authenticated
using (
  exists (
    select 1 from public.customer_segment_assignments a
    where a.segment_id = customer_segments.id
      and app_private.can_access_cs_customer_portfolio(a.tenant_id)
  )
  or app_private.has_global_role('platform_admin'::public.platform_role)
);
