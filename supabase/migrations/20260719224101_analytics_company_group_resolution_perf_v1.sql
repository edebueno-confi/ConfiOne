create index if not exists analytics_company_group_resolution_active_tax_id_idx
  on public.analytics_company_group_resolution (tax_id_normalized)
  where is_active;
