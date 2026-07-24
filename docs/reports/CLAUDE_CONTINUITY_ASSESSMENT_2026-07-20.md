# Relatório de continuidade — Claude assume o Genius Support OS

Data: 2026-07-20
Autor: Claude / Anthropic (agente executor da próxima fase)
Checkout: `C:\Projetos\GSO-old`
Branch: `codex/ux-ui-rebuild-v2-discovery`
HEAD: `b7ce25e feat(analytics): consolidate management dashboard and handoff`

Este relatório cumpre o gate solicitado no handoff: leitura completa antes de
implementar. Ele registra o que entendi, o estado real, riscos e a sequência de
ciclos. A execução autônoma só começa após a decisão registrada na seção 10.

## 1. Entendimento do produto e da arquitetura

O Genius Support OS é um cockpit operacional de CX B2B multiempresa, não um CRM
ou ERP genérico. O domínio central é o ciclo de vida do ticket, com superfícies
adjacentes: Portal do Cliente, Suporte/Ticket Workspace, Carteira CS, Knowledge,
Acionamentos Internos, Engenharia/Produto, Administração e, mais recentemente, o
Dashboard Gerencial.

Regras de arquitetura vigentes, que assumo como invioláveis:

- Backend é a única fonte da verdade. Frontend renderiza read models (views),
  dispara RPCs/commands governados e nunca calcula SLA, permissão, status,
  prioridade, elegibilidade, reconciliação, aging ou inadimplência.
- PostgreSQL/Supabase concentra RLS, constraints, triggers de auditoria,
  functions/RPCs, views contratuais e logs append-only.
- Todo dado operacional tem `tenant_id` ou vínculo explícito. Nunca inferir
  tenant pelo contexto visual.
- Separação estrita de domínios: suporte não é engenharia, ticket não é bug,
  artigo público não é playbook interno, empresa cliente não é usuário interno.
- Proibições: mock como fonte de produto, permissão só no frontend, IA sem
  fonte citável, anexo sem controle de acesso, exclusão física de histórico
  operacional, escrita externa sem dry-run/ledger/auditoria.
- Toda funcionalidade nasce com contrato de dados, regra de permissão, trilha de
  auditoria, evento de histórico, teste mínimo de acesso e documentação.

Hierarquia de fontes de dados do Dashboard Gerencial:

- HubSpot: fonte operacional de CS após reconciliação (empresas, deals, tickets,
  owners), consumida server-side e materializada em cache local read-only.
- CS Ops (planilha `BD_Clientes`): staging/migração/enriquecimento, não fonte
  permanente.
- Planilha financeira exportada do OMIE: fallback temporário até a API OMIE.
- Tickets/Suporte: preservam os pipelines usados pela equipe.

## 2. Estado atual do Dashboard Gerencial

O Dashboard Gerencial está implementado dentro do produto (rota
`/admin/analytics`), sem dependência de Looker, com backend-first consolidado no
commit `b7ce25e`. Módulo em `apps/web/src/features/analytics/`.

Abas: Executiva, Comercial, CS/Suporte, Financeiro, além de Configuração e Logs.
Período global compartilhado entre abas com presets (semana, mês atual, mês
passado, trimestre atual/passado, ano atual/passado, todo o período).

Contratos backend principais identificados:

- `rpc_analytics_ceo_snapshot`: visão executiva (reutilizada pelo histórico).
- `rpc_analytics_ceo_history`: comparação período atual vs anterior equivalente,
  retorna `current`, `previous` e quatro datas de referência.
- `rpc_analytics_ceo_reconciliation_quality_grouped`: fila de qualidade agrupada
  por cliente.
- `analytics_finance_receivables` (read model) + `rpc_analytics_finance_snapshot`:
  KPIs financeiros, distribuição por situação, aging e tendência mensal.
- `analytics_source_config`: multi-pipeline por domínio com RPC administrativo
  validado por `platform_admin`.
- `analytics_company_group_resolution`: resolução auditável de matriz/filial e
  grupo econômico por CNPJ.
- `analytics_hubspot_merge_runs` + Edge Function `hubspot-company-merge`:
  unificação manual e auditada de empresas.
- Papel `dashboard_viewer`: acesso restrito a Dashboard, Área do cliente e
  Central de ajuda.

## 3. Funcionalidades realmente implementadas

Confirmadas por relatórios, migrations versionadas e arquivos presentes em disco:

| Área | Entregue |
|---|---|
| Executiva | KPIs comercial/CS/financeiro, visão histórica comparativa, alertas semânticos de risco financeiro e qualidade, seções extensas recolhidas por padrão |
| Reconciliação | Filas de títulos `matched`/`unmatched`/`ambiguous`, contagem de candidatas, paginação server-side, busca por cliente/CNPJ/título, filtro por grupo econômico, agrupamento por cliente |
| Grupo econômico | Resolução por CNPJ (caso Restoque registrado: matriz Restoque Atacado, Le Lis Blanc no grupo); KPIs descontam essas ocorrências das ambiguidades |
| Financeiro | 3.077 títulos importados da planilha OMIE; líquido R$ 3.997.092,79; saldo R$ 1.455.040,79; 610 atrasados; provenance com hash do arquivo |
| CS/Suporte | Multi-pipeline configurável, consolidação por status/origem/responsável, `hubspot_owner_id` em tickets, total criado no período |
| HubSpot | Sync server-side, cache read-only, snapshot com proteção contra vazio, remoção de IDs ausentes só após carga bem-sucedida, captura de owners, merge auditado (correção do caso Gloss: 3 linhas para 1 novo ID) |
| CS Ops | Importador da aba `BD_Clientes` (parser enxuto contra HTTP 546), hash/idempotência, normalização de CNPJ e HubSpot ID, staging/auditoria/rejeições, dry-run; lote de 606 linhas aceitas |
| Exportação | Configurador visual no shell, seleção de abas, respeita período global, PDF dedicado sem shell, PNG local via canvas; `window.print()` e CSV visual removidos |
| Acesso | Papel `dashboard_viewer` com contrato e grant por e-mail (aguarda auth user) |

Limite explícito da exportação: primeira versão é relatório executivo
estruturado com KPIs e resumos, não replica todos os gráficos interativos com
fidelidade pixel a pixel.

## 4. Integrações: ativas, preparadas, pendentes

- HubSpot: preparada e funcional server-side (leitura + merge auditado). Ativação
  plena depende de uma sincronização concluída com sucesso e de credencial válida
  na integração gerenciada. Estado observado: cache de empresas já teve carga
  (10.161 linhas após limpeza do caso Gloss), mas em auditorias anteriores o
  cache esteve vazio por sync não concluído. Confirmar o estado do ambiente-alvo.
- OMIE: adapter read-only preparado (parser decimal robusto, timeout, retry),
  sem chave. Fonte atual é a planilha exportada. Pendente: App Key/App Secret
  server-side para sincronização e reconciliação API vs planilha.
- CS Ops: importador funcional em staging. Pendente: fechar o ledger de escrita
  antes de qualquer novo lote de escrita no HubSpot.
- GitHub (Produto): backlog, bloqueado até haver organização/repositório
  autorizado. O sistema não inventa métricas de produto.
- Canais de tickets (origem detalhada): depende de dados confiáveis do HubSpot.

Nenhuma credencial foi criada ou exposta neste checkout. O desenvolvimento local
segue sem depender de renovação de tokens.

## 5. Validações já executadas (herdadas do Codex)

- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado; aviso conhecido de chunks acima de 500 kB.
- `npm run supabase:test:db`: 62 arquivos, 1.164 testes, sem falhas (nota:
  auditoria de 18/07 registrou o teste 056 falhando por materialização de
  migrations no runner; verificar se já normalizou).
- Testes CS migration e OMIE: 9/9 aprovados.
- `git diff --check`: aprovado nos lotes verificados.
- `supabase db lint --local`: diagnósticos preexistentes de pgTAP e `v_actor`;
  não considerar lint totalmente limpo.
- QA de navegador: chegou ao login, sem sessão autenticada. O fluxo completo do
  dashboard e da exportação ainda não foi validado autenticado.

Ainda não reexecutei essas validações neste ambiente. Fazem parte do primeiro
ciclo (baseline).

## 6. Riscos e inconsistências identificados

Ordenados por severidade.

### 6.1 CRÍTICO — Índice Git preparado para remover o Dashboard Gerencial

O estado atual do repositório é o risco número um e precisa de decisão humana
antes de qualquer execução.

- HEAD (`b7ce25e`) contém o módulo Analytics completo (confirmado via
  `git ls-tree HEAD apps/web/src/features/analytics/`).
- O índice (staging area) tem uma remoção em massa de 232 arquivos,
  +518/-23453 linhas, que exclui todo o Analytics do índice, além de
  `AdminOverviewPage`, `SettingsPage`, `CustomersPage`, `HomePage`, `InboxPage`,
  e remove as rotas `/admin/analytics`, `/admin/settings`, entre outras, em
  `router.tsx`.
- Os arquivos do Analytics ainda existem fisicamente em disco, com timestamps de
  20/07 (mais recentes que o commit), mas estão marcados como `D` no índice.
- Reflog mostra `reset: moving to HEAD` sobre `d2127c1` antes do commit
  `b7ce25e`. O índice diverge de HEAD após o commit.

Interpretação: a branch `codex/ux-ui-rebuild-v2-discovery` está em fase de
descoberta/derrubada da UI legada para a reconstrução V2 (cockpit), e essa
derrubada foi preparada no índice mas nunca commitada. Isso contradiz
diretamente o handoff do mesmo dia, que instrui a continuar evoluindo o
Analytics (OMIE, QA, pipelines).

Consequência: se o índice atual for commitado como está, o Dashboard Gerencial
recém-entregue some do repositório. Não farei reset, checkout, clean ou commit
desse índice sem decisão explícita. As alterações estão preservadas.

### 6.2 ALTO — Migrations de Analytics untracked e não commitadas

47 migrations e diversos testes pgTAP do módulo Analytics estão untracked
(`20260716*` a `20260720*`). Ou seja, o backend que sustenta o Dashboard não
está versionado no HEAD. Precisam ser preservados e, após decisão da seção 10,
commitados de forma coerente com o frontend correspondente.

### 6.3 ALTO — HubSpot sync não confirmado no ambiente-alvo

Relatórios divergem sobre o estado do cache (vazio em 18/07, 10.161 linhas em
19/07). Sem uma sincronização concluída e verificada no ambiente do usuário, os
números de reconciliação e volume de tickets podem estar defasados.

### 6.4 MÉDIO — QA autenticado inexistente

Nenhuma validação autenticada de ponta a ponta do dashboard e da exportação foi
feita. Há apenas typecheck/build/testes de banco. É preciso fixture
administrativa e sessão local (`docs/LOCAL_QA_AUTH.md`).

### 6.5 MÉDIO — Divergência de checkout

Existe uma cópia `C:\Genius Support OS` que o handoff proíbe usar para retomar
Analytics. Confirmar que todo o trabalho ocorre em `C:\Projetos\GSO-old`.

### 6.6 BAIXO — Dívidas técnicas conhecidas

Chunks Vite acima de 500 kB (oportunidade de code-splitting), warnings
preexistentes de `db lint` (`v_actor`, pgTAP), possível fragilidade do teste 056.

## 7. Próximos ciclos (priorizados)

A prioridade depende da decisão da seção 10. Abaixo, a sequência que recomendo se
a decisão for preservar e evoluir o Analytics (cenário A do handoff).

- Ciclo 0 — Baseline e preservação. Reexecutar typecheck/build/testes de banco
  neste ambiente, confirmar estado do índice Git, garantir preservação, decidir a
  estratégia de commit das migrations untracked.
- Ciclo 1 — QA autenticado do Dashboard. Fixture admin + sessão local, validar
  período, abas, Configuração, filas de reconciliação e exportação PDF/PNG.
- Ciclo 2 — HubSpot sync confiável. Executar e verificar uma sincronização
  completa, confirmar pipelines oficiais de CS/Suporte, reconferir volume de
  tickets e resolver o erro HTTP 400 com payload sanitizado e correlation ID.
- Ciclo 3 — OMIE API read-only. Com App Key/App Secret server-side, ativar o
  adapter, sincronizar read-only e reconciliar API vs planilha registrando
  divergências.
- Ciclo 4 — Fechamento do ledger CS Ops. Consolidar dry-run, mapeamento de
  propriedades e evidência antes de qualquer novo lote de escrita HubSpot.
- Ciclo 5 — Robustez e observabilidade. Code-splitting de chunks, suíte E2E
  autenticada de Analytics, revisão de logs/alertas.

## 8. Arquivos e contratos impactados por ciclo

| Ciclo | Frontend | Backend / contrato |
|---|---|---|
| 0 | (nenhum) | validar migrations `20260716*`-`20260720*`, testes 049-059 |
| 1 | `AnalyticsShell.tsx`, `AnalyticsReportExport.tsx`, `analytics-export.ts` | `rpc_analytics_ceo_snapshot`, `rpc_analytics_ceo_history`, fixture QA |
| 2 | `AnalyticsCsPage.tsx`, `AnalyticsConfigPage.tsx`, `AnalyticsLogsPage.tsx` | `analytics_source_config`, worker `hubspot-sync`, `hubspot_tickets` |
| 3 | `AnalyticsFinancePage.tsx` | adapter OMIE, `analytics_finance_receivables`, `rpc_analytics_finance_snapshot`, migrations `*omie_api_sync*` |
| 4 | `AnalyticsConfigPage.tsx` | ledger CS Ops, `hubspot-company-merge`, `analytics_hubspot_merge_runs` |
| 5 | `router.tsx` (lazy/split), charts | índices/perf de RPCs executivos |

## 9. Critérios objetivos de conclusão por ciclo

- Ciclo 0: typecheck, build e testes de banco verdes neste ambiente; estado Git
  documentado; decisão da seção 10 registrada; nenhuma alteração destrutiva.
- Ciclo 1: sessão autenticada executada; evidência (screenshots) das abas e da
  exportação PDF/PNG; nenhum cálculo de regra migrado para o frontend.
- Ciclo 2: sincronização HubSpot concluída com contagem verificável; pipelines
  oficiais confirmados com o time; HTTP 400 de tickets eliminado com evidência.
- Ciclo 3: sincronização OMIE read-only executada; relatório de divergências API
  vs planilha; credenciais apenas server-side, nunca no navegador.
- Ciclo 4: ledger fechado com dry-run e retorno sanitizado; nenhum lote de
  escrita sem mapeamento e evidência.
- Ciclo 5: chunks abaixo do alerta ou justificados; suíte E2E autenticada
  passando; documentação e ledger atualizados.

Regra transversal: nenhum ciclo é declarado concluído sem testes/validações
executados, sem dado inventado, sem exposição de credenciais e sem atualização de
`docs/plan.md`, `docs/DOCUMENTATION_LEDGER.md`, `docs/PROJECT_STATE.md` (quando o
estado mudar) e um relatório em `docs/reports/`.

## 10. Decisão pendente que trava a execução autônoma

Preciso de uma definição antes de escrever código, por causa do risco 6.1:

- Cenário A (preservar e evoluir Analytics): trato a derrubada staged como
  descoberta descartável, preservo o Analytics e as migrations, e sigo os ciclos
  da seção 7. O handoff aponta para este cenário.
- Cenário B (seguir a reconstrução V2/teardown): a remoção staged é intencional e
  devo conduzir a reconstrução do cockpit V2, tratando o Analytics atual como
  legado a ser reintegrado no novo shell.

Enquanto a decisão não é registrada, não commito o índice, não faço reset e não
altero contratos. Todo o trabalho local (adapters, testes, fallbacks,
documentação) permanece possível sem violar gates.

## Status Git

- Branch: `codex/ux-ui-rebuild-v2-discovery`, HEAD `b7ce25e`.
- Índice: remoção em massa staged (232 arquivos, +518/-23453) — NÃO commitar sem
  decisão.
- Untracked: 47 migrations Analytics + testes pgTAP 049-059 + testes de scripts
  (CS migration, OMIE, parser diário comercial).
- Nenhum reset, clean, checkout destrutivo ou commit foi executado. Estado
  preservado integralmente. Único arquivo novo adicionado por mim: este relatório.
