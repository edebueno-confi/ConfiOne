# Relatório Delta — Refatoração de Configurações e Fontes do Dashboard

Data: 2026-08-02
Checkout: `C:\Projetos\GSO-old`
Branch: `codex/dashboard-management-rebuild-20260802`
Escopo: Configurações, Fontes do Dashboard, Histórico e proveniência.
Fora do escopo: páginas analíticas do Dashboard, sincronização real, push/deploy e correção de fixtures pgTAP.

## 1. Resumo executivo

O lote substituiu a composição antiga de Configurações por um único shell com
rotas canônicas e três superfícies operacionais separadas. Integrações agora
publica somente HubSpot e OMIE; OMIE aceita `APP_KEY` e `APP_SECRET` separados,
sem retornar credenciais. Fontes do Dashboard administra agenda, ações manuais,
status das fontes e catálogo vivo de pipelines. Histórico agrupa ciclos e
separa origem, execução, duração, contagem e erro sanitizado.

## 2. Estado Git inicial

O lote começou no checkout canônico, branch
`codex/dashboard-management-rebuild-20260802`, HEAD `e79e953`, sem upstream,
worktree limpo, um worktree ativo e stash preservado. A divergência observada
era `origin/main...HEAD = 0 61`. Nenhuma operação destrutiva ou de integração
remota foi executada.

## 3. Skill de design utilizada

Skills invocadas e lidas antes da implementação:

- `ux-friction-analyzer` — `C:\Users\edebu\.codex\skills\ux-friction-analyzer\SKILL.md`.
- `ui-ux-specialist` — `C:\Users\edebu\.codex\skills\ui-ux-specialist\SKILL.md`.
- `frontend-design` — `C:\Users\edebu\.codex\skills\frontend-design\SKILL.md`.
- `data-analytics:design-kpis` — `C:\Users\edebu\.codex\plugins\cache\openai-curated-remote\data-analytics\0.2.8-13ceeea1f599\skills\design-kpis\SKILL.md`.
- `genius-code-quality` — `C:\Projetos\GSO-old\.agents\skills\genius-code-quality\SKILL.md`.
- `artifact-template-design-report` — `C:\Users\edebu\.codex\plugins\cache\openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-design-report\SKILL.md`.

Invocação: refatoração controlada autorizada pelo Product Owner, com screenshots
das superfícies atuais, documentação canônica, contratos de views/RPCs e a
restrição de não alterar as páginas analíticas. Contexto adotado: reduzir carga
cognitiva, preservar acessibilidade, usar dados reais e manter o backend como
fonte da verdade.

Recomendações adotadas: progressive disclosure, rotas previsíveis, foco único
por página, alvos de toque amplos, estados textuais além de cor, cards de
integração em coluna responsiva, catálogo em lista, foco visível e copy
administrativa. Rejeitadas neste lote: redesign completo do Dashboard, ações em
massa sem confirmação, autoexecução de sincronização, mocks e nova skill; o
redesign visual da Visão Geral fica para aprovação em lote separado.

## 4. Arquitetura anterior

`SettingsPage` incorporava `AnalyticsConfigPage` e `AnalyticsLogsPage`, mantendo
uma barra interna “Dashboard e Analytics” com navegação duplicada, diagnóstico,
agenda, pipelines, logs e controles de integração no mesmo fluxo.

## 5. Arquitetura final

`AdminConsoleShell` continua sendo o shell global. `SettingsPage` passa a
controlar apenas o menu lateral e o contexto; o conteúdo especializado está em:

- `SettingsIntegrationsPanel.tsx`;
- `DashboardSourcesSettingsPage.tsx`;
- `SyncHistorySettingsPage.tsx`.

Cada rota usa os mesmos header, menu, tokens, estados de erro/vazio/loading e
largura de conteúdo.

## 6. Shell e navegação

Rotas canônicas publicadas:

- `/admin/settings/integrations`;
- `/admin/settings/dashboard-sources`;
- `/admin/settings/sync-history`;
- `/admin/settings/brands`;
- `/admin/settings/help-center`.

`/admin/settings` e `section=analytics`/seções legadas redirecionam para a rota
correspondente. Não há segunda barra de navegação nem conteúdo duplicado.

## 7. Integrações

A superfície exibe apenas HubSpot e OMIE, estado sanitizado, ativação e ações
“Salvar alterações” e “Atualizar credencial”. HubSpot descreve clientes,
Comercial e atendimentos; OMIE descreve dados financeiros e contas a receber.

## 8. Fontes do Dashboard

A página reúne atualização automática, atualização completa, ações reais
separadas para HubSpot e OMIE, status das fontes e catálogo de pipelines. O
frontend chama APIs/RPCs existentes ou os novos contratos administrativos; não
calcula KPI nem inventa origem.

## 9. Histórico de sincronizações

`vw_admin_analytics_sync_history_v1` alimenta uma tela própria. Os grupos usam
`correlation_id` quando disponível e mostram origem, execução manual/automática,
início, término, duração, quantidade processada, resultado e erro sanitizado.

## 10. Descoberta de pipelines

`hubspot-orchestrator-worker` consulta as definições de deals e tickets da API
HubSpot e chama `rpc_service_reconcile_hubspot_pipeline_catalog`. O RPC persiste
ID, nome oficial, tipo, descoberta e estado; pipelines ausentes são arquivados
sem apagar histórico.

## 11. Ativação padrão

Um pipeline novo, não arquivado e com classificação pendente entra ativo por
padrão. A carga HubSpot inclui `unclassified`, mas o domínio permanece
`unclassified` até decisão administrativa.

## 12. Classificação por área

As áreas persistidas são Comercial, Customer Success, Suporte, Chat e A
classificar. Deals são Comercial pelo tipo de objeto. Tickets sem decisão segura
ficam em A classificar; Chat não é inferido por nome. A classificação e o alias
existentes são preservados durante nova descoberta.

## 13. Diagnósticos removidos

Foram removidos da produção o card, a página antiga de configuração/logs, a Edge
Function `hubspot-cs-diagnostic` e seu bloco de configuração. A navegação e os
testes exclusivos foram substituídos por contrato de ausência.

## 14. Backend removido ou preservado

O endpoint de diagnóstico foi removido após auditoria de consumidores. RPCs de
sincronização, read models, worker, parser OMIE, scheduler e histórico foram
preservados porque possuem consumidores reais ou governam dados operacionais.
Nenhuma migration histórica foi editada; mudanças de banco são forward-only.

## 15. Auditoria de consumidores

O diagnóstico foi localizado em componente, API, Edge Function, configuração e
testes. Não havia outra rota, script ou consumidor legítimo. APIs de catálogo,
status, agenda e sincronização continuam referenciadas por Fontes do Dashboard
ou pelo Dashboard analítico fora do escopo visual.

## 16. Revisão de copy

Removidos das superfícies alvo: Modo API como controle, Vault, recurso técnico,
histórico junto ao botão de credencial, Dashboard e Analytics, diagnóstico,
platform_admin, server-side e nomes de funções/RPCs. O subtítulo passou a ser
“Gerencie integrações, fontes de dados e configurações do sistema.”

## 17. Segurança e permissões

Credenciais são enviadas somente como comando de atualização e nunca retornam à
interface. A UI usa estado sanitizado. RPCs novos usam `security definer`,
`search_path = ''`, validação de papel, grants restritos, read models com
`can_read_analytics()` e erro sem payload sensível. Não houve leitura ou alteração
de secrets externos.

## 18. Testes

Passaram os contratos Node focados (27/27), `web:typecheck`,
`contracts:typecheck`, build web, `git diff --check`, secret scan, lint SQL e
pgTAP focado `supabase/tests/090_settings_sources_catalog_v2.sql` (15/15).

## 19. Code Quality

`npm run quality:module -- apps/web/src/features/settings` foi aprovado com
observações. O scanner encontrou seis candidatos preexistentes de acesso direto
em `settings-api.ts`; eles pertencem a grupos antigos de Configurações e não
foram alterados neste lote. Não houve blocker confirmado.

## 20. QA visual

O QA usou servidor empacotado Vite Preview, não Vite dev. Foram validados claro e
escuro, shell único, copy, navegação, reload direto, overflow, console, erros de
página, respostas HTTP e falhas de requisição.

## 21. Screenshots

Manifesto: `output/settings-control-plane-v2-preview/manifest.json` (ignorado
pelo Git). Foram geradas 18 capturas: 3 superfícies × 3 viewports × 2 temas.
Também foram executados 6 checks sem captura em 1024×768. Resultado: 18/18
capturas e 24/24 checks sem console/page error, request failure, resposta
inesperada, overflow ou copy proibida.

## 22. Arquivos alterados

Principais arquivos: `SettingsPage.tsx`, `SettingsIntegrationsPanel.tsx`,
`DashboardSourcesSettingsPage.tsx`, `SyncHistorySettingsPage.tsx`, `router.tsx`,
`index.css`, `analytics-api.ts`, `analytics-model.ts`, worker HubSpot, duas
migrations de catálogo/histórico, teste pgTAP, contratos Node, `docs/spec.md` e
`docs/plan.md`.

## 23. Commits

Commits locais, sem push:

- `9432ad6` shell e rotas canônicas;
- `7ca344a` configuração de integrações;
- `e6b26c7` fontes e histórico;
- `be73634` catálogo HubSpot e migrations;
- `f284cab` remoção segura do diagnóstico legado;
- `a9a10cb` contratos Node e pgTAP;
- `17a8730` estilos do control plane;
- `7303cc3` documentação e QA empacotado.
- `ac5ff3e` fechamento do estado Git.

## 24. Estado Git final

Lote encerrado com staging revisado, commits locais e worktree limpo. HEAD:
`ac5ff3e`; branch `codex/dashboard-management-rebuild-20260802`; sem upstream;
`git rev-list --left-right --count origin/main...HEAD` = `0 69`. Nenhum upstream
foi criado e nenhum push foi feito.

## 25. Limitações

A suíte pgTAP completa não é uma evidência limpa neste banco persistente: testes
legados colidem em UUIDs fixos e um teste de scheduler histórico também falha.
Não houve reset para contornar isso, conforme autorização. Sincronização real
HubSpot → OMIE depende de credenciais externas e não foi executada. A Visão Geral
continua fora deste lote e não é considerada reconstruída/aprovada.

## 26. Pendências do Product Owner

1. Aprovar visualmente as três superfícies de Configurações.
2. Confirmar o denominador de Customer Success antes de qualquer redesign dessa
   área.
3. Fornecer/autorizar a execução read-only real HubSpot → OMIE em lote separado.
4. Autorizar o próximo lote para reconstruir shell/Resumo Gerencial/Comercial e,
   após aprovação visual, aplicar padrão a CS, Suporte e Financeiro.

## Critério de parada

Este lote para aqui. Não houve push, deploy, sync real, reset de banco, correção
de fixtures pgTAP ou alteração das páginas analíticas.
