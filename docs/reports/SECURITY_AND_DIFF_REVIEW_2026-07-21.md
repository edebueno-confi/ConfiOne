# Revisão de segurança e integridade do lote — 2026-07-21

## Escopo

Revisão local e estática das alterações recentes do Dashboard Gerencial,
Central de Ajuda, integrações HubSpot/OMIE, migração CS Ops e permissões de
`dashboard_viewer`. O checkout auditado é `C:\Projetos\GSO-old`, na branch
`codex/ux-ui-rebuild-v2-discovery`.

O worktree já continha alterações herdadas e arquivos não rastreados. Nenhum
`reset`, `clean`, commit, push, deploy, migração remota ou uso de credencial
foi executado nesta revisão.

## Resultado executivo

Não foram encontrados segredos expostos no frontend, bypass de papel,
permissão anônima de mutação administrativa ou função privilegiada recente sem
`search_path` explícito. As funções recentes usam `security definer` com
`set search_path = ''`, gates de autorização e grants restritos.

Foi aplicado um hardening pequeno e reversível no código versionável local:

- a migration de acesso do `dashboard_viewer` reafirma explicitamente grants da
  função privada, da view `vw_admin_knowledge_spaces` e da RPC de configuração;
- o teste pgTAP 063 passou a verificar também o `SELECT` autenticado e o bloqueio
  de leitura anônima da view administrativa.

## Achados e observações

### L-01 — CORS curinga compartilhado — baixo, aberto

Arquivo: `supabase/functions/_shared/ticket-evidence.ts:4-8`.

O helper compartilhado retorna `Access-Control-Allow-Origin: *` para funções
públicas e autenticadas. Isso não concede autenticação nem permissão por si só:
as rotas administrativas continuam exigindo JWT/papel e as rotas de evidência
validam o boundary. Porém, o curinga amplia a superfície de chamadas de
navegador e dificulta uma política de origem mínima.

Decisão: não alterar neste lote porque o helper também atende a superfícies
públicas da Central de Ajuda e uma troca sem inventário de consumidores pode
quebrar o fluxo. Próximo hardening: resolver origem permitida por ambiente e
manter `OPTIONS` coerente, com QA das rotas públicas e autenticadas.

### L-02 — Segredo de scheduler comparado diretamente no header — baixo, aberto

Arquivos: `supabase/functions/hubspot-sync/index.ts:89-95` e
`supabase/functions/analytics-integration-run/index.ts:11-20`.

O segredo `ANALYTICS_SYNC_SECRET` é lido somente no servidor e comparado com o
header dedicado. Não há evidência local de exposição do valor nem de aceitação
do scheduler sem o segredo. A comparação direta merece hardening futuro caso o
runtime ofereça comparação em tempo constante e rotação operacional do segredo.

Decisão: manter o comportamento nesta revisão para não invalidar o scheduler
configurado sem um procedimento de rotação e teste de disponibilidade.

### L-03 — `security definer` em funções RPC públicas — mitigado

Arquivos representativos: `supabase/migrations/20260720180000_analytics_company_matching_v1.sql:33-98`,
`supabase/migrations/20260720200000_analytics_integration_schedule_v1.sql:27-79`,
`supabase/migrations/20260720231000_knowledge_public_assets_bucket_v1.sql:66-122`
e `supabase/migrations/20260720234000_help_center_support_contacts_settings_v1.sql:24-128`.

As funções precisam estar no schema `public` para serem chamadas por RPC, mas o
risco foi reduzido por `set search_path = ''`, referências qualificadas,
validação de ator/papel e `revoke/grant` explícitos. A migration mais recente de
acesso do Dashboard passou a reafirmar os grants da view e RPC substituídas,
reduzindo dependência implícita da ordem histórica.

## Controles verificados

- RLS e grants presentes nas tabelas/views administrativas recentes; leitura de
  integrações é feita por read model sanitizado e o segredo gerenciado é obtido
  apenas pelo caminho server-side.
- `dashboard_viewer` fica limitado aos gates declarados; suporte/tickets não foi
  alterado por CS Ops.
- O preflight da migração CS Ops bloqueia `apply` quando o catálogo live do
  HubSpot retorna zero empresas (`HUBSPOT_COMPANY_CATALOG_EMPTY`).
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilidades.
- `npm run documentation:validate:internal-docs`: 0 bloqueios; 9 alertas
  normativos pré-existentes sobre menções a tokens/service role.
- `npm run supabase:lint:db`: aprovado; permanecem 12 warnings históricos de
  `v_actor` não utilizado em RPCs antigas.
- `npm run supabase:test:db`: aprovado com 67 arquivos e 1.194
  testes; o teste 063 foi ampliado neste lote e deve ser reexecutado no próximo
  comando de validação.

## Próximos gates

1. Reexecutar a suíte pgTAP completa e typecheck/build após o hardening.
2. Fazer QA autenticado das superfícies `dashboard_viewer`, Knowledge e
   configurações.
3. Revisar o diff por domínio e separar alterações herdadas antes de qualquer
   commit.
4. Só depois de revisão humana decidir commit, push, publicação de migrations e
   deploy remoto.

## Status Git

Alterações locais preservadas. Não houve staging, commit ou push nesta revisão.
