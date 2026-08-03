# Relatório final — Dashboard Visual System V1

**Data:** 2026-08-03
**Produto:** Genius Support OS
**Checkout canônico:** `C:\Projetos\GSO-old`
**Branch:** `codex/dashboard-visual-system-v1-20260803`
**Escopo:** frontend, UI/UX, estados visuais, copy, acessibilidade,
responsividade, performance localizada, testes e documentação.

## 1. Resumo executivo

O Dashboard recebeu um sistema visual compartilhado para shell, Visão Geral,
Comercial, Customer Success, Suporte & Chat, Financeiro, Integrações, Fontes e
Histórico. A Visão Geral foi ajustada após a revisão do Product Owner: o título
deixou de ser maximalista e passou a usar escala compacta, adequada a uma
interface HD com leitura executiva.

## 2. O que foi implementado

- navegação analítica única, sem seletor de domínio redundante;
- hierarquia editorial para o resumo gerencial, com regras abertas e KPI rails;
- classes visuais compartilhadas para cards, gráficos, domínio e configurações;
- timeline compacta e progressiva no Histórico;
- estados de atualização/UI-05 sem barra, percentual ou contagem fictícia;
- overlay bloqueante somente quando não existe snapshot válido;
- banner não bloqueante quando existe snapshot válido;
- copy aprovada do Gênio e animação baseada em asset existente;
- suporte claro/escuro, reduced motion, foco e layout móvel;
- sem alteração de fonte, métrica, denominador, contrato ou sincronização.

## 3. Decisões visuais

Direção adotada: cockpit editorial de decisão. A composição privilegia título
moderado, contexto curto, filtros em uma faixa, números com hierarquia e áreas
abertas. Bordas permanecem somente quando delimitam interação ou agrupamento;
não há nova caixa para o Gênio em ação.

## 4. Ajuste solicitado pelo Product Owner

O título “Visão Geral” foi reduzido de escala maximalista para
`clamp(1.8rem, 2.8vw, 2.7rem)` em desktop e `2.1rem` no breakpoint móvel. A
escala dos títulos de domínio também foi reduzida para preservar densidade de
informação sem perder contraste.

## 5. UI-05 — Gênio em ação

O componente `GeniusSyncOverlay` mantém o asset atual e diferencia:

- preparação/sem snapshot: overlay bloqueante;
- snapshot válido: banner não bloqueante;
- estado individual: HubSpot ou OMIE com copy específica;
- etapa de publicação: copy de finalização sem prometer conclusão.

Não houve sincronização real neste lote. O componente não mostra percentual,
barra, countdown ou vocabulário técnico de infraestrutura.

## 6. Estados e dados

O frontend continua consumindo os estados existentes. Quando um estado fresco
não possui timestamp válido, a UI exibe `Dados disponíveis` sem afirmar uma
data. Datas inválidas não são convertidas em uma falsa atualização. Ausências
continuam como `Indisponível`.

## 7. Arquivos principais alterados

- `apps/web/src/components/GeniusSyncOverlay.tsx`
- `apps/web/src/features/analytics/AnalyticsCeoPage.tsx`
- `apps/web/src/features/analytics/AnalyticsHdDomainFrame.tsx`
- `apps/web/src/features/analytics/AnalyticsShell.tsx`
- `apps/web/src/features/analytics/analytics-ui.tsx`
- `apps/web/src/features/settings/DashboardSourcesSettingsPage.tsx`
- `apps/web/src/features/settings/SettingsIntegrationsPanel.tsx`
- `apps/web/src/features/settings/SettingsPage.tsx`
- `apps/web/src/features/settings/SyncHistorySettingsPage.tsx`
- `apps/web/src/index.css`
- testes focados de Analytics/UI-05;
- especificação UI-05, backlog, design system, ledger e relatórios.

## 8. Validação executada

- `npm run contracts:typecheck` — passou;
- `npm run web:typecheck` — passou;
- `npm run web:build` — passou;
- `node --test tests/scripts/mvp-ux-02-1-genius-hd.test.mjs tests/scripts/dashboard-02-executive.test.mjs tests/scripts/mvp-ux-02-executive-integrated.test.mjs` — 15/15 passou;
- `node --test tests/scripts/analytics-domain-cta-contract.test.mjs tests/scripts/analytics-sync-progress.test.mjs` — 17/17 passou;
- `npm run quality:changed` — aprovado, 0 findings;
- `npm run local:qa:secret-scan` — 1.821 arquivos rastreados, 0 matches;
- `git diff --check` — passou, com apenas avisos de normalização CRLF já
  reportados pelo Git;
- QA browser autenticado — 0 console errors, 0 page errors, 0 request
  failures e sem overflow no recorte final;
- viewport 390x844 — Visão Geral, Financeiro e Histórico sem overflow.

## 9. Não validado neste lote

- sincronização real HubSpot → OMIE;
- disponibilidade de credenciais externas;
- alteração ou consistência de read models, RPCs, views, RLS e banco;
- denominador de Customer Success e catálogo definitivo de métricas;
- performance de API, incrementalidade, rate limit e custo do provedor.

Esses pontos permanecem fora do escopo visual e devem ser tratados em lotes
técnicos próprios.

## 10. Git e preservação

- branch criada a partir do HEAD preservado do checkout canônico;
- ref de arquivo e bundle externo de preservação mantidos;
- stash existente mantido;
- nenhum reset, clean, merge, rebase, cherry-pick, stash apply/pop/drop,
  remoção de worktree, push ou deploy executado;
- status final e hash do commit são reportados no encerramento do ciclo.

## 11. Pendências e próximo lote recomendado

1. finalizar discovery HubSpot e decisão do denominador de CS;
2. aprovar catálogo de métricas executivas;
3. tratar separadamente a consistência OMIE/status/frescor;
4. avaliar um teste de integração read-only somente com contrato e autorização;
5. aguardar aprovação visual antes de novas mudanças de produto.

## 12. Veredito

**Validado para o escopo visual local.** A entrega não declara integração,
sincronização ou qualidade de dados concluídas.
