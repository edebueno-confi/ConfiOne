# OCP V1-E - Customer Product Subscriptions Decision Record

Data: 2026-06-02

## Decisao executiva

O OCP V1-E deve modelar assinaturas cliente-produto como um dominio proprio, separado de perfil operacional de conta, tickets, Knowledge entitlements e feature flags operacionais.

Decisao recomendada:

- `After Sale` deve entrar como **produto/plataforma propria** no catalogo comercial, ao lado de `Genius Returns`.
- Um `tenant` pode ter **multiplos produtos ativos**.
- Cada par `tenant + product` deve ter subscription propria, plano proprio, status proprio, features comerciais derivadas de plano/add-on/excecao e responsaveis internos segmentados.
- Visibilidade por papel deve ser derivada apenas de views/read models e RPCs governadas.
- O proximo lote implementavel pode ser liberado como **migration/backend**, desde que siga o execution plan de `docs/reports/OCP_V1_E_CUSTOMER_PRODUCT_SUBSCRIPTIONS_EXECUTION_PLAN.md` e mantenha UI, billing completo, financeiro completo e runtime de entitlement tecnico fora de escopo.

## Modelo recomendado

Modelo canonico:

- `tenants`: cliente B2B operacional.
- `commercial_products`: produtos/plataformas comercializadas, incluindo `genius_returns` e `after_sale`.
- `commercial_product_plans`: planos por produto.
- `commercial_product_features`: features comerciais canonicas por produto.
- `commercial_plan_features`: features inclusas/opcionais por plano.
- `customer_product_subscriptions`: vinculo canonico `tenant -> product -> plan`.
- `customer_product_feature_entitlements`: excecoes comerciais por subscription/feature quando o plano nao basta.
- `customer_product_internal_owners`: responsaveis internos por subscription e dominio de manutencao.
- `product_area_ownerships`: ownership por area sobre produto/modulo/feature, sem conceder permissao individual.
- `customer_account_profiles`: resumo operacional de conta, compatibilidade e contexto; nao e fonte canonica de produto/plano.
- `customer_account_features`: habilitacao/override operacional por tenant; nao e entitlement comercial.

O modelo deve permitir que um cliente B2B use Genius Returns, After Sale ou ambos, sem criar `customer_profiles_v2`, sem duplicar tenant e sem acoplar o contrato comercial a tickets.

## Alternativas consideradas

### After Sale como linha interna do mesmo produto

Rejeitada.

Motivo: reduz a modelagem inicial, mas cria acoplamento fragil entre produtos que tendem a ter planos, features, owners, operacao, suporte e evolucao comercial diferentes. Tambem enfraquece multiproduto por tenant e obriga o futuro a reinterpretar `product_line`/`account_tier`.

### After Sale como modulo de Genius Returns

Rejeitada para o catalogo comercial canonico.

Motivo: modulo deve representar agrupamento de capacidades dentro de um produto. After Sale pode ter relacao comercial e operacional propria; tratar como modulo dificultaria ownership, visibilidade por papel, expansao futura e cliente com apenas After Sale.

### Produto unico com feature flags por cliente

Rejeitada.

Motivo: repetiria o problema de `customer_account_features` como fonte de contrato vendido, misturando habilitacao operacional com produto/plano/feature comercial.

### Produto/plano em `customer_account_profiles`

Rejeitada.

Motivo: `product_line` e `account_tier` sao resumo operacional legado/atual, nao contrato comercial canonico. Usar esses campos como fonte bloquearia multiproduto e historico de plano.

## Decisao sobre After Sale

`After Sale` deve ser cadastrado como produto/plataforma propria em `commercial_products`.

Impactos:

- Permite `Genius Returns` e `After Sale` com planos, features, modulos e owners independentes.
- Permite tenant com um produto, outro produto ou ambos.
- Evita refatoracao futura para separar plataformas.
- Facilita visibilidade por papel com read models segmentados.
- Mantem o catalogo global sem `tenant_id`.

Regra: o primeiro seed/fixture de produto pode criar apenas produtos necessarios para validacao local. Nao deve criar billing, preco real, contrato financeiro ou comunicacao externa.

## Decisao sobre multiproduto

Um `tenant` pode ter multiplos produtos ativos ao mesmo tempo.

Regras:

- A unicidade da subscription ativa deve ser por `tenant_id + product_id`, com historico preservado por status/datas.
- Cada subscription aponta para um `plan_id` do mesmo `product_id`.
- Cada produto contratado pode ter status, lifecycle, features e responsaveis proprios.
- O frontend nao deve inferir multiproduto por `product_line`; deve consumir read models backend.

Status sugeridos para subscription:

- `pending`
- `active`
- `suspended`
- `cancelled`
- `expired`

## Decisao sobre visibilidade por papel

Toda visibilidade deve vir de views/read models e RPCs. Nenhuma regra de visibilidade pode existir apenas no frontend.

### Admin

Pode ver e manter:

- produto;
- plano;
- status da subscription;
- features comerciais e entitlements;
- owners internos;
- trilha de auditoria sanitizada;
- referencias contratuais sanitizadas sem valor financeiro bruto.

Pode escrever apenas por RPC administrativa.

### Suporte

Pode ver:

- produto ativo;
- plano em label operacional;
- status operacional da subscription;
- features relevantes para atendimento;
- gaps backend-derived entre contratado e habilitado operacionalmente;
- owners internos de suporte/area quando necessario para roteamento.

Nao pode ver:

- preco;
- invoice;
- contrato bruto;
- audit bruto;
- divergencia financeira sensivel;
- ownership financeiro interno.

### CS

Pode ver:

- portfolio por cliente/produto;
- produto, plano, status e health operacional derivado;
- owners de conta e owners operacionais autorizados;
- riscos e proximas acoes comerciais/operacionais sanitizadas.

Nao deve substituir suporte nem financeiro. Escrita de CS deve aguardar workspace/contrato proprio.

### Financeiro

Pode ver:

- status financeiro operacional quando houver decisao futura;
- indicador de pendencia financeira sanitizado;
- relacao produto/plano/subscription necessaria para conciliacao operacional.

Fora deste V1-E:

- valores reais;
- invoice;
- cobranca;
- billing completo;
- integracao financeira.

### Engenharia

Pode ver:

- produto/modulo/feature associado a demanda tecnica quando autorizado;
- contexto tecnico necessario para work item;
- ownership tecnico por area.

Nao pode ver contrato comercial sensivel, preco, financeiro ou dados customer-facing alem do necessario para diagnostico.

### Customer-facing

Pode ver apenas se Produto aprovar a superficie:

- produto contratado;
- status customer-facing seguro;
- features autorizadas em linguagem operacional;
- limites nao sensiveis quando forem parte da experiencia do cliente.

Nao pode ver:

- ownership interno;
- audit;
- gaps internos;
- financeiro bruto;
- divergencias operacionais sensiveis;
- dados de outros tenants.

## Decisao sobre ownership de manutencao

Separar ownership por dominio:

- `product_area_ownerships`: area interna dona/apoiadora de produto, modulo ou feature.
- `customer_product_internal_owners`: responsaveis internos por subscription de um tenant.
- `tenant_memberships`: acesso customer/admin por tenant, nao ownership de subscription.
- `internal_area_memberships`: permissao individual por area, nao ownership comercial.

Papéis de owner sugeridos para subscription:

- `account_owner`: responsavel principal pela conta/subscription.
- `cs_owner`: responsavel por acompanhamento CS.
- `support_owner`: responsavel operacional de suporte.
- `technical_owner`: responsavel tecnico/engenharia quando aplicavel.
- `finance_owner`: responsavel por acompanhamento financeiro operacional, sem billing completo.
- `implementation_owner`: responsavel por implantacao/onboarding quando aplicavel.

Regra de manutencao:

- platform admin pode manter catalogo e subscriptions no primeiro corte.
- owners por dominio podem ser lidos e exibidos por views, mas permissao de escrita individual deve aguardar contrato explicito se nao for platform admin.
- ownership nao concede permissao sozinho; permissao continua em roles/memberships e RPCs.

## Relacao canonica entre entidades

```text
tenant
  -> customer_account_profile
       resumo operacional e compatibilidade
  -> customer_account_features
       habilitacao/override operacional por tenant
  -> customer_product_subscriptions
       product + plan + status + datas + metadata sanitizada
       -> commercial_products
       -> commercial_product_plans
       -> customer_product_feature_entitlements
            excecao/add-on/piloto/override comercial por feature
       -> customer_product_internal_owners
            responsaveis internos por subscription

commercial_products
  -> commercial_product_plans
  -> commercial_product_modules
  -> commercial_product_features
  -> commercial_plan_features
  -> product_area_ownerships
       ownership por area sobre produto/modulo/feature
```

Tickets podem referenciar contexto de produto via read model, mas ticket nao vira contrato comercial, backlog tecnico ou subscription.

## Fora de escopo

- Billing completo.
- Preco real.
- Invoice.
- Integracao financeira.
- UI Admin/CS/Financeiro/Suporte/Portal.
- Entitlement tecnico runtime para habilitar feature no produto.
- Migracao automatica de `customer_account_features`.
- Migracao automatica de `product_line`/`account_tier`.
- Portal customer-facing com plano/features sem decisao de exposicao especifica.
- Acoplamento direto com ticket ou backlog tecnico.

## Riscos aceitos

- O primeiro V1-E pode criar estrutura com poucos produtos/planos seedados para fixture local, sem representar todo portifolio comercial.
- `product_line` e `account_tier` podem conviver como resumo operacional ate existir lote de transicao.
- `customer_product_feature_entitlements` pode nascer minimalista para excecoes governadas, sem virar motor runtime de feature flags.
- Financeiro pode ficar restrito a status operacional no primeiro corte.

## Riscos bloqueadores

- Criar UI antes de views/RPCs.
- Expor plano/features customer-facing sem read model especifico e decisao de copy/visibilidade.
- Usar `customer_account_features` como contrato vendido.
- Misturar Knowledge entitlement com commercial entitlement.
- Conceder permissao por ownership sem membership/role.
- Permitir DML direto nas tabelas base por app.
- Criar subscription sem `tenant_id`, `product_id`, `plan_id`, RLS e auditoria.
- Migrar dados legados automaticamente sem decisao de transicao.

## Implicacoes para backend

O proximo lote backend deve criar somente a fundacao governada:

- tabelas de subscriptions e owners internos;
- entitlements comerciais apenas se modelados como excecao governada;
- views segmentadas por papel;
- RPCs admin-only;
- RLS/grants/audit;
- pgTAP cobrindo tenant boundary, grants, DML direto, `security_barrier`, `SECURITY DEFINER` e ausencia de dados sensiveis.

Backend continua source of truth para:

- status;
- visibilidade;
- relacao contratado versus habilitado;
- owners autorizados;
- tenant boundary.

## Implicacoes para frontend

Frontend continua fora do primeiro lote backend V1-E.

Quando houver UI futura:

- Admin consome views/RPCs de subscription.
- Support consome apenas contexto seguro.
- CS e Financeiro aguardam workspaces/contratos especificos.
- Portal customer-facing consome somente read model aprovado.
- UI nao calcula entitlement, plano, status ou visibilidade.

## Implicacoes para suporte, CS, financeiro e engenharia

Suporte:

- ganha contexto operacional seguro para atendimento;
- nao administra catalogo nem assinatura.

CS:

- ganha base futura para portfolio por produto;
- nao substitui suporte nem financeiro.

Financeiro:

- ganha base futura para status operacional financeiro;
- billing completo segue fora.

Engenharia:

- ganha contexto produto/modulo/feature para demandas autorizadas;
- nao recebe contrato comercial sensivel por padrao.

## Criterios de aceite para liberar migration/backend

Liberar OCP V1-E migration/backend quando o lote implementavel cumprir:

- After Sale tratado como produto/plataforma propria no catalogo.
- Multiproduto por tenant suportado.
- `customer_product_subscriptions` com `tenant_id`, `product_id`, `plan_id`, status, datas, metadata segura e auditoria.
- `customer_product_internal_owners` separado de memberships.
- `customer_product_feature_entitlements` criado apenas como excecao/add-on/piloto/override comercial governado.
- Read models admin/support-safe definidos.
- Portal, CS e Financeiro sem exposicao ate view especifica futura.
- Escrita apenas por RPC administrativa.
- RLS habilitada e grants sem DML direto para app.
- pgTAP cobrindo cross-tenant, grants, base tables, views e RPCs.
- Contratos TypeScript atualizados.
- Nenhum billing completo, UI, seed real, dado real, deploy remoto ou migration remota.
