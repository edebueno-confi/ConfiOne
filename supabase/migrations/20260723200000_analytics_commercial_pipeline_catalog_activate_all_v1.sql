-- Ativa o catalogo comercial descoberto no HubSpot.
-- O administrador continua podendo desativar qualquer fonte pela tela de
-- configuracao; o estado inicial do ambiente de teste deve refletir todos os
-- pipelines comerciais conhecidos.

update public.analytics_source_config
set is_active = true
where domain_key = 'commercial'
  and object_type = 'deal';

comment on table public.analytics_source_config is
  'Fontes HubSpot configuraveis por dominio. O catalogo comercial descoberto e inicializado ativo; a administracao ocorre no Dashboard Gerencial.';
