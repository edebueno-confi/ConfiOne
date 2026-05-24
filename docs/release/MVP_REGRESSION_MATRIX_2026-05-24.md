# MVP Regression Matrix - 2026-05-24

## Objetivo

Definir a matriz minima de regressao para liberar o MVP do Genius Support OS em piloto controlado, cobrindo papeis, rotas, acoes principais e boundaries criticos.

Esta matriz nao substitui testes automatizados, pgTAP, typecheck, build ou QA exploratorio humano. Ela define o minimo repetivel de release.

## Regras de execucao

- Usar apenas fixture funcional local ou massa sanitizada de staging.
- Nao usar CSV real, dados reais de clientes, secrets ou provider externo.
- Reidratar a fixture antes do smoke: `npm run supabase:qa:local-functional-fixture`.
- Em Windows local, usar timeout operacional de 10 a 15 minutos para a fixture funcional.
- Registrar ticket, internal action, work item e article slug usados no ciclo.
- Qualquer vazamento de dado interno no Portal/Public Help e bloqueador de release.

## Matriz

| Area | Papel | Rota | Acao principal | Resultado esperado | Boundary esperado | Prioridade | Execucao |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Auth | platform_admin | `/login` -> `/admin` | Login | Cai diretamente no Admin | Sem passagem indevida por `/access-denied` | P0 | Manual |
| Auth | support_manager | `/login` -> `/support/queue` | Login | Cai na fila de suporte | Sem acesso ao Admin por bypass | P0 | Manual |
| Auth | support_agent | `/login` -> `/support/queue` | Login | Cai na fila de suporte | Sem acesso ao Admin por bypass | P0 | Manual |
| Auth | internal_area_member | `/login` -> `/internal-actions` | Login | Cai na fila da area interna | Ve apenas areas com membership | P0 | Manual |
| Auth | internal_area_empty | `/internal-actions` | Abrir fila vazia | Ve empty state honesto | Nao cai em `/access-denied`; nao ve fila de outra area | P0 | Manual |
| Auth | internal_area_non_member | `/internal-actions` | Acesso direto | Bloqueado | Nao recebe empty state enganoso | P0 | Manual |
| Auth | engineering_member | `/login` -> `/engineering` | Login | Cai no workspace de engenharia | Nao ve Admin/Support fora do contrato | P0 | Manual |
| Auth | customer_user | `/login` -> `/portal` | Login | Cai no Portal | Nao ve rotas internas | P0 | Manual |
| Auth | customer_manager | `/login` -> `/portal` | Login | Cai no Portal | Escopo limitado ao tenant autorizado | P0 | Manual |
| Auth | public_anon | `/help/genius` | Acesso anonimo | Help publico abre | Apenas published/public | P0 | Manual |
| Admin | platform_admin | `/admin/tenants` | Abrir clientes B2B | Lista e detalhe carregam | Dados internos nao aparecem no Portal | P0 | Manual |
| Admin | platform_admin | `/admin/customer-portal` | Revisar acesso portal | Acesso customer-facing visivel | Sem secrets, sem dado real | P1 | Manual |
| Admin | platform_admin | `/admin/internal-areas` | Revisar memberships | Areas e membros carregam | Escrita apenas via RPC | P1 | Manual |
| Admin | platform_admin | `/admin/knowledge` | Abrir governanca Knowledge | Cockpit carrega | Publicacao continua governada | P0 | Manual |
| Admin | platform_admin | `/admin/system` | Ver readiness | Canais e AI readiness visiveis | Sem token, API key, provider real ou ledger bruto | P0 | Manual |
| Support | support_manager | `/support/queue` | Abrir fila | Tickets carregam com origem/canal | Sem botao de provider externo funcional | P0 | Manual |
| Support | support_manager | `/support/tickets/:ticketId` | Abrir ticket | Conversa, composer e rail carregam | Notas internas separadas de resposta publica | P0 | Manual |
| Support | support_manager | `/support/tickets/:ticketId` | Enviar resposta publica | Cliente ve resposta no Portal | Delivery apenas `customer_portal` | P0 | Manual |
| Support | support_manager | `/support/tickets/:ticketId` | Salvar nota interna | Support ve nota | Portal nao ve nota interna | P0 | Manual |
| Support | support_manager | `/support/tickets/:ticketId` | Vincular Knowledge publico | Link fica registrado | Cliente ve apenas artigo public/published enviado | P0 | Manual |
| Support | support_manager | `/support/tickets/:ticketId` | Tentar canal futuro | Acao bloqueada com motivo | Nao simula e-mail/WhatsApp/chat/API | P0 | Manual |
| Support | support_manager | `/support/customers` | Abrir lista de clientes | Lista B2B carrega | Nao vira CRM generico | P1 | Manual |
| Support | support_manager | `/support/customers/:tenantId` | Abrir cockpit cliente | Contexto operacional carrega | Alertas internos so para suporte/admin | P1 | Manual |
| Portal | customer_user | `/portal` | Abrir home | Home customer-facing carrega | Sem readiness interno/AI | P0 | Manual |
| Portal | customer_user | `/portal/tickets` | Listar tickets | Tickets do tenant/contato carregam | Sem tickets de outro tenant | P0 | Manual |
| Portal | customer_user | `/portal/tickets/:ticketId` | Criar/responder ticket | Mensagem aparece no Portal e Support | Sem nota interna, engenharia, internal action, audit bruto | P0 | Manual |
| Portal | customer_user | `/portal/tickets/:ticketId` | Baixar evidencia permitida | Grant curto funciona | Sem bucket/path/URL permanente | P0 | Manual |
| Portal | customer_user | `/portal/help` | Abrir ajuda autenticada | Artigos autorizados carregam | Sem draft/internal/restricted sem entitlement | P1 | Manual |
| Public Help | public_anon | `/help/genius` | Abrir central publica | Navegacao publica carrega | Somente published/public | P0 | Manual |
| Public Help | public_anon | `/help/genius/articles/:articleSlug` | Abrir artigo | Artigo publico carrega | Sem draft, advisory, source path ou metadata interna | P0 | Manual |
| Knowledge | platform_admin | `/admin/knowledge` | Ver artigos | Estados editoriais carregam | Sem publish automatico | P1 | Manual |
| Knowledge | support_manager | `/support/tickets/:ticketId` | Abrir painel Conhecimento | Links e candidatos carregam | Envio customer-facing so com backend `can_send_to_customer` | P0 | Manual |
| Internal Actions | support_manager | `/support/tickets/:ticketId` | Criar acionamento | Area recebe item | Ticket status nao muda automaticamente | P0 | Manual |
| Internal Actions | internal_area_member | `/internal-actions/:actionId` | Devolver ao suporte | Retorno aparece no Support | Cliente nao ve acionamento | P0 | Manual |
| Engineering | support_manager | `/support/tickets/:ticketId` | Criar work item | Engenharia recebe demanda | Cliente nao ve engenharia interna | P0 | Manual |
| Engineering | engineering_member | `/engineering/work-items/:workItemId` | Registrar update/retorno | Support ve retorno | Engenharia nao vira conversa direta com cliente | P0 | Manual |
| Customer Account | platform_admin | `/admin/tenants` | Abrir Conta B2B | Profile/stack/features carregam | Escrita governada por RPC | P1 | Manual |
| Customer Account | support_manager | `/support/customers/:tenantId` | Ver contexto | Produto/plano/alertas internos carregam | Portal nao ve alertas/customizacoes internas | P0 | Manual |
| Communication | support_manager | `/support/tickets/:ticketId` | Revisar delivery | Portal aparece como canal real | Externos bloqueados | P0 | Manual |
| Communication | platform_admin | `/admin/system` | Revisar canais | Portal ativo; externos futuros/bloqueados | Sem provider, token ou webhook | P0 | Manual |
| AI Readiness | platform_admin | `/admin/system` | Revisar AI-native readiness | Governanca visivel e IA inativa | Sem provider/modelo/API key/Copilot | P0 | Manual |
| AI Readiness | support_manager | `/support/tickets/:ticketId` | Procurar IA ativa | Nenhum botao ativo de gerar resposta | IA nao executa acao | P0 | Manual |
| AI Readiness | customer_user | `/portal` | Procurar readiness interna | Nada interno visivel | Portal nao ve AI readiness | P0 | Manual |

## Bloqueadores de release

- `git status --short` nao limpo antes de release.
- Falha em `contracts:typecheck`, `web:typecheck`, `web:build`, `supabase:lint:db`, `supabase:test:db` ou fixture funcional.
- Portal exibindo nota interna, internal actions, engineering internals, audit bruto, storage path, provider/readiness interno ou AI readiness.
- Public Help exibindo draft, internal, restricted sem contrato publico, advisory ou source path.
- Botao visivel que pareca executar provider externo, IA real ou acao sem RPC.
- Migration pendente nao revisada.
- Secrets, env, dumps, screenshots ou dados reais versionados.

## Riscos aceitaveis para piloto controlado

- QA exploratorio humano ainda precisar cobrir variacoes de copy e densidade visual.
- Fixture funcional ser pesada em Windows local.
- Observabilidade ainda ser manual e baseada em audit logs, ticket events, delivery ledger, Admin System e logs do Supabase.
- Canais externos e IA real permanecerem indisponiveis por decisao de MVP.
