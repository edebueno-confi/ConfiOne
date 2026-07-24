# Customer Portal Readiness Blueprint V3

## Objetivo
Preparar a arquitetura minima do futuro portal do cliente B2B do Genius Support OS, sem implementar portal completo, sem criar auth paralela e sem expor dados internos.

O portal futuro deve permitir que um cliente B2B acompanhe a propria operacao de suporte de forma controlada. Ele nao e SAC B2C, nao e portal de shopper final e nao deve copiar o cockpit interno de suporte.

## Principios
- Backend continua sendo source of truth.
- Leitura futura deve passar por views/read models dedicados ao cliente B2B.
- Mutacao futura deve passar por RPCs auditadas.
- `tenant_id` explicito e isolamento por tenant sao obrigatorios.
- Cliente B2B nunca acessa nota interna, audit log bruto, handoff tecnico interno, perfil operacional sensivel ou payload tecnico.
- Evidencias/anexos devem usar o mesmo principio de storage privado, grant curto e URL temporaria.
- Central de ajuda contextual deve expor apenas artigos publicos publicados.
- Nenhuma acao do portal deve existir sem contrato backend, RLS e auditoria.

## Usuario alvo
- Cliente B2B autorizado pelo tenant.
- Contato operacional do cliente, nunca shopper final.
- Perfis futuros possiveis: solicitante, gestor operacional, aprovador ou viewer, se Produto formalizar.

## O que o cliente pode ver no futuro
- Tickets do proprio tenant.
- Status publico-operacional do ticket, com linguagem controlada.
- Mensagens publicas trocadas com suporte.
- Evidencias que o proprio tenant pode acessar.
- Artigos publicos relacionados ao ticket.
- Campos basicos do cliente B2B necessarios para contexto, como nome da empresa e contatos autorizados.
- SLA apenas quando houver decisao de Produto para expor, sempre como informacao controlada e nunca como promessa automatica sem contrato.

## O que o cliente nao pode ver
- Notas internas.
- Eventos tecnicos internos.
- `ticket_events` bruto.
- `audit.audit_logs`.
- `engineering_work_items`.
- `engineering_ticket_links`.
- Updates internos da engenharia.
- Perfil operacional completo do cliente usado por Suporte/CS.
- Alertas internos, customizacoes sensiveis, operational flags e observacoes administrativas.
- Storage bucket, storage path, signed URL permanente, headers, payloads, tokens ou segredos.
- Conteudo Knowledge `draft`, `internal`, `restricted` ou legado bruto.

## Auth e acesso
O portal deve usar a estrategia de auth vigente do projeto, sem criar auth paralela. O desenho futuro precisa definir:
- como o contato B2B vira usuario autenticado;
- quais roles/claims ou memberships autorizam leitura do proprio tenant;
- como bloquear acesso cross-tenant;
- como revogar acesso sem apagar historico;
- como auditar login e acoes relevantes.

Enquanto isso nao estiver contratado, nenhuma tela funcional de portal deve ser criada.

## Tickets do cliente
Read models futuros sugeridos:
- `vw_customer_portal_tickets`
- `vw_customer_portal_ticket_detail`
- `vw_customer_portal_ticket_timeline`

Regras:
- listar somente tickets do tenant autorizado;
- mostrar apenas mensagens publicas e eventos permitidos;
- esconder notas internas e handoff tecnico;
- status deve ser traduzido para linguagem operacional do cliente;
- dados ausentes devem aparecer como `Indisponivel`.

## Abertura e acompanhamento de tickets
RPCs futuras sugeridas:
- `rpc_customer_portal_create_ticket`
- `rpc_customer_portal_add_ticket_message`
- `rpc_customer_portal_register_ticket_attachment`
- `rpc_customer_portal_get_ticket_attachment_download_url`

Regras:
- tenant resolvido por auth/contexto, sem permitir o cliente escolher tenant arbitrario;
- contato solicitante obrigatorio ou derivado do usuario autenticado;
- origem controlada como `customer_portal` se esse source for formalizado;
- prioridade/categoria visiveis ao cliente somente se Produto definir;
- toda mutacao deve gerar `ticket_event` e audit log seguro.

## Evidencias e anexos
O portal deve reutilizar a governanca de evidencias segura:
- bucket privado;
- intent/grant curto;
- metadata sanitizada;
- download temporario;
- sem path interno no frontend.

O cliente deve enxergar apenas anexos autorizados do proprio tenant/ticket. Arquivamento, retencao e scan continuam dependentes de lote proprio.

## Central de ajuda contextual
O portal pode apontar para a Central Publica e para artigos publicos vinculados ao ticket. Ele nao deve usar:
- candidatos documentais da Knowledge;
- playbooks internos;
- drafts;
- artigos internos/restritos;
- lacunas documentais internas.

Read model futuro pode reaproveitar `vw_customer_portal_ticket_knowledge_links`, desde que continue expondo apenas links publicos seguros.

## Limites do Customer Account Profile
O Customer Account Profile e contexto operacional interno. No portal, apenas um subset seguro pode ser exposto:
- nome do tenant;
- status operacional publico se Produto definir;
- contatos autorizados do proprio tenant;
- talvez plano/produto em linguagem comercial-operacional, se aprovado.

Nao expor:
- alertas internos;
- flags operacionais;
- integracoes detalhadas;
- customizacoes de risco;
- observacoes internas;
- historico de auditoria.

## Contratos futuros minimos
Antes de construir portal, criar e testar:
- read models `customer_portal_*` com `security_barrier`;
- RPCs `rpc_customer_portal_*` para abertura, mensagem e anexos;
- RLS/policies bloqueando cross-tenant;
- audit trail para toda mutacao;
- fixture QA com usuario cliente B2B autorizado e usuario bloqueado;
- testes pgTAP de isolamento, visibilidade e ausencia de vazamento interno.

## Fora deste blueprint
- Implementar UI do portal.
- Criar auth paralela.
- Criar portal de shopper final.
- Expor SLA como promessa publica.
- Expor engenharia, notas internas ou audit logs.
- Implementar notificacao externa.
- Implementar IA ou Omni Inbox.

## Proximo lote recomendado
`Customer Portal Contract Foundation V3`, somente quando Produto decidir iniciar o portal cliente B2B. O lote deve começar por auth/tenancy, read models customer-facing e testes de vazamento, antes de qualquer tela.
