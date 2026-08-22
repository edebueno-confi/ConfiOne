# Operational Support Flow V1 — kickoff

**Produto:** ConfiOne
**Data:** 2026-08-16
**Estado:** contrato de autorização corrigido; publicação ainda pendente de validação operacional

## Decisão

O primeiro corte de evolução será a publicação governada do Support Workspace. A UI e os contratos backend já existem. A lacuna de autorização foi corrigida pela migration `20260816100000_support_screen_capability_grants_v1.sql`, que alinha `screen.support.view` aos grants de tela de `platform_admin`, `support_manager` e `support_agent`.

As rotas continuam fora do release surface padrão. A publicação foi testada somente em modo local `VITE_RELEASE_SURFACE=full`, sem alterar o manifesto de produção ou o catálogo persistido de release.

Não será implementada melhoria visual ou ação adicional em uma superfície que ainda não pode ser acessada pelo fluxo oficial de autorização. A sequência correta é liberar a superfície por catálogo/perfil, validar a matriz de acesso e só então evoluir a operação diária.

## Evidência atual

- O backend possui `vw_support_tickets_queue`, `rpc_support_ticket_queue_page`, `vw_support_ticket_detail`, `rpc_support_get_ticket_timeline` e RPCs de criação, classificação, status, prioridade, SLA, mensagens, anexos, Knowledge e handoff.
- pgTAP passou com 1.788 testes em 116 arquivos e os smoke tests de RLS/auth passaram.
- O Playwright confirmou que a matriz atual de Settings está íntegra, mas confirmou também que as rotas Support não estão publicadas no release surface.
- A matriz autenticada local em modo full confirmou 10 combinações de perfil/rota: `platform_admin`, `support_manager` e `support_agent` chegaram às duas rotas e carregaram views/RPCs de suporte com HTTP 200; `dashboard_viewer` e `customer_user` foram negados.
- A matriz também confirmou carregamento dos read models de fila, detalhe, timeline, cliente, classificação, agentes atribuíveis, anexos, Knowledge e acionamentos internos, sem acesso direto a tabela-base sensível.
- O smoke versionado `npm.cmd run local:qa:support-release-smoke` habilita temporariamente somente `support_queue` e `support_tickets` no banco local, inicia o frontend em `4174` com `VITE_RELEASE_SURFACE=full`, registra a matriz em `output/local-qa/support-release-smoke.json` e restaura o catálogo automaticamente.
- A execução versionada terminou com 10 combinações, 6 autorizadas, 4 negadas e zero falhas. O release padrão foi confirmado novamente com as duas telas desabilitadas.
- O smoke operacional de escrita `npm.cmd run local:qa:support-operational-writes` passou com gestor, agente e cliente: atribuição, status, nota interna, resposta pública, anexo e reload foram persistidos quando aplicáveis; isolamento entre tenants e invisibilidade de nota interna foram confirmados. O harness foi tornado tolerante a reload assíncrono e a fixture já estar em `in_progress`, sem alterar o produto.
- A segunda rodada de gates passou com 262 testes focados, 549 testes amplos, typechecks de contracts/web, build, pgTAP, autenticação de cinco perfis, smoke Playwright geral, smoke Support, secret scan e quality gate. O lint continua sem erros, com 159 avisos legados; o lint SQL continua sem falhas, com 19 avisos não bloqueantes.
- Não foi criado bypass no frontend. `SupportGate` continua exigindo contexto autenticado e screen key compatível.

## Escopo da V1

1. Publicar `support_queue` e `support_tickets` no manifesto de release apenas depois do aceite operacional desta matriz.
2. Confirmar as dependências de `support_inbox`, áreas internas e contexto de tenant.
3. Reexecutar a matriz com `platform_admin`, `support_manager`, `support_agent`, `dashboard_viewer` e `customer_user`.
4. Validar fila, intake, seleção de ticket, timeline paginada, mensagens, classificação, SLA, Knowledge vinculada e handoff.
5. Só depois decidir melhorias de usabilidade, persistência de filtros e automações.

## Critérios de aceite

| Perfil | `/support/queue` | `/support/tickets` | Resultado esperado |
|---|---:|---:|---|
| `platform_admin` | autorizado | autorizado | operação administrativa completa, dentro do tenant |
| `support_manager` | autorizado | autorizado | operação de suporte permitida |
| `support_agent` | autorizado | autorizado | operação de suporte permitida |
| `dashboard_viewer` | negado | negado | `/access-denied`, sem request operacional indevido |
| `customer_user` | negado | negado | `/access-denied`, sem exposição de dados internos |

Para cada rota e perfil, o smoke deve registrar caminho final, requests de views/RPCs, status HTTP, erros de console e falhas de request. Nenhum acesso direto a tabela-base sensível será aceito.

## Fora do escopo

- IA ou automação de resposta.
- Integrações externas HubSpot/OMIE.
- Alteração de RLS para contornar a autorização.
- Nova tabela, RPC ou migration antes de auditar o catálogo existente.
- Redesign do shell ou publicação de módulos parcialmente funcionais.

## Próximo lote executável

`Support Release Surface Activation V1`: revisar o diff e aprovar a publicação das duas rotas no manifesto de release. A matriz Playwright versionada e o smoke de escrita já existem e passaram em modo local; antes da ativação, repetir o aceite de tenant, timeline, SLA, Knowledge, handoff e ações de escrita em fixture limpa. Em seguida, iniciar o primeiro lote de melhoria de UX sem incluir IA ou integrações externas.
