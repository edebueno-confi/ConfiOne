# Auditoria inicial — Dashboard Visual System V1

**Data:** 2026-08-03
**Checkout:** `C:\Projetos\GSO-old`
**Branch:** `codex/dashboard-visual-system-v1-20260803`
**HEAD inicial:** `d06323ed42037f5ac6ceb8f83f033a15204d6123`
**Escopo autorizado:** frontend, UI/UX, estados visuais, copy, acessibilidade, responsividade, performance localizada e documentação visual. Nenhuma alteração de backend, banco, contrato, RPC, view, integração ou dado está autorizada neste lote.

## 1. Evidência de preservação e Git

Antes da auditoria foi executado o inventário completo de status, branch,
upstream, divergência, histórico, diff, stash, worktrees e refs.

- worktree inicial limpo;
- `origin/main...HEAD`: `0 119`;
- stash preservado: `stash@{0}`;
- histórico local preservado em `refs/archive/dashboard-visual-system-v1-start-20260803`;
- bundle externo verificado em
  `C:\Projetos\GSO-artifacts\dashboard-visual-system-v1-20260803\GSO-old-dashboard-visual-system-v1.bundle`;
- SHA-256 do bundle:
  `789FC47BDB96A098C636DBCBC8C08AF4D38066AAE3FB9D9EDC9A366F1A121814`;
- nenhum reset, clean, merge, rebase, cherry-pick, push, remoção de stash ou
  worktree foi executado.

## 2. Matriz de superfícies auditadas

| Superfície | Rota/área | Estado observado | Direção deste lote |
| --- | --- | --- | --- |
| Shell | `/admin/analytics` | Cabeçalho, fonte, abas e seletor repetem informação; barra superior compete com o conteúdo | Consolidar uma única gramática de shell e navegação |
| Visão Geral | `?tab=ceo` | Loading genérico ocupa toda a área; composição atual usa muitas faixas e caixas | Reconstruir como cockpit executivo, sem inventar métrica |
| Comercial | `?tab=commercial` | Filtros em caixa pesada; KPIs sem leitura editorial comum | Reorganizar filtros, KPI e gráficos no mesmo sistema |
| Customer Success | `?tab=customer_success` | Deve manter `Indisponível` quando o contrato não sustenta a leitura | Melhorar hierarquia sem alterar denominadores |
| Suporte & Chat | `?tab=support` | Estado factual, porém repetitivo e pouco hierárquico | Padronizar status e leitura de operação |
| Financeiro | `?tab=finance` | Fonte financeira ocupa faixa vertical separada do cabeçalho OMIE | Alinhar visualmente; não alterar origem OMIE |
| Integrações | `/admin/settings/integrations` | Cards paralelos, bordas e formulário com baixa prioridade visual | Reorganizar somente HubSpot/OMIE e preservar campos/handlers |
| Fontes | `/admin/settings/dashboard-sources` | Estado e ações existem, mas o fluxo de atualização usa overlay bloqueante genérico | Aplicar UI-05 conforme snapshot/lifecycle existente |
| Histórico | `/admin/settings/sync-history` | Ciclos já são recolhíveis, mas a lista fica longa e boxificada | Transformar em timeline compacta com detalhes progressivos |
| UI-05 | Atualização de fontes | Mascote central, barra sem progresso real e copy técnica/genérica | Suspensão/halo/motion sem progresso fictício e com estados honestos |

## 3. Achados objetivos

### P0/P1 — confiança operacional

1. O overlay atual de fontes é bloqueante por padrão e diz que a tela só será
   liberada após publicação, sem distinguir snapshot válido de ausência de
   snapshot. Isso conflita com a regra de manter dados válidos visíveis durante
   um ciclo ativo.
2. O estado visual de carregamento da Visão Geral pode aparecer como
   `Conjurando seus dados`, sem contexto de fonte, frescor ou motivo. A captura
   baseline ocorreu antes da conclusão assíncrona do carregamento e deve ser
   recapturada no servidor empacotado.
3. A interface distribui o estado de fontes entre header, cabeçalho de domínio,
   cards e textos repetidos. A mesma fonte pode parecer atualizada em um local e
   sem sincronização em outro se o usuário não tiver o contexto correto.

### P1 — hierarquia e densidade

1. A Visão Geral não estabelece uma âncora executiva clara; os blocos atuais
   parecem uma coleção de cards administrativos.
2. Comercial, Suporte e Financeiro não compartilham uma composição de filtros,
   KPI e evidência; a troca de aba altera também a gramática visual.
3. Integrações e Histórico gastam espaço com molduras, faixas e explicações
   repetidas, empurrando a ação e a leitura factual para baixo.
4. A navegação de analytics aparece como abas e também como um seletor de área,
   criando duas fontes visuais para a mesma decisão.

### P2 — acabamento

1. O dark mode mantém estrutura semelhante à versão light, mas ainda precisa de
   contraste e estados semânticos revisados com o novo sistema.
2. O mascote domina mais a tela do que o estado operacional; a magia deve ser um
   sinal visual controlado, não o conteúdo principal.
3. O histórico precisa manter ciclo pai e etapas HubSpot/OMIE, mas com resumo
   escaneável e expansão progressiva.

## 4. Contratos e limites preservados

O redesenho consumirá apenas props, read models, estados e handlers já expostos
pelos módulos atuais. Não serão criados:

- métricas, fórmulas, denominadores ou fontes novas;
- RPCs, views, tabelas, migrations, Edge Functions ou contratos;
- chamadas diretas ao HubSpot ou OMIE;
- execução real de sincronização neste lote;
- fallback de zero para `Indisponível`;
- texto que exponha nomes técnicos, tokens, erros brutos ou detalhes internos.

Questões de runtime, duração de consulta, incrementalidade, rate limit e
`ANALYTICS_SYNC_SECRET` permanecem backlog técnico e não serão mascaradas por
polish visual.

## 5. Direção visual adotada

O produto será tratado como **cockpit editorial de decisão**:

- shell único, com sidebar e cabeçalho estáveis;
- fundo de trabalho calmo, conteúdo dominante e no máximo duas zonas úteis;
- títulos e valores com escala suficiente para leitura em desktop;
- fonte/frescor resumidos em uma única faixa semântica;
- uma ação primária por contexto, subordinada à leitura dos dados;
- superfícies abertas e separadores discretos no lugar de caixas aninhadas;
- azul estrutural, magenta de identidade e cores semânticas somente para
  sucesso, atenção, falha e indisponibilidade;
- layout responsivo mobile-first, com container queries em componentes que
  mudam de composição;
- motion limitado a `transform` e `opacity`, com `prefers-reduced-motion`;
- acessibilidade por teclado, foco visível, `aria-live` apenas em mudanças de
  etapa e targets de toque confortáveis.

O ponto de assinatura é o **trilho de decisão**: cada área apresenta contexto,
estado da fonte e evidência principal em uma mesma leitura, sem transformar a
tela em um painel de caixas.

## 6. Plano de componentes

1. `AnalyticsShell`: fonte semântica única, tabs únicas, cabeçalho compacto e
   estado de atualização não duplicado.
2. Primitivas analytics: `DomainHeader`, `FilterBar`, `MetricRail`,
   `SourceFreshness`, `EmptyState` e `EvidenceSection`, mantendo contratos
   existentes.
3. `AnalyticsCeoPage`: reconstrução da Visão Geral com posição executiva,
   desempenho temporal, áreas e integridade em composição editorial.
4. Domínios Comercial, CS, Suporte e Financeiro: adoção da mesma gramática,
   preservando dados e particularidades factuais.
5. Settings: integração, fontes e histórico com progressive disclosure; sem
   navegação analytics duplicada dentro de Configurações.
6. UI-05: componente orientado pelos estados `preparing`, `syncing_hubspot`,
   `syncing_omie`, `publishing`, `succeeded`, `partial`, `failed`,
   `timed_out`, `abandoned` e `unavailable`, usando snapshot válido como
   critério visual de bloqueio.

## 7. Skills aplicadas

| Skill | Aplicação | Decisão |
| --- | --- | --- |
| `tailwind-patterns` | tokens semânticos, mobile-first, container queries, motion por transform/opacity | Aplicada |
| `genius-code-quality` | gates read-only, diff escopado, typecheck/build/quality | Aplicada |
| `genius-documentation-governance` | precedência de código/contratos sobre histórico e atualização do ledger | Aplicada |
| `artifact-template-cockpit-operacional-genius-os` | referência visual retida para cockpit com feed dominante e rail contextual | Aplicada como referência |
| `data-analytics:design-kpis` | preservar origem, frescor e honestidade dos KPIs | Aplicada |
| `product-design:index` + `product-design:audit` | preflight de contexto e auditoria visual com capturas atuais | Aplicada |
| `gso-operational-design` | cockpit operacional, azul estrutural, magenta controlado e densidade | Aplicada |
| `frontend-design` | direção editorial explícita e assinatura visual sem template genérico | Aplicada |
| `ui-ux-specialist` | WCAG, foco, teclado, contraste e targets | Aplicada |
| `ux-friction-analyzer` | progressive disclosure, status calmo e redução de carga cognitiva | Aplicada |

O preflight de contexto do Product Design foi executado; não havia contexto de
usuário persistido no plugin. A referência retida do cockpit foi inspecionada e
será preservada; ela não substitui os contratos do repositório.

## 8. Evidência baseline

Capturas dev autenticadas, somente para diagnóstico, estão fora do Git em:

`C:\Projetos\GSO-artifacts\dashboard-visual-system-v1-20260803\baseline-dev\`

Foram capturadas as superfícies analytics e settings em light/dark a 1440x900.
Não houve overflow horizontal nem erros de console/página nas capturas. Houve
uma requisição abortada durante navegação:

`/rest/v1/rpc/rpc_analytics_ceo_history` → `net::ERR_ABORTED`

Esse evento não é tratado como zero falhas: a matriz final deverá ser executada
no servidor empacotado, com manifesto por superfície, viewport, tema, estado,
requests e hash da captura.

## 9. Critério de saída desta auditoria

A auditoria está concluída para iniciar implementação quando:

- o drift de UI-05 e DASHBOARD-05 estiver corrigido na documentação canônica;
- a direção visual e o plano de componentes estiverem registrados;
- cada alteração permanecer somente em frontend, CSS, testes focados e docs
  visuais;
- o primeiro checkpoint puder ser revisado por diff e validado isoladamente.

**Status:** diagnóstico concluído; implementação autorizada pelo macro-lote
ativo, sob os limites acima.
