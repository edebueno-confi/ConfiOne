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
| `/admin/access` | parcial | `vw_admin_auth_context`, `vw_admin_user_lookup`, memberships | falta hardening de concessao/revogacao e trilha clara de auditoria para acesso | alto |
| `/admin/system` | parcial | `vw_admin_audit_feed` e leituras administrativas | falta observabilidade operacional, health real e incident hints sem expor internals | medio |
| `/support/queue` | visual pronta, funcional parcial | `vw_support_tickets_queue`, `vw_support_customer_360`, `vw_support_assignable_agents` | falta criacao operacional de ticket e filtros/sinais persistidos por contrato | medio |
| `/support/tickets/:ticketId` | visual pronta, funcional parcial | `vw_support_ticket_detail`, `vw_support_ticket_timeline_recent`, `vw_support_customer_account_context`, RPCs de status, responsavel, mensagem, nota, fechar/reabrir | falta fluxo completo de conversa com anexos, SLA, classificacao e trilha de handoff tecnico | alto |
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
| Concessao/revogacao de acesso com evidencia operacional | precisa RPC/mutacao, RLS/policy e auditoria | qualquer mudanca de role deve registrar ator, alvo, motivo e escopo |
| Governance de Knowledge alem do CRUD | precisa contrato de leitura, RPC/mutacao e documentacao | falta fila de revisao real, pendencias, bloqueios e publicacao segura |
| System/audit/observability acionavel | precisa contrato de leitura e decisao de produto | deve mostrar saude e auditoria sem expor logs sensiveis ou detalhes internos |

### Support

| Lacuna | Tipo | Observacao |
| --- | --- | --- |
| Criacao de ticket pelo suporte | precisa RPC/mutacao, RLS/policy, auditoria e UI | `createTicket` existe no client, mas precisa validar superficie, permissao e fluxo de entrada |
| Conversa com anexos e eventos completos | precisa migration/schema, views, RPCs e auditoria | timeline recente existe; anexos e historico completo precisam contrato explicito |
| Notas internas com governanca de visibilidade | parcial; precisa auditoria e testes | RPC existe; precisa reforcar copy e criterios de uso interno |
| Status/responsavel com SLA e motivo | precisa schema/RPC complementar | status e assign existem, mas nao ha camada de SLA/filas operacionais |
| Central de ajuda dentro do ticket com link publico seguro | precisa contrato de leitura | gap ja mapeado: `vw_support_knowledge_public_link_candidates` |
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
- Contratos necessarios: confirmar `rpc_create_ticket`; adicionar read model paginado de timeline completa; planejar anexos; implementar `vw_support_knowledge_public_link_candidates`.
- Riscos: expor nota interna ao cliente, criar transicao invalida de status, enviar artigo sem URL publica segura.
- Dependencias: RLS de ticketing, auditoria de eventos e regra de permissao por role.
- Criterios de aceite: todo comando passa por RPC, toda mutacao gera evento/audit trail, frontend nao monta URL publica por heuristica.
- Testes esperados: typecheck, build, testes de RPC/RLS, testes de fluxo support ticket.

### Fase C: Customer Account Profile operacional
- Objetivo: consolidar a conta B2B como contexto operacional vivo para Suporte e CS.
- Entregaveis: perfil operacional editavel, contatos, integracoes, customizacoes, alertas, saude operacional e tickets vinculados.
- Contratos necessarios: usar `vw_support_customer_account_context`, `vw_admin_customer_account_profiles` e RPCs admin existentes; criar historico paginado se necessario.
- Riscos: score de saude sem definicao, exposicao de integracao sensivel, edicao sem auditoria.
- Dependencias: decisao de ownership entre Admin, Suporte e CS.
- Criterios de aceite: toda alteracao sensivel tem motivo, ator e audit log; dados tecnicos sensiveis nao aparecem crus.
- Testes esperados: typecheck, build, testes de RLS/admin RPC e smoke de customer profile.

### Fase D: Knowledge Admin funcional
- Objetivo: sair de corpus documentado para operacao real de Knowledge governada.
- Entregaveis: fila de revisao, status editorial, bloqueios, publicacao governada, relacionamento com tickets e lacunas de documentacao.
- Contratos necessarios: views v2 de Knowledge, RPCs v2, advisories e ticket knowledge links.
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

### Lote: Support Ticket Operational Flow V3

Objetivo: fechar o primeiro bloco real de backend/contrato para atendimento diario, priorizando ticket workspace e Knowledge dentro do ticket.

Ordem sugerida:
1. Revisar contratos existentes de ticket e confirmar se `rpc_create_ticket` esta completo em migration, tipos e RLS.
2. Criar ou validar view paginada de timeline completa, sem substituir `vw_support_ticket_timeline_recent`.
3. Criar `vw_support_knowledge_public_link_candidates` para retornar caminho publico seguro quando o backend permitir envio ao cliente.
4. Garantir que todo envio de mensagem, nota interna, status, responsavel, fechamento e reabertura gere evento/audit trail.
5. Adicionar testes de RLS para agente, gerente de suporte e platform admin.
6. Atualizar contratos TypeScript e front somente apos contrato backend fechado.
7. Validar ticket workspace com typecheck, build e testes focados.

Migrations necessarias:
- Somente se a revisao confirmar lacuna em timeline paginada, link publico seguro ou audit trail.

Views necessarias:
- `vw_support_ticket_timeline_full` ou equivalente paginado.
- `vw_support_knowledge_public_link_candidates`.

RPCs necessarias:
- Confirmar `rpc_create_ticket`.
- Manter status, assign, message, internal note, close e reopen como unicas portas de mutacao.

RLS/policies:
- Agente de suporte deve ler apenas escopo permitido.
- Nota interna nunca pode ser exposta ao cliente.
- Link publico so pode ser retornado quando artigo esta publicado, publico e associado a rota publica valida.

Audit logs:
- Mutacoes de ticket, assignment, status, mensagem, nota, close/reopen e vinculos de Knowledge.

Fixtures/testes:
- Ticket com cliente B2B ativo.
- Ticket sem responsavel.
- Ticket com artigo interno e artigo publico.
- Agente sem permissao de publish/admin.

Impacto no front:
- Habilitar criacao de ticket apenas apos contrato confirmado.
- Remover qualquer fallback de URL publica montada no cliente.
- Melhorar estados de erro por permissao/contrato sem mudar regra de negocio.

## Decisoes que ainda dependem de Produto
- Se Support e Admin devem convergir em um App Shell unico.
- Quais roles podem criar ticket manualmente.
- Quais status devem aparecer para Suporte e quais sao internos de engenharia.
- Como definir saude operacional da conta sem virar score generico.
- Quando os 8 candidatos de Knowledge voltam para trilha de validacao/publicacao.
- Se Public Help deve ter busca RPC tambem na lista ou manter filtro local no conjunto carregado.

## Criterio de parada desta etapa
Esta etapa nao tenta fechar produto inteiro. Ela encerra a fragmentacao editorial, cria o backlog faseado e aplica apenas quick win seguro que remove comportamento falso de UI.
