# Correção do timeout da fila de suporte - 2026-07-23

## Sintoma

Após o seed local da operação CS Ops, `/support/tickets` e `/support/queue`
retornavam `canceling statement due to statement timeout`.

## Causa raiz

`vw_support_tickets_queue` consumia `vw_tickets_list` no recorte principal e
novamente dentro de `vw_support_ticket_channel_context`. Com 607 tickets e
permissões por tenant, a mesma agregação de mensagens e verificação de acesso
era calculada mais de uma vez.

## Correção

- `support_visible` passou a ser um CTE materializado e único.
- SLA e canal reutilizam o mesmo conjunto autorizado.
- O frontend passou a solicitar as colunas contratuais explicitamente.
- O primeiro carregamento fica limitado aos 50 tickets mais recentes, preservando
  filtros server-side e a paginação visual existente.

Migration: `supabase/migrations/20260723151602_optimize_support_ticket_queue_read_model.sql`.

## Evidência local

- Consulta autenticada de 607 tickets: concluída sem timeout.
- Consulta autenticada ordenada com limite de 50: concluída sem timeout.
- Navegador local validou `/support/tickets` e `/support/queue` com 50 itens.
- Navegador local validou `/support/clientes` e `/cs/portfolio` com 607 clientes.
- Navegador local validou `/internal-actions` com 606 acionamentos.

## Limite conhecido

A paginação server-side completa, para navegar além do primeiro recorte de 50
tickets sem filtro, permanece no próximo ciclo. Nenhum banco remoto foi alterado.
