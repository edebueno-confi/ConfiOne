-- Support Workspace V1: alinha o grant de capacidade com os grants de tela.
--
-- As telas de suporte já possuem grants de tela para os papéis operacionais,
-- mas a resolução efetiva também exige a capacidade screen.support.view.
-- Esta migration corrige somente a lacuna de autorização e não publica as
-- telas no catálogo de release.

insert into public.internal_role_capability_grants (role, capability_key)
select roles.role, capability.capability_key
from (
  values
    ('platform_admin'::public.platform_role),
    ('support_manager'::public.platform_role),
    ('support_agent'::public.platform_role)
) as roles(role)
cross join (
  values ('screen.support.view'::text)
) as capability(capability_key)
on conflict (role, capability_key) do nothing;
