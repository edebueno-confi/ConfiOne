# Functional Integration Readiness Audit - 2026-05-22

## 1. Sumário executivo

O Genius Support OS já tem uma base funcional relevante: autenticação com gates por área, Admin com tenants/acessos/Knowledge/Portal, Support Workspace com ticketing real, Customer Portal com tickets, mensagens, evidências e Knowledge autorizada, Engineering Workspace com fila técnica e retorno ao suporte, além de Internal Actions V1 com contrato backend e integração mínima no ticket.

O produto ainda não está pronto como operação integrada ponta a ponta. As lacunas bloqueantes são menos de infraestrutura básica e mais de fechamento operacional entre domínios: Internal Actions ainda não tem workspace da área acionada nem administração de memberships; Customer/account operations ainda não têm CRUD completo; vários domínios de governança existem como views/RPCs, mas não têm tela completa; e alguns atalhos aparecem como indisponíveis ou placeholders, o que deve virar backlog explícito antes de uso operacional.

Princípio de auditoria aplicado: backend como source of truth; leituras por views/read models; escritas por RPCs; sem DML direto no frontend como padrão aceitável; sem exposição de conteúdo internal/restricted; sem botão que pareça executar ação sem contrato real.

## 2. Estado geral do produto

| Área | Estado | Leitura | Escrita | Diagnóstico |
| --- | --- | --- | --- | --- |
| Auth / Shell | Parcial funcional | `vw_admin_auth_context`, contexto do portal | Supabase Auth | Gates existem, mas a política de redirect inicial ainda favorece Admin e precisa matriz por role/contexto. |
| Admin | Parcial funcional | Views admin, customer portal, knowledge, system | RPCs admin | Tenants, access, Knowledge e Customer Portal têm ações reais; customer profile, integrations, alerts e internal area memberships seguem incompletos. |
| Support | Funcional com lacunas | Views support/ticket/customer/knowledge/internal/engineering | RPCs support/ticketing | Ticket Workspace executa fluxo principal, mas ainda concentra muita orquestração e depende de integrações incompletas em Internal Actions e customer profile. |
| Knowledge | Funcional governado | Views admin/public/customer/support | RPCs admin/support/customer/public search | Editor rico e publicação governada existem; risco principal é garantir que envio público use sempre rota pública backend-safe. |
| Customer Portal | Funcional parcial | Views customer portal | RPCs customer portal | Tickets, respostas, evidências, resolução, reabertura, tenant switching e Knowledge autorizada existem; falta fechar gestão/admin de usuários e perfil de conta. |
| Engineering | Funcional parcial | Views engineering | RPCs engineering | Fila, detalhe, assign, status, update e retorno ao suporte existem; falta robustecer ciclo integrado com Support e reporting operacional. |
| Internal Actions | Parcial bloqueante | Views support/internal actions e queue by area | RPCs support/internal action | Fundação existe, mas não há workspace da área acionada nem Admin Console de memberships; fluxo real quebra fora do suporte. |

## 3. Matriz de rotas

| Rota | Estado atual | Views/read models usados | RPCs usadas | Ações reais disponíveis | Ações aparentes incompletas | CRUD | Estados loading/vazio/erro/acesso | Riscos | Próximo passo | Prioridade |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/login` | Funcional | `vw_admin_auth_context` após login | Auth password | Login e redirect | Redirect default para Admin precisa matriz por perfil | N/A | Erro de credencial/rede | Usuário customer/support pode cair em área indevida antes do gate | Testar matriz de redirects por role | P1 |
| `/access-denied` | Funcional | N/A | N/A | Bloqueio visual | N/A | N/A | Acesso negado | Baixo | Manter como destino canônico de gates | P3 |
| `/admin` | Parcial | AdminGate | N/A | Redirect para Admin | Default global pode mascarar rota inexistente | N/A | Gate | Confusão operacional em usuário não-admin | Definir home por role | P1 |
| `/admin/tenants` | Parcial funcional | `vw_admin_tenants_list`, `vw_admin_tenant_detail`, `vw_admin_tenant_memberships`, `vw_admin_audit_feed` | `rpc_admin_create_tenant`, `rpc_admin_update_tenant_status`, `rpc_admin_create_tenant_contact`, `rpc_admin_update_tenant_contact` | Criar tenant, atualizar status, criar/editar contato | Campos grupo/plano/produto aparecem como indisponíveis; perfil de conta não fecha aqui | CRUD incompleto | Loading/erro/vazio presentes | Dados de account profile ficam dispersos | Unificar tenant + account profile governado | P1 |
| `/admin/access` | Parcial funcional | `vw_admin_access_users`, `vw_admin_access_memberships`, `vw_admin_user_lookup` | `rpc_admin_add_tenant_member`, `rpc_admin_update_tenant_member_role`, `rpc_admin_update_tenant_member_status` | Buscar usuário, adicionar membership, mudar papel/status | Convite/criação de usuário não é fluxo completo | CRUD incompleto | Loading/erro/vazio presentes | Operação depende de usuário já existir | Criar fluxo governado de convite/provisionamento | P1 |
| `/admin/system` | Funcional read-only | `vw_admin_system_audit_events`, `vw_admin_system_health_checks`, `vw_admin_system_operational_summary` | N/A | Observabilidade | Sem ações corretivas | Read-only | Loading/erro/vazio presentes | Baixo | Manter como painel de diagnóstico | P3 |
| `/admin/customer-portal` | Parcial funcional | `vw_admin_customer_portal_*`, `vw_admin_knowledge_entitlements`, `vw_admin_ticket_knowledge_links` | `rpc_admin_update_tenant_member_role`, `rpc_admin_update_tenant_member_status`, `rpc_admin_grant_knowledge_article_entitlement`, `rpc_admin_archive_knowledge_article_entitlement`, `rpc_admin_link_knowledge_article_to_ticket`, `rpc_admin_unlink_knowledge_article_from_ticket` | Atualizar acesso existente, conceder/arquivar entitlement, vincular/desvincular artigo-ticket | "Adicionar usuário" e "Ver tickets" estão desabilitados; criação inicial indisponível | CRUD incompleto | Loading/erro/vazio presentes | Pode parecer governança completa sem onboarding real | Fechar admin de usuários do portal | P1 |
| `/admin/knowledge` | Funcional governado | `vw_admin_knowledge_spaces`, `vw_admin_knowledge_categories_v2`, `vw_admin_knowledge_articles_list_v2`, `vw_admin_knowledge_article_detail_v2`, assets/review advisories | RPCs admin knowledge V2, tags, assets, review, publish/archive | Criar/editar/publicar/arquivar/revisar, tags e assets | Próxima fase deve validar Leia também/legacy em fluxo real | CRUD majoritário | Loading/erro/vazio presentes | Publicação indevida se governança for burlada, mitigada por RPCs | QA funcional de publicação e boundaries | P1 |
| `/admin/build-journal` | Funcional read-only | Conteúdo/documentos internos | N/A | Consulta documental | Não é workflow operacional | Read-only | Estados presentes | Baixo | Manter como documentação viva | P3 |
| `/admin/product-docs` | Funcional read-only | `vw_internal_documents_catalog`, `vw_internal_document_detail` | N/A | Consulta documental interna | Sem edição/governança documental na UI | Read-only | Estados presentes | Exposição se gate falhar | Validar gate/admin-only | P2 |
| `/support` | Parcial | SupportGate | N/A | Shell e redirect | N/A | N/A | Gate | Baixo | Validar home por papel support | P2 |
| `/support/queue` | Funcional parcial | `vw_support_tickets_queue`, intake tenants/contacts, classification options | `rpc_create_ticket` | Fila, filtros, abrir ticket | Notificações e mais ações da fila desabilitadas | CRUD parcial | Loading/erro/vazio presentes | Atalhos indisponíveis podem sugerir feature pronta | Transformar placeholders em backlog/disabled copy | P2 |
| `/support/tickets` | Funcional parcial | `vw_support_tickets_queue` | N/A | Lista e navegação | Sino/notificações desabilitado | Listar | Estados presentes | UX operacional incompleta | Definir escopo de notificações | P2 |
| `/support/tickets/:ticketId` | Funcional com lacunas | `vw_support_ticket_detail`, timeline, attachments, knowledge links, engineering links, internal actions | Ticketing, classification, SLA, evidence, knowledge, engineering handoff, internal actions | Assumir, classificar, status, responder, nota interna, evidência, Knowledge, handoff, internal action | Internal action só fecha no lado suporte; safe public Knowledge link exige QA contra view canônica | CRUD ticket forte; integrações parciais | Estados presentes | Boundary de Knowledge/Portal se link público for composto fora da view canônica | QA end-to-end Support + Portal + Engineering + Internal Actions | P0 |
| `/support/customers` | Parcial | `vw_support_customer_360`, recent tickets/events, account context | N/A | Lista e contexto 360 | Não é CRM/account CRUD | Read-only parcial | Estados presentes | Operador pode esperar edição de conta | Separar Customer 360 de Admin account profile | P2 |
| `/support/customers/:tenantId` | Parcial | `vw_support_customer_360`, `vw_support_customer_account_context` | N/A | Detalhe 360 | Vários campos indisponíveis | Read-only parcial | Estados presentes | Contexto incompleto prejudica triagem | Completar account profile read model e UX | P1 |
| `/help`, `/help/genius`, `/help/:spaceSlug/articles/:articleSlug` | Funcional | `vw_public_knowledge_space_resolver`, navigation/list/detail/assets | `rpc_public_search_knowledge_articles` | Navegar e buscar Knowledge pública | N/A | Read-only público | Loading/erro/vazio presentes | Vazamento se view pública não filtrar published/public | Teste boundary public/internal/restricted | P0 |
| `/portal` | Funcional parcial | `vw_customer_portal_*context`, available tenants | `rpc_customer_get_portal_session_status`, `rpc_customer_set_active_tenant` | Contexto ativo, tenant switching, refresh/recovery | N/A | N/A | Loading/stale/access revoked/session expired/retryable | Contaminação de tenant se refresh falhar | QA multi-tenant/multi-tab | P0 |
| `/portal/tickets` | Funcional | `vw_customer_portal_ticket_list` | `rpc_customer_create_ticket` | Listar e criar ticket | Contagem "Artigos autorizados: Indisponível" | CRUD parcial | Loading/erro/vazio presentes | UX sugere dado faltante | Conectar contagem por contrato ou remover | P2 |
| `/portal/tickets/:ticketId` | Funcional | Detail, timeline, collaboration state, attachments, ticket knowledge links | Reply, evidence upload/download, acknowledge, confirm resolution, reopen | Responder, enviar evidência, baixar evidência, marcar lido, confirmar resolução, reabrir | N/A evidente | CRUD operacional parcial | Loading/erro/vazio presentes | Boundary crítico: nota interna/engenharia/storage path | Teste de vazamento e permissão por tenant | P0 |
| `/portal/help` | Funcional | `vw_customer_portal_knowledge_articles` | `rpc_customer_search_knowledge_articles` | Buscar/navegar Knowledge autorizada | N/A | Read-only | Loading/erro/vazio presentes | Entitlements incorretos vazam restricted | Testes cross-tenant e entitlement | P0 |
| `/portal/help/:articleSlug` | Funcional | `vw_customer_portal_knowledge_article_detail` | N/A | Ler artigo autorizado | N/A | Read-only | Loading/erro/acesso presentes | Artigo internal/restricted sem entitlement | Teste boundary por slug direto | P0 |
| `/engineering` | Funcional parcial | `vw_engineering_work_items_queue`, detail, links, updates | Assign/unassign/status/update/return | Fila técnica, assumir, status, update, devolver ao suporte | Sem criação independente; depende do Support handoff | CRUD parcial | Loading/erro/vazio presentes | Engenharia virar conversa com cliente se copy/fluxo escapar | Validar retorno ao suporte sem exposição ao portal | P1 |
| `/engineering/work-items/:workItemId` | Funcional parcial | Engineering detail/links/updates | Mesmas RPCs engineering | Detalhe e ações técnicas | N/A | CRUD parcial | Estados presentes | Boundary com ticket/customer | Teste Support -> Engineering -> Support | P1 |

## 4. Matriz de fluxos ponta a ponta

| # | Fluxo | Estado | Onde quebra ou falta | Contrato existe | Contrato falta | Tela que precisa ajuste | Natureza | Prioridade |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Admin cria ou governa cliente B2B | Parcial | Cria tenant/status/contato, mas account profile amplo fica incompleto | Sim | CRUD account profile completo | `/admin/tenants` | Frontend/governança | P1 |
| 2 | Suporte abre ticket para cliente B2B | Completo parcial | Depende de tenant/contact intake disponíveis | Sim | N/A | `/support/queue` | Dados | P1 |
| 3 | Agente assume ticket | Completo | N/A | Sim | N/A | `/support/tickets/:ticketId` | N/A | P2 |
| 4 | Agente classifica ticket | Completo parcial | Opções dependem de contrato de classificação | Sim | Governança de categorias/motivos completa | Ticket drawer | Governança | P1 |
| 5 | Agente responde cliente | Completo | N/A | Sim | N/A | Ticket composer | N/A | P2 |
| 6 | Agente adiciona nota interna | Completo | Precisa teste boundary portal | Sim | N/A | Ticket composer | Segurança | P0 |
| 7 | Agente anexa/consulta evidência | Completo parcial | Upload/download existem; precisa QA bucket privado e grants curtos | Sim | N/A | Evidence drawer | Segurança | P0 |
| 8 | Agente vincula artigo de Knowledge | Completo parcial | Link existe; qualidade depende de picker/candidato | Sim | N/A | Knowledge drawer | Produto | P1 |
| 9 | Agente envia link público seguro de artigo | Parcial crítico | Front usa `publicArticlePath`; precisa garantir origem backend-safe e não concatenação frágil | Sim | N/A | Knowledge drawer | Segurança/frontend | P0 |
| 10 | Agente identifica lacuna de documentação | Completo parcial | Marca gap/needs update, mas fila editorial de gaps precisa consolidação operacional | Sim | Workflow editorial de triagem | Knowledge drawer/Admin Knowledge | Governança | P1 |
| 11 | Agente aciona área interna | Parcial | Criação no suporte existe | Sim | N/A | Internal Actions panel | N/A | P1 |
| 12 | Área interna responde acionamento | Bloqueado | Não há workspace/fila da área acionada na UI | Backend sim | UI/workspace da área | Novo workspace Internal Actions | Frontend/produto | P0 |
| 13 | Suporte recebe retorno e continua tratativa | Parcial | Suporte aceita/follow-up/fecha, mas retorno depende da área sem UI | Sim | UI da área | Ticket internal actions | Produto | P0 |
| 14 | Suporte escala para engenharia quando necessário | Completo parcial | Handoff existe | Sim | Critérios operacionais/UX | Handoff drawer | Governança | P1 |
| 15 | Engenharia assume work item | Completo | N/A | Sim | N/A | `/engineering` | N/A | P2 |
| 16 | Engenharia registra update técnico | Completo | N/A | Sim | N/A | Engineering drawer | N/A | P2 |
| 17 | Engenharia devolve para suporte | Completo parcial | Retorno existe; precisa validação de visibilidade no ticket e portal | Sim | N/A | Engineering + Support | Segurança/UX | P1 |
| 18 | Suporte responde cliente | Completo | N/A | Sim | N/A | Ticket composer | N/A | P2 |
| 19 | Cliente acessa portal | Completo parcial | Context recovery existe; precisa matriz multi-role | Sim | N/A | `/portal` | Auth/UX | P1 |
| 20 | Cliente consulta tickets | Completo | N/A | Sim | N/A | `/portal/tickets` | N/A | P2 |
| 21 | Cliente responde ticket | Completo | Status pode bloquear conforme colaboração | Sim | N/A | `/portal/tickets/:ticketId` | N/A | P2 |
| 22 | Cliente envia evidência | Completo parcial | Upload seguro existe; exige QA de tipo/tamanho/grant | Sim | N/A | Evidence panel | Segurança | P0 |
| 23 | Cliente consulta Knowledge autorizada | Completo parcial | Views e search existem; precisa testes de entitlement direto por slug | Sim | N/A | `/portal/help` | Segurança | P0 |
| 24 | Cliente troca tenant ativo | Completo parcial | Switch + stale recovery existem; exige QA multi-tab | Sim | N/A | Portal shell | Segurança/UX | P0 |
| 25 | Artigo é criado/editado/publicado por governança | Completo parcial | Editor e RPCs existem; precisa QA editorial completo | Sim | N/A | Admin Knowledge/editor | Governança | P1 |
| 26 | Artigo publicado aparece no Help público | Completo parcial | Public views existem; precisa teste published/public | Sim | N/A | Public Help | Segurança | P0 |
| 27 | Artigo internal/restricted não vaza no público nem portal | Crítico a validar | Contratos indicam isolamento; precisa teste direto por slug/search/link | Sim | N/A | Public Help + Portal + Support links | Segurança | P0 |

## 5. Matriz de CRUD por domínio

| Domínio | CRUD completo? | O que falta | RPC existe? | View existe? | Teste existe? | UI existe? | Auditoria | Prioridade |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| tenants/clientes B2B | Parcial | Editar dados amplos, arquivamento lógico completo, account profile | Sim | Sim | Parcial | Sim | Sim | P1 |
| membros/acessos | Parcial | Convite/provisionamento e remoção/arquivamento operacional claro | Sim | Sim | Parcial | Sim | Sim | P1 |
| contatos | Parcial | Arquivar/remover contato e governança de vínculo com usuário | Sim | Sim | Parcial | Sim | Sim | P2 |
| tickets | Parcial forte | Excluir/arquivar lógico separado de close/reopen; categorias governadas | Sim | Sim | Sim | Sim | Sim | P1 |
| mensagens públicas | Parcial forte | Moderação/edição/retention explícitos | Sim | Sim | Sim | Sim | Sim | P2 |
| notas internas | Parcial forte | Teste visual de não vazamento no portal | Sim | Sim | Sim | Sim | Sim | P0 |
| evidências | Parcial forte | QA grants curtos, limites, auditoria de download | Sim | Sim | Sim | Sim | Sim | P0 |
| categorias/motivos de ticket | Incompleto | Admin CRUD/governança de catálogo | Parcial | Sim | Parcial | Parcial | Parcial | P1 |
| SLA policies | Incompleto | CRUD de políticas SLA e simulação/auditoria | Parcial | Parcial | Parcial | Parcial | Parcial | P1 |
| Knowledge categories | Parcial | Edição/arquivamento operacional completo | Sim | Sim | Sim | Sim | Sim | P2 |
| Knowledge articles | Parcial forte | QA editorial completo e rollback/unpublish operacional | Sim | Sim | Sim | Sim | Sim | P1 |
| Knowledge tags | Parcial | Governança/taxonomia, merge/rename | Sim | Sim | Sim | Sim | Sim | P2 |
| Knowledge entitlements | Parcial | Administração de lifecycle e revisão periódica | Sim | Sim | Parcial | Sim | Sim | P1 |
| ticket knowledge links | Parcial forte | Garantia de rota pública segura no suporte | Sim | Sim | Parcial | Sim | Sim | P0 |
| customer portal users/access | Parcial | Criação/invite/onboarding e revogação clara | Parcial | Sim | Parcial | Parcial | Sim | P1 |
| customer account profile | Incompleto | CRUD completo de perfil, plano, produto, integrações e alertas | Parcial | Sim | Parcial | Parcial/read-only | Parcial | P1 |
| customer integrations | Incompleto | CRUD e health/status integrados | Não claro | Parcial | Não claro | Read-only parcial | Parcial | P1 |
| customer customizations | Incompleto | CRUD de preferências/customizações | Não claro | Parcial | Não claro | Parcial | Parcial | P2 |
| customer alerts | Incompleto | Criar/editar/arquivar alertas operacionais | Não claro | Parcial | Não claro | Parcial | Parcial | P1 |
| engineering work items | Parcial forte | Criação independente/controlada e reporting | Sim | Sim | Parcial | Sim | Sim | P1 |
| engineering updates | Parcial forte | Edição/retificação governada | Sim | Sim | Parcial | Sim | Sim | P2 |
| internal actions | Parcial bloqueante | Workspace da área, fila operacional, assignments via UI | Sim | Sim | Sim | Suporte apenas | Sim | P0 |
| internal area memberships | Incompleto | Admin Console para membros por área | Backend parcial | Sim | Parcial | Não | Sim | P0 |

## 6. Ações decorativas/falsas

| Tela | Ação | Problema | Risco | Correção recomendada | Prioridade |
| --- | --- | --- | --- | --- | --- |
| `/admin/customer-portal` | "Ver tickets" | Botão governado aparece, mas está desabilitado com tooltip de indisponibilidade | Operador entender que a tela deveria navegar para tickets | Trocar por link real filtrado ou remover até existir contrato de navegação | P2 |
| `/admin/customer-portal` | "Adicionar usuário" | Drawer mostra campos e botões desabilitados; copy diz inclusão inicial indisponível | Parece onboarding parcial e pode frustrar operação | Converter em estado "backlog" sem formulário falso ou implementar convite governado | P1 |
| `/support/tickets` | Sino/notificações | Botão desabilitado | Sugere sistema de notificações inexistente | Remover ou transformar em indicador explícito de backlog | P3 |
| `/support/queue` | "Mais ações da fila" | Botão de overflow desabilitado | Sugere ações em lote indisponíveis | Remover enquanto não houver bulk actions reais | P2 |
| `/portal/tickets` | "Artigos autorizados: Indisponível" | Campo informacional sem dado conectado | Diminui confiança do cliente | Conectar contagem por view ou ocultar | P2 |
| Support Knowledge | Copiar/enviar link público | Ação é real, mas depende de `publicArticlePath`; contrato exige decisão backend-safe | Risco de link público indevido se origem não for view canônica segura | Validar uso de `vw_support_knowledge_public_link_candidates` ou equivalente no picker | P0 |
| Support auxiliary/context panels | Alguns cards mostram "Indisponivel" sem acento | Copy operacional inconsistente | Baixo, mas passa sensação de área inacabada | Ajuste de copy no lote visual, sem mudar regra | P3 |

Não foram identificados mocks de sucesso ou DML direto óbvio nas APIs auditadas. As ações problemáticas estão, em sua maioria, desabilitadas ou explicitamente marcadas como indisponíveis; ainda assim devem virar backlog para não parecerem produto completo.

## 7. Contratos ausentes ou insuficientes

| Contrato/lacuna | Impacto | Prioridade |
| --- | --- | --- |
| Workspace/fila UI para `vw_internal_action_queue_by_area` e RPCs `rpc_internal_action_*` | Área acionada não consegue responder acionamentos no produto | P0 |
| Admin Console para `internal_area_memberships` | Não há gestão operacional de quem pertence a cada área interna | P0 |
| Fluxo governado de criação/invite de usuário do Customer Portal | Admin não conclui onboarding de cliente pelo produto | P1 |
| CRUD completo de customer account profile/integrations/customizations/alerts | Support vê contexto parcial e Admin não governa cliente B2B de ponta a ponta | P1 |
| CRUD/governança de categorias/motivos e SLA policies | Classificação e SLA dependem de configuração incompleta | P1 |
| Validação canônica de link público seguro no Support Knowledge | Pode expor conteúdo fora do contrato se path for derivado no frontend | P0 |
| Reporting de ciclo Support -> Engineering -> Support | Operação não mede filas, aging e retorno técnico com clareza | P2 |

## 8. Telas que precisam revisão

| Tela | Motivo | Prioridade |
| --- | --- | --- |
| `/support/tickets/:ticketId` | É o hub de integração; precisa QA de Knowledge, Internal Actions, Engineering, evidências e boundaries | P0 |
| `/portal/tickets/:ticketId` | Precisa provar que não vaza nota interna, engenharia, audit bruto nem storage path | P0 |
| `/portal/help` e `/portal/help/:articleSlug` | Precisa testar entitlement direto por slug/search e multi-tenant | P0 |
| `/help/:spaceSlug/articles/:articleSlug` | Precisa provar public-only/published-only | P0 |
| Novo workspace de Internal Actions | Não existe, mas é necessário para fechar o fluxo | P0 |
| `/admin/customer-portal` | Onboarding/acesso de usuário e ação "Ver tickets" incompletos | P1 |
| `/admin/tenants` | Customer profile/integrations/alerts dispersos ou indisponíveis | P1 |
| `/engineering` | Validar retorno ao suporte e não exposição ao cliente | P1 |

## 9. Riscos de segurança e boundary

| Boundary | Estado | Risco | Prioridade |
| --- | --- | --- | --- |
| Public Help só published/public | Contrato existe | Precisa teste direto por slug/search/assets | P0 |
| Portal não mostra internal/restricted sem entitlement | Contrato existe | Precisa teste cross-tenant e entitlement revogado | P0 |
| Portal não mostra nota interna | Contrato existe | Precisa QA timeline em ticket com nota interna | P0 |
| Portal não mostra engenharia interna | Contrato existe | Precisa QA após engineering update/return | P0 |
| Portal não mostra audit bruto | Contrato existe | Precisa inspeção de payload/view | P1 |
| Portal não mostra storage path | Contrato existe | Upload/download devem usar signed URL curta | P0 |
| Admin não depende de contexto customer-facing | Provável | Precisa teste tenant switching antes de Admin | P1 |
| Customer active tenant não contamina Admin | Contrato existe | Precisa QA multi-tab/multi-tenant | P0 |
| Support não altera work item técnico sem contrato | Contrato separado existe | Precisa teste de permissões | P1 |
| Engineering não vira canal cliente | Contrato indica retorno via suporte | Precisa QA timeline portal após retorno | P1 |
| Internal Actions não mudam `ticket.status` automaticamente | Contrato V1 declara isso | Precisa teste de criação/retorno/status | P0 |
| Knowledge internal/restricted não vira link público | Contrato existe | Ponto crítico no Support Knowledge | P0 |
| Upload/download usam grants curtos e bucket privado | Contrato existe | Precisa QA de URL e expiração | P0 |
| IA não responde/indexa conteúdo sem governança | Fora do runtime atual auditado | Manter fora do próximo lote funcional | P2 |

## 10. Riscos de UX/operação

- O operador pode interpretar `Indisponível` como falha de dados, não como feature fora de escopo, especialmente em Support Customer 360 e Customer Portal Admin.
- A página de ticket de suporte ainda concentra muitas responsabilidades e é o ponto mais provável de regressão ao integrar novas áreas.
- Admin Customer Portal parece mais completo do que é: gerencia usuários existentes e entitlements, mas não fecha criação/onboarding.
- Engineering tem ações reais, mas a linguagem ainda é técnica; o suporte precisa receber retorno em linguagem operacional.
- Internal Actions possui o maior risco de expectativa quebrada: o suporte consegue criar, mas a área acionada não tem cockpit próprio.

## 11. Backlog priorizado

### P0 bloqueante

1. Criar workspace/fila da área acionada para Internal Actions usando `vw_internal_action_queue_by_area` e RPCs `rpc_internal_action_*`.
2. Criar Admin Console para `internal_area_memberships`.
3. Validar e, se necessário, ajustar o envio/cópia de link público de Knowledge no Support para usar somente rota pública backend-safe.
4. Executar QA boundary: Public Help published/public; Portal sem internal/restricted, nota interna, engenharia, audit bruto ou storage path.
5. Executar QA multi-tenant/multi-tab do Customer Portal e garantir que active tenant não contamina Admin/Support.
6. Validar evidence upload/download com bucket privado, tipos/tamanhos e signed URLs curtas em Portal e Support.
7. Testar que Internal Actions não alteram `ticket.status` automaticamente.

### P1 alta

1. Fechar onboarding governado de usuários do Customer Portal no Admin.
2. Completar customer account profile: perfil, produto/plano, integrações, customizações e alertas.
3. Completar governança de categorias/motivos e SLA policies.
4. Validar fluxo Support -> Engineering -> Support com retorno operacional e sem exposição ao cliente.
5. Fazer matriz de redirects por role/contexto para `/login`, `/`, `/admin`, `/support`, `/portal`, `/engineering`.
6. Reduzir risco operacional do Ticket Workspace com testes de integração e extração incremental sem redesenho.

### P2 média

1. Conectar ou remover contagem "Artigos autorizados" no `/portal/tickets`.
2. Definir ações em lote reais para fila de suporte ou remover overflow.
3. Melhorar reporting operacional de Engineering e Support.
4. Completar lifecycle de Knowledge tags/categories/entitlements.
5. Melhorar documentação de critérios de envio de artigo ao cliente.

### P3 futura

1. Notificações/sino no Support.
2. Polimento de copy visual como `Indisponivel` sem acento.
3. Ações corretivas no `/admin/system`.
4. IA assistiva somente após governança de indexação e aprovação.

## 12. Próxima fase recomendada

Próximo lote recomendado: **Functional Integration P0 Closure**.

Escopo objetivo:

1. Internal Actions Area Workspace + Admin Memberships.
2. Boundary QA automatizado para Public Help, Portal, Support, Engineering e Knowledge.
3. Safe Knowledge Link Contract Alignment no Support.
4. Customer Portal multi-tenant/evidence hardening.

Esse lote deve ser pequeno o suficiente para fechar riscos reais sem abrir redesign.

## 13. O que NÃO implementar ainda

- IA respondendo cliente ou indexando conteúdo sem governança explícita.
- Redesign visual amplo do Support Workspace.
- Admin Console genérico para todos os domínios de uma vez.
- Bridge definitiva Internal Actions -> Engineering antes de validar o workspace de área.
- Automação de publicação de Knowledge.
- CRUDs massivos de customer profile sem contrato final de account operations.
- Botões de notificações, bulk actions ou dashboards decorativos sem contrato real.

## 14. Critérios de aceite para o próximo lote

1. Área interna consegue ver fila, assumir, comentar, atualizar status, anexar evidência e devolver acionamento ao suporte.
2. Admin consegue governar memberships de áreas internas sem DML direto no frontend.
3. Criar Internal Action não altera `ticket.status`.
4. Suporte recebe retorno da área interna e decide follow-up/aceite/fechamento.
5. Link público de Knowledge enviado pelo suporte só existe quando o backend declarar `can_send_to_customer` e rota pública segura.
6. Artigos `internal`/`restricted` não aparecem no Public Help por lista, busca, slug direto ou assets.
7. Portal Cliente não vê notas internas, engenharia, audit bruto ou storage path.
8. Upload/download de evidências passam por RPCs e URLs temporárias.
9. Active tenant do Portal não contamina Admin, Support ou Engineering.
10. `npm run contracts:typecheck`, `npm run web:typecheck` e `npm run web:build` passam após as mudanças.

## 15. Evidência de auditoria

Arquivos e contratos consultados:

- `docs/PROJECT_STATE.md`
- `docs/PRODUCT_VISION.md`
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/ARCHITECTURE_RULES.md`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/SUPPORT_WORKFLOW.md`
- `docs/SUPPORT_WORKSPACE_ARCHITECTURE_SPEC.md`
- `docs/TICKET_KNOWLEDGE_LINKING_SPEC.md`
- `docs/KNOWLEDGE_BASE_STRATEGY.md`
- `docs/KNOWLEDGE_ADMIN_OPERATIONAL_GOVERNANCE_V3.md`
- `docs/ENGINEERING_WORKSPACE_OPERATIONAL_CORE_V3.md`
- `docs/CUSTOMER_PORTAL_CONTRACT_FOUNDATION_V3.md`
- `docs/CUSTOMER_PORTAL_ACCESS_AND_KNOWLEDGE_ENTITLEMENTS_V3.md`
- `docs/CUSTOMER_PORTAL_TENANT_CONTEXT_AND_SWITCHING_V3.md`
- `docs/CUSTOMER_PORTAL_SEARCH_AND_DISCOVERABILITY_V3.md`
- `docs/CUSTOMER_PORTAL_SECURE_EVIDENCE_UPLOAD_V3.md`
- `docs/CUSTOMER_ACCOUNT_PROFILE_SPEC.md`
- `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`
- `apps/web/src/app/router.tsx`
- `apps/web/src/features/admin/admin-api.ts`
- `apps/web/src/features/support/support-api.ts`
- `apps/web/src/features/customer-portal/customer-portal-api.ts`
- `apps/web/src/features/engineering/engineering-api.ts`
- `apps/web/src/features/help-center/public-api.ts`
- `apps/web/src/features/support/SupportWorkspacePage.tsx`
- `apps/web/src/features/support/components/*`
- `apps/web/src/features/customer-portal/CustomerPortalPage.tsx`
- `apps/web/src/features/engineering/EngineeringWorkspacePage.tsx`

Validações documentais executadas nesta auditoria:

- `git status --short` inicial: limpo.
- Leitura de docs canônicos obrigatórios.
- Varredura de rotas em `router.tsx`.
- Varredura de APIs por `.from(...)`, `.rpc(...)` e `storage.from(...)`.
- Varredura de ações desabilitadas/placeholders em Support, Admin Customer Portal, Customer Portal e Engineering.
- Varredura de migrations/read models/RPCs relevantes.
- `npm run contracts:typecheck`: passou.
- `npm run web:typecheck`: passou.
- `npm run web:build`: passou.
