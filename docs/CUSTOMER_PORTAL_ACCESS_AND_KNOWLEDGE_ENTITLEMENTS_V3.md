# Customer Portal Access And Knowledge Entitlements V3

## Objetivo
Fechar o controle de acesso do portal cliente B2B a artigos da Knowledge Base com boundary clara entre conteúdo público, autenticado por tenant e vínculo específico de ticket, sem expor draft, internal, advisory editorial ou operação interna.

## Auditoria inicial

### Reaproveitado
- `knowledge_articles`, `knowledge_article_revisions`, `knowledge_spaces` e o gate editorial já endurecido da Knowledge.
- Read models públicos:
  - `vw_public_knowledge_space_resolver`
  - `vw_public_knowledge_navigation`
  - `vw_public_knowledge_articles_list`
  - `vw_public_knowledge_article_detail`
- Read models administrativos:
  - `vw_admin_knowledge_articles_list_v2`
  - `vw_admin_knowledge_article_detail_v2`
- Vínculo seguro ticket -> artigo já existente por `ticket_knowledge_links`.
- Boundary customer-facing e auth context do portal já existentes.

### Faltava
- Modelo explícito de entitlement autenticado por tenant/artigo.
- Read models customer-facing para artigo autorizado fora do Help público.
- Read model próprio para artigos ligados a ticket permitido.
- RPC administrativa mínima para conceder/revogar entitlement e materializar vínculo ticket-artigo customer-facing sem depender do frontend.

### Risco encontrado
- Duplicar a camada pública da Knowledge dentro do portal ou deixar o frontend decidir visibilidade de artigo restrito.
- Expor artigos `restricted` sem entitlement explícito ou usar vínculo de ticket como atalho para publicar conteúdo.

## Decisão de modelagem

### Entitlement model
- Tabela: `knowledge_article_entitlements`
- Escopos suportados:
  - `tenant`
  - `customer_portal`
  - `ticket_linked`
- `public` não é concedido por entitlement; continua sendo derivado do gate editorial público.

### Regras
- Artigo autenticado só entra no portal se já estiver `published`.
- Artigo `internal` não recebe entitlement customer-facing.
- Artigo `restricted` exige grant explícito ou vínculo seguro de ticket.
- Entitlement não muda `visibility`, não publica artigo e não substitui revisão editorial.
- Arquivamento é lógico; não há delete físico.

## Contratos finais

### Views
- `vw_customer_portal_knowledge_articles`
  - lista artigos autorizados do tenant nas origens `public`, `customer_portal` e `ticket_linked`
- `vw_customer_portal_knowledge_article_detail`
  - expõe corpo do artigo somente quando ele já passou pela boundary customer-facing
- `vw_customer_portal_ticket_knowledge_links`
  - lista apenas artigos vinculados ao ticket permitido para o cliente autenticado

### Campos expostos
- `article_id`
- `slug`
- `title`
- `summary`
- `category_name`
- `published_at`
- `updated_at`
- `relation_reason`
- `source`
- `source_label`
- `body_md` apenas no detalhe autorizado

### Campos bloqueados
- `draft body`
- notas internas
- advisory/review editorial
- checklist humano
- metadata bruta
- motivo interno de visibilidade
- autor interno não seguro
- payload de engenharia
- audit bruto

### RPCs administrativas mínimas
- `rpc_admin_grant_knowledge_article_entitlement`
- `rpc_admin_archive_knowledge_article_entitlement`
- `rpc_admin_link_knowledge_article_to_ticket`
- `rpc_admin_unlink_knowledge_article_from_ticket`

Regras:
- exigem `tenant_id` explícito;
- validam artigo/ticket existentes;
- bloqueiam `draft` e `internal`;
- exigem auditoria;
- falham em transições inválidas;
- não habilitam UI administrativa fake por si só.

## Boundary público vs autenticado

### Help público
- Continua em `/help/genius` e rotas filhas.
- Lê apenas `vw_public_knowledge_*`.
- Não depende de sessão customer-facing.
- Continua limitado a conteúdo `published` + `public`.

### Portal autenticado
- Ganha `/portal/help` e `/portal/help/:articleSlug`.
- Lê apenas `vw_customer_portal_knowledge_*`.
- Pode ver:
  - artigo público publicado
  - artigo autenticado com entitlement ativo
  - artigo vinculado a ticket permitido
- Não pode ver:
  - draft
  - internal
  - restricted sem entitlement
  - advisory/review interno
  - playbook operacional interno

## Frontend
- `/portal` agora resume a Central autorizada.
- `/portal/help` lista apenas artigos autorizados.
- `/portal/help/:articleSlug` renderiza detalhe autenticado com markdown seguro.
- `/portal/tickets/:ticketId` mostra apenas artigos relacionados permitidos ao mesmo ator.
- Não foi criada busca customer-facing sem contrato.
- Não foi criada recomendação IA, personalização local ou dashboard fake.

## Testes e fixture
- Novo pgTAP: `supabase/tests/031_customer_portal_access_and_knowledge_entitlements.sql`
- Fixture QA agora inclui:
  - artigo público
  - artigo `customer_portal`
  - artigo `ticket_linked`
  - artigo `internal` bloqueado
  - artigo `draft` bloqueado
  - customer com entitlement
  - customer sem entitlement
  - ticket com artigo relacionado

## Ações habilitadas
- Ler artigo público no Help público.
- Ler artigo autorizado no portal autenticado.
- Ler artigo restrito vinculado a ticket permitido.
- Conceder entitlement por RPC administrativa.
- Arquivar entitlement por RPC administrativa.
- Vincular e desvincular artigo de ticket por RPC administrativa.

## Ações bloqueadas
- Publicar artigo automaticamente.
- Aprovar artigo automaticamente.
- Expor draft/internal sem gate.
- Expor `restricted` sem entitlement.
- Criar busca customer-facing sem contrato.
- Criar recomendação IA.
- Criar UI administrativa complexa de entitlement neste lote.

## Riscos restantes
- O portal ainda assume o primeiro tenant do contexto; falta tenant switcher customer-facing.
- A operação administrativa de entitlement existe no backend, mas ainda sem UI própria.
- Search/navigation mais rica do portal continua dependente de contrato dedicado.
- Os 8 candidatos documentais seguem fora da superfície publicada/autenticada.

## Próximo lote recomendado
`Customer Portal Access Administration V3`

Foco:
- convite/revogação customer-facing por tenant;
- boundary auditável de `customer_manager`;
- gestão segura de contatos/usuários do portal sem auth paralela.
