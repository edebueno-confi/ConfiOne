# SUPPORT_WORKFLOW.md

## Fluxo padrão
1. Ticket criado.
2. Classificação inicial por categoria operacional, quando disponível.
3. Priorização e severidade com SLA interno por tenant derivado pelo backend.
4. Atribuição.
5. Investigação.
6. Resposta técnico-operacional ao cliente B2B ou time interno.
7. Vínculo com artigo, se existir.
8. Escalonamento para engenharia, se necessário.
9. Devolutiva.
10. Encerramento com motivo.

## Responsabilidades do suporte
- Manter histórico claro.
- Usar macros e artigos quando aplicável.
- Não perder contexto em canais externos.
- Escalar para engenharia com evidência suficiente.
- Registrar retorno técnico para o cliente B2B ou stakeholder interno correto.

## Dados mínimos para escalonar
- Cliente B2B/tenant.
- Impacto.
- Evidência.
- Passos para reproduzir.
- Integração afetada.
- Prints/logs/anexos.
- Resultado esperado.
- Resultado atual.

## Anti-padrões
- Resolver por WhatsApp sem registrar.
- Resolver por e-mail sem registrar.
- Abrir bug sem contexto.
- Fechar ticket sem devolutiva.
- Usar conhecimento informal sem artigo.

## Direção arquitetural do Support Workspace
- o Support Workspace futuro deve partir da fila de tickets, nao de dashboard pesado
- a lista operacional deve ser a superficie dominante
- o detalhe do ticket deve concentrar timeline, composer, atribuicao e acoes de status
- o contexto do cliente B2B deve existir como visao 360 enxuta, sem virar CRM generico
- escalonamento para engenharia continua parte do fluxo, mas sem transformar suporte em board tecnico completo nesta fase
- timeline e customer context nao podem carregar historico infinito na primeira tela; a operacao deve partir de recortes recentes e controlados

## Authz atual do workspace
- a superficie de suporte interna agora esta contratada em read models proprios:
  - `vw_support_tickets_queue`
  - `vw_support_ticket_detail`
  - `vw_support_ticket_timeline`
  - `vw_support_customer_360`
  - `vw_support_ticket_timeline_recent`
  - `vw_support_knowledge_public_link_candidates`
  - `vw_support_customer_recent_tickets`
  - `vw_support_customer_recent_events`
- `platform_admin` pode ler a operacao completa
- `support_agent` e `support_manager` leem apenas os tenants em que possuem membership ativo
- membros comuns do tenant continuam fora do workspace
- engenharia continua fora destes read models especificos ate existir contrato proprio para Engineering Workspace

## Customer 360 minimo
- tenant operacional e seu status
- contatos ativos do tenant
- tickets recentes
- contagem de tickets por status
- eventos recentes relevantes
- sem metricas pesadas, SLA executavel ou funil comercial

## Proxima camada de contexto do cliente
- o Support Workspace ja validou a necessidade de um perfil operacional mais rico do cliente B2B
- esse dominio fica especificado em `CUSTOMER_ACCOUNT_PROFILE_SPEC.md`
- a proposta minima de modelo fica revisada em `CUSTOMER_ACCOUNT_PROFILE_DATA_MODEL_REVIEW.md`
- o desenho tecnico pre-migration desse dominio fica consolidado em `CUSTOMER_ACCOUNT_PROFILE_MIGRATION_DESIGN.md`
- o suporte precisa consultar, antes da resposta:
  - produto ativo
  - plano e modulos relevantes
  - stack operacional principal
  - customizacoes e alertas
  - contatos por finalidade
- esse contexto deve apoiar a tratativa sem transformar a tela em CRM generico

## Boundary materializado na Fase 6.8
- o suporte continua lendo apenas por read models contratuais, nunca por tabela-base do perfil do cliente
- o primeiro read model executável desse dominio agora e `vw_support_customer_account_context`
- a manutencao do perfil operacional passou a existir apenas por RPCs administrativas dedicadas
- `platform_admin` continua como write actor garantido do primeiro corte
- `support_manager` e `support_agent` continuam apenas com leitura controlada por tenant no MVP do dominio
- o workspace agora consome esse contexto de forma controlada:
  - `/support/tickets/:ticketId` mostra apenas produto, status operacional, tier, plataforma, integrações principais, features relevantes, customizações de risco e alertas ativos no rail
  - `/support/customers/:tenantId` expande stack, integrações, features, customizações, alertas, contatos e tickets recentes sem virar CRM pesado
  - observacoes internas, flags e detalhes extensos ficam recolhidos por padrao

## Superficie minima ja implementada
- `/support` redireciona para a fila oficial `/support/queue`
- `/support/queue` e `/support/tickets` usam a fila dominante de tickets do workspace
- `/support/tickets/:ticketId` ancora o detalhe operacional do ticket
- `/support/customers/:tenantId` materializa a visao 360 minima do cliente B2B
- a leitura dessa superficie ocorre apenas por:
  - `vw_support_tickets_queue`
  - `vw_support_ticket_detail`
  - `vw_support_ticket_timeline_recent`
  - `rpc_support_get_ticket_timeline`
  - `vw_support_customer_360`
  - `vw_support_customer_recent_tickets`
  - `vw_support_customer_recent_events`
  - `vw_support_assignable_agents`
  - `vw_support_knowledge_public_link_candidates`
  - `vw_support_ticket_classification_options`
  - `vw_support_ticket_sla_context`
- a escrita continua apenas por:
  - `rpc_support_update_ticket_status_v2`
  - `rpc_assign_ticket`
  - `rpc_add_ticket_message`
  - `rpc_add_internal_ticket_note`
  - `rpc_close_ticket`
  - `rpc_reopen_ticket`
  - `rpc_support_update_ticket_classification`
  - `rpc_support_update_ticket_priority_severity`

## Boundary materializado na Fase 8.10
- categorias de ticket e motivos operacionais agora sao dominio proprio, nao categorias de Knowledge
- `rpc_create_ticket` aceita categoria e motivo inicial opcionais quando o backend fornece opcoes validas
- status sensiveis exigem motivo operacional conforme matriz backend
- SLA e calculado como governanca interna por `ticket_sla_policies`; nao e promessa publica automatica
- fila e workspace exibem categoria, prioridade/severidade e SLA derivados por read model
- frontend nao calcula prazo, nao cria timer e nao inventa transicao de status
- toda mudanca relevante de classificacao, prioridade/severidade ou status gera `ticket_event` e audit trail

## Boundary materializado na Fase 8.11
- politicas de SLA agora podem ser especificas por tenant, com fallback global controlado para preservar continuidade operacional
- calendario de negocio MVP existe como metadata governada, mas o calculo de prazo ainda usa minutos corridos neste corte
- `vw_support_ticket_sla_context`, `vw_support_tickets_queue` e `vw_support_ticket_detail` expõem origem da politica, calendario e prazos derivados pelo backend
- `rpc_admin_upsert_ticket_sla_policy`, `rpc_admin_archive_ticket_sla_policy` e `rpc_admin_upsert_business_calendar` sao a superficie administrativa governada de SLA
- `rpc_support_recalculate_ticket_sla` permite recalculo autorizado e gera evento quando ha mudanca relevante de SLA
- frontend continua sem calcular SLA, sem criar timer e sem inferir breach
- pausa por status, feriados aplicados ao calculo e notificacao externa continuam fora do contrato ate decisao explicita

## Contrato vigente de status do Support Workspace
- o fluxo operacional atual do ticket usa `rpc_support_update_ticket_status_v2` para mudancas normais de andamento
- fechamento e reabertura continuam fluxos dedicados e nao devem ser reimplementados no dropdown geral:
  - `rpc_close_ticket`
  - `rpc_reopen_ticket`
- o read model `vw_support_ticket_detail` ja projeta as flags que o frontend deve respeitar:
  - `can_update_status`
  - `can_close`
  - `can_reopen`
  - `allowed_next_statuses`
- o frontend deve consumir essas flags como verdade pronta do backend, sem recalcular a matriz de transicao e sem liberar fallback amplo quando `allowed_next_statuses` vier vazio
- a matriz canonica continua no backend por `app_private.allowed_next_ticket_statuses(...)` e pelo gate `app_private.ticket_status_transition_allowed(...)`
- o seletor de status normal nao deve oferecer `closed`; encerramento continua sendo CTA dedicado quando `can_close = true`
- reabertura continua sendo CTA dedicado quando `can_reopen = true`, levando o ticket de volta para `waiting_support`
- tickets com transicao indisponivel devem aparecer como estado honestamente bloqueado, e nao como lista ampla de status teoricos

## Boundary materializado na Fase 8.12
- a usabilidade operacional do suporte foi revisada sem backend novo
- copies visiveis de estados indisponiveis passaram a evitar termos de implementacao como backend/contrato quando isso nao ajuda o operador
- a tela continua exibindo `Indisponivel` para dado ausente e copy honesta para acao bloqueada
- thread, composer, anexos, SLA, handoff tecnico e customer context foram preservados sem criar fluxo fake
- qualquer reorganizacao maior de densidade/rail deve partir de uso real e manter os mesmos contratos

## Boundary materializado na Fase 8.2
- o historico anterior da timeline do ticket agora e carregado por `rpc_support_get_ticket_timeline`
- a primeira carga continua usando `vw_support_ticket_timeline_recent`, mantendo payload inicial controlado
- a RPC paginada usa cursor por `occurred_at` e `timeline_entry_id`, sem leitura direta de `ticket_messages` ou `ticket_events` pelo frontend
- resposta publica, nota interna, status, atribuicao, fechamento e reabertura continuam usando apenas RPCs reais ja existentes
- eventos e audit logs dessas mutacoes foram validados em pgTAP
- candidatos de link publico seguro de Knowledge agora sao lidos por `vw_support_knowledge_public_link_candidates`
- a view de link publico seguro nao expõe draft, internal, restricted ou artigo sem rota publica publicada
- anexos, handoff tecnico estruturado, criacao assistida, classificacao, SLA interno e politica por tenant foram fechados em lotes posteriores; notificacoes externas, pausa de SLA e calendario util completo continuam fora desta fase

## Diretrizes de UX da fase 6.2.1
- a fila continua como ponto de partida e precisa dominar a triagem
- o ticket selecionado vira o centro do atendimento, nao um detalhe lateral comprimido
- resposta publica e nota interna passam a compartilhar um composer unico com modo explicito
- timeline precisa sustentar leitura operacional continua, nao sequencia de cards equivalentes
- contexto do cliente B2B deve ser compacto e util para a tratativa
- status e atribuicao precisam aparecer como acoes operacionais do fluxo
- o workspace nao deve parecer dashboard generico nem extensao visual do Admin Console
- foco em operacao interna de suporte/CS, nunca em atendimento a shopper final

## Correcoes consolidadas na fase 6.2.2
- a fila oficial passou a mostrar apenas o essencial para triagem:
  - status
  - prioridade e severidade
  - titulo
  - tenant
  - responsavel
  - ultima atividade
- o preview lateral da fila existe apenas para decidir o atendimento; nao concorre com a lista dominante
- o detalhe do ticket agora segue a ordem operacional:
  1. cabecalho do ticket
  2. composer
  3. timeline
  4. rail de status, atribuicao e cliente
- resposta publica e nota interna continuam no mesmo composer, mas com mudanca explicita de modo e CTA principal grande
- user_id tecnico, fechamento e reabertura ficam recolhidos em areas avancadas
- customer context fica compacto e serve a continuidade da tratativa sem virar CRM ou painel institucional

## Diretório de agentes da fase 6.3
- o fluxo principal de atribuicao agora depende de `vw_support_assignable_agents`, nao de UUID manual no corpo da tela
- o seletor de agente lista apenas operadores ativos e atribuiveis dentro do mesmo tenant permitido
- `Atribuir a mim` e `Desatribuir` continuam usando apenas `rpc_assign_ticket`
- o `user_id` tecnico permanece recolhido como fallback excepcional, nunca como caminho principal da operacao

## Guardrails de volume da fase 6.4
- a timeline principal do ticket passa a operar por `vw_support_ticket_timeline_recent`
- a tela inicial do ticket mostra apenas a janela recente com `recent_limit`, `total_available_count` e `has_more`
- o customer context passa a separar resumo e listas recentes:
  - `vw_support_customer_360` para tenant e preview de contatos
  - `vw_support_customer_recent_tickets` para tickets recentes
  - `vw_support_customer_recent_events` para eventos recentes
- a UI nao deve simular paginacao carregando tudo por baixo
- enquanto nao existir RPC paginavel dedicada, a leitura operacional fica explicitamente limitada ao recorte recente

## Passo visual da fase 6.4.1
- a tela `/support/tickets/:ticketId` passa a tratar conversa e composer como fluxo principal de atendimento
- respostas publicas e notas internas continuam no mesmo composer, mas com modo explicito e CTA principal forte
- eventos de sistema e historico tecnico ficam recolhidos em area secundaria
- o rail operacional fica reduzido a:
  - status
  - atribuicao
  - cliente B2B compacto
  - acoes principais
- `/support/customers/:tenantId` fica como apoio operacional sintetico, sem visual de CRM pesado ou dashboard

## Shell e workspace da fase 6.10
- o Support Workspace passa a usar shell interno colapsavel proprio
- a sidebar do suporte deixa de explicar a operacao e passa a servir navegacao rapida:
  - queue
  - tickets
  - customers
  - knowledge
  - admin quando autorizado
- o ticket vira workspace unico de atendimento:
  1. cabecalho compacto
  2. toolbar operacional na propria superficie
  3. conversa em formato de troca real entre cliente e equipe
  4. composer amplo e central
  5. rail operacional recolhivel
  6. historico tecnico e acoes de excecao recolhidos
- o ticket nao deve mais parecer pilha de cards administrativos:
  - cliente do lado esquerdo
  - equipe do lado direito
  - nota interna separada visualmente
  - contexto e conhecimento fora da coluna principal
- `/support/customers/:tenantId` continua apoiando a tratativa, mas com stack, tickets, contatos e eventos em leitura curta
- a referencia visual transversal dessa camada fica em `INTERNAL_WORKSPACE_DESIGN_SYSTEM.md`

## Enforcements da fase 6.11
- o Support Workspace passa a obedecer tambem ao gate documental de `INTERNAL_UI_ACCEPTANCE_CHECKLIST.md`
- linguagem tecnica, nomes de contrato e detalhes de implementacao nao devem aparecer no fluxo principal do atendimento
- a fila, o ticket e o contexto do cliente devem continuar guiados pela operacao real, nunca por reaproveitamento visual do Admin Console
- o backlog de refinamento da experiencia fica rastreado em `UI_REFACTOR_BACKLOG.md`

## Direcao de vinculo ticket -> Knowledge Base
- o suporte precisa conseguir relacionar artigo ao ticket sem transformar a tratativa em tela editorial
- o vinculo deve ser assistivo:
  - referencia interna
  - artigo enviado ao cliente
  - lacuna de documentacao
  - necessidade de atualizacao
- o ticket continua sendo a source of truth da tratativa
- a KB continua sendo a source of truth do conteudo
- artigo `restricted` ou `internal` nunca pode ser tratado como link ao cliente
- a especificacao oficial desta ponte fica em `TICKET_KNOWLEDGE_LINKING_SPEC.md`
- o modelo minimo revisado desta ponte fica em `TICKET_KNOWLEDGE_LINKING_DATA_MODEL_REVIEW.md`
- o desenho tecnico pre-migration dessa ponte fica consolidado em `TICKET_KNOWLEDGE_LINKING_MIGRATION_DESIGN.md`
- a fase 6.15 materializa o backend minimo dessa ponte com:
  - `vw_support_ticket_knowledge_links`
  - `vw_support_knowledge_article_picker`
  - `rpc_support_link_ticket_article`
  - `rpc_support_archive_ticket_article_link`
  - `rpc_support_mark_documentation_gap`
  - `rpc_support_mark_article_needs_update`
- o vinculo passa a ser append-only auditavel, com arquivamento logico e sem duplicar conteudo do artigo dentro do ticket
- o portal B2B futuro continua restrito a uma view propria que so pode expor `sent_to_customer` de artigos `public` + `published`

## Superficie assistiva da fase 6.16
- `/support/tickets/:ticketId` agora abre um painel recolhivel `Conhecimento relacionado` dentro do rail operacional
- a conversa e o composer continuam no eixo principal; o conhecimento fica como apoio sob demanda
- a leitura desse painel ocorre apenas por:
  - `vw_support_ticket_knowledge_links`
  - `vw_support_knowledge_article_picker`
- a escrita desse painel ocorre apenas por:
  - `rpc_support_link_ticket_article`
  - `rpc_support_archive_ticket_article_link`
  - `rpc_support_mark_documentation_gap`
  - `rpc_support_mark_article_needs_update`
- labels operacionais consolidadas no fluxo:
  - `Referencia interna`
  - `Link enviado ao cliente`
  - `Lacuna de documentacao`
  - `Precisa revisao`
  - `Artigo sugerido`
- `public` + `published` continua sendo pre-requisito de backend para qualquer envio ao cliente
- artigos `internal` e `restricted` aparecem apenas como apoio interno autorizado
- o painel nao expõe UUID, nomes de views/RPCs nem metadata tecnica no fluxo principal

## Contrato de link publico seguro do ticket -> KB
- a UI 6.16 comprovou uma lacuna contratual: o suporte sabe quando um artigo pode ser enviado ao cliente, mas ainda nao recebe a rota publica segura pronta para uso
- `vw_support_knowledge_article_picker` continua suficiente para busca e vinculo geral, mas nao deve virar montador de rota publica no frontend por heuristica
- a review oficial desta lacuna fica em `TICKET_KNOWLEDGE_PUBLIC_LINK_CONTRACT_REVIEW.md`
- recomendacao documental atual:
  - manter o picker focado em selecao geral de artigo
  - criar uma view dedicada para candidatos a link publico seguro
  - deixar o backend decidir `can_send_to_customer`, `public_article_path` e `reason_if_blocked`
- o objetivo da proxima camada nao e publicar artigo nem automatizar resposta; e apenas permitir copia/envio seguro de link publico quando o artigo for `public` + `published` em `knowledge_space` ativo

## Ajuste visual 6.18.3 da tratativa
- `/support/tickets/:ticketId` recebeu um passe corretivo de fidelidade visual para aproximar layout, densidade e hierarquia da blueprint aprovada
- o header do ticket ficou mais compacto e horizontal, com status, prioridade, id e data na mesma faixa de resumo
- a conversa passou a mostrar mais thread util na primeira dobra, com mensagens mais proximas do formato de inbox operacional
- o composer foi mantido no fluxo principal, mas com encaixe mais natural ao fim da conversa
- o rail direito continua contextual, agora com leitura mais curta para status, cliente, conhecimento e atividade recente
- o seletor de andamento preserva o status atual visivel, evitando salto visual incoerente no card de acoes

## Fora de escopo do workspace
- atendimento a shopper final
- omnichannel B2C
- chat widget
- IA ativa
- portal B2B

## Passo operacional da fase 8.7
- `/support/tickets/:ticketId` agora exibe dois apoios operacionais adicionais no rail:
  - `Evidencias do ticket`
  - `Handoff tecnico`
- `Evidencias do ticket` le apenas metadata sanitizada de anexo:
  - nome exibivel
  - tipo MIME
  - tamanho
  - data de criacao
  - autor quando disponivel
- a interface nao recebe nem mostra `bucket`, `path`, URL assinada ou qualquer coordenada sensivel de storage
- enquanto nao existir bucket/policy segura, o rail informa de forma honesta que upload segue indisponivel
- `Handoff tecnico` permite criar demanda tecnica real a partir do ticket quando o caller esta autorizado
- o handoff nao e nota interna solta:
  - cria `engineering_work_item`
  - cria `engineering_ticket_link`
  - gera `ticket_event`
  - gera `audit_log`
- o workspace passa a mostrar work items vinculados com:
  - tipo
  - status
  - prioridade
  - severidade
  - titulo
  - data de abertura
- ticket fechado ou cancelado nao aceita novo handoff
- o andamento tecnico futuro continua pertencendo ao dominio de engenharia; o ticket apenas registra e acompanha o vinculo

## Engineering Workspace da fase 8.8
- `/engineering` passa a ser a fila operacional propria das demandas tecnicas originadas de tickets.
- `/engineering/work-items/:workItemId` passa a mostrar detalhe tecnico, tickets vinculados e updates estruturados.
- o suporte continua criando handoff a partir do ticket, mas nao opera o lifecycle tecnico dentro da conversa.
- a engenharia pode:
  - assumir work item;
  - remover responsavel;
  - atualizar status tecnico;
  - registrar update tecnico;
  - devolver retorno estruturado ao suporte.
- o retorno ao suporte nao e mensagem solta:
  - grava `engineering_work_item_update`;
  - gera `ticket_event`;
  - aparece no ticket workspace pelo read model do vinculo tecnico.
- o ticket workspace passa a mostrar ultimo retorno tecnico e link para abrir a demanda no Engineering Workspace quando existir permissao e rota.
- suporte pode acompanhar o vinculo tecnico do ticket, mas nao altera work item sem papel tecnico autorizado.
- o workspace de engenharia nao substitui backlog de produto, sprint, kanban, chat interno ou sistema externo de notificacao.

## Acionamentos internos da fase 8.27
- o backend agora possui um dominio formal `internal_actions` para subfluxos internos multiárea vinculados ao ticket.
- o suporte continua dono do ticket principal e da comunicação com o cliente.
- a área acionada:
  - não assume o ticket;
  - trabalha no próprio subfluxo;
  - comenta, muda status interno, vincula evidência já existente e devolve retorno ao suporte.
- o catálogo inicial governado de áreas inclui:
  - engenharia
  - financeiro
  - customer success
  - produto
  - operações
  - outra área interna
- memberships de área são explícitos por tenant; o sistema não usa role global nova para representar área.
- o V1 não muda `ticket.status` quando um acionamento interno é criado; a pendência interna aparece por read model dedicado.
- toda mutação relevante gera:
  - `internal_action_update`
  - `ticket_event` interno
  - `audit_log`
- cliente nunca vê esse subfluxo no portal B2B.
- a UI do Support Workspace ainda não foi conectada a esse domínio nesta fase; engenharia continua com o fluxo técnico existente em `engineering_work_items`.

## Evidencias seguras da fase 8.9
- `/support/tickets/:ticketId` agora pode enviar evidencias reais por fluxo governado.
- a experiencia do operador continua simples:
  - selecionar arquivo
  - validar tipo e tamanho
  - enviar
  - ver a evidencia entrar no rail do ticket
  - abrir download temporario quando autorizado
- o frontend nao monta path nem signed URL:
  - pede um intent de upload ao backend
  - envia o arquivo para a function de upload
  - recebe metadata sanitizada de volta
  - pede um grant de download ao backend quando o operador quer abrir a evidencia
- a leitura operacional do rail continua restrita a:
  - nome exibivel
  - tipo
  - tamanho
  - autor
  - data
  - status
- bucket, path interno e URL assinada nao aparecem no fluxo principal.
- a evidencia continua pertencendo ao ticket e ao tenant; upload e download cross-tenant sao bloqueados.
- arquivamento/remocao ainda nao faz parte do fluxo porque nao existe RPC segura habilitada para isso.

## Evidencias customer-facing da fase 8.16
- O portal B2B autenticado agora tambem envia evidencias reais no ticket.
- O fluxo customer-facing e separado do interno:
  - intent por `rpc_customer_create_ticket_attachment_upload`;
  - upload via `ticket-evidence-upload` com `boundary=customer`;
  - registro por `rpc_customer_register_ticket_attachment`;
  - download por `rpc_customer_get_attachment_download_url`.
- O cliente so envia evidencia em ticket permitido do proprio tenant e contato.
- Tickets `closed` e `cancelled` nao aceitam upload customer-facing.
- O portal aceita apenas PDF, PNG, JPG e WebP ate `10 MB`.
- O Support Workspace enxerga a evidencia enviada pelo cliente como metadata sanitizada.
- Bucket, path interno e URL permanente continuam fora do frontend.
- Arquivamento/remocao pelo cliente, notificacao externa, scan/antivirus, IA e Omni Inbox continuam fora do escopo.

## Colaboracao customer-facing da fase 8.17
- O portal cliente B2B agora possui colaboracao real de ticket com leitura/ack, resposta, confirmacao de resolucao e solicitacao de reabertura.
- A timeline customer-facing mostra apenas mensagens publicas/customer-facing e eventos seguros.
- Notas internas, engenharia, audit bruto, advisory, Knowledge draft/internal/restricted e metadata sensivel continuam fora do portal.
- Resposta do cliente:
  - usa `rpc_customer_add_ticket_message`;
  - exige body nao vazio;
  - limita body a 4000 caracteres;
  - bloqueia tickets `resolved`, `closed` e `cancelled`;
  - gera `ticket_event` e `audit_log`;
  - move `waiting_customer` para `waiting_support` pelo backend quando aplicavel.
- Leitura/ack:
  - usa `rpc_customer_acknowledge_ticket_update`;
  - valida timeline entry customer-facing autorizado;
  - deriva `unread_count` e `has_new_updates` por `vw_customer_portal_ticket_collaboration_state`.
- Resolucao/reabertura:
  - cliente confirma apenas ticket `resolved`;
  - cliente solicita reabertura apenas de `resolved`/`closed` com motivo obrigatorio;
  - cliente nao altera prioridade, severidade, categoria ou SLA.
