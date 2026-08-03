# Relatório Delta — Dashboard Visual Density V1.1

## 1. Resumo executivo

Macro-lote visual executado na branch `codex/dashboard-visual-density-v1-1-20260803`. O foco foi reduzir a escala tipográfica e a densidade excessiva do Dashboard sem alterar backend, banco, contratos, métricas, fontes ou sincronizações.

## 2. Git inicial

- Checkout canônico: `C:\Projetos\GSO-old`.
- Base preservada: `c75ec57b22985589a9f705c6bf2bbce908af1b92` (`feat(ui): aplicar sistema visual do dashboard`).
- Relação com `origin/main`: `0 120`.
- Sem upstream configurado para a branch; stash existente preservado.
- Worktree inicial limpo.

## 3. Preservação

Foi criado o bundle externo `C:\Projetos\GSO-artifacts\dashboard-visual-density-v1-1-20260803\GSO-old-dashboard-visual-density-v1-1.bundle`, verificado como histórico completo, com SHA-256 `0135A0E6AC56F138BE98691599E692A14119941626CE8D226F803CBB84565620`. Também foi criada a ref `refs/archive/dashboard-visual-density-v1-1-start-20260803` apontando para o HEAD inicial.

## 4. Auditoria do V1

O V1 tinha regras concorrentes para overview, pilot e domínio. O título podia alcançar 43px, KPIs alcançavam 50px, o primeiro KPI usava preenchimento azul dominante, havia gaps de até 48px e o histórico usava uma linha do tempo decorativa. O baseline real foi capturado antes da correção.

## 5. Skills aplicadas

Foram aplicadas as orientações de `gso-operational-design`, `frontend-design`, `ui-ux-specialist`, `ux-friction-analyzer`, `design-kpis`, `tailwind-patterns`, `web-design-guidelines`, `genius-code-quality`, `genius-documentation-governance`, `playwright`, `screenshot` e `verification-before-completion`. A revisão atualizada das Web Interface Guidelines reforça foco visível, reduced motion, tipografia compacta e ausência de `transition: all`. [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)

## 6. Tipografia

- Título de página: máximo observado 32px desktop; 28px intermediário; 24px mobile.
- Título de domínio: limite aproximado de 28px.
- KPI executivo: máximo observado 36px.
- Removido o eyebrow duplicado de `Visão Geral`.
- O título mantém hierarquia editorial, sem escala maximalista.

## 7. Espaçamento

Gaps principais foram reduzidos para a escala operacional de 4/8/12/16/20/24px. O cabeçalho da overview usa padding vertical compacto; filtros, KPIs, domínios e histórico não criam áreas vazias desnecessárias.

## 8. Shell

O shell preserva contexto global, abas analíticas e fonte agregada. O padding horizontal foi reduzido para `clamp(1rem, 2.5vw, 2.5rem)`, sem alterar navegação ou estado de URL.

## 9. Visão Geral

O título foi reduzido para 32px no desktop, o filtro foi compactado e a primeira métrica deixou de ser um card azul dominante. Os KPIs e a posição atual agora usam regras superiores e contraste por hierarquia, não caixas excessivas.

## 10. Comercial

A superfície continua usando o mesmo frame de domínio e KPI compartilhado. O refinamento global reduz o título do domínio, a altura mínima de KPI e a distância entre filtros, indicadores e gráficos.

## 11. Customer Success

A superfície permanece somente leitura e mantém indisponibilidade honesta quando não há read model próprio. Nenhum denominador, carteira ou métrica foi alterado neste lote.

## 12. Suporte

O frame compartilhado mantém filtros, KPIs e gráficos. A mudança global evita que Suporte e Comercial usem escalas distintas de título e indicador.

## 13. Financeiro

Delta final: os oito KPIs foram agrupados em Posicao e risco e Movimentacao e previsao, sem alterar valores, formulas ou contrato.

O bloco de fonte financeira foi transformado visualmente em metadata compacta, alinhada ao cabeçalho `OMIE · Contas a Receber`, preservando fonte, frescor, link de gerenciamento e estado real.

## 14. Integrações

As duas integrações publicadas continuam sendo HubSpot e OMIE. Apenas densidade visual e tipografia compartilhada foram tocadas; campos, credenciais e handlers não foram alterados.

## 15. Fontes

A superfície de fontes continua responsável por ações operacionais existentes. Nenhum botão de sincronização foi acionado durante o QA deste lote.

## 16. Histórico

O histórico deixou de apresentar a linha do tempo decorativa. O cabeçalho foi reduzido a uma faixa operacional curta, sem o hero “Rastreabilidade”; os grupos continuam recolhíveis e agora exibem registro operacional, trigger, data e status em linhas mais compactas. A repetição de “Ciclo de atualização” foi removida.

## 17. UI-05

Delta final: o titulo do overlay/loading foi limitado a 24-30px no desktop e 21px no mobile.

O copy do Gênio foi refinado para mensagens operacionais mais humanas: “O Gênio está abrindo caminho para os dados”, “puxando os fios do HubSpot”, “fazendo a conta fechar no OMIE” e “soltando a magia no painel”. A semântica de overlay bloqueante/banner não bloqueante foi preservada.

## 18. Alta resolução

A captura de 1920x1080 não aumenta mais o título proporcionalmente; a escala fica limitada pelos tokens definidos. A leitura usa a largura disponível sem transformar o dashboard em uma página maximalista.

## 19. Responsividade

Delta final: as 80 capturas foram feitas no preview empacotado estabilizado, sem overflow horizontal ou vertical.

Foram capturados 80 estados: 8 superfícies × 5 viewports × 2 temas. Viewports: 1920x1080, 1440x900, 1024x768, 768x1024 e 390x844. Não foi observado overflow horizontal.

## 20. Temas

Light e dark foram capturados em todas as superfícies. A troca de tema preserva contraste, status e densidade sem reintroduzir bordas ou fundos dominantes.

## 21. Acessibilidade

Delta final: os campos de integracao passaram a estar em formularios e o probe browser encontrou foco visivel nos controles navegaveis.

Typecheck e contratos passaram. Os controles e semântica existentes foram preservados; o histórico permanece com `<details>/<summary>`, fonte financeira recebeu `aria-label` e o overlay mantém `role=status`, `aria-live` e `aria-busy`.

## 22. Performance

Não houve alteração de chamadas, polling, sincronização, cache, read model ou lifecycle. O build Vite passou com 831 módulos transformados.

## 23. Código/CSS

Delta final: o escopo inclui agrupamento financeiro, formulários de integrações e escala do loading do Gênio.

As correções foram concentradas em `index.css`, no frame executivo, no metadata financeiro, no histórico e no copy do overlay. Os limites foram expressos em regras CSS com tokens existentes, sem regra de negócio no frontend.

## 24. Qualidade

`quality:changed`, `quality:module` para Analytics e Components passaram com zero findings confirmados. O lint de banco passou com warnings preexistentes de variáveis/parâmetro não lidos.

## 25. Governança documental

Este relatório é a evidência delta do macro-lote. O plano corrente, `PROJECT_STATE.md` e `DOCUMENTATION_LEDGER.md` foram atualizados sem substituir o histórico anterior. A auditoria `run-documentation-audit.mjs changed` foi reexecutada e permaneceu `inconsistent` por contradições históricas globais, links legados e um achado de secret-assignment em documento histórico; nenhum valor sensível foi aberto ou reproduzido neste lote.

## 26. Testes

- `npm run contracts:typecheck`: passou.
- `npm run web:typecheck`: passou.
- `npm run web:build`: passou.
- `npm run local:qa:secret-scan`: passou, 0 matches.
- Suíte focada UI: 31/31 passou.
- Suíte Analytics ampla: 91/94 passou; três falhas permanecem fora do escopo visual (runner, diagnóstico e status sem sucesso). Nenhuma falha foi causada por backend alterado neste lote.
- `npm run supabase:lint:db`: passou com warnings não bloqueantes preexistentes.

## 27. Matriz inicial

| Superfície | Problema V1 | Severidade | Correção V1.1 |
|---|---|---:|---|
| Visão Geral | título/KPI grandes e primeiro card dominante | P1 | escala limitada, contexto compacto, fundo neutro |
| Comercial | frame mais pesado que Suporte | P2 | frame/KPI compartilhados |
| Customer Success | risco de leitura de catálogo | P0 fora do escopo | mantida indisponibilidade, sem métrica nova |
| Suporte | densidade dependente de regras globais | P2 | tokens compartilhados |
| Financeiro | fonte em bloco redundante | P1 | metadata compacta no cabeçalho operacional |
| Integrações | cards altos | P2 | regras compactas globais |
| Fontes | ações preservadas | P2 | sem alteração de contrato |
| Histórico | timeline e repetição de ciclo | P1 | grupos compactos, sem linha decorativa |
| UI-05 bloqueante | overlay sem ciclo real no QA | P1 | motion auditado no loading real; sync não acionado |
| UI-05 não bloqueante | dependente de snapshot válido | P2 | contrato preservado |
| UI-05 erro | sem nova chamada autorizada | P2 | não executado externamente |
| UI-05 reduced motion | precisa desligar animação | P1 | captura e computed style sem animação |

## 28. Findings

O finding visual principal foi confirmado no baseline: escala excessiva e composição espaçada em desktop. Findings de dados, denominadores e sincronismo foram deliberadamente excluídos deste lote.

## 29. Correções

Delta final: seis áreas de código foram cobertas: CSS visual, overview, Financeiro, histórico, formulários de integração e UI-05.

Implementadas 4 áreas de código: CSS visual, overview, finance metadata e UI-05 copy/history. Não houve alteração em migrations, RPCs, views, read models, secrets, handlers de sincronização ou permissões.

## 30. QA final

Delta final: preview empacotado 80/80, 0 falhas de rota, 0 HTTP >=400, 0 overflow, 0 login detectado e 0 mensagens de console na coleta final.

Matriz final: 80/80 capturas; 0 falhas de carregamento; 0 HTTP ≥400; 0 overflow horizontal; 30 mensagens de console registradas para inspeção, sem falha de rota. Os títulos observados foram 32px, 28px e 24px conforme viewport.

## 31. Evidência de motion

Em `C:\Projetos\GSO-artifacts\dashboard-visual-density-v1-1-20260803\motion` foram capturados frames reais do loading do Dashboard em 0/250/500/750ms. O computed style registrou `genius-mascot-float`, `genius-mascot-magic`, `genius-mascot-arm-magic` e sparkles. Em reduced motion, nenhuma animação permaneceu. O overlay de ciclo ativo não foi acionado porque isso iniciaria sincronização externa.

## 32. Screenshots

- Baseline: `C:\Projetos\GSO-artifacts\dashboard-visual-density-v1-1-20260803\baseline-v1` — 80 PNGs e manifesto.
- Final: `C:\Projetos\GSO-artifacts\dashboard-visual-density-v1-1-20260803\final-v1-1` — 80 PNGs e manifesto.
- Preview final: `C:\Projetos\GSO-artifacts\dashboard-visual-density-v1-1-20260803\preview-final-2` — 80 PNGs e manifesto.
- Zoom: `C:\Projetos\GSO-artifacts\dashboard-visual-density-v1-1-20260803\zoom` — 16 PNGs, oito superfícies em 125% e 200%, sem overflow horizontal.
- Motion: `C:\Projetos\GSO-artifacts\dashboard-visual-density-v1-1-20260803\motion`.
- Pacote para revisão: `C:\Projetos\GSO-artifacts\dashboard-visual-density-v1-1-20260803\dashboard-visual-density-v1-1-evidence.zip`, 16.266.594 bytes, SHA-256 `2B037C236CADBCB8FB9F86E5B282612EEE567F37C951AE8E8ECA0DC147E6935B`.

## 33. Arquivos

Alterados no código: `apps/web/src/index.css`, `apps/web/src/features/analytics/AnalyticsCeoPage.tsx`, `apps/web/src/features/analytics/AnalyticsFinancePage.tsx`, `apps/web/src/features/settings/SyncHistorySettingsPage.tsx`, `apps/web/src/features/settings/SettingsIntegrationsPanel.tsx`, `apps/web/src/components/GeniusSyncOverlay.tsx`. Documentação: este relatório, `docs/plan.md`, `docs/PROJECT_STATE.md` e `docs/DOCUMENTATION_LEDGER.md`.

## 34. Código removido

Removidos: status duplicado no título da Visão Geral, eyebrow duplicado, preenchimento azul dominante do primeiro KPI, linha decorativa da timeline e texto repetitivo “Ciclo de atualização”. Nenhum código de integração ou fonte de dados foi removido.

## 35. Commits

- `e8f5380 refactor(ui): reduzir densidade visual do dashboard` — código e CSS.
- `6527c75 docs(ui): registrar densidade e QA do dashboard` — relatório e registros canônicos.
- `0ed6f61 docs(ui): fechar relatório do lote visual` — HEAD/commits finais.
- `5f2186d docs(ui): atualizar contagem final de testes` — validação ampla corrigida.
- `fff25ff refactor(ui): compactar hierarquia e estados visuais` — ajustes finais de overview, Financeiro, histórico, integrações e loading.
- `dd26d09 docs(ui): fechar evidências do lote de densidade` — documentação, matriz final e limites.

## 36. Git final

Branch: `codex/dashboard-visual-density-v1-1-20260803`. A divergência observada antes deste registro era `origin/main...HEAD = 0 128`; o HEAD final deve ser lido por `git rev-parse --short HEAD` após o commit documental.

## 37. Limitações

Não foi executada sincronização HubSpot/OMIE, não foram usadas credenciais, não foi feito deploy/push e não foi validado o overlay com um ciclo externo real. A suíte ampla tem três falhas fora do delta.

## 38. Backlog residual

1. Autorizar e executar uma sincronização real read-only controlada para validar o fluxo completo e o overlay UI-05.
2. Resolver as três falhas de contratos amplos em lote técnico separado.
3. Validar denominador de Customer Success e documentação de origem dos dados.
4. Aprovar visualmente V1.1 antes de propagar ajustes adicionais a outras superfícies.

## 39. Decisões pendentes

- Aprovação visual do Product Owner para o novo limite tipográfico e composição compacta.
- Autorização explícita para sincronização externa read-only, se o QA de UI-05 precisar do ciclo real.
- Decisão de produto sobre o denominador de Customer Success permanece fora deste lote.
