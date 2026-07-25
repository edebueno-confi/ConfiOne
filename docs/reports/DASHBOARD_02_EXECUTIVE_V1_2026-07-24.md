# DASHBOARD-02.3 — Implementação produtiva da Visão Executiva V1

## Escopo e decisão visual

Implementação exclusiva de `/admin/analytics`, dentro do shell real. A tela usa a Opção A aprovada: densidade gerencial, hierarquia por decisão e cor reservada para estado, prioridade e comparação. Não houve alteração na Central, Knowledge, Taxonomia, Portal, integrações ou nas páginas detalhadas de Comercial, CS, Financeiro, Configuração e Logs.

## Arquitetura

1. Cabeçalho executivo com estado consolidado e última atualização.
2. Filtros de período e domínio em foco.
3. Desempenho no período com quatro KPIs.
4. Posição atual separada e explicitamente independente do período.
5. Até três exceções determinísticas com regra, impacto e rota existente.
6. Resumos compactos de Comercial, CS / Suporte e Financeiro.
7. Até cinco pipelines prioritários, sem CTA para rota inexistente.

## Componentes criados e alterados

- `analytics-executive.ts`: ranking determinístico e construção de exceções.
- `AnalyticsCeoPage.tsx`: superfície produtiva da Visão Executiva.
- `AnalyticsShell.tsx`: restrição de navegação do `dashboard_viewer` ao executivo e passagem explícita do perfil.
- `analytics-model.ts`: propriedade opcional de contexto do viewer.
- `dashboard-02-executive.test.mjs`: contratos estáticos de arquitetura, ranking, rotas e permissões.

## Filtros e semântica temporal

O período é enviado aos RPCs já existentes e afeta somente o fluxo temporal. A posição atual — saldo vencido, clientes com alerta e carteira de suporte — não recebe o recorte temporal. O domínio em foco filtra o resumo visual sem inventar uma nova fonte ou contrato. Não existe filtro global de pipeline.

## Estados e frescor

O cabeçalho e os cards consomem os estados `fresh`, `stale`, `partial`, `empty`, `not_configured`, `syncing`, `unavailable` e `error` já mapeados pela fundação. Zero só é exibido quando o snapshot respondeu; estados degradados carregam o badge e a mensagem correspondente. O estado vazio informa “Nenhum registro no período selecionado” sem ocultar posição atual disponível.

## Permissões

`dashboard_viewer` permanece restrito a `/admin/analytics`, vê o estado das fontes e não recebe sincronização, exportação administrativa, configuração ou links de aprofundamento. O backend e as grants da fundação não foram ampliados. O administrador preserva os comandos existentes no shell.

## Ranking dos pipelines

O ranking usa apenas `support.byPipeline`, remove linhas sem atividade, ordena por quantidade decrescente, desempata por rótulo e ID, e limita a cinco. Cada item direciona para `/admin/analytics/cs`. A rota dedicada `/admin/analytics/pipelines` fica no backlog `DASHBOARD-02.9`.

## Comparação antes/depois

O pacote de revisão contém uma referência equivalente do discovery e uma captura da implementação produtiva em 1440×900, além das capturas responsive. A comparação qualitativa reduz a mistura de detalhes, elimina a lista de todos os pipelines e coloca desempenho, posição e exceções em sequência explícita. A fixture local contém receita comercial real de QA, mas não possui registros atuais de Financeiro/HubSpot para pipelines; a interface preserva esse estado em vez de preencher com dados fictícios.

## Testes e evidências

- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `node --test tests/scripts/dashboard-02-executive.test.mjs tests/scripts/pilot-02-contract.test.mjs tests/scripts/pilot-06-editorial.test.mjs`
- Capturas Playwright autenticadas de admin e `dashboard_viewer` em desktop, tablet, mobile e dark.

## Limitações e riscos

- A fixture local não hidrata HubSpot/OMIE; portanto pipelines, saldo vencido e tickets podem aparecer como zero real ou sem atividade. Isso é uma limitação de dados, não uma simulação.
- O smoke do shell registrou requisições abortadas da fila de suporte fora da superfície executiva; o detalhe deve ser triado no lote de suporte, sem alterar este escopo.
- A rota detalhada de pipelines não foi criada.
- As páginas de domínio mantêm inconsistências de copy/encoding históricas e ficam para DASHBOARD-02.4–02.8.

## Próximos lotes

- DASHBOARD-02.4 — evolução de Comercial.
- DASHBOARD-02.5 — evolução de CS / Suporte.
- DASHBOARD-02.6 — evolução Financeira.
- DASHBOARD-02.7 — Configuração.
- DASHBOARD-02.8 — Logs.
- DASHBOARD-02.9 — Pipelines detalhados.

## Pacote de revisão

O pacote de revisão `dashboard-02-executive-v1-implemented-review` foi mantido localmente para consulta e upload, mas removido do versionamento por ser artefato gerado e duplicado.

## Atualização DASHBOARD-02.3.1 — gate de design

O gate de organização e preservação funcional foi executado exclusivamente em `/admin/analytics`. A hierarquia executiva foi consolidada, a primeira dobra foi reduzida, a posição atual foi separada do período, o limite de KPIs e exceções foi aplicado, e os pipelines passaram a comunicar atendimento prioritário sem inventar rota ou dado.

O shell do `dashboard_viewer` permanece restrito ao Dashboard Gerencial, com identidade visual correta e sem comandos administrativos. Estados de frescor, ausência, erro e cobertura incompleta não são convertidos silenciosamente em zero. O relatório detalhado está em `docs/reports/DASHBOARD_02_EXECUTIVE_DESIGN_GATE_2026-07-25.md`; o pacote binário correspondente permanece fora do versionamento.
