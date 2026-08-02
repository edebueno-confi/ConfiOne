# Relatório Delta final — Dashboard Gerencial API-only — 2026-08-02

## 1. Resumo executivo

O macro-lote reconstruiu e consolidou a superfície do Dashboard Gerencial no
checkout canônico `C:\Projetos\GSO-old`. A navegação ativa possui cinco áreas:
Resumo Gerencial, Comercial, Customer Success, Suporte & Chat e Financeiro.
Configurações e Integrações ficam fora das abas do Dashboard. HubSpot e OMIE
são as únicas fontes publicadas; planilhas antigas foram preservadas como
histórico/migração/auditoria/QA, sem fallback operacional.

O contrato, o banco local, os executores e a configuração administrativa foram
validados localmente. A sincronização real não foi executada porque depende de
credenciais/autorização e write externo. A matriz visual autenticada possui 48
capturas sem overflow, erro de console ou `pageerror`; a rede ficou parcialmente
validada por 24 requisições de módulo abortadas durante ciclos dev de 768px.

## 2. Git inicial

O trabalho foi mantido em `C:\Projetos\GSO-old`, sem troca de checkout. A branch
final é `codex/dashboard-management-rebuild-20260802`, sem upstream, com
`origin/main...HEAD = 0 56`. O ponto de entrada anterior do lote é preservado
em `refs/archive/dashboard-rebuild-start-20260802` (`b121b446`). O stash
existente permanece preservado. Há um único worktree ativo.

Não foram executados `reset`, `clean`, `rebase`, `merge`, `cherry-pick`,
`worktree remove`, exclusão de branch ou `push`.

## 3. Skill de design aplicada

Foram aplicadas as orientações de `frontend-design`, `gso-operational-design`,
`data-analytics:design-kpis`, `product-design:design-qa`,
`web-design-guidelines` e os contratos locais de qualidade. A decisão visual foi
densidade operacional, hierarquia consistente entre abas, fonte factual visível,
espaços/padding previsíveis, responsividade e ausência de dados inventados.

## 4. Auditoria anterior e reconciliação

O inventário confirmou que o código local acumulava histórico de planilhas,
conectores e documentos de ciclos anteriores. Esses artefatos não foram
apagados indiscriminadamente: consumidores ativos foram retirados da superfície
do Dashboard; migrations, parsers, funções de migração, relatórios e fixtures
foram classificados como históricos ou de QA. Os documentos canônicos que ainda
descreviam fallback receberam marcação explícita de histórico/superseded.

## 5. Arquitetura de informação

Ordem publicada: `ceo` (Resumo Gerencial), `commercial` (Comercial),
`customer_success` (Customer Success), `support` (Suporte & Chat) e `finance`
(Financeiro). Produto e Desenvolvimento continuam no código, mas não aparecem
na navegação ou nos cards ativos. Integrações, histórico, diagnóstico e
agendamento permanecem no contexto de Configurações.

## 6. Catálogo de métricas

| Área | Métricas e fórmula | Fonte / contrato | Grão e período | Disponibilidade e limitações |
|---|---|---|---|---|
| Resumo | Deals totais, abertos, ganhos, receita ganha, conversão = ganhos/negócios fechados, ticket médio; tickets totais/criados/abertos/fechados; títulos, saldo, vencidos e reconciliação | `rpc_analytics_ceo_snapshot(p_from,p_to)`; campos do snapshot e `analytics_finance_receivables` | visão agregada; período selecionado e histórico equivalente | HubSpot + OMIE; Produto/Desenvolvimento `not_configured`; campos ausentes seguem estado `Indisponível` |
| Comercial | `totalDeals`, `openDeals`, `wonDeals`, `lostDeals`, `wonRevenue`, `conversionRate`, `avgTicket`; funil, pipeline, owner e mensal | `rpc_analytics_commercial_snapshot(p_from,p_to,p_owner_id,p_stage_id,p_excluded_pipeline_ids)` | deal; período global | HubSpot Deals; depende do cache sincronizado e dos pipelines configurados |
| Customer Success | `companiesTotal`, status de cliente preenchido, status de contrato preenchido, sem owner e MRR preenchido; cortes por owner/status | `rpc_analytics_customer_success_snapshot()`; read model HubSpot companies | empresa; posição atual | HubSpot Companies; saúde ativa e carteira operacional não são inferidas quando o campo não existe |
| Suporte & Chat | `totalTickets`, `openTickets`, `closedTickets`, `closedRate`; status, mensal, origem, pipeline, owner e último ticket | `rpc_analytics_cs_snapshot(p_from,p_to,p_stage_id,p_priority,p_excluded_pipeline_ids)` | ticket; período global | HubSpot Tickets; Chat só será publicado com contrato real Conversations/Inbox/Chat |
| Financeiro | títulos, valor líquido, recebido, saldo, títulos/saldo vencidos, taxa recebida, abertos, atraso médio, vencimentos 30/60/90, aging, categorias, devedores e reconciliação | `rpc_analytics_finance_snapshot(p_from,p_to,p_status,p_aging_bucket,p_client_query)` e `rpc_analytics_finance_source_status()` | título; período e posição atual conforme métrica | OMIE API; `source` é `api` ou `none`; não há fallback de planilha |

As consultas frontend estão em
`apps/web/src/features/analytics/analytics-api.ts`, os tipos/mapeadores em
`apps/web/src/features/analytics/analytics-model.ts` e os contratos SQL nas
migrations `20260802030000` e `20260802050000`. Cada bloco carrega estado,
proveniência, frescor, erro sanitizado e, quando aplicável, `sync_run_id`.

## 7. Resumo Gerencial / CEO

O snapshot executivo combina Comercial, Customer Success, Suporte e Financeiro.
O wrapper corrente preserva a RPC legada para os dados existentes, substitui o
Financeiro pela fonte `omie_receivables_api`, usa tickets de pipelines HubSpot
configurados, expõe qualidade de reconciliação e deixa Produto/Desenvolvimento
como não configurados. Não há composição de planilha nem cálculo local de regra
de negócio.

## 8. Comercial

Comercial usa Deals do HubSpot, com filtros de período, owner, estágio e
pipeline. O funil, o corte por pipeline/owner e a tendência mensal são
renderizados a partir da RPC real. A ausência de pipeline ou de dado de fonte é
mostrada pelo estado do contrato, sem criar negócio, zero sintético ou pipeline
implícito.

## 9. Customer Success

Customer Success usa o read model de empresas HubSpot. O contrato expõe total
de empresas, preenchimento de status/contrato/MRR, atribuição de owner e
limitações explícitas. Saúde, risco ou atividade não são deduzidos de planilha,
nome ou heurística quando o campo real não está disponível.

## 10. Suporte & Chat

Suporte usa Tickets HubSpot com filtros de período, status, prioridade e
pipeline. A superfície mostra contagens, status e tendência factual. Não há
botão ou métrica de “Chat” operacional sem contrato confirmado de
Conversations/Inbox/Chat; o estado é indisponível quando essa fonte não existe.

## 11. Financeiro

Financeiro publica somente dados do adapter OMIE API e seus read models. O
histórico de sincronização usa a view `vw_analytics_finance_sync_runs_read` e
separa OMIE de HubSpot. Dados sem origem financeira são indisponíveis; valores
de exportação XLSX não são usados para preencher cards, gráficos ou reconciliação.

## 12. Remoção do fallback de planilha

Foi removida a superfície operacional de upload/importação/fallback no Dashboard
e em Configurações. O inventário foi classificado assim:

- código de runtime sem consumidor ativo: retirado da navegação ou desconectado;
- migrations/tabelas antigas: preservadas para histórico e compatibilidade;
- funções/parsers de migração: preservados como ferramentas históricas;
- relatórios, fixtures e evidências: preservados para auditoria/QA;
- documentação antiga: marcada como histórica e apontada para o contrato atual.

Não foi feita exclusão física ampla, pois isso destruiria proveniência e
histórico de migração.

## 13. Sincronização HubSpot

O executor HubSpot usa autenticação server-side, segredo gerenciado, execução
idempotente, run/correlation id, cursor/paginação, heartbeat, contadores,
estado parcial e erro sanitizado. O escopo cobre empresas, deals, pipelines,
stages, owners e tickets configurados. A UI oferece somente `Sincronizar
HubSpot` a administrador de plataforma.

## 14. Sincronização OMIE

O executor OMIE usa a API oficial no backend, segredo gerenciado e staging com
promoção idempotente. Há lock/concurrency guard, timeout, retry controlado,
normalização, rejeições, colisões de identidade, preservação do snapshot bom
anterior e estados `processing`, `completed`, `partial`, `failed`, `empty` e
`abandoned`. A UI oferece somente `Sincronizar OMIE` a administrador de
plataforma.

## 15. Orquestração e agendamento

Há um ciclo único HubSpot -> OMIE. O executor sequencial bloqueia o início do
OMIE enquanto o HubSpot ainda está processando; falha parcial preserva o último
snapshot bom e retorna estado parcial. O agendamento local legado específico de
HubSpot foi desativado. Configurações expõe um único agendamento do ciclo
completo. Nenhum scheduler remoto foi criado ou disparado.

## 16. Segurança, permissões e isolamento

Segredos ficam no backend/secret store e nunca são retornados à UI. A execução
manual exige `platform_admin`; `dashboard_viewer` é somente leitura. RPCs e
views têm grants/revogação revisados, o acesso continua tenant/RLS-aware e os
erros de integração são sanitizados. Nenhum `.env`, token, JWT, cookie ou
service-role key foi exposto no relatório ou nas capturas.

## 17. Testes executados

- `npm run web:typecheck` — passou.
- `npm run web:build` — passou; 830 módulos.
- Testes Node focados de settings, CTA, runtime, orquestração, runner CS e
  permissões — 30/30 passaram.
- `node_modules\\.bin\\supabase.cmd test db --local supabase/tests/088_analytics_finance_omie_only_contract.sql supabase/tests/089_dashboard_api_only_reconstruction.sql` — 37/37 passou.
- `npm run supabase:test:db` — parcial: fixtures antigas com UUID fixas colidem
  no banco persistente sem reset; nenhum reset foi autorizado/executado.
- `npm run documentation:validate:internal-docs` — 3 documentos válidos, 9
  alertas, 0 bloqueios.
- `git diff --check` — passou.

## 18. Code Quality

`npm run quality:module -- apps/web/src/features/analytics` e
`npm run quality:changed` passaram sem bloqueios. O gate sinalizou seis
ocorrências médias candidatas de acesso direto a tabelas na API de Configurações;
elas não bloquearam o lote e ficam pendentes de uma frente própria de
encapsulamento, sem misturar com a reconstrução do Dashboard. Lint não está
configurado como script executável neste repositório.

## 19. Documentation Governance

`genius-documentation-governance` foi aplicado ao conjunto alterado. Os blocos
correntes de `PROJECT_STATE.md`, `DOCUMENTATION_LEDGER.md` e `spec.md` agora
refletem o HEAD, o escopo de cinco áreas, as fontes HubSpot/OMIE e as limitações
reais. Documentos históricos foram preservados e marcados, sem reescrita
destrutiva. O relatório atual é este arquivo.

## 20. QA visual

QA autenticado foi executado em light/dark nos viewports 1440x900, 1024x768,
768x1024 e 390x844 para seis superfícies. Resultado: 48/48 capturas, 48/48
sem overflow horizontal, 48/48 sem `console.error`/`pageerror` e 48/48 com
tema correspondente.

Limitação: 24 falhas de requisição para o módulo
`AdminConsoleShell.tsx` ocorreram nos ciclos dev de 768px durante trocas rápidas
de rota. A UI renderizou, mas a rede não é declarada 100% validada. O preview
da build respondeu HTTP 200 nas rotas `/`, `/admin/analytics` e
`/admin/settings?section=analytics`, e foi encerrado após o smoke.

## 21. Screenshots e evidências

Manifesto: `docs/reports/visual-audit/screenshots/dashboard-matrix-2026-08-02.json`.
Capturas: `docs/reports/visual-audit/screenshots/`, padrão
`dashboard-{surface}-{theme}-{viewport}-2026-08-02.png`.
Relatório visual: `docs/reports/visual-audit/dashboard-matrix-2026-08-02.md`.

## 22. Arquivos alterados

O lote alterou frontend, contratos, migrations, funções de sincronização,
testes, relatórios e documentação. O fechamento documental deste Delta alterou:

- `docs/PROJECT_STATE.md`;
- `docs/DOCUMENTATION_LEDGER.md`;
- `docs/spec.md`;
- `docs/ANALYTICS_HUBSPOT.md`;
- `docs/DASHBOARD_GERENCIAL_UX_SPEC_V1.md`;
- `docs/design/METRICS_CATALOG.md`;
- `docs/ANALYTICS_METRIC_CATALOG_V1.md`;
- `docs/CS_HUBSPOT_OPERATING_GUIDE.md`;
- `docs/reports/visual-audit/design-qa.md`;
- este relatório `docs/reports/2026-08-02_dashboard-delta-final.md`.

O inventário completo do código está nos commits listados abaixo e no diff
revisado antes do fechamento.

## 23. Commits do lote

Commits locais relevantes, sem push:

- `9eb9ef2` — registrar contrato API-only;
- `2578366` — limitar Dashboard a cinco áreas;
- `4d96bbb` — retirar planilhas da superfície operacional;
- `4c6e314` — orquestrar HubSpot antes de OMIE;
- `22b3346` — distinguir Suporte de Chat não confirmado;
- `b89fefb` — confinar rolagem ao conteúdo;
- `dce609b` — registrar fechamento do macro-lote;
- `6fe26a9` — padronizar integrações e ciclo completo;
- `ade706a` — registrar QA visual e estado do lote;
- `13ac83e` — fechar superfície API-only e histórico;
- `2798b97` — registrar estado e evidências;
- `890571f` — fechar contrato ativo de integrações e QA visual.

O commit documental deste relatório será criado separadamente após os gates
finais. Nenhum push será executado.

## 24. Git final

Antes do commit documental, o checkout deve continuar em
`codex/dashboard-management-rebuild-20260802`, sem upstream, com apenas as
alterações documentais deste relatório, `origin/main...HEAD = 0 56`, um
worktree, stash preservado e archive ref `b121b446`. O servidor persistente
`4173` não foi encerrado nem alterado; o preview `4180` foi encerrado.

## 25. Limitações e pendências

- Sincronização real HubSpot/OMIE não executada sem credencial/autorização e
  write externo.
- Scheduler remoto não criado.
- Suite pgTAP completa requer estratégia de fixture isolada ou banco limpo
  autorizadamente; não usar reset implícito.
- Rede da matriz dev tem 24 requisições abortadas em 768px; repetir em preview
  autenticado com a matriz completa é o próximo gate de QA.
- Lint não possui script configurado.
- Seis alertas médios de acesso direto em settings-api aguardam lote próprio.
- Remoção física de migrations/tabelas/funções históricas de planilha não foi
  feita e exige decisão de produto/retensão antes de qualquer ação destrutiva.

## 26. Decisões pendentes do Product Owner

1. Autorizar ou não a repetição da matriz visual autenticada completa no
   servidor preview empacotado.
2. Disponibilizar/autorizar credenciais server-side para preflight e sync real,
   sem compartilhar secrets no chat.
3. Decidir em lote separado a eventual aposentadoria física de artefatos de
   planilha após inventário de dependências e retenção.
4. Revisar a composição visual final e aprovar o backlog de qualidade de
   `settings-api`.
5. Manter Produto/Desenvolvimento fora da navegação até existir contrato real;
   não adicionar métricas sem fonte, RPC/view e regra de disponibilidade.
