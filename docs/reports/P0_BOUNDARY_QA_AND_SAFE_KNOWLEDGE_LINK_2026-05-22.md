# P0 Boundary QA And Safe Knowledge Link - 2026-05-22

## Sumario

O lote P0-B fechou a principal falha operacional encontrada na auditoria funcional: a copia/envio de link publico de Knowledge no Support Workspace agora depende de contrato backend-safe explicito, sem montagem de rota por slug no frontend e sem habilitar artigos `internal`, `restricted`, `draft`, `review`, `archived` ou sem `public_article_path`.

Nao houve publicacao automatica, redesign, nova feature editorial, bridge com Engineering nem alteracao de Internal Actions.

## Correcoes aplicadas

- `vw_support_knowledge_article_picker` passou a projetar:
  - `can_send_to_customer`
  - `reason_if_blocked`
  - `article_status`
  - `article_visibility`
  - `public_article_path`
- `vw_support_knowledge_public_link_candidates` passou a projetar os mesmos campos de decisao para candidatos publicos seguros.
- O frontend do Support Workspace agora so habilita copiar/enviar link quando:
  - `can_send_to_customer = true`
  - `is_customer_send_allowed = true`
  - `public_article_path` esta preenchido
  - `article_status = published`
  - `article_visibility = public`
- Quando o backend bloqueia, a UI usa `reason_if_blocked` como motivo operacional.
- A RPC `rpc_support_link_ticket_article` continua sendo o enforcement final para `sent_to_customer`.

## Cenarios cobertos por pgTAP

### Safe Knowledge Link

- Picker do suporte projeta `can_send_to_customer` e `reason_if_blocked`.
- Artigo `published/public` com `public_article_path` fica elegivel para envio ao cliente.
- Artigos `internal` e `restricted` ficam bloqueados no picker com motivo operacional.
- `vw_support_knowledge_public_link_candidates` lista somente artigos `published/public`.
- `sent_to_customer` continua bloqueando artigo `internal`.
- `sent_to_customer` continua bloqueando artigo `restricted`.
- Cross-tenant em referencia interna continua bloqueado.
- Portal future view de ticket knowledge links continua sem `note` interna.

### Public Help

Cobertura existente revalidada:

- `vw_public_knowledge_space_resolver`
- `vw_public_knowledge_navigation`
- `vw_public_knowledge_articles_list`
- `vw_public_knowledge_article_detail`
- `rpc_public_search_knowledge_articles`

Os testes existentes cobrem exposicao apenas de artigo publicado/publico, bloqueio de draft/internal/restricted e busca publica sem vazamento.

### Customer Portal

Cobertura existente revalidada:

- `vw_customer_portal_ticket_timeline` sem nota interna e sem eventos tecnicos internos.
- `vw_customer_portal_ticket_attachments` sem `storage_bucket`, `storage_object_path`, URL permanente ou signed URL persistida.
- `vw_customer_portal_knowledge_articles` e detalhe com entitlement backend-first.
- `rpc_customer_search_knowledge_articles` sem vazamento de draft/internal/restricted sem entitlement.
- `vw_customer_portal_active_tenant_context` e `rpc_customer_set_active_tenant` isolando tenant ativo.

### Engineering

Cobertura existente revalidada:

- Updates e retorno tecnico ficam no workspace de engenharia e no retorno estruturado para suporte.
- Suporte nao altera work item tecnico sem RPC apropriada.
- Portal nao recebe update tecnico interno na timeline customer-facing.

### Internal Actions

Cobertura existente revalidada:

- Criacao/retorno de internal action nao altera `ticket.status`.
- Fila por area exige membership.
- Usuario sem membership nao ve acionamento.
- Portal nao le `internal_actions`.
- Nao ha criacao automatica de `engineering_work_items`.

### Evidence

Cobertura existente revalidada:

- Bucket `ticket-evidence` privado.
- Upload customer-facing valida tipo e tamanho.
- Ticket fechado/cancelado bloqueia upload customer-facing.
- Cross-tenant bloqueado.
- Views customer-facing nao expõem bucket/path.
- Download usa grant curto por RPC/edge function.
- Timeline/audit nao persistem URL permanente.

## Cenarios cobertos por HTTP/browser smoke

Servidor local usado:

- `http://127.0.0.1:5173`

HTTP smoke:

- `/help/genius` -> `200`
- `/help/genius/articles` -> `200`
- `/portal` -> `200`
- `/portal/help` -> `200`
- `/portal/tickets` -> `200`
- `/support/tickets/00000000-0000-4000-8000-000000000000` -> `200`
- `/engineering` -> `200`
- `/internal-actions` -> `200`

Browser smoke:

- `/help/genius` carregou a Central Publica.
- `/portal` redirecionou para login quando sem sessao customer-facing valida.
- `/internal-actions` carregou rota interna com gate de autenticacao.

Observacao: o browser local registrou `Invalid Refresh Token: Refresh Token Not Found` ao abrir rotas privadas sem sessao valida. O comportamento esperado e redirecionamento para login; nao houve alteracao de auth neste lote.

## Boundaries confirmados

- Public Help permanece `published/public only`.
- Portal Cliente nao recebe notas internas, internal actions, engenharia interna, audit bruto, bucket, path ou URL persistente pelas views customer-facing.
- Tenant switching continua backend-governed e nao contamina Admin, Support ou Engineering.
- Evidence upload/download continua usando bucket privado e grants temporarios.
- Engineering return nao vira conversa direta com cliente.
- Internal Actions nao aparecem no Portal e nao mudam `ticket.status`.
- Artigo `internal` ou `restricted` nao vira link publico enviado ao cliente pelo Support Workspace.

## Validacoes executadas

- `supabase migration up --local` -> passou depois de preservar ordem de colunas das views existentes.
- `npm run contracts:typecheck` -> passou.
- `npm run web:typecheck` -> passou.
- `npm run web:build` -> passou.
- `npm run supabase:lint:db` -> passou.
- `npm run supabase:test:db` -> passou com `43` arquivos e `878` testes.

## Riscos restantes

- O smoke browser foi sem sessao autenticada valida; rotas privadas foram validadas quanto a carregamento/gate, nao quanto a jornada autenticada completa.
- A view `vw_support_knowledge_article_picker` ainda lista referencias internas autorizadas para uso interno; isso e intencional, mas qualquer novo botao customer-facing deve usar os campos `can_send_to_customer` e `reason_if_blocked`.
- Fases futuras que adicionarem nova UI de Knowledge no ticket precisam manter a mesma regra: sem concatenar rota publica no frontend.
