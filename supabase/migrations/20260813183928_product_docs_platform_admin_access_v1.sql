insert into public.internal_capabilities (
  capability_key,
  display_name,
  description,
  domain
)
values (
  'product_docs.view',
  'Consultar documentos do produto',
  'Abrir o catálogo e o leitor dos documentos internos oficiais do ConfiOne.',
  'administration'
)
on conflict (capability_key) do update
set display_name = excluded.display_name,
    description = excluded.description,
    domain = excluded.domain,
    is_active = true,
    updated_at = timezone('utc', now());

insert into public.internal_screen_capability_requirements (screen_key, capability_key)
values ('product_docs', 'product_docs.view')
on conflict (screen_key, capability_key) do nothing;

insert into public.internal_role_capability_grants (role, capability_key)
values ('platform_admin'::public.platform_role, 'product_docs.view')
on conflict (role, capability_key) do nothing;

update public.internal_screen_catalog
set release_enabled = true,
    release_stage = 'released',
    release_reason = 'Leitura dos documentos oficiais vinculados ao controle interno de desenvolvimento.',
    updated_at = timezone('utc', now())
where screen_key = 'product_docs';
