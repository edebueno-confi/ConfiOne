# P0-C Private Routes Authenticated QA

Data: `2026-05-22`

Branch: `codex/phase7-5-z2-admin-access-system-blueprint`

## Sumário

O lote P0-C criou a fixture local funcional persistida e executou smoke autenticado em rotas privadas principais de Admin, Support, Internal Actions, Engineering e Customer Portal, além de smoke anônimo do Public Help. Não houve alteração de contrato funcional, migration produtiva, frontend ou backend de produto.

## Fixture criada

Comando oficial:

```bash
npm run supabase:qa:local-functional-fixture
```

Características:

- idempotente;
- bloqueada para Supabase local por `API_URL` e `DB_URL`;
- reaproveita `supabase/qa/create-local-support-fixture.mjs`;
- cria usuários QA de área interna com domínio local;
- adiciona membership de área interna via `rpc_admin_add_internal_area_membership`;
- cria acionamentos internos via `rpc_support_create_internal_action`;
- devolve um acionamento ao suporte via `rpc_internal_action_assign_to_self`, `rpc_internal_action_add_comment` e `rpc_internal_action_return_to_support`;
- imprime credenciais e IDs úteis no final.

## Usuários QA

| Papel | Email | Senha |
| --- | --- | --- |
| platform_admin | `qa.local.platform-admin@genius.local` | `LOCAL_QA_ADMIN_PASSWORD` |
| support_manager | `qa.local.support-manager-a@genius.local` | `LOCAL_QA_SUPPORT_MANAGER_PASSWORD` |
| support_agent | `qa.local.support-agent-a@genius.local` | `LOCAL_QA_SUPPORT_AGENT_PASSWORD` |
| internal_area_member | `qa.local.internal-area-member@genius.local` | `LOCAL_QA_INTERNAL_AREA_MEMBER_PASSWORD` |
| internal_area_non_member | `qa.local.internal-area-non-member@genius.local` | `LOCAL_QA_INTERNAL_AREA_NON_MEMBER_PASSWORD` |
| engineering_member | `qa.local.engineering-member-a@genius.local` | `LOCAL_QA_ENGINEERING_PASSWORD` |
| customer_user | `marina.ops@support-qa-a.local` | `LOCAL_QA_CLIENT_PASSWORD` |
| customer_manager | `gestao.portal@support-qa-a.local` | `LOCAL_QA_CUSTOMER_MANAGER_PASSWORD` |

## IDs úteis da execução local

| Entidade | ID / slug |
| --- | --- |
| Tenant A | `ba69ddb9-aa0c-4edc-b791-0c00db5e1f38` / `support-qa-a` |
| Ticket principal | `734a5b81-3123-435d-a4f7-f76092b79d08` |
| Internal action aberta | `a0db3e33-db8c-4bcf-bfca-a0b53ce905c5` |
| Internal action devolvida | `30c38694-57fe-4e36-8dc1-4c05c720d1bc` |
| Work item técnico | `5aeaefb7-ce10-4bb6-8340-ca726a137231` |
| Artigo público | `como-compartilhar-evidencias-em-um-ticket` |
| Artigo interno | `erp-diagnostico-interno-webhook` |
| Artigo restrito autorizado | `expedicao-checklist-autenticado-tenant-a` |
| Artigo restrito não autorizado | `erp-observacoes-restritas-rollout` |

Observação: IDs locais podem mudar se o banco for resetado. Rode novamente a fixture funcional antes de QA autenticado.

## Rotas testadas

### Admin / platform_admin

| Rota | Resultado | Métrica visual |
| --- | --- | --- |
| `/admin/knowledge` | Abriu sem erro cru. | `1366x900`, `scrollHeight=900`, sem scroll global. |
| `/admin/customer-portal` | Abriu sem erro cru. | `1366x900`, `scrollHeight=900`, sem scroll global. |
| `/admin/internal-areas` | Abriu sem erro cru e com governança de áreas. | `1366x900`, `scrollHeight=900`, sem scroll global. |
| `/admin/access` | Abriu sem erro cru. | `1366x900`, `scrollHeight=900`, sem scroll global. |
| `/admin/tenants` | Abriu sem erro cru. | `1366x900`, `scrollHeight=900`, sem scroll global. |

### Support / support_manager

| Rota | Resultado | Métrica visual |
| --- | --- | --- |
| `/support/queue` | Fila abriu com tickets da fixture. | `1366x900`, `scrollHeight=900`, sem scroll global. |
| `/support/tickets/734a5b81-3123-435d-a4f7-f76092b79d08` | Ticket abriu com timeline, nota interna, acionamentos, engenharia, evidências e Knowledge. | `1366x900`, `scrollHeight=900`, sem scroll global. |
| `/support/customers/ba69ddb9-aa0c-4edc-b791-0c00db5e1f38` | Cliente B2B abriu sem erro cru. | `1366x900`, `scrollHeight=900`, sem scroll global. |

### Internal Actions

| Usuário | Rota | Resultado | Métrica visual |
| --- | --- | --- | --- |
| internal_area_member | `/internal-actions` | Vê acionamentos da área `finance`; a rota seleciona detalhe disponível. | `1366x900`, `scrollHeight=1387`, com scroll global. |
| internal_area_member | `/internal-actions/a0db3e33-db8c-4bcf-bfca-a0b53ce905c5` | Detalhe abriu com timeline e ação da própria área. | `1366x900`, `scrollHeight=1125`, com scroll global. |
| internal_area_non_member | `/internal-actions` | Não vê acionamentos fora de membership; contadores zerados e sem erro cru. | `1366x900`, `scrollHeight=900`, sem scroll global. |

### Engineering / engineering_member

| Rota | Resultado | Métrica visual |
| --- | --- | --- |
| `/engineering` | Fila técnica abriu com work items da fixture. | `1366x900`, `scrollHeight=900`, sem scroll global. |
| `/engineering/work-items/5aeaefb7-ce10-4bb6-8340-ca726a137231` | Work item abriu sem erro cru e com sinais de update técnico. | `1366x900`, `scrollHeight=900`, sem scroll global. |

### Customer Portal

| Usuário | Rota | Resultado | Métrica visual |
| --- | --- | --- | --- |
| customer_manager | `/portal` | Mostra tenant autorizado `support-qa-a` e resumo do portal. | `1366x900`, `scrollHeight=900`, sem scroll global. |
| customer_manager | `/portal/tickets` | Lista tickets autorizados do tenant. | `1366x900`, `scrollHeight=900`, sem scroll global. |
| customer_manager | `/portal/tickets/734a5b81-3123-435d-a4f7-f76092b79d08` | Abre ticket sem nota interna, internal actions, engineering internals, audit bruto ou storage path. | `1366x900`, `scrollHeight=900`, sem scroll global. |
| customer_manager | `/portal/help` | Lista Knowledge autorizada por contrato customer-facing. | `1366x900`, `scrollHeight=900`, sem scroll global. |
| customer_manager | `/portal/help/expedicao-checklist-autenticado-tenant-a` | Artigo restrito com entitlement abre corretamente. | `1366x900`, `scrollHeight=900`, sem scroll global. |
| customer_manager | `/portal/help/erp-diagnostico-interno-webhook` | Artigo interno bloqueado por slug direto. | `1366x900`, `scrollHeight=900`, sem scroll global. |
| customer_manager | `/portal/help/erp-observacoes-restritas-rollout` | Artigo restrito sem entitlement bloqueado por slug direto. | `1366x900`, `scrollHeight=900`, sem scroll global. |
| customer_user | `/portal/tickets/734a5b81-3123-435d-a4f7-f76092b79d08` | Abre ticket autorizado sem vazamentos internos. | `1366x900`, `scrollHeight=900`, sem scroll global. |

### Public Help / anônimo

| Rota | Resultado | Métrica visual |
| --- | --- | --- |
| `/help/genius` | Lista central pública published/public. | `1366x900`, `scrollHeight=1749`, com scroll global esperado. |
| `/help/genius/articles` | Lista artigos públicos sem conteúdo internal/restricted/draft. | `1366x900`, `scrollHeight=900`, sem scroll global. |
| `/help/genius/articles/como-compartilhar-evidencias-em-um-ticket` | Artigo público published abre corretamente. | `1366x900`, `scrollHeight=984`, com scroll global. |
| `/help/genius/articles/erp-diagnostico-interno-webhook` | Slug interno retorna estado sem dados. | `1366x900`, `scrollHeight=900`, sem scroll global. |
| `/help/genius/articles/erp-observacoes-restritas-rollout` | Slug restrito retorna estado sem dados. | `1366x900`, `scrollHeight=900`, sem scroll global. |
| `/help/genius/articles/rascunho-restrito-que-nao-pode-vazar` | Slug draft/restricted retorna estado sem dados. | `1366x900`, `scrollHeight=900`, sem scroll global. |

## Boundaries validados

- Public Help não mostrou artigo interno, restrito ou draft por lista ou slug direto.
- Portal Cliente não mostrou nota interna, internal actions, engineering internals, audit bruto, `storage_bucket` ou `storage_object_path`.
- Portal Cliente respeitou tenant ativo autorizado para `support-qa-a`.
- Artigo restrito com entitlement abriu no Portal.
- Artigo interno e artigo restrito sem entitlement foram bloqueados no Portal.
- Usuário sem membership de área interna não viu acionamentos da área `finance`.
- Internal Actions permaneceram vinculadas ao ticket sem alteração automática de `ticket.status`; o ticket principal continuou `waiting_engineering`.
- Engineering abriu apenas no contexto interno e não apareceu no Portal como detalhe técnico bruto.

## Falhas e achados

- O primeiro login de usuários não-admin redireciona para `/access-denied`, porque o fluxo padrão pós-login tenta abrir `/admin`. A sessão fica válida e as rotas corretas por papel funcionam ao navegar diretamente. Esse é um achado de UX/redirect para lote futuro, não bloqueou o QA autenticado.
- O primeiro disparo da fixture funcional estourou o timeout curto de 4 minutos. Com janela operacional adequada, o comando concluiu e a segunda execução confirmou idempotência.
- Houve um erro de console esperado por tentativa manual de preenchimento via `page.evaluate` sem sincronizar o estado controlado do formulário: `400 Bad Request` em `/auth/v1/token` com `missing email or phone`. A autenticação real via preenchimento Playwright funcionou.
- O script legado de suporte emite warning Node `DEP0190` por uso de child process com shell em trecho já existente. Não foi alterado neste lote por estar fora do escopo funcional.

## Correções aplicadas

- Criado `supabase/qa/create-local-functional-fixture.mjs`.
- Adicionado script `supabase:qa:local-functional-fixture` no `package.json`.
- Atualizada a documentação local de QA com credenciais e comando oficial.

Não houve correção em runtime de produto, contrato, migration, RLS ou UI.

## Validações

- `node --check supabase/qa/create-local-functional-fixture.mjs` passou.
- `npm run supabase:qa:local-functional-fixture` passou.
- Segunda execução de `npm run supabase:qa:local-functional-fixture` passou e confirmou idempotência.
- Smoke browser autenticado em `http://127.0.0.1:5173` executado para Admin, Support, Internal Actions, Engineering, Customer Portal e Public Help.

## Riscos restantes

- Corrigir o redirect pós-login por role/contexto para evitar ida inicial indevida a `/admin` para usuários não-admin.
- Investigar/remover warning `DEP0190` no script legado de suporte em lote de manutenção de tooling.
- Manter IDs do relatório como evidência da execução local atual; após reset local, reexecutar a fixture para obter IDs novos.
