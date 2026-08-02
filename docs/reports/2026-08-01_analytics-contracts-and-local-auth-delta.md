# Relatório Delta — Dashboard e contratos de métricas

Data: 2026-08-01/02  
Checkout: `C:\Projetos\GSO-old`  
Branch: `main`  
HEAD de referência: `3dabf7d`

## 1. Proveniência Git

O checkout canônico continua sendo `C:\Projetos\GSO-old`. A branch `main`
segue com upstream `origin/main`, divergência `0 15`, um worktree ativo, stash
preservado e refs de arquivo da reconciliação anterior. O objetivo operacional
foi atualizado para resolver o produto no HEAD atual sem apagar os commits
históricos que ainda exigem decisão explícita de rebase/merge/cherry-pick.

## 2. Correções implementadas

- Customer Success deixou de reutilizar `getCeoSnapshot` como contrato próprio;
  a aba agora declara contrato não publicado, dependências e ausência de
  indicadores inferidos de tickets.
- O modelo público de `FinanceSnapshot` aceita somente `api` ou `none`. Payload
  histórico com `source = spreadsheet` não volta a ser publicado como fonte.
- A migration `20260802004655_analytics_finance_omie_only_contract_v1.sql`
  restringe snapshot, status da fonte e fila de não correspondências ao OMIE API
  atual; planilhas permanecem históricas.
- Ações de sincronização continuam centralizadas em Configurações; os domínios
  não publicam CTAs próprios.
- Configurações deixou de recriar `visibleGroups` em todo render. A memoização e
  a guarda de `selectedId` eliminaram o loop `Maximum update depth exceeded`.
- Foram adicionados contratos estruturais de CTA, Customer Success, Financeiro
  e Configurações.

## 3. Diagnóstico local do Auth

O login API autenticava em HTTP 200, mas o browser parava em `/login`. A captura
sanitizada mostrou HTTP 404 para `POST /rest/v1/rpc/rpc_internal_actor_workspace_context`.
O RPC existia no repositório, porém suas migrations anteriores não estavam
aplicadas no container local. A sequência aditiva foi aplicada localmente:

1. `20260727033234_access_01_role_enum_values.sql`;
2. `20260727033235_access_01_internal_control_plane.sql`;
3. `20260727173000_access_01_3_workspace_context_runtime_hardening.sql`.

Não houve reset, truncate, delete de dados, alteração remota ou uso de secrets.

## 4. Financeiro

Consulta agregada read-only do banco local: 10.317 empresas HubSpot, 108 chaves
de CNPJ normalizadas duplicadas e zero títulos OMIE atuais. Portanto não existe
amostra local válida para medir matching ou publicar números financeiros.

O contrato novo diferencia `not_configured`, `syncing`, `error`, `empty`,
`stale` e `fresh`. O teste persistido tem 20 asserções. A extensão pgTAP não
estava instalada no container; o mesmo contrato foi validado por bloco SQL
estrutural read-only com resultado `PASS`.

## 5. Customer Success

O contrato próprio ainda não está publicado. A especificação separa carteira,
health score, risco, renovação, expansão e onboarding de tickets e do snapshot
executivo. A tela permanece honesta em estado indisponível.

## 6. Suporte e conversas

Tickets continuam no contrato `rpc_analytics_cs_snapshot`/`vw_analytics_cs_*`.
Conversas são backlog separado: threads, mensagens, atores, canais, cursor,
deduplicação e escopos HubSpot ainda precisam de contrato e ingestão server-side.

## 7. Comercial

KPIs, funil, owner e série mensal já usam read models HubSpot. Drill-down por
deal ficou especificado como próximo lote, exigindo paginação, associações,
qualidade e link contextual validado.

## 8. Matching

As regras atuais são read-only e usam CNPJ normalizado e nome como candidato.
Duplicidade de CNPJ não autoriza merge; grupo econômico exige resolução humana.
Sem títulos OMIE atuais, não foi fabricada taxa de matching.

## 9. Evidências visuais

Capturas reais geradas em `output/local-qa/`, incluindo Dashboard desktop/mobile,
Financeiro desktop/mobile e Configurações após a correção do loop. A captura
autenticada do administrador chegou a `/admin/analytics` sem erro de console.
Após a correção, Configurações carregou sem `Maximum update depth exceeded`.
O smoke multi-persona completo não foi considerado aprovado porque a execução
automática em 4175 não saiu da rota de login; o smoke de Auth das cinco personas,
separado, passou.

## 10. Validações executadas

- `npm run contracts:typecheck` — passou;
- `npm run web:typecheck` — passou;
- `npm run web:build` — passou, 830 módulos;
- testes focados de contratos — 16/16;
- `node scripts/local-qa/smoke.mjs` — 5/5 autenticações;
- bloco SQL estrutural do contrato financeiro — PASS;
- `npm run documentation:validate:internal-docs` — 0 bloqueios, 9 alertas históricos;
- `git diff --check` — passou;
- pgTAP 088 — não executável localmente porque a extensão não está instalada.

## 11. Commits

Nenhum commit ou push foi executado neste delta. As alterações herdadas e novas
continuam separadas no working tree para revisão e commits objetivos autorizados.

## 12. Git final do delta

O working tree continua intencionalmente sujo, com alterações anteriores,
correções deste lote, migration/testes novos, specs e evidências. O stash foi
preservado. Nenhum histórico foi reescrito.

## 13. Próximos macro-lotes

Seguir `docs/plans/analytics-macro-lote-0.4-backlog-v1.md`: primeiro fechar QA
visual multi-persona e editor legado; depois publicar contrato próprio de CS,
conversas, Comercial drill-down e matching após carga OMIE autorizada.

## 14. Limitações e pendências

- credenciais e tokens não foram lidos nem recuperados;
- sync HubSpot/OMIE real, deploy, push e scheduler remoto não foram executados;
- o banco local foi corrigido aditivamente, mas a extensão pgTAP continua ausente;
- a sequência de migrations aplicada localmente precisa ser confirmada em um
  banco reproduzido pela cadeia completa antes de qualquer promoção remota.
