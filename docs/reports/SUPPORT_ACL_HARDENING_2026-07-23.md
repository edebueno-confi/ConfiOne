# Hardening da fila e das funções de acesso - 2026-07-23

## Escopo

Este lote fecha duas regressões locais descobertas após a carga de 606 clientes
CS Ops: o custo duplicado da fila de suporte e ACL implícita em funções internas
do catálogo de telas.

## Correções

- `vw_support_tickets_queue` reutiliza um único recorte materializado de tickets
  autorizados; SLA e canal não reabrem a mesma view pesada.
- O frontend pede somente as colunas da fila e limita o primeiro carregamento a
  50 tickets mais recentes.
- Funções de trigger `ensure_internal_membership_screen_dependencies`,
  `ensure_internal_profile_screen_dependencies` e
  `touch_internal_screen_access_updated_at` não ficam executáveis por papéis da
  API; a migration deixa a ACL explícita para o owner do banco.

## Validação

- pgTAP: 71 arquivos, 1.219 testes, PASS.
- Contracts/web typecheck, build, testes Node, higiene da raiz e `git diff --check`:
  PASS.
- Documentação interna: 0 bloqueios; alertas históricos de menção a token foram
  preservados para triagem separada.
- Smoke HTTP local: `http://127.0.0.1:4173/` respondeu 200.

## Limites

As migrations foram aplicadas somente no banco local. Paginação server-side além
dos 50 tickets e qualquer publicação remota permanecem como próximos gates.
