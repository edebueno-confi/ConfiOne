# Dashboard Runtime Truth v3 — relatório de estabilização

Data: 02/08/2026

Checkout: `C:\Projetos\GSO-old`

Branch: `codex/dashboard-runtime-stabilization-20260802`
Status: **parcialmente validado**

## Resumo executivo

O lote estabilizou o ciclo de sincronização, separou estado de execução de estado do snapshot publicado, corrigiu a exposição de erros OMIE, tornou as ações de atualização rastreáveis e eliminou a contradição “dados atualizados” versus “snapshot inexistente” nas superfícies verificadas.

Uma execução OMIE real, iniciada pela tela autenticada de Fontes do Dashboard, concluiu localmente em 49 segundos com 3.451 registros aceitos e zero rejeitados. O provedor foi consultado em leitura; não houve escrita externa no OMIE ou HubSpot. A execução sequencial HubSpot → OMIE não foi iniciada porque o runtime local de Edge Functions não possui `ANALYTICS_SYNC_SECRET`; esse segredo não foi criado, alterado ou exposto.

## Achados, implicações e decisões

### 1. Ciclo e órfãos

- A migration `20260802130000_dashboard_runtime_truth_v3.sql` adiciona `analytics_sync_cycles` e `analytics_sync_cycle_steps`.
- Runs sem heartbeat dentro do limite passam a `timed_out` por `rpc_admin_reconcile_analytics_sync_runs(900)`.
- O run HubSpot órfão encontrado no início do lote foi reconciliado como timeout, preservando o snapshot HubSpot válido anterior de 36.315 registros promovidos.
- O novo orquestrador evita adotar um run de outra correlação e bloqueia ciclos concorrentes.

### 2. Contrato de status e frescor

O RPC `rpc_analytics_source_status()` agora publica simultaneamente:

- `currentRunStatus`: ciclo técnico em execução, falha, timeout ou conclusão;
- `publishedSourceStatus`: condição do snapshot que o Dashboard pode ler;
- `lastAttemptAt`, `lastSuccessAt`, `lastFailureAt`;
- `processedCount`, `rejectedCount`, `sanitizedError` e `hasValidSnapshot`.

Assim, uma falha posterior não apaga um snapshot anterior válido. A interface mostra “Falhou · snapshot anterior preservado”, sem afirmar que a tentativa atual está atualizada.

### 3. OMIE e erros

- Erros HTTP 429/5xx, timeout, rede, autenticação, validação e resposta malformada são classificados no cliente OMIE.
- A camada interna conserva contexto técnico; views e UI recebem somente mensagem sanitizada.
- A execução real concluída em 02/08/2026 atualizou o snapshot financeiro com 3.451 registros aceitos.
- O erro legado SOAP não é mais exposto ao usuário e não foi repetido neste relatório.

### 4. Configurações e histórico

- HubSpot continua sendo a fonte de Comercial, Customer Success e Suporte.
- OMIE continua sendo a fonte exclusiva do Financeiro.
- A tela de Integrações exibe o token de acesso do HubSpot e os campos humanos “Chave da aplicação” e “Segredo da aplicação” do OMIE. Os nomes internos `app_key`/`app_secret` permanecem somente no payload protegido; o modo de execução não é uma escolha de produto e permanece fixo internamente como API.
- O formulário mantém cada integração como uma unidade operacional, com ativação explícita, credencial mascarada e uma única ação de salvar. HubSpot cobre Comercial, Customer Success e Suporte; OMIE cobre Financeiro.
- A view de histórico v2 passou a incluir também runs diretos sem ciclo pai. Isso evita que uma ação manual concluída desapareça da rastreabilidade.
- O Histórico usa cópia “Execução direta” para esses runs, sem classificá-los falsamente como ciclo automático.

### 5. Catálogo e origem dos dados

Leitura local do catálogo no encerramento do lote:

| Recorte | Quantidade |
| --- | ---: |
| Total | 37 |
| Não arquivados | 37 |
| Ativos | 37 |
| Inativos não arquivados | 0 |
| A classificar | 0 |
| Deals | 12 |
| Tickets | 25 |

O catálogo permanece configurável em Fontes do Dashboard, mantendo nome oficial HubSpot, alias administrativo, área e ativação. A interpretação de “carteira real de Customer Success” ainda depende de uma decisão de domínio sobre denominador; o lote não inventa essa regra.

## QA visual e comportamental

Artefato local: `output/dashboard-runtime-v3-preview/manifest.json`

Capturas: `output/dashboard-runtime-v3-preview/*.png`
Matriz: 5 superfícies × 2 temas × 2 viewports = 20 imagens reais.

Superfícies verificadas:

- Visão Geral;
- Financeiro;
- Integrações;
- Fontes do Dashboard;
- Histórico de sincronizações.

Resultado objetivo:

- build web: aprovado;
- console/page errors: 0;
- respostas HTTP inesperadas: 0;
- overflow horizontal: 0;
- cópia sensível/proibida encontrada: 0;
- contradições de status detectadas: 0;
- estados de fonte duplicados na Visão Geral: 0;
- falhas bloqueantes de requisição: 0;
- abortos `net::ERR_ABORTED` de assets durante navegação: 0;

A matriz visual foi concluída objetivamente para as 20 capturas. O relatório geral permanece **parcialmente validado** por causa das limitações de domínio e da execução sequencial completa descritas abaixo.

## Validações executadas

- `npx supabase test db --local supabase/tests/091_dashboard_runtime_truth_v3.sql` — 19/19;
- `node --test tests/scripts/analytics-domain-cta-contract.test.mjs tests/scripts/settings-sources-v2-contract.test.mjs tests/scripts/analytics-sequential-orchestrator.test.mjs tests/scripts/omie-client.test.mjs tests/scripts/release-surface.test.mjs` — 67/67;
- `npm run contracts:typecheck` — aprovado;
- `npm run web:typecheck` — aprovado;
- `npm run web:build` — aprovado;
- `git diff --check` — aprovado;
- QA empacotado `node scripts/local-qa/dashboard-runtime-v3-preview.mjs` — 20 capturas, zero falhas de requisição, zero erros de console, zero overflow, zero cópia proibida, zero contradições e zero estados duplicados;
- reconciliação local autorizada: HubSpot órfão encerrado como `timed_out`;
- execução OMIE real via sessão QA autenticada: concluída, 3.451 aceitos, 0 rejeitados.

## Skills e direção aplicada

- `ux-friction-analyzer`: reduziu escolhas concorrentes e tornou a ação manual acompanhável no Histórico;
- `ui-ux-specialist` e `frontend-design`: preservaram hierarquia operacional, alvos acionáveis e estados explícitos; removeram o pulso e o cartão contextual redundantes da Visão Geral, mantendo o estado agregado no shell compacto; não foi feito redesign amplo das cinco áreas neste lote;
- `data-analytics:design-kpis`: separou métrica publicada, frescor e denominador; Customer Success continua sem regra inventada;
- `genius-code-quality`: gate staged/changed/module, typechecks, secret scan e revisão contextual;
- `web-design-guidelines`: QA real de viewport, overflow, estados e cópia;
- `artifact-template-design-report`: relatório estruturado em resumo executivo, achados, implicações, recomendações e apêndice de evidências.

## Limitações e pendências

1. O ciclo completo HubSpot → OMIE depende da provisão aprovada de `ANALYTICS_SYNC_SECRET` no runtime local de Functions. Não foi preenchido automaticamente.
2. A definição de carteira/denominador de Customer Success ainda precisa ser decidida antes de validar os KPIs dessa área.
3. A Visão Geral continua visualmente próxima do shell administrativo existente; o lote atual corrigiu a duplicação de status, verdade de dados, configurações e rastreabilidade, mas não executou a reconstrução visual ampla recomendada anteriormente.

## Próximo lote recomendado

Prover o segredo server-side por fluxo autorizado, executar uma única vez o ciclo sequencial read-only HubSpot → OMIE e revalidar o manifesto. Depois, fechar a definição de denominador de Customer Success e somente então iniciar o piloto visual separado da Visão Geral e Comercial.

## Apêndice — arquivos principais

- `supabase/migrations/20260802130000_dashboard_runtime_truth_v3.sql`;
- `supabase/tests/091_dashboard_runtime_truth_v3.sql`;
- `supabase/functions/_shared/omie.ts`;
- `supabase/functions/_shared/omie-sync-service.ts`;
- `supabase/functions/analytics-sequential-sync/index.ts`;
- `supabase/functions/analytics-integration-run/index.ts`;
- `apps/web/src/features/analytics/AnalyticsCeoPage.tsx`;
- `apps/web/src/features/settings/SettingsIntegrationsPanel.tsx`;
- `apps/web/src/features/settings/SettingsPage.tsx`;
- `apps/web/src/features/settings/DashboardSourcesSettingsPage.tsx`;
- `apps/web/src/features/settings/SyncHistorySettingsPage.tsx`;
- `apps/web/src/index.css`;
- `scripts/local-qa/dashboard-runtime-v3-preview.mjs`.
