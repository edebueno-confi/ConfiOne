-- Mantem o resolver publico historico e acrescenta WhatsApp ao contato publico.
alter view public.vw_public_knowledge_space_resolver
rename to vw_public_knowledge_space_resolver_base_v1;

revoke all on public.vw_public_knowledge_space_resolver_base_v1
from public, anon, authenticated, service_role;

create view public.vw_public_knowledge_space_resolver
with (security_barrier = true)
as
  select
    base.knowledge_space_id,
    base.knowledge_space_slug,
    base.knowledge_space_display_name,
    base.brand_name,
    base.default_locale,
    base.organization_slug,
    base.organization_display_name,
    base.route_kind,
    base.route_host,
    base.route_path_prefix,
    base.is_canonical,
    base.logo_asset_url,
    base.theme_tokens,
    base.seo_defaults,
    jsonb_strip_nulls(
      base.support_contacts || jsonb_build_object(
        'whatsapp',
        case
          when jsonb_typeof(bs.support_contacts -> 'whatsapp') = 'string'
            and length(bs.support_contacts ->> 'whatsapp') <= 40
            then bs.support_contacts ->> 'whatsapp'
          else null
        end
      )
    ) as support_contacts
  from public.vw_public_knowledge_space_resolver_base_v1 as base
  left join public.brand_settings as bs
    on bs.knowledge_space_id = base.knowledge_space_id;

revoke all on public.vw_public_knowledge_space_resolver
from public, anon, authenticated, service_role;

grant select on public.vw_public_knowledge_space_resolver to anon, authenticated, service_role;

comment on view public.vw_public_knowledge_space_resolver is
  'Read model contratual publico para resolver knowledge spaces ativos por slug e dominio, incluindo contatos publicos sanitizados.';
