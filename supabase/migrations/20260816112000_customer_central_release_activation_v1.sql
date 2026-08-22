-- Publica a Central de Clientes no release local/controlado somente depois de
-- haver contrato backend, RLS, read models e smoke autenticado para a tela.

update public.internal_screen_catalog
set
  release_enabled = true,
  release_stage = 'released',
  release_reason = 'Central de Clientes B2B com cadastro operacional e agrupamento interno auditavel',
  updated_at = timezone('utc', now())
where screen_key = 'tenants';
