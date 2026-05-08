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
| `/support/queue` | visual pronta, funcional parcial | `vw_support_tickets_queue`, `vw_support_customer_360`, `vw_support_assignable_agents` | falta criacao operacional de ticket e filtros/sinais persistidos por contrato | medio |
| `/support/tickets/:ticketId` | funcional parcial com contrato operacional fechado | `vw_support_ticket_detail`, `vw_support_ticket_timeline_recent`, `rpc_support_get_ticket_timeline`, `vw_support_customer_account_context`, RPCs de status, responsavel, mensagem, nota, fechar/reabrir | faltam anexos, SLA, classificacao, criacao assistida e trilha de handoff tecnico | alto |
| `/support/customers` | visual pronta, funcional parcial | `vw_support_customer_360`, `vw_support_customer_account_context` | falta busca/filtros operacionais persistidos e criacao/edicao governada de perfil de conta | medio |
| `/support/customers/:tenantId` | visual pronta, funcional parcial | `vw_support_customer_360`, `vw_support_customer_account_context`, `vw_support_customer_recent_tickets`, `vw_support_customer_recent_events` | falta historico completo, saude operacional versionada e gestao de contatos/integracoes | alto |
| `/help/genius` | pronta para leitura publicada | `vw_public_knowledge_space_resolver`, `vw_public_knowledge_navigation`, `vw_public_knowledge_articles_list`, `rpc_public_search_knowledge_articles` | depende de artigos publicados reais; candidatos atuais continuam internos | medio |
| `/help/genius/articles` | pronta para lista publicada | `vw_public_knowledge_articles_list`, navegacao publica | busca local de lista existe; busca RPC fica na home | baixo |
| `/help/genius/articles/:slug` | pronta para artigo publicado | `vw_public_knowledge_article_detail` | precisa garantir estados de slug ausente e links relacionados sem vazar conteudo interno | medio |

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
| Status/responsavel com SLA e motivo | precisa schema/RPC complementar | status e assign existem, mas nao ha camada de SLA/filas operacionais |
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
- Contratos ainda necessarios: categoria inicial formal; SLA/motivo se entrar no produto; arquivamento seguro de evidencia; notificacoes externas se Produto decidir.
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

### Lote: Ticket Classification And SLA Governance V3

Objetivo: fechar classificacao operacional inicial de tickets, motivos auditaveis, prioridade/SLA governados e transicoes associadas sem inventar regra no frontend.

Ordem sugerida:
1. Auditar enums, constraints e surface atual de status/prioridade/categoria.
2. Definir categoria inicial formal e motivos operacionais aceitos.
3. Criar read models auxiliares de intake/workspace para categorias e motivos.
4. Criar RPCs para classificar ticket, revisar prioridade e operar transicoes com motivo quando necessario.
5. Conectar fila e workspace apenas aos contratos reais.
6. Validar SLA/prioridade/estado por tenant, auditoria e regras de transicao.

Migrations necessarias:
- sim, para categoria inicial formal, motivos e possivel camada de SLA.

Views necessarias:
- opcoes controladas de classificacao/prioridade/SLA
- possiveis read models de fila com sinais operacionais adicionais

RPCs necessarias:
- classificar ticket
- revisar prioridade
- aplicar motivo operacional
- possivel recalculo/control plane de SLA se o dominio existir

RLS/policies:
- isolamento por tenant
- transicoes permitidas por papel
- nenhuma classificacao livre fora do backend

Audit logs:
- toda mudanca de classificacao, prioridade, motivo e SLA precisa gerar audit trail e `ticket_event`.

Fixtures/testes:
- ticket com classificacao definida
- ticket sem categoria inicial
- tentativa cross-tenant bloqueada
- motivo/transicao invalida bloqueados

Impacto no front:
- completar intake e workspace com classificacao operacional real
- evitar copy improvisada de categoria/SLA no frontend

## Decisoes que ainda dependem de Produto
- Se Support e Admin devem convergir em um App Shell unico.
- Quais roles podem criar ticket manualmente.
- Quais status devem aparecer para Suporte e quais sao internos de engenharia.
- Como definir saude operacional da conta sem virar score generico.
- Quando os 8 candidatos de Knowledge voltam para trilha de validacao/publicacao.
- Se Public Help deve ter busca RPC tambem na lista ou manter filtro local no conjunto carregado.

## Criterio de parada desta etapa
Esta etapa nao tenta fechar produto inteiro. Ela encerra a fragmentacao editorial, cria o backlog faseado e aplica apenas quick win seguro que remove comportamento falso de UI.
