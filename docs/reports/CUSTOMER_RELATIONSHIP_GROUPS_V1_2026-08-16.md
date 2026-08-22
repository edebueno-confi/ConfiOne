# Customer Relationship Groups V1

**Data:** 2026-08-16
**Produto:** ConfiOne
**Escopo:** Central de Clientes e agrupamento interno de contas e marcas

## Resultado

A Central de Clientes foi publicada no release local/controlado e passou a consumir o contexto de agrupamento interno quando existir. O modelo nao presume que um agrupamento seja grupo societario, entidade juridica ou entidade de faturamento.

## Direção visual futura

Os blueprints visuais aprovados para a Central de Clientes V1 estão em
[`CENTRAL_CLIENTES_HOME_V1.png`](../design/blueprints/central-clientes/CENTRAL_CLIENTES_HOME_V1.png)
e [`CLIENTE_RESUMO_V1.png`](../design/blueprints/central-clientes/CLIENTE_RESUMO_V1.png).
Eles orientam a futura Release 2 e não alteram o resultado técnico deste
relatório nem comprovam que a interface final esteja concluída.

## Decisao de dominio

- `tenants` continua sendo a conta operacional/contratual do ConfiOne.
- `customer_account_groups` representa um guarda-chuva interno.
- `customer_account_group_members` aceita `tenant` ou `brand`.
- Os tipos de agrupamento novos sao `economic_group` e `service_umbrella`.
- `portfolio` nao e um agrupamento valido para novas criacoes. Carteira CS usa `cs_customer_portfolio_assignments`, com responsavel, escopo e historico proprios.
- As relacoes sao `contract_holder`, `served_brand` e `operational_member`.
- Uma marca atendida pode ser registrada sem receber contrato ou tenant proprio.
- Quando houver permissao, carteira, KPI ou isolamento especifico, a marca deve ser vinculada a um tenant operacional.
- HubSpot e OMIE/OME continuam fontes externas de dados. Nenhuma escrita foi executada nesses servicos.

## Implementacao

- `supabase/migrations/20260816110000_customer_relationship_groups_v1.sql`
  - tabelas, enums, indices, RLS, auditoria, RPCs e read models;
- `supabase/migrations/20260816114000_customer_relationship_groups_scope_fix.sql`
  - impede novas carteiras CS na camada de grupos e direciona a operacao para a RPC propria de Customer Success;
- `supabase/migrations/20260816112000_customer_central_release_activation_v1.sql`
  - publica `tenants` no catalogo de telas;
- `supabase/migrations/20260816113000_customer_central_screen_capability_v1.sql`
  - cria `screen.tenants.view` e concede a capacidade ao `platform_admin`;
- `apps/web/src/features/admin/admin-api.ts`
  - carrega o contexto de agrupamento sem join em tabela base;
- `apps/web/src/features/tenants/TenantsPage.tsx`
  - exibe grupo principal e tipo quando houver vinculo;
- `apps/web/src/features/tenants/CustomerGroupsPanel.tsx`
  - permite criar agrupamentos, vincular contas ou marcas e arquivar vinculos;
- `apps/web/src/features/admin/admin-api.ts` e `apps/web/src/contracts/admin-contracts.ts`
  - expõem os read models e RPCs de grupos ao frontend sem leitura direta das tabelas base;
- `tests/scripts/release-surface.test.mjs`
  - alinha assercoes de rotas e navegacao com a Central publicada;
- `scripts/local-qa/browser-smoke.mjs`
  - inclui `/admin/tenants` no smoke autenticado;
- `supabase/tests/115_customer_relationship_groups_v1.sql`
  - contrato RLS, RPC, views, capacidade e publicacao.

## Validacao

| Gate | Resultado |
|---|---|
| Migration local sem reset | passou |
| pgTAP focado | 24/24 |
| pgTAP completo | 118 arquivos, 1.816 testes aprovados |
| SQL lint | passou, somente avisos legados |
| Typecheck web | passou |
| Typecheck contracts | passou |
| Build Vite | passou, 938 modulos |
| Testes focados Node | 262/262 |
| Contratos de release/support | 37/37 |
| Playwright autenticado | 10 personas, 0 erros de console/rede, Central em `/admin/tenants` |
| `git diff --check` | passou |

## Limites atuais

- Nenhum grupo ou marca foi criado artificialmente na fixture QA.
- Carteira de Customer Success nao e criada, inferida ou exibida como grupo de marcas, grupo economico ou guarda-chuva de servico.
- A migration de correcao `20260816114000_customer_relationship_groups_scope_fix.sql` bloqueia novas criacoes com o valor legado `portfolio`; registros antigos, se existirem, permanecem somente para leitura.
- A tela mostra `Indisponivel` para contas sem classificacao, o que e o comportamento correto neste lote.
- A UI atual cobre criacao de agrupamento, vinculo de contas ou marcas e arquivamento de membros. Edicao ou arquivamento do agrupamento ainda nao sao expostos porque o backend nao possui RPC especifica para essas operacoes.
- O painel nao cria dados de Grendene, Infracommerce ou outras contas automaticamente. O de-para real continua dependendo de aprovacao operacional.
- A sincronizacao HubSpot/OMIE nao foi alterada.

## Seguranca

- Tabelas base nao sao expostas ao frontend.
- Read models sao restritos a `platform_admin` e usam `security_barrier`.
- RPCs exigem ator ativo, `platform_admin`, autoria e auditoria.
- IDs de origem externa sao metadados, nunca credenciais.

## Estado de execucao

- Nenhum commit, push, deploy ou migration remota foi executado.
- O Supabase usado foi exclusivamente o local.
