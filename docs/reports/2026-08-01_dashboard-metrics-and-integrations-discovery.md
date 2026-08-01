# Dashboard — métricas e integrações: descoberta técnica

Data: 2026-08-01
Checkout final: `C:\Projetos\GSO-old`
Branch final: `claude/release-surface-visual-audit-20260731`
Escopo: Macro-lote 0.3 — correções imediatas de Dashboard e discovery de métricas/integrações.

Nota de integração: este relatório foi produzido durante a consolidação intermediária e incorporado ao checkout principal. A pasta `C:\Projetos\GSO-consolidation-01` não é o destino operacional final.

## 1. Resumo executivo

Foram aplicadas correções pequenas e auditáveis no Dashboard:

- Financeiro passou a publicar somente uma leitura com `source: api` do OMIE. Quando o read model devolve planilha ou outra origem não confirmada, a tela exibe indisponibilidade, orienta Gerenciar OMIE e permite tentar novamente; não apresenta KPI de planilha como se fosse fonte financeira.
- O Financeiro mantém Aplicar e Limpar na mesma linha dos filtros em telas médias e maiores, com quebra natural em telas estreitas.
- O Suporte passou a incorporar Pipeline na barra principal de filtros, preservando o conceito atual e sem criar métricas novas.
- A descrição da área Financeiro foi alinhada à integração OMIE.

O discovery confirma que Backend, views/read models, RPCs e caches existentes são a fonte da verdade. Não foram criados indicadores, contratos, migrations, sincronizações, hidratações ou ações externas neste lote.

## 2. Estado inicial

- O checkout original `C:\Projetos\GSO-old` permaneceu congelado e não foi usado para executar alterações neste lote. O preview já existente nessa pasta, em `127.0.0.1:4173`, não foi usado como evidência do checkout consolidado.
- O checkout trabalhado estava limpo em `fd687b0` (`docs(validation): registrar macro-lote 0.2`) e com `origin/main...HEAD = 0 11`: onze commits locais da consolidação acima de `origin/main`.
- Não houve push, merge, rebase, cherry-pick, reset, limpeza ampla, operação de banco remoto, uso de credenciais ou sincronização real.
- O código anterior ainda tratava `spreadsheet` como fallback possível no modelo financeiro; essa possibilidade já existe nos RPCs/migrations legados e foi bloqueada somente na superfície do Dashboard neste lote.

## 3. Correções aplicadas

### Financeiro

Arquivos: `apps/web/src/features/analytics/AnalyticsFinancePage.tsx`, `apps/web/src/features/analytics/analytics-domains.ts`.

- Removida da superfície a linguagem operacional de fallback de planilha.
- Estado `not_configured`, erro/indisponibilidade e origem não-API agora conduzem a estados explícitos de indisponibilidade, com ação `Gerenciar OMIE` quando aplicável e retry.
- A origem positiva exibida na tela é `Fonte: API OMIE (ao vivo)` somente depois da guarda `snapshot.source === 'api'`.
- O botão `Sincronizar HubSpot` não existia no componente Financeiro auditado; portanto não houve remoção artificial. A ação de sincronização HubSpot permanece restrita à tela de configuração, fora do escopo desta correção.
- Não foi adicionado botão de sincronização OMIE ao Dashboard. O acesso existente de gerenciamento continua apontando para Configurações, sem executar ação externa por esta tela.
- Aplicar/Limpar foram movidos para o mesmo grid dos filtros e dimensionados para manter alinhamento visual.

### Suporte

Arquivos: `apps/web/src/features/analytics/AnalyticsCsPage.tsx`, `apps/web/src/features/analytics/AnalyticsFilters.tsx`, `apps/web/src/features/analytics/AnalyticsPipelineCombobox.tsx`.

- Pipeline deixou de ocupar uma linha isolada e passou a ser um campo opcional da barra principal.
- O combobox ganhou apenas uma variante `inline`, preservando busca, seleção, persistência em `sessionStorage`, `data-testid` e `role=listbox`.
- Não foram adicionados KPIs. Permanecem os contratos existentes de tickets: total, abertos, fechados, taxa de fechamento, status, tendência mensal, origem/pipeline e responsável.

## 4. Validações

Status objetivo do lote:

| Controle | Resultado |
|---|---|
| `git diff --check` | Passou |
| `npm run contracts:typecheck` | Passou |
| `npm run web:typecheck` | Passou |
| `npm run web:build` | Passou; 830 módulos transformados |
| testes focados Analytics/CS/HD | Passou; 41 testes, 0 falhas |
| `npm run local:qa:secret-scan` | Passou; 1.659 arquivos rastreados, 0 matches |
| QA autenticado contra Supabase/HubSpot/OMIE | Não validado; sem credenciais locais autorizadas |
| banco/RLS/RPC em ambiente remoto | Não executado por escopo e proteção de dados |

O primeiro `web:typecheck` após a edição encontrou dois erros de compilação introduzidos na alteração; eles foram corrigidos antes da rodada final. A rodada final acima é a evidência considerada válida.

## 5. Auditoria por aba

### Comercial

`AnalyticsCommercialPage.tsx` consome dados de Deals sincronizados do HubSpot e apresenta receita, pipeline, conversão, responsáveis e tendência conforme os contratos existentes. Os rótulos de pipeline preservam o ID imutável e diferenciam nome oficial do HubSpot de alias local. Não há alteração aplicada nesta aba: não foi identificado ajuste textual/CTA de baixo risco que exigisse intervenção no escopo imediato.

### Customer Success

O contrato atual expõe relacionamento e carteira a partir do cache HubSpot, associações explícitas, grupos resolvidos por auditoria humana, entidades legais e Deals associados. Não há base suficiente para publicar health score, NPS, CSAT, cadência, risco ou cobertura como métrica nova. A aba foi tratada como limite de contrato: sem indicadores inventados e sem alteração funcional neste lote.

### Suporte

O read model atual é de Tickets HubSpot. Os campos operacionais confirmados incluem pipeline, estágio, responsável, prioridade, datas, `source_type` e estados parciais de SLA. `source_type` pode observar valores como `CHAT`, `FORM`, `EMAIL`, `PHONE`, `WHATSAPP` e `BOT`, mas isso não prova a existência de uma inbox, conversa ou URL de widget.

Assim, “chat” permanece representado somente quando a origem sincronizada informa `CHAT`; não foi criado um módulo de conversas nem uma métrica de atendimento de chat. A correção aplicada foi exclusivamente a composição dos filtros.

### Financeiro

O modelo de tela aceita `api`, `spreadsheet` e `none` porque o histórico de read models ainda possui fallback legado. As migrations financeiras atuais priorizam `omie_receivables_api` quando há registros e podem retornar origem não-API quando a fonte viva não está disponível. A tela agora trata essa origem não-API como indisponível para publicação de KPI.

Os indicadores existentes de posição, vencido, aging, projeção, recebimento e reconciliação não foram ampliados. A reconciliação exibida é baseada em CNPJ normalizado; nome é apenas pista e não reconcilia.

## 6. Auditoria de integrações

### HubSpot

O cache local possui contratos para Companies, Owners, pipelines, Deals e Tickets, com RLS e gate de analytics. A sincronização chama o orquestrador via cliente autenticado/Edge Function; nenhum token é exposto pela UI.

Campos confirmados para Deals incluem pipeline, estágio, owner, amount, type, nome e datas. Para Tickets incluem pipeline, estágio, origem, prioridade, datas e estados parciais de SLA. O catálogo auditado não confirma, para publicação como KPI, conversas, inbox, atividades completas, CSAT, NPS, health score ou relações ticket-company-contact robustas.

### OMIE

O contrato documentado é de leitura de Contas a Receber e Clientes Resumidos. A integração trabalha com títulos, datas, status, documento, categoria e código de cliente; nomes e CNPJ são enriquecidos pelo cadastro de clientes. O valor recebido é derivado por status, pois o campo de valor pago não é confirmado no retorno utilizado.

O contrato atual suporta posição, vencimento, aging e qualidade de matching. Não há evidência suficiente neste lote para forecasting completo, centros de custo, cancelamentos ou histórico integral de notas.

## 7. Matching HubSpot ↔ OMIE

O caminho seguro existente é:

1. normalizar CNPJ para comparação exata;
2. usar nome normalizado apenas como pista de candidato;
3. consultar `rpc_analytics_company_candidates` para candidatos por CNPJ exato, raiz de CNPJ, contenção ou similaridade;
4. manter score e motivo do candidato;
5. exigir resolução humana para grupos econômicos e situações ambíguas;
6. usar `rpc_analytics_finance_company_rollup` para rollup financeiro read-only;
7. manter empresas sem correspondência e correspondências ambíguas visíveis para ação operacional.

As associações de relacionamento não são inferidas por nome ou repetição de CNPJ. A aplicação de propriedades no HubSpot possui caminho dry-run e exige ação explícita; não foi executada neste lote.

## 8. Screenshots e evidências

O preview foi executado a partir de `C:\Projetos\GSO-consolidation-01\apps\web` em `127.0.0.1:4174`, após o build consolidado. As quatro capturas são reais, mas representam o estado de bloqueio de configuração antes da autenticação:

- `output/playwright/dashboard-finance-unauthenticated.png` — SHA-256 `69FDA189285295354056566A4217CEE68BCB73E20C55C68D5551B440AC293E1C`
- `output/playwright/dashboard-support-unauthenticated.png` — SHA-256 `5B6493A30BD4F13538D5EFA40BC7903AD8A430E7FE43B23D9DF1DC57ADCD7F7A`
- `output/playwright/dashboard-cs-unauthenticated.png` — SHA-256 `519209F26974A28BD5F5D6E24ACE686E621F0015E60CD700B15175727FC236FD`
- `output/playwright/dashboard-commercial-unauthenticated.png` — SHA-256 `D2D05D8944A67C4F6BBF6D5072CED62BEC2F0A22C6109B46F2687CE1A9A4B262`

O bloqueio observado foi `Configuração de acesso indisponível — Variaveis ausentes: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY`. Por isso, as superfícies autenticadas não foram declaradas visualmente validadas. Não houve cópia de `.env`, cookies, JWTs ou credenciais do checkout original.

## 9. Backlog recomendado por fases

### Fase 0 — Ambiente e evidência autenticada

Fornecer ambiente local autorizado com configuração não sensível e sessão de QA apropriada; repetir screenshots autenticados de Comercial, CS, Suporte e Financeiro em desktop e viewport estreito. Validar loading, empty, error, unavailable e overflow.

### Fase 1 — Correções imediatas

Concluída neste lote: Financeiro sem fallback visual de planilha, estados de origem explícitos, filtros alinhados; Suporte com Pipeline integrado à barra principal.

### Fase 2 — Fonte OMIE única

Auditar e, com autorização separada, ajustar o contrato server-side para que a publicação financeira diferencie claramente `api`, `stale`, `empty`, `error` e `not_configured`. Remover a ambiguidade de fallback na origem, mantendo auditoria e RLS.

### Fase 3 — Contrato HubSpot de suporte e CS

Definir evidência de conversas/inbox/chat, relações ticket-company-contact, SLA completo, CSAT/NPS e health score antes de qualquer KPI. Sem esse contrato, manter “indisponível” ou “não disponível na fonte”.

### Fase 4 — Matching operacional

Medir cobertura de CNPJ exato, candidatos por raiz/nome, ambiguidade e resolução humana. Só depois avaliar aplicação de propriedades no HubSpot, sempre em dry-run, com `canApply`, reidratação de catálogo e confirmação explícita.

### Fase 5 — Métricas adicionais

Somente após contratos e proveniência: priorizar métricas que tenham decisão operacional, definição, owner, período, fonte, estado de ausência e regra de atualização. Não iniciar por expansão visual do Dashboard.

## 10. Git final

Estado no fechamento da validação, antes do commit deste relatório:

```text
## codex/consolidation-origin-main-20260801...origin/main [ahead 11]
M apps/web/src/features/analytics/AnalyticsCsPage.tsx
M apps/web/src/features/analytics/AnalyticsFilters.tsx
M apps/web/src/features/analytics/AnalyticsFinancePage.tsx
M apps/web/src/features/analytics/AnalyticsPipelineCombobox.tsx
M apps/web/src/features/analytics/analytics-domains.ts
```

O diretório `output/playwright/` é ignorado pelo repositório conforme `.gitignore`; os caminhos e hashes acima preservam a rastreabilidade local das evidências sem adicionar artefatos de execução ao histórico.

## 11. Limitations

- A validação funcional autenticada não foi possível por ausência de variáveis de acesso no checkout consolidado.
- Não foram executadas consultas reais ao Supabase, RPCs remotos, OMIE ou HubSpot.
- A correção de Financeiro é uma guarda de publicação na UI; o contrato legado server-side ainda pode produzir `spreadsheet` e requer a Fase 2 para eliminação estrutural da ambiguidade.
- A descoberta de “chat” está limitada ao `source_type` sincronizado; não comprova inbox/conversação.
- Nenhum dado ausente foi simulado e nenhuma credencial foi obtida ou exposta.

## 12. Reconciliação Git e destino canônico

O `GSO-old` partia de `68884bf`, enquanto `origin/main` estava em `66570c6`. A diferença medida foi:

- `old_branch..origin/main`: 74 commits que já estavam em `origin/main`;
- `origin/main..old_branch`: 10 commits locais do antigo checkout;
- `origin/main..consolidation`: 11 commits locais na consolidação intermediária.

A branch consolidada foi criada diretamente sobre `origin/main`; `git merge-base --is-ancestor origin/main codex/consolidation-origin-main-20260801` retornou verdadeiro. Portanto, os 74 commits não foram descartados nem reaplicados um a um: já fazem parte da base consolidada. Os 10 commits locais do `GSO-old` foram preservados no histórico e reaplicados seletivamente durante a consolidação.

Após a revisão do fluxo operacional, o destino canônico voltou a ser `C:\Projetos\GSO-old`. A configuração ignorada `apps/web/.env.local` foi recuperada localmente para esse checkout e não entra em commit.
