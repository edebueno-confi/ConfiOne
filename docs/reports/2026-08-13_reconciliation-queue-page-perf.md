# Analytics — Paginação da Fila de Reconciliação — 2026-08-13

## Diagnóstico

O `pg_stat_statements` indicou custo elevado no RPC
`rpc_analytics_company_reconciliation_queue(integer, integer)`. A função
construía candidatos para todos os grupos de origem e só depois aplicava
`limit/offset`. A fila de produção possui 245 grupos, enquanto a tela abre
com 25 itens.

## Mudança aplicada

`supabase/migrations/20260813145204_analytics_company_reconciliation_queue_page_perf_v2.sql`

- adiciona uma etapa `paged_rows` antes do cálculo de candidatos;
- preserva o resumo global, a ordem pública e o contrato JSON;
- evita calcular sugestões para itens fora da página atual;
- mantém o comentário e os grants do RPC, sem alterar regra de decisão ou
  criar vínculo automático.

A migration foi aplicada ao Supabase remoto e registrada como
`20260813145259` / `analytics_company_reconciliation_queue_page_perf_v2`.

## Evidência

| Cenário remoto | Resultado | Payload verificado |
| --- | ---: | --- |
| página 1, 25 itens | 531 ms | `total=245`, `items=25` |
| página 2, 25 itens | 2,12 s | `total=245`, `items=25` |

No banco local, as mesmas páginas mediram aproximadamente 340 ms e 171 ms.
As variações entre páginas refletem cache e o custo dos candidatos da página;
o contrato de paginação e o total global permaneceram estáveis.

## Segurança e validação

- `anon` não possui `EXECUTE`;
- `authenticated` e `service_role` mantêm `EXECUTE`;
- autorização interna e postura de decisão humana foram preservadas;
- advisors de performance foram executados após a migration; os avisos
  retornados são o backlog geral já existente de FKs, políticas e índices,
  sem novo aviso específico desta função.
- A suíte local completa executou 1.789 testes. O contrato específico da fila
  (`113_analytics_company_reconciliation_queue_perf.sql`) passou. O lote geral
  ficou vermelho apenas em falhas preexistentes de fixtures/conteúdo local nos
  testes `077_knowledge_taxonomy.sql`, `110_analytics_operation_scope.sql` e
  `111_analytics_company_reconciliation_manual.sql`; essas falhas não são
  cobertas nem alteradas por esta migration.

## Próxima frente

Os read models executivos continuam como o maior custo observado. Eles devem
ser tratados em lote separado, com comparação de payload completo e medição
por domínio antes de qualquer substituição de plano.
