# Central de Ajuda, Conteúdo e acesso do Dashboard — 2026-07-20

## Resultado

O perfil `dashboard_viewer` passou a ter um recorte operacional administrável
para:

- Dashboard Gerencial e configuração de pipelines/fontes;
- Área do cliente;
- Central de Ajuda pública;
- Knowledge/Conteúdo, incluindo criação e edição de artigos;
- Configurações limitadas às integrações gerenciais, sem liberar o restante do
  console administrativo.

O acesso agora pode ser concedido ou revogado por um administrador na tela
`/admin/access`, pelo controle `Acesso ao Dashboard Gerencial`. A RPC aceita
somente o papel `dashboard_viewer`; não foi criado um gravador genérico de
papéis globais.

## Conteúdo disponível

O projeto já possui documentação editorial versionada e um corpus local em
`raw_knowledge/octadesk_export/latest/articles`:

- `docs/KNOWLEDGE_BASE_STRATEGY.md`;
- `docs/KNOWLEDGE_CONTENT_CURATION_PLAN.md`;
- `docs/PUBLIC_HELP_CENTER_PUBLISH_RUNBOOK.md`;
- `docs/CONTENT_OPERATIONS_GOVERNANCE.md`;
- `docs/reports/KNOWLEDGE_LEGACY_INVENTORY_REPORT.md`;
- `docs/reports/GENIUS_HELP_CENTER_READINESS_REPORT.md`.

Os 58 artigos disponíveis foram importados no banco local como `draft`, com
`source_path` e `source_hash` preservados. Nenhum conteúdo foi publicado
automaticamente. A central local `genius` foi ativada apenas para QA; como os
artigos continuam em rascunho, a superfície pública não expõe esses artigos.

## Contratos alterados

- `app_private.can_manage_knowledge_base()` agora aceita `platform_admin` e
  `dashboard_viewer` para operação editorial autenticada;
- `vw_admin_knowledge_spaces` permite ao editor autorizado escolher a central,
  mas a escrita de organizations, spaces e branding continua exclusiva de
  `platform_admin`;
- `rpc_admin_upsert_analytics_source_config` usa o gate analítico autorizado;
- `rpc_admin_set_global_role` concede/revoga somente `dashboard_viewer` e exige
  administrador de plataforma;
- rotas e shell mantêm o perfil sem acesso a Acessos, Sistema, Tenants e demais
  superfícies administrativas.

## Validação

- `npm run web:typecheck`: passou;
- `npm run supabase:verify`: passou antes da inclusão do teste de administração do
  papel, com o reset/contrato local validados;
- `npx supabase test db --local`: passou após as alterações finais, com 64
  arquivos pgTAP / 1.177 testes;
- QA autenticado no navegador: Dashboard, Área do cliente, `/help`,
  `/admin/knowledge`, `/admin/knowledge/new` e `/admin/settings` carregaram;
- `/admin/access` redirecionou o viewer para o Dashboard;
- o administrador visualizou o painel de concessão/revogação do Dashboard;
- console do navegador sem erros durante o fluxo QA.

## Limite deliberado

Publicar artigos públicos continua exigindo revisão editorial humana e o
runbook vigente. O perfil pode preparar conteúdo, mas não deve ser usado para
publicar em massa sem revisão de segurança, categoria, visibilidade e assets.
