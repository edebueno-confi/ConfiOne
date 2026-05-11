# ROADMAP_BUILDOUT_V3.md

## Objetivo
Consolidar a virada de foco do Genius Support OS: pausar a curadoria editorial refinada da Knowledge Base e priorizar a construcao funcional da plataforma interna CX B2B tecnica.

Este documento organiza o estado atual do produto, as lacunas reais por dominio, os quick wins seguros e o backlog faseado para evoluir Knowledge, Tickets, Clientes e Central Publica sem criar feature falsa e sem mover regra de negocio para o frontend.

## Premissas vigentes
- Genius Support OS e plataforma interna CX B2B tecnica.
- Nao e SAC B2C, CRM generico ou dashboard generico.
- Backend e source of truth.
- Frontend nao inventa regra de negocio.
- Sem mocks quando houver contrato real.
- Views e RPCs devem ser usados quando aplicavel.
- RLS, permissoes e auditoria entram desde o inicio.
- IA nao e source of truth.
- UI nao deve expor termo tecnico cru quando houver linguagem operacional melhor.
- Funcionalidade indisponivel deve ser declarada como indisponivel, nao simulada.
- `docs/design/blueprint/Conversas.png` permanece fora de escopo ate decisao explicita.

## Mudanca de foco
A trilha de curadoria refinada da Knowledge Base fica pausada. Os 8 artigos candidatos permanecem como corpus/documentacao inicial, sem necessidade de nova validacao humana neste momento. O foco atual passa a ser buildout funcional da plataforma: telas, contratos, fluxos operacionais, navegacao, estados e continuidade diaria entre suporte, clientes, Knowledge e Central Publica.

## Auditoria de rotas

| Rota | Estado | Contratos atuais | Lacuna principal | Risco arquitetural |
| --- | --- | --- | --- | --- |
| `/login` | pronta | Auth Supabase e bootstrap de contexto | consolidar UX de erro por ambiente quando necessario | baixo |
| `/access-denied` | pronta | gate de auth/roles | manter copy operacional e caminhos de retorno | baixo |
| `/admin/tenants` | visual pronta, funcional parcial | `vw_admin_tenants_list`, `vw_admin_tenant_detail`, `vw_admin_tenant_memberships`, RPCs de tenant/membro/contato | falta operar ciclo completo de cliente B2B com historico e governanca de contato | medio |
| `/admin/knowledge` | visual pronta, funcional parcial | `vw_admin_knowledge_*`, `vw_admin_knowledge_*_v2`, RPCs admin de Knowledge, advisories | falta fluxo operacional de publicacao governada, backlog de revisao e importacao controlada do corpus | alto |
| `/admin/access` | funcional parcial com hardening operacional | `vw_admin_access_users`, `vw_admin_access_user_detail`, `vw_admin_access_memberships`, RPCs de membership endurecidas | falta convite formal, reset de senha e motivo obrigatorio por mutacao se Produto exigir | medio |
| `/admin/system` | funcional parcial com observabilidade segura | `vw_admin_system_audit_events`, `vw_admin_system_health_checks`, `vw_admin_system_operational_summary` | falta observabilidade externa real e incident hints de fontes alem do banco local | medio |
| `/support/queue` | funcional com governanca operacional parcial | `vw_support_tickets_queue`, `vw_support_customer_360`, `vw_support_assignable_agents`, `vw_support_ticket_classification_options`, `vw_support_ticket_sla_context`, `rpc_create_ticket` | falta usabilidade final da operacao, calculo de SLA por horario util completo e automacao de breach se Produto decidir | medio |
| `/support/tickets/:ticketId` | funcional com contratos operacionais reais | `vw_support_ticket_detail`, `vw_support_ticket_timeline_recent`, `rpc_support_get_ticket_timeline`, `vw_support_customer_account_context`, RPCs de status/classificacao/prioridade/SLA, anexos, handoff e mensagens | falta arquivamento de evidencia, pausa de SLA e notificacao externa se Produto decidir | medio |
| `/support/customers` | visual pronta, funcional parcial | `vw_support_customer_360`, `vw_support_customer_account_context` | falta busca/filtros operacionais persistidos e criacao/edicao governada de perfil de conta | medio |
| `/support/customers/:tenantId` | visual pronta, funcional parcial | `vw_support_customer_360`, `vw_support_customer_account_context`, `vw_support_customer_recent_tickets`, `vw_support_customer_recent_events` | falta historico completo, saude operacional versionada e gestao de contatos/integracoes | alto |
| `/help/genius` | pronta para leitura publicada | `vw_public_knowledge_space_resolver`, `vw_public_knowledge_navigation`, `vw_public_knowledge_articles_list`, `rpc_public_search_knowledge_articles` | depende de artigos publicados reais; candidatos atuais continuam internos | medio |
| `/help/genius/articles` | pronta para lista publicada | `vw_public_knowledge_articles_list`, navegacao publica | busca local de lista existe; busca RPC fica na home | baixo |
| `/help/genius/articles/:slug` | pronta para artigo publicado | `vw_public_knowledge_article_detail` | precisa garantir estados de slug ausente e links relacionados sem vazar conteudo interno | medio |
| `/portal` | funcional customer-facing com Knowledge autorizada | `vw_customer_portal_profile_context`, `vw_customer_portal_ticket_list`, `vw_customer_portal_knowledge_articles` | ainda nao e portal completo; sem SLA publico, IA, Omni Inbox ou admin customer-facing | medio |
| `/portal/help` | funcional customer-facing autenticada | `vw_customer_portal_knowledge_articles` | falta busca contratual, switch de tenant e administracao customer-facing de entitlement | medio |
| `/portal/help/:articleSlug` | funcional customer-facing autenticada | `vw_customer_portal_knowledge_article_detail` | falta navegacao contextual por tenant ativo sem depender do primeiro contexto carregado | medio |
| `/portal/tickets` | funcional customer-facing | `vw_customer_portal_ticket_list`, `rpc_customer_create_ticket` | criacao minima de ticket sem categoria/SLA manual; administracao customer-facing de usuarios fica para lote futuro | medio |
| `/portal/tickets/:ticketId` | funcional customer-facing com colaboracao, evidencias e Knowledge autorizada | `vw_customer_portal_ticket_detail`, `vw_customer_portal_ticket_timeline`, `vw_customer_portal_ticket_attachments`, `vw_customer_portal_ticket_collaboration_state`, `vw_customer_portal_ticket_knowledge_links`, RPCs customer | falta preferencia de notificacao e regra temporal objetiva de reabertura | medio |

## Lacunas por dominio

### Admin

| Lacuna | Tipo | Observacao |
| --- | --- | --- |
| Operar tenants/clientes B2B como conta operacional completa | precisa contrato de leitura, RPC/mutacao, RLS/policy e auditoria | tenant existe, mas perfil operacional ainda depende de consolidacao entre Admin e Support |
| Concessao/revogacao de acesso com evidencia operacional | parcialmente entregue; falta decisao de produto sobre motivo obrigatorio | RPCs de membership foram endurecidas e auditadas; convite formal/reset de senha continuam fora do corte |
| Governance de Knowledge alem do CRUD | precisa contrato de leitura, RPC/mutacao e documentacao | falta fila de revisao real, pendencias, bloqueios e publicacao segura |
| System/audit/observability acionavel | parcialmente entregue; falta observabilidade externa real | System agora consome audit feed sanitizado, health checks reais/indisponiveis e summary operacional sem payload bruto |

### Support

| Lacuna | Tipo | Observacao |
| --- | --- | --- |
| Criacao de ticket pelo suporte | contrato backend existe; falta UI/fluxo de entrada | `rpc_create_ticket` foi validada como contrato real, mas a superficie operacional de criacao ainda precisa lote proprio |
| Conversa com anexos e eventos completos | parcial; anexos ainda precisam migration/schema/RPC | timeline recente e historico paginado existem; anexos continuam fora deste lote |
| Notas internas com governanca de visibilidade | implementado no contrato atual; manter testes e copy | RPC e eventos/audit logs foram validados no fluxo operacional |
| Status/responsavel com SLA e motivo | implementado para MVP interno | status, categoria, motivo e SLA interno passam por read models/RPCs reais; politica por tenant foi materializada, pausa/calendario util completo e automacao seguem pendentes |
| Central de ajuda dentro do ticket com link publico seguro | contrato de leitura criado; falta acao governada de envio/copia | `vw_support_knowledge_public_link_candidates` retorna apenas artigos publicos publicados com rota segura |
| Handoff tecnico/engenharia | depende de decisao de produto e schema futuro | nao deve virar campo livre sem regra de ownership |

### Customers

| Lacuna | Tipo | Observacao |
| --- | --- | --- |
| Perfil operacional B2B editavel | precisa RPC/mutacao, RLS/policy e auditoria | admin tem RPCs de profile; falta fluxo de uso consolidado |
| Contatos da conta com ownership claro | precisa RPC/mutacao e auditoria | contato operacional aparece, mas gestao completa precisa trilha governada |
| Saude operacional versionada | precisa schema/view e decisao de produto | hoje e leitura agregada, nao score canonico aprovado |
| Tickets vinculados e historico profundo | precisa contrato de leitura | janelas recentes existem; historico completo deve ser paginado e protegido |
| Migracao futura | depende de decisao de produto | mostrar status sem transformar em promessa operacional indevida |

### Public Help

| Lacuna | Tipo | Observacao |
| --- | --- | --- |
| Publicacao real dos 8 candidatos | depende de decisao de produto e validacao humana futura | pausa vigente: nao publicar agora |
| Busca publica consistente entre home e lista | precisa avaliacao UI/contrato | home usa RPC; lista filtra client-side o conjunto carregado |
| Categorias publicas finais | depende de decisao de produto | nao criar subcategoria no banco sem lote explicito |
| Estados publicos de conteudo ausente | apenas UI/testes | ja existem estados, mas devem ser testados em rotas reais |

## Quick wins seguros identificados

| Item | Status | Acao |
| --- | --- | --- |
| Remover contadores estaticos da navegacao do Support Workspace | implementado | retirados badges fixos `8` e `12` de Fila/Tickets por nao virem de contrato backend |
| Manter estados `Indisponivel` para contratos ausentes | preservado | sem fallback falso |
| Nao transformar Knowledge candidata em publicacao | preservado | candidatos continuam como corpus/documentacao |
| Nao criar rota nova sem contrato | preservado | roadmap documenta lacunas antes de schema/RPC |

## Backlog faseado

### Fase A: saneamento de navegacao, estados e shell
- Objetivo: garantir que o usuario interno sempre saiba onde esta, o que esta carregando e o que esta indisponivel.
- Entregaveis: App Shell revisado, navegacao por permissao, estados vazios/erro/loading consistentes, links internos auditados, remocao de qualquer numero ou acao sem contrato.
- Contratos necessarios: nenhum novo para o saneamento inicial; futura view de contadores de navegacao pode ser criada se os badges voltarem.
- Riscos: esconder lacuna real com copy bonita; misturar Admin Shell e Support Shell sem decisao.
- Dependencias: inventario de rotas e permissao atual.
- Criterios de aceite: nenhuma rota principal quebra, nenhuma acao sem contrato aparece como executavel, estados indisponiveis explicam limite real.
- Testes esperados: `npm run web:typecheck`, `npm run web:build`, navegacao manual nas rotas principais.

### Fase B: fluxos reais de ticket
- Objetivo: transformar o ticket workspace em superficie diaria de atendimento B2B.
- Entregaveis: criacao de ticket, conversa completa, nota interna, status/responsavel, fechamento/reabertura, Knowledge vinculada e handoff tecnico registrado.
- Status Fase 8.2: `rpc_create_ticket`, mutacoes principais, audit trail, eventos, timeline paginada e candidato seguro de link publico foram validados/materializados.
- Status Fase 8.6: `/support/queue` passou a abrir tickets por intake real com `vw_support_ticket_intake_tenants`, `vw_support_ticket_intake_contacts` e `rpc_create_ticket`, sem criar categoria inicial fake nem leitura direta de tabela-base.
- Status Fase 8.7: `/support/tickets/:ticketId` passou a ler anexos por metadata sanitizada (`vw_support_ticket_attachments`) e a registrar handoff tecnico real por `rpc_support_create_engineering_work_item_from_ticket`, com `engineering_work_items`, `engineering_ticket_links`, `ticket_event` e `audit_log`.
- Status Fase 8.8: `/engineering` e `/engineering/work-items/:workItemId` foram criadas como superficie propria para operar `engineering_work_items`, com fila, detalhe, ownership, status tecnico, updates estruturados e retorno ao suporte por contrato real.
- Status Fase 8.9: `/support/tickets/:ticketId` passou a enviar evidencias reais com bucket privado `ticket-evidence`, policies por tenant/ticket, intent de upload, metadata sanitizada e download temporario curto sem expor `storage_bucket` nem `storage_object_path` ao frontend.
- Status Fase 8.10: classificacao operacional, motivos, prioridade/severidade, SLA interno e transicoes de status foram formalizados com `ticket_categories`, `ticket_operational_reasons`, `ticket_sla_policies`, read models e RPCs conectados ao intake/fila/workspace.
- Status Fase 8.11: politicas de SLA por tenant, calendario de negocio MVP, fallback global seguro, recalculo backend e sinais internos de SLA foram materializados sem timer fake ou promessa publica.
- Status Fase 8.12: a usabilidade operacional do suporte foi consolidada com ajuste conservador de copy tecnica visivel, preservando contratos, thread, composer, anexos, SLA, handoff e customer context.
- Status Fase 8.13: o blueprint de readiness do portal cliente B2B foi criado sem implementar UI, auth paralela ou contratos fake.
- Status Fase 8.14: o checkpoint geral de buildout consolidou pronto/parcial/bloqueado e os proximos blocos grandes sem implementar produto novo.
- Status Fase 8.15: a foundation contratual customer-facing foi criada com `customer_user`/`customer_manager`, views `vw_customer_portal_*`, RPCs `rpc_customer_*`, rotas `/portal`, `/portal/tickets` e `/portal/tickets/:ticketId`, sem expor audit, engenharia, SLA interno, drafts, storage path ou Knowledge interna.
- Status Fase 8.16: o upload customer-facing seguro de evidencias foi fechado no portal, reaproveitando o bucket privado `ticket-evidence` com policies customer, intents/RPCs proprias, edge function com `boundary=customer`, metadata sanitizada e visibilidade no Support Workspace sem path leak.
- Status Fase 8.17: a colaboracao customer-facing do portal foi consolidada com ack, resposta, confirmacao de resolucao e reabertura governada, sem expor operacao interna.
- Status Fase 8.18: a camada de entitlement de Knowledge autenticada foi materializada com `knowledge_article_entitlements`, views `vw_customer_portal_knowledge_*`, RPCs administrativas minimas e rotas `/portal/help` + `/portal/help/:articleSlug`, mantendo o Help publico independente de sessao customer.
- Contratos ainda necessarios: calculo por horario util completo; pausa objetiva de SLA; automacao/notificacao de SLA se Produto decidir; arquivamento seguro de evidencia.
- Riscos: expor nota interna ao cliente, criar transicao invalida de status, enviar artigo sem URL publica segura.
- Dependencias: RLS de ticketing, auditoria de eventos e regra de permissao por role.
- Criterios de aceite: todo comando passa por RPC, toda mutacao gera evento/audit trail, frontend nao monta URL publica por heuristica.
- Testes esperados: typecheck, build, testes de RPC/RLS, testes de fluxo support ticket.

### Fase C: Customer Account Profile operacional
- Objetivo: consolidar a conta B2B como contexto operacional vivo para Suporte e CS.
- Entregaveis: perfil operacional editavel, contatos, integracoes, customizacoes, alertas, saude operacional e tickets vinculados.
- Status Fase 8.3: core operacional materializado e conectado ao suporte com `vw_support_customer_account_context`, `vw_admin_customer_account_profiles`, RPC administrativa dedicada para feature flag, fixture QA com cliente sem perfil e estados `Indisponivel` preservados no frontend.
- Contratos necessarios: usar `vw_support_customer_account_context`, `vw_admin_customer_account_profiles` e RPCs admin existentes; criar historico paginado se necessario.
- Riscos: score de saude sem definicao, exposicao de integracao sensivel, edicao sem auditoria.
- Dependencias: decisao de ownership entre Admin, Suporte e CS.
- Criterios de aceite: toda alteracao sensivel tem motivo, ator e audit log; dados tecnicos sensiveis nao aparecem crus.
- Testes esperados: typecheck, build, testes de RLS/admin RPC e smoke de customer profile.

### Fase D: Knowledge Admin funcional
- Objetivo: sair de corpus documentado para operacao real de Knowledge governada.
- Entregaveis: fila de revisao, status editorial, bloqueios, publicacao governada, relacionamento com tickets e lacunas de documentacao.
- Status Fase 8.4: publicacao publica v2 endurecida no backend com gate de evidencia humana revisada e checklist humano completo; Public Help segue limitado a artigos publicos publicados; os 8 candidatos documentais seguem fora da base publica.
- Contratos necessarios: views v2 de Knowledge, RPCs v2, advisories e ticket knowledge links.
- Contratos ainda necessarios: UI especifica para coletar evidencia humana dos candidatos documentais; acao governada de envio/copia de artigo ao cliente; consolidacao editorial avancada se produto decidir operar deduplicacao.
- Riscos: publicar candidato sem aprovacao, misturar interno/publico, IA virar fonte de verdade.
- Dependencias: governanca de conteudo e definicao de papeis Produto/Suporte.
- Criterios de aceite: artigo publico so aparece apos status publicado no backend; rascunho e interno nunca vazam para Public Help.
- Testes esperados: typecheck, build, testes de publish/archive e RLS de Knowledge.

### Fase E: Public Help funcional
- Objetivo: entregar Central Publica utilizavel quando houver conteudo publicado real.
- Entregaveis: home, lista, busca, artigo, relacionados, estados de vazio/erro e canais oficiais.
- Contratos necessarios: contratos publicos atuais e eventual refinamento de busca/lista.
- Riscos: prometer atendimento publico, publicar material interno, listar categoria sem artigo.
- Dependencias: Knowledge Admin publicar conteudo real.
- Criterios de aceite: somente conteudo publicado aparece; busca nao retorna interno/restrito; slugs ausentes recebem estado seguro.
- Testes esperados: typecheck, build, smoke de `/help/genius`, `/articles` e artigo publicado.

### Fase F: Access/System hardening
- Objetivo: fechar governanca de acesso, auditoria e observabilidade operacional.
- Entregaveis: gestao de roles/memberships, auditoria navegavel, eventos de sistema, health operacional e trilhas de seguranca.
- Status: `Access System Observability Hardening V3` materializou `vw_admin_access_users`, `vw_admin_access_user_detail`, `vw_admin_access_memberships`, `vw_admin_system_audit_events`, `vw_admin_system_health_checks` e `vw_admin_system_operational_summary`; `/admin/access` e `/admin/system` passaram a consumir contratos reais e o audit feed de System deixou de expor payload bruto.
- Contratos necessarios: views de auth context, audit feed, user lookup e RPCs de membership; possivel view de health operacional.
- Riscos: escalacao indevida de role, exposicao de logs/secrets, falso senso de observabilidade.
- Dependencias: politica de acesso por papel e taxonomia de eventos.
- Criterios de aceite: nenhuma mutacao administrativa sem audit log; nenhum segredo ou token na UI.
- Testes esperados: typecheck, build, testes RLS/admin e auditoria.

### Fase G: Omni Work futuro
- Objetivo: registrar a direcao futura sem construir agora.
- Entregaveis: apenas nota arquitetural para unificar trabalho de suporte, CS, engenharia e Knowledge em superficie operacional unica.
- Contratos necessarios: nenhum neste momento.
- Riscos: virar dashboard generico ou CRM se implementado cedo demais.
- Dependencias: fases B-F estabilizadas.
- Criterios de aceite: nao iniciar implementacao antes de tickets, clientes, knowledge e access estarem funcionais.
- Testes esperados: nenhum neste momento.

## Proximo lote tecnico recomendado

### Lote: Customer Portal Access Administration V3

Objetivo: fechar a administracao customer-facing do proprio tenant, com convite/revogacao governados para `customer_user` e `customer_manager`, sem auth paralela, sem bypass de roles internas e sem frontend decidir ownership.

Ordem sugerida:
1. Auditar `tenant_memberships`, `tenant_contacts`, `vw_customer_portal_auth_context` e RPCs administrativas existentes reaproveitaveis.
2. Definir boundary exata do `customer_manager` para convidar, revogar e acompanhar usuarios do proprio tenant.
3. Criar read models customer-facing de usuarios/contatos autorizados sem expor dados internos ou cross-tenant.
4. Criar RPCs customer-facing minimas de convite/revogacao/reativacao com `audit_log`.
5. Conectar o portal sem UI fake de IAM e cobrir cross-tenant, autopromocao e usuario revogado.

### Lote alternativo: Omni Inbox Thread Foundation V3

Objetivo: criar a fundacao de threads/canais externos sem implementar WhatsApp, email real ou IA.

Ordem sugerida:
1. Modelar thread separada de ticket.
2. Criar vinculo ticket-thread.
3. Criar ingestao sanitizada por RPC/worker.
4. Garantir RLS, audit e payload bruto isolado.
5. Expor apenas read models operacionais seguros.
4. Reutilizar governanca de evidencias com grant curto e sem path sensivel.
5. Validar que notas internas, engenharia, audit logs e perfil operacional sensivel nunca aparecem ao cliente.

Migrations necessarias:
- sim, se houver roles/customer memberships ou views/RPCs customer-facing.

Views/RPCs necessarias:
- `vw_customer_portal_tickets`
- `vw_customer_portal_ticket_detail`
- `vw_customer_portal_ticket_timeline`
- RPCs `rpc_customer_portal_*` apenas para acoes explicitamente aprovadas.

RLS/policies:
- cliente B2B so ve o proprio tenant; cross-tenant deve ser bloqueado em testes.

Audit logs:
- toda abertura, mensagem e anexo do cliente deve gerar audit trail seguro.

Fixtures/testes:
- usuario cliente autorizado
- usuario cliente sem acesso
- tenant com tickets e tenant sem tickets
- anexos autorizados e bloqueados
- ausencia de notas internas/handoff/audit log no portal

Impacto no front:
- concluido em `/admin/customer-portal`, sem shell novo e com regressao segura no portal.

Status:
- concluido em `2026-05-10`
- rota administrativa criada: `/admin/customer-portal`
- contratos administrativos:
  - `vw_admin_customer_portal_access_overview`
  - `vw_admin_customer_portal_tenant_access`
  - `vw_admin_customer_portal_users`
  - `vw_admin_customer_portal_user_detail`
  - `vw_admin_knowledge_entitlements`
  - `vw_admin_knowledge_entitlement_detail`
  - `vw_admin_ticket_knowledge_links`
  - `vw_admin_customer_portal_article_candidates`
  - `vw_admin_customer_portal_ticket_candidates`
- mutacoes reaproveitadas:
  - `rpc_admin_grant_knowledge_article_entitlement`
  - `rpc_admin_archive_knowledge_article_entitlement`
  - `rpc_admin_link_knowledge_article_to_ticket`
  - `rpc_admin_unlink_knowledge_article_from_ticket`
  - `rpc_admin_update_tenant_member_role`
  - `rpc_admin_update_tenant_member_status`
- o portal deixou de exibir contagem enganosa de artigos nos cards resumidos quando nao existe contrato de count autorizada.

## Proximo lote tecnico recomendado

### Lote: Customer Portal Search And Discoverability V3

Objetivo: criar busca autenticada e descoberta segura no portal cliente para tickets e Knowledge autorizada, sem IA, sem indexacao insegura e sem frontend decidir entitlement.

Ordem sugerida:
1. Auditar contratos atuais de listagem em `/portal`, `/portal/help` e `/portal/tickets`.
2. Definir read models ou search contracts backend-only para Knowledge autorizada e tickets do tenant.
3. Fechar boundary entre busca publica do Help e busca autenticada do portal.
4. Conectar UX de busca/filter sem expor draft/internal nem depender de heuristica no frontend.
5. Cobrir regressao de tenant isolation, no-result states e scroll/layout.

Status:
- concluido em `2026-05-10`
- contrato fechado em `rpc_customer_search_knowledge_articles`
- `/portal/help` agora opera com busca autenticada real
- `/portal/tickets/:ticketId` agora oferece descoberta contextual segura
- o Help publico permaneceu fora da boundary autenticada

## Proximo lote tecnico recomendado

### Lote: Customer Portal Tenant Context And Switching V3

Objetivo: permitir que um mesmo ator customer-facing escolha explicitamente o tenant/contexto ativo quando possuir mais de um vinculo valido, sem auth paralela, sem tenant switcher fake e sem quebrar entitlement, tickets ou Knowledge autenticada.

Ordem sugerida:
1. Auditar `vw_customer_portal_auth_context`, memberships customer-facing e contatos vinculados.
2. Definir read model de contexts disponiveis por usuario customer-facing.
3. Criar contrato backend para escolha/troca de contexto ativo sem mover seguranca para o frontend.
4. Atualizar `/portal`, `/portal/tickets` e `/portal/help` para trabalhar com tenant/contexto explicito.
5. Cobrir cross-tenant, usuario revogado e persistencia segura da ultima escolha.

Preparacao ja concluida:
- a regressao de loading persistente em `/admin/customer-portal` foi corrigida antes deste lote.
- a separacao entre contexto admin e contexto customer-facing foi revalidada em browser e em pgTAP.
- a preparacao arquitetural foi registrada em `docs/CUSTOMER_PORTAL_TENANT_CONTEXT_AND_SWITCHING_PREP_V3.md`.

Status:
- concluido em `2026-05-10`
- `active_tenant_id` implementado como contrato backend-governed
- gate de portal habilitado consolidado via `customer_account_features.feature_key = 'returns_portal'`
- portal multi-tenant passou a trocar contexto sem reaproveitar `contexts[0]`

## Proximo lote tecnico recomendado

### Lote: Customer Portal Multi-Tab Session Semantics V3

Objetivo: definir o comportamento do tenant ativo customer-facing em multiplas abas e sessoes concorrentes, sem transformar cache local em fonte de verdade, sem vazamento cross-tenant e sem contaminar o contexto admin.

Ordem sugerida:
1. Formalizar semantica de refresh e concorrencia do `active_tenant_id`.
2. Definir invalidacao segura de dados customer-facing durante troca em outra aba.
3. Cobrir regressao browser com multi-aba real.

Status:
- concluido em `2026-05-11`
- `vw_customer_portal_active_tenant_context` passou a expor `context_version`
- abas stale agora entram em estado honesto e exigem refresh explicito
- mutacoes customer-facing revalidam contexto antes de operar

## Proximo lote tecnico recomendado

### Lote: Customer Portal Session Expiry And Recovery Semantics V3

Status: concluido em `2026-05-11`

Fechado:
1. `rpc_customer_get_portal_session_status` como revalidacao leve do contexto operacional.
2. Estados oficiais do portal:
   - `initializing`
   - `ready`
   - `stale_context`
   - `session_expired`
   - `access_revoked`
   - `tenant_unavailable`
   - `network_retryable`
   - `fatal_error`
3. UI honesta para sessao expirada, acesso revogado, tenant indisponivel e erro temporario.
4. Mutacoes customer-facing bloqueadas fora de `ready`.
5. Browser real validado com logout, retorno ao login, relogin e regressao admin.

### Proximo lote recomendado

Lote: Customer Portal Offline And Network Recovery Hardening V3

Objetivo: aprofundar a recuperacao em falhas temporarias de rede e host local indisponivel, sem criar modo offline nem fonte paralela de sessao.

Status:
- concluido em `2026-05-11`
- timeout, `AbortError` e `Failed to fetch` agora entram em `network_retryable`
- retry ficou manual e explicito, sem loop automatico
- a superficie ativa sobe para o estado global `network_retryable` quando a leitura operacional falha
- o portal limpa a superficie local quando a leitura falha por rede
- o lote nao abriu modo offline, fila local nem fallback visual falso

## Proximo lote tecnico recomendado

### Lote: Customer Portal Host Outage Runbook And Observability V3

Objetivo: documentar e endurecer diagnostico operacional de indisponibilidade do host local/Supabase para o portal cliente, com runbook claro de recuperacao, sinais minimos de observabilidade e validacao de retomada, sem criar infraestrutura realtime nem alterar boundary de auth.

## Decisoes que ainda dependem de Produto
- Se Support e Admin devem convergir em um App Shell unico.
- Quais roles podem criar ticket manualmente.
- Quais status devem aparecer para Suporte e quais sao internos de engenharia.
- Como definir saude operacional da conta sem virar score generico.
- Quando os 8 candidatos de Knowledge voltam para trilha de validacao/publicacao.
- Se Public Help deve ter busca RPC tambem na lista ou manter filtro local no conjunto carregado.

## Criterio de parada desta etapa
Esta etapa nao tenta fechar produto inteiro. Ela encerra a fragmentacao editorial, cria o backlog faseado e aplica apenas quick win seguro que remove comportamento falso de UI.
