# P4-A MVP Operational Closure & End-to-End Workflow Hardening

Data: 2026-05-24
Branch: `codex/p4-a-mvp-operational-closure`

## Objetivo

Validar e endurecer o fluxo MVP ponta a ponta do Genius Support OS, confirmando que Cliente B2B, Portal, Support Workspace, Knowledge, Internal Actions, Engineering, Customer Account, delivery, channel governance e AI-native readiness convivem como operação real, sem ação fake e sem criar feature avançada.

## Auditoria inicial resumida

- O backend já expõe os fluxos MVP por views/read models e RPCs: tickets, mensagens públicas, notas internas, delivery via Portal, Knowledge links, evidências, Internal Actions, Engineering, Customer Account, channel readiness e AI readiness.
- O frontend de Support, Portal, Admin, Internal Actions e Engineering consome `vw_*`/RPCs reais. Não foi identificado DML direto para operações de ticketing nas superfícies auditadas.
- Canais externos continuam bloqueados pelo backend; `customer_portal` permanece o único canal real.
- IA continua apenas preparada e governada; não há provider, modelo, embedding, job, Copilot ou botão de geração.
- A fixture funcional local concluiu com timeout maior; a primeira tentativa de 240s expirou por duração da fixture, não por hang silencioso.

## Fluxos MVP validados

1. Portal abriu ticket via `rpc_customer_create_ticket`.
2. Support viu o ticket na `vw_support_tickets_queue` com canal `Portal do cliente` e resposta permitida.
3. Support respondeu via `rpc_add_ticket_message`; Portal exibiu a resposta pública.
4. Support adicionou nota interna via `rpc_add_internal_ticket_note`; Portal não exibiu a nota.
5. Support vinculou Knowledge público via `rpc_support_link_ticket_article`; Portal viu apenas o artigo enviado.
6. Support criou acionamento interno via `rpc_support_create_internal_action`; área interna viu o item e devolveu retorno.
7. Support criou vínculo técnico via `rpc_support_create_engineering_work_item_from_ticket`; engenharia registrou update e retorno.
8. Support timeline preservou nota interna, eventos de Internal Actions e eventos de Engineering.
9. Evidências da fixture foram validadas por `vw_support_ticket_attachments` e `vw_customer_portal_ticket_attachments`; Portal recebeu apenas metadata sanitizada.
10. Ticket de e-mail futuro bloqueou resposta pública com motivo backend: `E-mail ainda nao esta integrado para resposta direta.`
11. Admin leu AI readiness por `vw_ai_operational_context_readiness`, sem ativação real.

## IDs úteis do QA P4

- Tenant: `c12185f7-cc66-4731-b1e5-aa81023ef1a8`
- Ticket P4 validado: `4d7d5c2e-6e3b-4bba-b3e6-76ed6ab8990b`
- Internal action P4: `9cc7e9c7-4a59-40a9-bc8a-7b43b306b35d`
- Engineering work item P4: `8cbc6ad0-ae1f-4a86-8b73-9190cb2671c4`
- Ticket futuro e-mail bloqueado: `8e5ee201-7e27-45ef-9e61-f3209f6ad203`
- Ticket com evidências da fixture: `b86df683-9756-4047-b954-350e02063aa2`
- Artigo público usado: `como-compartilhar-evidencias-em-um-ticket`

## Usuários e senhas QA

- `platform_admin`: `qa.local.platform-admin@genius.local` / `Local-QA-Admin-2026!`
- `support_manager`: `qa.local.support-manager-a@genius.local` / `Local-QA-Manager-A-2026!`
- `support_agent`: `qa.local.support-agent-a@genius.local` / `Local-QA-Agent-A-2026!`
- `internal_area_member`: `qa.local.internal-area-member@genius.local` / `Local-QA-Internal-Area-2026!`
- `internal_area_empty`: `qa.local.internal-area-empty@genius.local` / `Local-QA-Internal-Empty-2026!`
- `internal_area_non_member`: `qa.local.internal-area-non-member@genius.local` / `Local-QA-Internal-NoArea-2026!`
- `engineering_member`: `qa.local.engineering-member-a@genius.local` / `Local-QA-Engineering-A-2026!`
- `customer_user`: `marina.ops@support-qa-a.local` / `Local-QA-Customer-A-2026!`
- `customer_manager`: `gestao.portal@support-qa-a.local` / `Local-QA-Customer-Manager-A-2026!`

## Rotas testadas

Admin:
- `/admin/tenants`
- `/admin/customer-portal`
- `/admin/internal-areas`
- `/admin/knowledge`
- `/admin/system`

Support:
- `/support/queue`
- `/support/tickets/4d7d5c2e-6e3b-4bba-b3e6-76ed6ab8990b`
- `/support/customers/c12185f7-cc66-4731-b1e5-aa81023ef1a8`

Portal:
- `/portal`
- `/portal/tickets/4d7d5c2e-6e3b-4bba-b3e6-76ed6ab8990b`
- `/portal/help/como-compartilhar-evidencias-em-um-ticket`

Internal Actions:
- `/internal-actions`
- `/internal-actions/9cc7e9c7-4a59-40a9-bc8a-7b43b306b35d`

Engineering:
- `/engineering/work-items/8cbc6ad0-ae1f-4a86-8b73-9190cb2671c4`

Public Help:
- `/help/genius/articles/como-compartilhar-evidencias-em-um-ticket`

## Achados visuais e funcionais

- Rotas operacionais auditadas em viewport `1440x900`.
- Não houve scroll horizontal global nas rotas privadas testadas.
- Public Help tem scroll global natural por ser página documental pública.
- Não houve erro de console relevante na leitura final de console.
- Support Workspace manteve conversa, fila e contexto operacional sem virar CRM pesado.
- Portal manteve conversa limpa, sem termos técnicos internos.
- Admin System exibiu readiness de canais e AI-native readiness sem campo de segredo, provider ou botão de ativação.

## Boundaries confirmados

- Portal não vê nota interna.
- Portal não vê Internal Actions.
- Portal não vê engenharia interna.
- Portal não vê audit bruto.
- Portal não vê storage path/bucket.
- Portal não vê provider/readiness interno.
- Portal não vê AI readiness.
- Public Help só mostra conteúdo publicado/público.
- Support não simula provider externo.
- Delivery não altera `ticket.status`.
- Internal Actions não alteram `ticket.status` automaticamente.
- Engineering não vira conversa direta com cliente.
- IA não executa ação.
- Nenhum token, segredo ou API key foi criado.

## Correções aplicadas

Nenhuma correção de produto foi necessária. O lote aplicou fechamento documental e QA autenticado/funcional. As falhas intermediárias ocorreram em scripts ad hoc de QA por nomes de colunas/parâmetros incorretos e não indicaram bug do produto; as assinaturas reais dos clients já estavam corretas.

## Validações executadas

- `npm run contracts:typecheck`: PASS.
- `npm run web:typecheck`: PASS.
- `npm run web:build`: PASS.
- `npm run supabase:lint:db`: PASS.
- `npm run supabase:test:db`: PASS, 47 arquivos e 979 testes.
- `npm run supabase:qa:local-functional-fixture`: PASS antes do QA funcional com timeout maior.
- `npm run supabase:qa:local-functional-fixture`: PASS após QA funcional.
- `npm run supabase:qa:local-functional-fixture`: PASS novamente para idempotência.
- QA funcional por Supabase Auth + views/RPCs reais: PASS.
- QA de evidências sanitizadas por views Support/Portal: PASS.
- Browser smoke autenticado em Admin, Support, Portal, Internal Actions, Engineering e Public Help: PASS.

## Riscos restantes

- A fixture funcional é pesada e pode passar de quatro minutos em Windows local; usar timeout operacional maior nos gates.
- O lote validou o fluxo MVP com dados locais sanitizados, não substitui QA exploratório humano de todos os botões administrativos.
- Os tickets P4 criados por QA permanecem no banco local até próxima reidratação/reset; não são dados reais e não foram versionados.

## Próxima fase recomendada

`P4-B MVP Release Readiness & Regression Matrix`: consolidar matriz de regressão manual/automática para release interno do MVP, com foco em repetibilidade de QA, critérios de aceite por papel e evidências sem screenshots versionados.
