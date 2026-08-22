# IMPLEMENTATION

- Task ID: `R2-CUSTOMER-CENTRAL-WORKSPACE-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Base SHA: `344f900c`
- Implementation SHA: UNCOMMITTED_WORKTREE

## Instrução operacional

Implementar o workspace da Central de Clientes usando os blueprints canônicos,
contratos, read models e padrões existentes. Antes de criar UI, reconciliar
fonte backend, autorização, tenant e estados. Não criar mock ou fallback
silencioso para dados ausentes.

## Entregáveis

## Entrega para revisão

Implementação: rota dedicada `/admin/customer-central` reutilizando
`TenantsPage`, que já é o workspace completo da Central de Clientes com lista,
detalhe, abas, busca, estados e fontes tenant-aware. Não foi criado slide-over
como workspace principal, nem contrato, read model, regra de negócio ou dados
fictícios novos.

Arquivos do lote: `apps/web/src/app/router.tsx` e
`tests/scripts/customer-central-workspace.test.mjs`. A superfície utiliza os
contratos existentes em `admin-api.ts`, `vw_admin_tenants_list`,
`vw_admin_customer_account_profile_detail` e
`vw_admin_customer_operations_directory`. A rota não foi adicionada à
allowlist de first release, portanto não constitui publicação da Release 2.

Validações: teste focalizado 2/2 PASS; `npm run web:typecheck` PASS;
`npm run web:build` PASS com 945 módulos; `npm run lint` PASS com 0 erros e
160 warnings legados; `npm run docs:validate` PASS; `npm run review:gates`
PASS com 0 regressões bloqueantes e 47 itens baseline resolvidos;
`git diff --check` PASS.

Limitações: o smoke browser local foi executado sem autenticação. A rota
respondeu 200 e redirecionou para `/login`, com título correto, conteúdo de
login e zero erros de console. Isso comprova somente o guard de sessão não
autenticada, não o workspace autenticado, tabs, estados internos,
responsividade, RLS/cross-tenant servido ou dados atuais HubSpot/OMIE. Não
houve leitura de secrets, escrita externa, produção, deploy, push ou merge.

Forge transfere `READY_FOR_REVIEW` ao Sentinel. Implementation SHA permanece
`UNCOMMITTED_WORKTREE`.

## Resposta a F-R2WS-001

O finding é aceito. O teste 2/2 é somente estático e não será apresentado como
prova de QA visual ou funcional. Não há, nesta sessão, sessão autenticada,
ambiente servido autorizado ou permissão para executar fluxos que possam
escrever em serviços externos. Portanto não foi inventado um PASS para tabs,
loading/error/empty em runtime, responsividade, guard/permissão ou isolamento.

Resposta: QA local autorizado executado sem credenciais. Comando usado:
servidor Vite em `127.0.0.1:4174` e Playwright headless navegando para
`/admin/customer-central`. Resultado: HTTP 200 do shell, redirecionamento para
`/login`, título `Confi One — Plataforma Operacional`, conteúdo de login e
zero erros de console. O teste focused 2/2 continua sendo evidência estática,
não substituto do QA autenticado. A task retorna a `READY_FOR_REVIEW` com a
limitação autenticada explicitamente preservada, sem declaração de PASS para
tabs, estados internos, responsividade ou isolamento servido.

- carteira e workspace dedicado em rota real;
- tabs, estados, navegação e busca global integrada;
- QA visual/funcional local e testes focados;
- divergências justificadas, gates e pedido de revisão independente.
