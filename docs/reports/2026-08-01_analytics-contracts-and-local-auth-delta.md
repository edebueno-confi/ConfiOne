# Relatório Delta — Dashboard e contratos de métricas

Data: 2026-08-01/02
Checkout: `C:\Projetos\GSO-old`
Branch: `main`
HEAD de base desta atualização: `b77698d`

## 1. Proveniência Git

O checkout canônico continua sendo `C:\Projetos\GSO-old`. A branch `main`
segue com upstream `origin/main`, sem commits atrás e com 21 commits locais à
frente no início deste delta. Há um worktree ativo e o stash preservado. As
refs de arquivo da reconciliação anterior continuam acessíveis; não houve
reset, clean, rebase, merge, cherry-pick, push ou exclusão de histórico.

## 2. Correções implementadas

- Customer Success deixou de reutilizar `getCeoSnapshot`; a aba própria declara
  contrato não publicado, dependências e ausência de indicadores inferidos de
  tickets.
- `FinanceSnapshot` aceita somente `api` ou `none`; a migration OMIE-only
  restringe snapshot, status e fila de não correspondências ao OMIE atual.
- Ações de sincronização ficam centralizadas em Configurações; domínios não
  publicam CTAs próprios.
- Configurações deixou de recriar grupos visíveis em todo render; a guarda de
  `selectedId` elimina o loop `Maximum update depth exceeded`.
- Foram adicionados contratos estruturais de CTA, Customer Success, Financeiro
  e Configurações.
- Foi criado `scripts/local-qa/dashboard-macro-lote-0.4.mjs`, que autentica
  perfis locais, captura superfícies reais, mede overflow/rede/console e grava
  `output/dashboard-macro-lote-0.4/summary.json`.
- As especificações de CS, Suporte/Conversas, Comercial, Financeiro, matching e
  backlog foram ampliadas sem implementar métricas ainda.

## 3. Diagnóstico local do Auth

O primeiro browser QA reproduziu `401 JWT issued at future`/falha de contexto
após login. A chamada API direta com a sessão recém-emitida retornou HTTP 200;
o problema era sessão/browser local desatualizado durante a primeira captura,
não um fallback de frontend. Após iniciar contextos limpos e aguardar a
conclusão da navegação, todas as capturas autenticadas chegaram às rotas
esperadas sem erro de contexto.

As migrations de Access já aplicadas localmente foram preservadas e são
aditivas: `20260727033234`, `20260727033235` e `20260727173000`. Não houve reset,
truncate, delete de dados, alteração remota ou exposição de secrets.

## 4. Financeiro

Consulta agregada read-only local: 10.317 empresas HubSpot, 108 chaves de CNPJ
normalizadas duplicadas e zero títulos OMIE atuais. Não existe amostra local
válida para medir matching ou publicar números financeiros.

O contrato diferencia `not_configured`, `syncing`, `error`, `empty`, `stale` e
`fresh`. O QA visual 1440/1024 registrou `omie-unavailable`, sem valores
fabricados. O teste pgTAP possui 20 asserções; a extensão pgTAP não está
instalada no container local, e o contrato foi verificado por SQL estrutural
read-only.

## 5. Customer Success

O contrato próprio continua não publicado. A especificação agora cobre clientes
por CSM, sem CSM, contato recente, tickets críticos, inadimplência, renovação,
onboarding, negócio ativo, risco, cobertura, cadência e health score, cada um
com fórmula, grão, origem candidata, frescor, nulo, permissão, owner e status.
O QA full-preview capturou a tela com `Contrato Customer Success não publicado`
e `Indicadores de Customer Success ainda não configurados`.

## 6. Suporte e conversas

Tickets permanecem no contrato `rpc_analytics_cs_snapshot`/`vw_analytics_cs_*`.
O catálogo separa Tickets, Conversas, Canais, SLA e Satisfação. Conversas
continuam indisponíveis até confirmar produto, plano, escopos HubSpot, cursor,
deduplicação, retenção e read model server-side. O suporte foi capturado em
1440, 1280 e 1024px; em 1024px o filtro de pipeline quebra responsivamente para
uma segunda linha, sem overflow, enquanto em 1440px todos os filtros e ações
ficam alinhados.

## 7. Comercial

KPIs, funil, owner e série mensal usam read models HubSpot. O drill-down ficou
especificado como próximo lote, exigindo paginação, associações, qualidade,
tenant/RLS e helper de link validado por portal + Deal ID. A captura autenticada
do domínio Comercial foi feita como `platform_admin`; não houve chamada HubSpot
direta nem implementação de detalhe neste delta.

## 8. Matching

As regras atuais são read-only: normalização de CNPJ, `app_private.normalize_company_name`,
`rpc_analytics_company_candidates`, reconciliação agrupada e resolução humana
de grupo econômico. O mapa agora registra sinais exato/forte/provável,
ambíguo/rejeitado, payload de dry-run, score versionado, fila e integridade.
Com zero títulos OMIE atuais, não foi fabricada taxa de matching nem threshold.

## 9. Evidências visuais

Artefatos reais em `output/dashboard-macro-lote-0.4/`:

- executivo 1440px;
- comercial 1440px;
- suporte 1440/1280/1024px;
- financeiro 1440/1024px;
- Configurações/integrações 1440px;
- Customer Success em `full-preview-only` 1440px.

O `summary.json` registra rota, perfil, modo de release, estado da fonte,
console, page errors, request failures, respostas inesperadas e overflow.
Resultado: 9/9 autenticadas, zero erros de console, zero falhas de requisição,
zero respostas inesperadas e zero overflow.

## 10. Validações executadas

- `ALLOW_LOCAL_QA_RESET=true node --test tests/scripts/*.test.mjs` — 266/266;
- `npm run contracts:typecheck` — passou;
- `npm run web:typecheck` — passou;
- `npm run web:build` — passou, 830 módulos transformados;
- `npm run repository:check-root` — passou;
- `npm run local:qa:secret-scan` — 1.683 arquivos rastreados, 0 matches;
- `npm run documentation:validate:internal-docs` — 0 bloqueios, 9 alertas
  documentais históricos;
- `node --check scripts/local-qa/dashboard-macro-lote-0.4.mjs` — passou;
- `git diff --check` — passou;
- bloco SQL estrutural do contrato financeiro — passou;
- pgTAP 088 — não executável localmente porque a extensão não está instalada.

## 11. Commits

Os commits funcionais anteriores deste ciclo já estão em `main`, incluindo
`8db7463`, `066f50f`, `4617b97`, `979d7e0`, `818bd6a` e `b77698d`. Este delta
adiciona um commit separado para as especificações e o script de QA, sem incluir
alterações staged de outro agente em `.agents/`, nem `AGENTS.md`, `.gitignore` ou
`docs/engineering/`.

## 12. Git final do delta

O trabalho do usuário em `.agents/`, `AGENTS.md`, `.gitignore` e
`docs/engineering/` foi preservado e não foi misturado. O commit deste delta é
local; nenhum push foi executado. O stash, refs de arquivo e demais branches
continuam preservados.

## 13. Próximos macro-lotes

Seguir `docs/plans/analytics-macro-lote-0.4-backlog-v1.md`: Lote 1 OMIE-only já
tem contrato; os próximos lotes independentes são matching, Comercial
drill-down, Tickets/SLA, Conversas/Chat, Customer Success e auditoria/observabilidade.
O próximo lote recomendado é validar o editor legado e a governança de
integrações em escopo isolado, sem iniciar CS ou Chat automaticamente.

## 14. Limitações e pendências

- credenciais e tokens não foram lidos nem recuperados;
- sync HubSpot/OMIE real, deploy, push e scheduler remoto não foram executados;
- pgTAP continua ausente no container local;
- o ambiente local não prova disponibilidade do OMIE real nem escopos/planos de
  Conversations;
- Customer Success continua indisponível por decisão honesta de contrato;
- alterações não pertencentes a este lote permanecem no working tree e exigem
  revisão própria antes de qualquer organização futura.
