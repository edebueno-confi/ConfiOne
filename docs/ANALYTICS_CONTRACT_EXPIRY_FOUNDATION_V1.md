# Fundação de contratos próximos do vencimento V1

**Status:** DISCOVERY / NOT PUBLISHED
**Task:** `CONTRACT-EXPIRY-2026-08-21`
**Data:** 2026-08-21

## Resumo executivo

O ConfiOne já possui uma fonte contratual local para assinaturas
cliente-produto-plano com `renewal_at`, `ended_at`, status, produto, plano e
referência do contrato. Também possui uma leitura de carteira CS que expõe
`renewalAt` e o responsável de Customer Success para assinaturas ativas ou
suspensas.

Essas fontes ainda não formam um contrato publicado de contratos próximos do
vencimento. Não existe janela canônica de alerta, classificação de vencimento,
responsável de renovação ou vínculo publicado entre a assinatura e o MRR
financeiro. Portanto, não há base suficiente para criar uma lista, KPI, alerta,
MRR em risco ou UI de vencimento neste lote.

## Fontes reais encontradas

### Assinatura cliente-produto-plano

Fonte: `public.customer_product_subscriptions`, criada em
`supabase/migrations/20260602120000_ocp_v1_e_customer_product_subscriptions_foundation.sql:52-82`.

Campos relevantes:

- `tenant_id`, `product_id`, `plan_id` e `contract_reference` identificam o
  contexto operacional, produto, plano e referência textual do contrato;
- `status` pode ser `pending`, `active`, `suspended`, `cancelled` ou `expired`;
- `started_at`, `ended_at` e `renewal_at` são `timestamptz` e podem ser nulos;
- a constraint só garante que `renewal_at <= ended_at` quando ambos existem;
  ela não define que `ended_at` seja a data de vencimento exibível nem cria uma
  janela de renovação;
- não há campo de MRR, probabilidade de renovação ou responsável de renovação
  no registro da assinatura.

O índice de assinatura corrente considera assinaturas `pending`, `active` e
`suspended` não arquivadas por tenant e produto. Isso não equivale a uma
classificação de contrato próximo do vencimento.

### Read model administrativo

Fonte: `public.vw_admin_customer_product_subscriptions`, definida em
`supabase/migrations/20260602170000_ocp_v1_e_subscription_readmodel_hardening.sql:1-52`.

O read model publica tenant, produto, plano, status, datas de início, fim e
renovação, referência do contrato, contagens de entitlements e ownership. A
leitura é protegida pelo papel `platform_admin`; não é um contrato de carteira
CS nem um endpoint de alertas.

### Carteira de Customer Success

Fonte: `public.vw_cs_customer_portfolio`, definida em
`supabase/migrations/20260604193000_cs_portfolio_contract_foundation.sql:35-183`.

O `product_contexts` expõe `startedAt`, `endedAt`, `renewalAt`, produto, plano,
status e contagens operacionais para assinaturas `active` ou `suspended`. A
mesma view expõe o `cs_owner` selecionado entre owners ativos com
`owner_role = 'cs_owner'` e permite acesso a administradores ou membros ativos
de Customer Success no tenant.

Esse contrato não publica:

- dias até renovação ou faixa de vencimento;
- data de vencimento validada contra uma fonte externa;
- owner de renovação distinto do `cs_owner`;
- MRR por assinatura ou por produto;
- estado `due_soon`, `overdue` ou equivalente.

### MRR e sinais de risco financeiro

As fontes analíticas financeiras usam `public.vw_analytics_customer_financial_link`
e a configuração `analytics_kpi_settings.mrr_source`. As migrations
`supabase/migrations/20260807170000_analytics_kpi_read_models_v3.sql:358-532`
e `supabase/migrations/20260809060338_analytics_finance_identity_reconciliation_v1.sql:158-332`
publicam MRR atual e sinais como `mrr_overdue`, `mrr_with_critical_ticket`,
`mrr_without_recent_activity` e `mrr_at_risk` por causas observadas.

O sinal `contract_not_current` considera `contract_status` igual a `Vencido` ou
`Encerrado`. Isso descreve contrato fora de vigência já observado. Não é uma
previsão de renovação próxima e não usa `renewal_at`. A cobertura pode ser
`partial` ou `unavailable` quando a origem de MRR, identidade ou vínculo não
está resolvida.

As funções de ingestão HubSpot selecionam MRR, status do contrato e owner de CS
em `supabase/functions/hubspot-orchestrator-worker/index.ts:65-72` e
`supabase/functions/hubspot-cs-migration/index.ts:36-115`, mas não selecionam
uma data de renovação. Não foi localizado contrato publicado que una esse MRR
à assinatura cliente-produto-plano por uma chave e semântica de vigência
definidas.

## Semântica temporal e cobertura

- `renewal_at` e `ended_at` são timestamps com timezone, mas o domínio ainda
  não define a janela de alerta, o calendário operacional ou a conversão de
  data para exibição;
- nulo em `renewal_at` significa ausência de data contratada no registro, não
  “não vence” e não deve virar zero ou uma data estimada;
- uma assinatura `active` ou `suspended` sem `renewal_at` não pode entrar em
  uma lista de próximos vencimentos sem estado explícito de indisponibilidade;
- `contract_status` e `mrr_overdue` são sinais separados de vigência e atraso
  financeiro e não devem ser combinados silenciosamente;
- a lista de contratos não pode misturar posição atual, histórico de contrato,
  previsão de renovação e MRR atual como se fossem a mesma coorte.

## Estado de publicação

| Capacidade | Estado | Motivo |
| --- | --- | --- |
| Ler `renewal_at` de assinaturas contratadas | OBSERVED | Existe nos read models administrativos e CS, sujeito a permissões. |
| Identificar `cs_owner` corrente | OBSERVED | Existe na carteira CS, com seleção de owner ativo. |
| Listar contratos próximos do vencimento | UNAVAILABLE | Não há janela, classificação ou read model dedicado. |
| Calcular MRR por assinatura em renovação | UNAVAILABLE | A assinatura não possui MRR e não há vínculo publicado com a fonte financeira. |
| Calcular MRR em risco por vencimento futuro | UNAVAILABLE | Não há regra de risco, probabilidade ou contrato de previsão. |
| Mostrar alerta ou UI de renovação | NOT_PUBLISHED | Depende de contrato backend, permissão, janela e método aprovados. |

## Menor próximo lote implementável

Antes de qualquer UI, o próximo lote deve obter uma decisão de produto e
contrato sobre:

1. qual campo é a data oficial de vencimento ou renovação;
2. qual janela operacional define `due_soon` e em qual timezone;
3. quem é o responsável de renovação e como ele se relaciona com `cs_owner`;
4. qual fonte de MRR é oficial e qual chave liga MRR à assinatura;
5. quais estados de cobertura e permissões devem ser publicados;
6. quais testes de tenant, RLS, auditoria e frescor são necessários.

Sem essas decisões, a evolução correta é um contrato server-side de leitura
explicitamente versionado, não um cálculo no frontend ou uma coluna derivada
em documentação.

## Referências e limitações

- `packages/contracts/src/ticketing.ts:2022-2180` materializa os tipos de
  assinatura, `renewalAt` e owners administrativos.
- `apps/web/src/features/cs/cs-model.ts:10-50` apenas mapeia o contexto real;
  não calcula dias ou risco.
- `apps/web/src/features/admin/admin-api.ts:551-585,855-878` consome os read
  models administrativos sem criar regra de vencimento.
- Esta fundação é documental. Não altera migrations, views, RPCs, RLS,
  contratos executáveis, integrações, UI ou dados externos.
