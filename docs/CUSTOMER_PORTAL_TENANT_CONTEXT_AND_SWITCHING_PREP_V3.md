# Customer Portal Tenant Context And Switching Prep V3

## Status
Este documento de preparacao foi consumido pela implementacao do lote `Customer Portal Tenant Context And Switching V3`. O estado final do contrato ativo esta registrado em `docs/CUSTOMER_PORTAL_TENANT_CONTEXT_AND_SWITCHING_V3.md`.

## Objetivo
Preparar com seguranca o proximo lote de tenant context e switching do Portal Cliente B2B, sem implementar switcher fake no frontend e sem contaminar o contexto administrativo.

## Estado de partida
- O portal customer-facing ja possui contratos reais para tickets, colaboracao, evidencias seguras e Knowledge autorizada.
- O Admin Console agora possui `/admin/customer-portal` estavel apos a correcao da regressao de loading persistente.
- A sessao Supabase do browser e unica, mas os gates e contratos de cada superficie continuam separados:
  - Admin: `vw_admin_auth_context`
  - Portal cliente: `vw_customer_portal_auth_context`

## Cenario que motiva o lote
Hoje o portal assume implicitamente o primeiro contexto customer-facing retornado para a sessao autenticada. Isso nao escala para o ator que possui:
- mais de um tenant valido;
- mais de um papel customer-facing;
- ticket e Knowledge autorizada em tenants diferentes.

Sem um `active_tenant_id` governado pelo backend, o frontend acabaria:
- escolhendo tenant por heuristica local;
- misturando dados de contexts diferentes;
- criando risco de cross-tenant por cache ou navegacao.

## Regras obrigatorias
- Nao criar auth paralela.
- Nao duplicar tenancy.
- Nao decidir tenant ativo apenas no frontend.
- Nao inferir permissao a partir do ultimo tenant visitado.
- Todo switch precisa revalidar membership customer-facing ativo.
- O contexto administrativo nao pode depender do tenant ativo do portal.

## Boundary de sessao

### Admin
- Continua autenticando com a mesma sessao Supabase do browser.
- Continua resolvendo autorizacao apenas por `vw_admin_auth_context`.
- Nao deve ler nem persistir `active_tenant_id` customer-facing para liberar tela admin.

### Customer-facing
- Continua autenticando com a mesma sessao Supabase do browser.
- Precisa passar a resolver:
  - tenants disponiveis para o usuario;
  - tenant ativo;
  - papel customer-facing naquele tenant;
  - contatos/tickets/Knowledge autorizados apenas para o tenant ativo.

## Contratos que precisam evoluir

### Leituras novas ou endurecidas
- `vw_customer_portal_available_tenants`
  - lista segura dos tenants acessiveis pela sessao customer-facing
  - inclui `tenant_id`, `tenant_slug`, `tenant_display_name`, `portal_role`, flags minimas de uso
- `vw_customer_portal_active_context`
  - resolve o tenant ativo efetivo da sessao/usuario
  - retorna vazio quando nao existir selecao valida

### Leituras existentes que nao devem continuar ambíguas
- `vw_customer_portal_profile_context`
- `vw_customer_portal_ticket_list`
- `vw_customer_portal_ticket_detail`
- `vw_customer_portal_ticket_timeline`
- `vw_customer_portal_ticket_attachments`
- `vw_customer_portal_ticket_collaboration_state`
- `vw_customer_portal_knowledge_articles`
- `vw_customer_portal_knowledge_article_detail`
- `vw_customer_portal_ticket_knowledge_links`

Esses contratos precisam aceitar `active_tenant_id` explicito no backend ou resolver o tenant ativo por uma fonte backend-governed.

### RPCs provaveis
- `rpc_customer_set_active_tenant`
  - valida ator autenticado
  - valida membership ativa no tenant alvo
  - registra a selecao de tenant ativo
  - nao permite escolher tenant fora do proprio escopo
- `rpc_customer_clear_active_tenant`, se a UX precisar reset explicito

## Onde persistir o tenant ativo
Recomendacao segura:
- persistir por backend em entidade propria de contexto customer-facing, nunca so em `localStorage`.

Opcoes aceitaveis para o lote seguinte:
1. tabela de preferencia por usuario customer-facing
2. contexto de sessao customer-facing governado por RPC

Em ambos os casos:
- `tenant_id` deve ser revalidado contra `tenant_memberships` ativos;
- a persistencia deve ser ignorada automaticamente quando o vinculo for revogado;
- a leitura deve continuar tenant-aware e customer-safe.

## Riscos de cross-tenant
- usar o primeiro contexto retornado e navegar manualmente para outro ticket;
- reaproveitar caches de Knowledge/tickets de um tenant depois do switch;
- permitir `ticket_id` de um tenant antigo com `active_tenant_id` novo;
- espelhar `active_tenant_id` em superficie admin ou support sem necessidade.

## Ordem recomendada de implementacao
1. Criar read model de tenants customer-facing disponiveis.
2. Criar contrato backend para definir e ler `active_tenant_id`.
3. Atualizar RPCs/read models customer-facing mais sensiveis para tenant explicito.
4. Ajustar `/portal`, `/portal/help` e `/portal/tickets/:ticketId` para reagir ao tenant ativo real.
5. Cobrir regressao browser:
   - customer com um tenant
   - customer com multiplos tenants
   - customer revogado
   - troca customer -> admin
   - troca admin -> customer

## O que nao entra neste lote preparatorio
- switcher visual final
- tenant switcher funcionando apenas por estado local
- qualquer atalho que limpe storage manualmente como solucao de produto
- ampliar acesso do cliente a contexto interno, engenharia ou audit bruto

## Dependencia desbloqueada
- `/admin/customer-portal` agora pode ser usado como base de governanca e regressao antes do lote de switching, porque o bootstrap deixou de entrar em loop apos troca de sessao.
