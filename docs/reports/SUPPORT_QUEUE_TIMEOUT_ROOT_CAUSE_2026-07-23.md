# Diagnostico e correcao do timeout da fila de suporte

Data: `2026-07-23`

## Sintoma

O contrato `rpc_support_ticket_queue_page` retornava HTTP 500 com SQLSTATE
`57014` (`canceling statement due to statement timeout`) quando executado por
um usuario autenticado com acesso administrativo.

## Causa raiz

A view `vw_support_tickets_queue` materializava `support_visible` e depois
revarria esse mesmo conjunto em dois CTEs independentes (`sla_context` e
`channel_context`). O plano local observado mostrou nested loops com 393.756
linhas removidas por filtro de join. O custo crescia desnecessariamente com a
quantidade de tickets, mesmo quando a pagina retornava no maximo 50 itens.

## Correcao

- migration: `supabase/migrations/20260723183054_support_ticket_queue_single_pass_hardening.sql`;
- eliminados os dois CTEs que repetiam a leitura de `support_visible`;
- enriquecimento de SLA, canal, readiness e tipo de conversa passou a ocorrer
  na mesma passagem relacional da view;
- nenhum campo do contrato publico foi removido e a ACL existente foi
  preservada.

## Validacao local

- antes da correcao: RPC autenticado retornava HTTP 500/SQLSTATE 57014;
- depois da correcao: RPC autenticado retornou HTTP 200 em aproximadamente
  `433 ms`, com 50 itens e total de 628 registros;
- pagina 2 retornou HTTP 200, 50 itens e o mesmo total de 628 registros;
- teste arquitetural: `tests/scripts/support-queue-view-architecture.test.mjs`;
- a migration foi aplicada somente no banco local para QA. Nenhuma migration
  remota, deploy ou push foi executado.

## Limites

O teste de integracao completo da fila continua dependente da reidratação da
fixture de suporte. A migration deve ser validada em um reset controlado antes
de qualquer publicacao remota, sem apagar o estado de QA atual neste checkout.
