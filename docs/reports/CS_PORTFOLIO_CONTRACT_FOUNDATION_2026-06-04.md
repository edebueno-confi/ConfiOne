# CS Portfolio Contract Foundation - 2026-06-04

## Resumo executivo

Foi materializado o primeiro contrato backend-first para CS Portfolio, sem UI, sem rota `/cs`, sem mutation, sem health score canonico, sem billing/financeiro e sem deploy remoto.

O corte usa o contrato ja existente de areas internas: membership ativa na area `customer_success` por tenant. Isso evita criar uma role global nova neste momento e mantem a permissao tenant-aware pelo dominio de `internal_area_memberships`.

## Escopo entregue

- Criada a funcao `app_private.can_access_cs_customer_portfolio(target_tenant_id uuid)`.
- Criada a view `public.vw_cs_customer_portfolio`.
- Criado teste pgTAP dedicado `supabase/tests/048_cs_portfolio_contract_foundation.sql`.
- Atualizado allowlist do teste global de funcoes privadas para o novo gate `can_access_*`.
- Adicionados tipos TypeScript `CsCustomerPortfolio` e `CsCustomerPortfolioProductContext`.

## Contrato de leitura

`vw_cs_customer_portfolio` retorna tenant, escopo `customer_success_area`, owner CS quando existir, contadores de subscriptions/produtos, contexto de produto/plano, contadores agregados de tickets, membros ativos da area `customer_success` e health como `unavailable`.

## Gate de acesso

A leitura e permitida para `platform_admin` ou usuario ativo com tenant membership ativa e `internal_area_memberships` ativa no mesmo tenant, `area_key = 'customer_success'`, role `viewer`, `member` ou `manager`.

O gate segue o padrao local de funcoes `app_private.can_access_*`: `authenticated` pode executar o helper, `anon` nao pode, e a view continua sendo a superficie contratual de leitura.

Nao foi criada role global de CS.

## Boundary mantido

- Sem UI `/cs`.
- Sem RPC `rpc_cs_*`.
- Sem escrita CS.
- Sem follow-up, tarefa, projeto, reuniao ou plano de acao.
- Sem health score canonico.
- Sem billing, preco, invoice, payment, revenue ou financeiro.
- Sem leitura direta de tabelas base pelo frontend.
- Sem reaproveitar view de suporte como contrato CS.

## Validacoes

- `git status --short`
- `git diff --check`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:wait:ready`
- `npm run supabase:lint:db`
- `npm run supabase:db:reset`
- `supabase test db --local supabase/tests/048_cs_portfolio_contract_foundation.sql`
- `npm run supabase:test:db`
- `npm run documentation:validate:internal-docs`

## Proximo passo recomendado

Conectar `/cs/portfolio` read-only somente depois de confirmar blueprint/screen spec, gate de rota usando contrato CS e manutencao de health como `Indisponível` ate existir contrato proprio.
