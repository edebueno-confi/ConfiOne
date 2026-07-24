# Data Model and Tenancy

## Princípio auditado

Os documentos canônicos exigem backend como fonte da verdade, dados operacionais com `tenant_id` ou escopo equivalente, RLS e auditoria.

## Indicadores estruturais

Nas migrations foram encontrados, de forma aproximada:

- 104 ocorrências de `create table`.
- 189 views.
- 365 functions/RPCs.
- 156 policies.
- 103 habilitações de RLS.

## Entidades recorrentes

- `tenants`
- `profiles`
- `tenant_memberships`
- `tenant_contacts`
- `tickets`
- `ticket_messages`
- `ticket_events`
- `knowledge_articles`
- `knowledge_categories`
- `hubspot_companies`
- `hubspot_deals`
- `hubspot_tickets`
- tabelas de analytics e OMIE
- estruturas recentes de carteira CS

## Ambiguidade de tenancy

Ainda precisa decisão formal sobre:

- diferença entre Genius, After Sale, empresa cliente, tenant e workspace;
- relação entre grupo econômico, entidade legal e empresa HubSpot;
- quando um cliente B2B é tenant operacional versus registro de empresa;
- como negócios e tickets se vinculam a entidades legais e grupos.

## Risco

Sem essa decisão, telas de cliente/conta/carteira podem parecer corretas visualmente, mas representar incorretamente ownership e responsabilidades.
