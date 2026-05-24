# SUPPORT_WORKSPACE_ARCHITECTURE_SPEC.md

## Objetivo
Definir a arquitetura do futuro Support Workspace do Genius Support OS como ambiente interno de suporte e CS para operacao B2B tecnica, sem implementar UI, schema novo ou contratos adicionais nesta fase.

## Premissa de produto
- o Genius Support OS atende clientes B2B de SaaS de logistica reversa
- nao e SAC B2C
- nao atende shopper final da loja
- o workspace de suporte deve servir suporte interno, CS e times tecnicos na operacao do cliente B2B

## Resultado esperado desta fase
- delimitar o que o Support Workspace precisa cobrir
- reaproveitar ao maximo o ticketing core ja existente
- explicitar as lacunas antes de abrir qualquer fase de UI
- evitar dashboard pesado e manter foco em fila, detalhe e contexto operacional

## Estado atual de runtime em 2026-05-16
- Em 2026-05-24, o P3 adicionou fundacao AI-native, human-governed sem Copilot real, chatbot, modelo, embedding ou automacao. O Support Workspace nao deve exibir botao ativo de geracao enquanto nao houver provider/modelo aprovado; qualquer sugestao futura deve passar por `rpc_ai_validate_context_access`, fonte citavel, redaction, auditoria e revisao humana.
- Em 2026-05-24, o P2-C adicionou governanca de readiness de canais por tenant sem provider externo. O Support Workspace continua usando `customer_portal` como canal real e recebe motivos backend-safe para canais externos futuros. `/admin/system` mostra readiness operacional sanitizado; nao existe configuracao de segredo, token, webhook, job, retry, provider fake ou envio externo real.
- Em 2026-05-23, o P2-B adicionou a camada de readiness de delivery sem provider externo. O Support Workspace continua sem WhatsApp/e-mail/chat/API reais, mas agora consegue exibir status leve de disponibilidade no Portal para mensagens customer-facing por `ticket_message_deliveries` e `vw_support_ticket_message_deliveries`. Canais externos seguem bloqueados por `vw_support_ticket_delivery_capabilities`; nao existe botao de envio externo, retry, job ou provider fake.
- Em 2026-05-23, a fundação P2 de origem/canal foi adicionada ao workspace sem integrar canal externo real. A fila e o detalhe passam a receber `origin_*`, `channel_*`, `can_reply_now`, `reply_mode` e `reason_if_unavailable` por read models; o composer só habilita resposta pública quando o backend permite; canais `email`, `chat` e `api` são exibidos como futuros/indisponíveis, sem botão funcional de envio externo.
- `/support/tickets/:ticketId` materializa o Ticket Workspace operacional em tres zonas apos a sidebar global: fila viva, conversa central dominante e rail direito ou drawer lateral substituto.
- A timeline central do ticket e a unica superficie visual de historico operacional; o card redundante de `Atividade recente` foi removido do rail direito.
- O rail direito padrao ficou restrito a `Resumo do ticket`, `Ações rápidas` e `SLA interno`, reforcando a separacao entre contexto operacional e historico da tratativa.
- O drawer lateral continua substituindo integralmente o rail direito quando uma acao rapida e aberta; nao existe toolbar flutuante, coluna intermediaria nem compressao adicional da conversa alem da largura aprovada do painel.
- A fila viva agora opera com segmentacao explicita `Abertos | Fechados`, iniciando por padrao em `Abertos`; tickets encerrados continuam acessiveis por filtro, sem poluir a operacao diaria.
- O split de lifecycle da fila usa apenas status reais ja carregados pela `vw_support_tickets_queue`, sem contrato novo, sem mock e sem view parametrizada adicional.
- Os status operacionais hoje reutilizados para esse split sao `new`, `triage`, `waiting_customer`, `waiting_support`, `waiting_engineering`, `in_progress`, `resolved`, `closed` e `cancelled`.
- A UI continua restrita a contratos reais ja materializados para fila, detalhe, timeline, contexto do cliente, classificacao, anexos, knowledge links, handoff tecnico, SLA e acionamentos internos. O drawer `Acionamentos` consome read models/RPCs reais de `internal_actions`; nao le tabela base, nao usa mock e nao altera `ticket.status`.

## Escopo do Support Workspace
O Support Workspace deve cobrir:
- fila interna de tickets
- lista dominante de trabalho
- detalhe completo do ticket
- historico e timeline unificada
- mensagens ao cliente B2B
- notas internas
- atribuicao de responsavel
- prioridade
- severidade
- status
- contexto do tenant/cliente B2B
- trilha de escalonamento futuro para engenharia
- vinculo futuro com Knowledge Base
- base para SLA futuro

## Fora de escopo
- atendimento a consumidor final
- WhatsApp, Instagram ou omnichannel B2C
- chat widget
- IA ativa
- automacoes
- portal B2B
- engineering board completo
- help center publico
- BI executivo ou dashboard pesado

## Contratos backend reutilizaveis hoje

### Views ja materializadas
- `vw_tickets_list`
- `vw_ticket_detail`
- `vw_ticket_timeline`
- `vw_support_tickets_queue`
- `vw_support_ticket_detail`
- `vw_support_ticket_timeline`
- `vw_support_ticket_timeline_recent`
- `vw_support_customer_360`
- `vw_support_customer_recent_tickets`
- `vw_support_customer_recent_events`
- `vw_support_assignable_agents`
- `vw_support_ticket_channel_context`
- `vw_support_ticket_communication_capabilities`
- `vw_support_tenant_communication_capabilities`
- `vw_support_ticket_channel_readiness`
- `vw_support_ticket_message_deliveries`
- `vw_support_ticket_delivery_capabilities`

### RPCs ja materializadas
- `rpc_create_ticket`
- `rpc_update_ticket_status`
- `rpc_support_update_ticket_status_v2`
- `rpc_assign_ticket`
- `rpc_add_ticket_message`
- `rpc_add_internal_ticket_note`
- `rpc_close_ticket`
- `rpc_reopen_ticket`
- `rpc_support_get_ticket_timeline`

## O que esses contratos ja cobrem

### `vw_tickets_list`
Ja cobre:
- fila operacional por tenant
- status
- prioridade
- severidade
- requester
- origem
- autor
- assignee quando permitido
- contadores visiveis de mensagens
- `last_message_at`
- flags de permissao

### `vw_ticket_detail`
Ja cobre:
- detalhe canonico do ticket
- requester contact
- motivo de fechamento
- contadores visiveis de mensagens e anexos
- assignee quando permitido
- flags de permissao

### `vw_ticket_timeline`
Ja cobre:
- timeline unificada de mensagens e eventos
- separacao entre mensagem publica e nota interna
- historico de status, atribuicao, resolucao, fechamento e reabertura
- direcao/canal de comunicacao normalizados quando disponiveis (`inbound`, `outbound`, `internal`, `system`)

### RPCs
Ja cobrem:
- criacao de ticket
- atualizacao de status
- atribuicao e desatribuicao
- envio de mensagem publica ao cliente B2B
- envio de nota interna
- fechamento controlado
- reabertura controlada

## Leitura arquitetural do dominio
O backend atual ja oferece o nucleo do Support Workspace, mas ainda no nivel de ticketing core. A proxima camada nao deve criar um segundo dominio paralelo de suporte; deve projetar uma experiencia operacional sobre esses contratos.

Direcao recomendada:
- `vw_tickets_list` como lista dominante
- `vw_ticket_detail` como painel de detalhe
- `vw_ticket_timeline` como trilha unica de contexto
- RPCs atuais como superficie inicial de acao

## Lacunas antes da UI

### 1. Read models especificos para suporte
Lacuna:
- as views atuais sao genericas de ticketing

Impacto:
- o Support Workspace provavelmente vai precisar de um read model mais orientado a fila interna, com filtros e joins operacionais mais diretos

Necessidade futura provavel:
- `vw_support_queue`
- `vw_support_ticket_detail`
- possivel `vw_support_customer_summary`

### 2. Filtros de fila
Lacuna:
- o contrato atual nao foi especificado como uma fila interna com recortes prontos

Filtros que o workspace deve suportar no futuro:
- status
- prioridade
- severidade
- responsavel
- sem responsavel
- tenant
- origem
- aguardando cliente
- aguardando suporte
- aguardando engenharia

### 3. Visao 360 do cliente B2B
Lacuna:
- hoje o ticket pertence a um `tenant`, mas nao existe ainda um read model de contexto do cliente para suporte

O que deve existir futuramente:
- resumo do tenant/cliente B2B
- historico de tickets do tenant
- sinais de volume ou recorrencia
- contatos relevantes do tenant

Desdobramento aprovado em especificacao:
- o perfil operacional completo do cliente passa a ser tratado como dominio proprio em `CUSTOMER_ACCOUNT_PROFILE_SPEC.md`
- suporte nao deve depender apenas de `tenant` + contatos + tickets recentes; precisa enxergar produto ativo, plano resumido, stack, customizacoes e alertas operacionais
- esse perfil nao deve virar CRM generico nem ser despejado inteiro no ticket

### 4. Assignments
Lacuna:
- o contrato ja suporta atribuicao, mas a UX de fila precisa decidir claramente:
  - pegar ticket
  - reatribuir
  - deixar sem responsavel

### 5. Comentarios publicos vs internos
Lacuna:
- o backend diferencia corretamente mensagem publica e nota interna
- a UI futura precisa tornar essa distincao impossivel de confundir

Requisito duro:
- composer separado ou indicacao muito explicita para evitar envio acidental de nota interna ao cliente B2B

### 6. Vinculo ticket -> KB
Lacuna:
- nao existe contrato atual para relacionar ticket a artigo

Uso esperado:
- sugerir artigo relacionado
- registrar artigo usado na resolucao
- transformar demanda recorrente em backlog de conteudo
- separar claramente:
  - referencia interna
  - link publico enviado ao cliente
  - lacuna de documentacao
  - artigo que precisa de atualizacao

Direcao aprovada em especificacao:
- esse dominio assistivo agora fica formalizado em `TICKET_KNOWLEDGE_LINKING_SPEC.md`
- o painel de conhecimento relacionado deve apoiar a resposta no ticket sem competir com conversa e composer
- o vinculo nao altera ticket nem artigo automaticamente

### 7. Vinculo ticket -> engineering work item
Lacuna:
- nao existe contrato atual para handoff estruturado para engenharia

Uso esperado:
- escalar ticket para demanda tecnica
- acompanhar status tecnico sem transformar o Support Workspace em board de engenharia

### 8. SLA
Lacuna:
- ainda nao existe camada executavel de SLA

Uso esperado:
- fila com urgencia visivel
- clocks por status
- base para futuro `SLA_STRATEGY.md`

## Proposta de rotas futuras
- `/support`
- `/support/tickets`
- `/support/tickets/:id`
- `/support/customers/:tenantId`
- `/support/queue`

## Papel esperado de cada rota

### `/support`
- entrada do workspace
- pode redirecionar para a fila principal
- evitar dashboard pesado

### `/support/tickets`
- lista dominante de tickets
- filtros e ordenacao
- foco em operacao diaria

### `/support/tickets/:id`
- detalhe do ticket
- conversa recente em primeiro plano
- composer central de resposta publica e nota interna
- historico tecnico recolhido sob demanda
- acoes de status e atribuicao

### `/support/customers/:tenantId`
- visao 360 do cliente B2B
- historico de tickets
- contexto do tenant para atendimento tecnico-operacional
- ponto natural de leitura aprofundada do futuro Customer Account Profile
- no P1 Customer Account Operations Buildout, a leitura aprofundada foi fechada por read models de suporte (`vw_support_customers_list`, `vw_support_customer_detail`, `vw_support_customer_account_context`) e a escrita permaneceu fora do Support Workspace; alteracoes estruturais de conta B2B pertencem ao Admin.

### `/support/queue`
- recorte operacional prioritario
- sem competir com `/support/tickets`; pode ser a mesma base com presets de fila

## UX minima recomendada

### Estrutura
- lista dominante a esquerda ou em coluna principal
- painel de detalhe forte
- composer grande e central para resposta publica e nota interna
- conversa recente como principal area de leitura do ticket
- timeline tecnica em camada secundaria ou recolhida
- acoes operacionais visiveis sem modal excessivo
- contexto do cliente compacto no rail operacional

### Componentes minimos
- lista de tickets com filtros
- header do ticket com status, prioridade, severidade e responsavel
- conversa recente
- timeline tecnica controlada
- bloco de contexto do cliente B2B
- composer de mensagem
- composer de nota interna
- acoes de:
  - atribuir
  - mudar status
  - fechar
  - reabrir

### O que evitar
- dashboard com muitos cards concorrendo por atencao
- KPIs dominando a tela antes da fila
- navegacao confusa entre ticket, cliente e engenharia
- mistura visual entre resposta ao cliente e nota interna

## Principios de UX
- menos painel, mais fluxo operacional
- fila como ponto de partida
- detalhe como centro da tomada de decisao
- contexto suficiente do cliente B2B sem virar CRM pesado
- timeline unica como fonte de verdade operacional

## Diretório de agentes e atribuicao operacional
- o fluxo principal de atribuicao do Support Workspace deve depender de um diretório seguro de agentes atribuiveis, nunca de digitacao manual de UUID por padrao
- esse diretório deve ser lido por view propria e seguir o mesmo boundary de authz usado pela atribuicao do ticket
- o painel de atendimento deve mostrar:
  - agente atual resolvido por nome e email
  - seletor simples de agente atribuivel
  - acao `Atribuir a mim`
  - acao `Desatribuir`
- o `user_id` tecnico pode continuar existindo apenas em fallback avancado e recolhido
- a escrita continua unicamente por `rpc_assign_ticket`

## Direcao oficial de UX apos a fase 6.2.1
- o Support Workspace nao deve herdar layout generico do Admin Console por conveniencia
- a fila precisa ser a superficie dominante de triagem
- o ticket selecionado precisa ser o centro do atendimento
- resposta publica e nota interna devem viver em composer explicito e impossivel de confundir
- status e atribuicao devem aparecer como acoes operacionais do fluxo, nao como cards soltos
- customer context deve ser compacto e util, sem competir com o painel principal de atendimento
- notebook e desktop largo devem privilegiar largura util real para tratativa, evitando coluna lateral espremida e vazio improdutivo
- o contexto enriquecido de conta do cliente deve aparecer apenas como apoio operacional:
  - no ticket, mostrar somente produto, status operacional, tier, plataforma, integrações principais, features relevantes, customizações de risco e alertas ativos
  - observacoes internas, flags e listas extensas ficam recolhidas
  - a conversa e o composer continuam como foco principal da tratativa

## Direcao consolidada da fase 6.10
- o Support Workspace passa a usar um shell interno proprio, colapsavel e mais compacto
- a sidebar do suporte deixa de carregar cards textuais longos e passa a servir navegacao util
- a tela do ticket deve operar como workspace unico:
  - conversa e composer no centro
  - rail operacional recolhivel
  - contexto do cliente compacto
  - historico tecnico e acoes avancadas sob demanda
- a fila continua dominante e a customer view continua sintetica
- a referencia transversal desse comportamento fica em `INTERNAL_WORKSPACE_DESIGN_SYSTEM.md`

## Correcao estrutural consolidada na fase 6.2.2
- `/support/queue` deve operar como ferramenta de triagem, nao como dashboard
- o resumo de fila deve ser compacto e auxiliar, sem cards grandes de metrica
- a fila ocupa a maior parte da tela e o preview do ticket ativo existe apenas para decidir qual ticket assumir
- `/support/tickets/:ticketId` deve operar como painel de atendimento
- o composer precisa aparecer antes da timeline e usar modo explicito entre resposta publica e nota interna
- status, atribuicao e user_id tecnico nao devem ocupar o centro da tela; ficam no rail operacional com avancado recolhido
- a timeline deve parecer trilha cronologica continua, nao pilha de cards equivalentes
- `/support/customers/:tenantId` deve servir retorno rapido para a tratativa, com tickets recentes, contatos e eventos em estrutura compacta
- qualquer informacao que nao ajude a responder, priorizar, atribuir ou continuar a operacao deve ser rebaixada ou recolhida

## Guardrails de volume da fase 6.4
- a timeline operacional nao deve carregar historico infinito na primeira abertura do ticket
- o recorte inicial do ticket passa a depender de `vw_support_ticket_timeline_recent`
- o customer context deixa de depender de listas longas agregadas no mesmo payload e passa a separar:
  - `vw_support_customer_360` para resumo do tenant e preview de contatos
  - `vw_support_customer_recent_tickets` para tickets recentes do tenant
  - `vw_support_customer_recent_events` para eventos recentes do tenant
- a UX deve explicitar que a tela trabalha com janelas recentes, e nao com historico total, ate existir RPC paginavel dedicada

## Relacao com a Knowledge Base
No curto prazo:
- o suporte deve consultar e reaproveitar artigos existentes

No medio prazo:
- o workspace deve conseguir registrar quais artigos ajudaram a resolver tickets
- tickets recorrentes devem alimentar backlog de curadoria

## Relacao com engenharia
No curto prazo:
- escalar para engenharia continua sendo processo e contexto, nao board integrado

No medio prazo:
- precisa existir vinculo ticket -> item de engenharia sem duplicar dominio

## Regras de seguranca e governanca
- backend continua source of truth
- leitura do app deve continuar por views
- escrita do app deve continuar por RPCs
- notas internas nao podem vazar para a camada publica
- o workspace deve continuar orientado a cliente B2B, nunca a consumidor final

## Status flow vigente no runtime
- o read model principal `vw_support_ticket_detail` ja projeta `can_update_status`, `can_close`, `can_reopen` e `allowed_next_statuses`
- a UI deve tratar essas flags como resposta pronta do backend, e nao como sugestao para recalculo local
- mudanca normal de andamento usa `rpc_support_update_ticket_status_v2`
- fechamento continua caminho dedicado por `rpc_close_ticket`, apenas quando o ticket estiver elegivel para encerramento
- reabertura continua caminho dedicado por `rpc_reopen_ticket`, retornando o ticket para `waiting_support`
- `closed` nao deve ser tratado como opcao comum do seletor de andamento; faz parte do fluxo dedicado de encerramento
- a matriz canonica de transicao permanece no backend por `app_private.allowed_next_ticket_statuses(...)` e `app_private.ticket_status_transition_allowed(...)`
- se `allowed_next_statuses` vier vazio, a UX correta e expor indisponibilidade contratual ou ausencia de transicao, nunca liberar lista ampla de status teoricos

## Sequencia recomendada de fases futuras
1. criar read models especificos de suporte, se necessario
2. definir authz explicita do Support Workspace
3. implementar UI minima de fila e detalhe
4. adicionar contexto do cliente B2B
5. so depois evoluir vinculos com KB, engenharia e SLA

## Recomendacao tecnica final
- nao iniciar a UI do Support Workspace diretamente sobre dashboards ou novas tabelas sem primeiro fechar os read models necessarios
- reutilizar o ticketing core existente como fundacao
- manter a primeira versao enxuta: fila, detalhe, timeline, composer, status e atribuicao
- tratar visao 360 do cliente B2B como contexto operacional, nao como CRM
- deixar KB link, handoff para engenharia e SLA preparados como proximas camadas controladas
- manter a gramatica visual do dominio de suporte local ao proprio workspace, usando primitives compartilhadas sem copiar o layout do Admin Console

## Internal Actions V1
- o workspace agora possui um dominio formal de `internal_actions` separado do ticket principal e separado do dominio tecnico de engenharia.
- esse dominio possui integracao minima no Ticket Workspace para o lado do suporte:
  - drawer `Acionamentos`
  - catalogo real de areas acionaveis
  - criacao de acionamento
  - lista por ticket
  - detalhe
  - timeline interna
  - aceite de retorno
  - pedido de complemento
  - fechamento
  - vinculo de evidencia existente quando aplicavel
- a operacao da area acionada agora possui superficie propria:
  - `/internal-actions`
  - `/internal-actions/:actionId`
  - fila por membership ativo da area
  - detalhe operacional, timeline interna, assumir para si, update, status interno permitido e devolucao estruturada ao suporte
- a governanca de memberships agora possui superficie administrativa:
  - `/admin/internal-areas`
  - areas acionaveis
  - memberships por area/tenant/usuario
  - add/update/archive por RPC administrativa
- o modelo materializado inclui:
  - catalogo governado de areas internas
  - membership explicito por area e tenant
  - entidade principal de acionamento interno
  - ledger append-only de updates
  - vinculo de evidencia apenas por `ticket_attachments`
  - fila por area e views de suporte
- decisoes estruturais do V1:
  - criar acionamento nao altera `ticket.status`
  - pendencia interna aparece por read model, nao por status publico
  - cliente nao ve o subfluxo
  - suporte continua owner do ticket
  - bridge com `engineering_work_items` continua fora deste lote
- consequencia arquitetural:
  - o Support Workspace passa a ter dois trilhos internos coexistindo:
    - handoff tecnico especializado de engenharia
    - acionamento interno generico multiarea
  - a UI precisa manter essa separacao sem misturar lifecycle de ticket com lifecycle do subfluxo interno
- limites ainda abertos:
  - nao existe bridge automatica com `engineering_work_items`
  - estados de retorno pendente exigem massa QA estavel para validacao visual recorrente
