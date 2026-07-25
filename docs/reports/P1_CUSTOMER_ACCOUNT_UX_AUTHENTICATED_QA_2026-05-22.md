# P1-B Customer Account UX + Authenticated QA Pass

Data: `2026-05-22`

Branch: `codex/p1-b-customer-account-ux-authenticated-qa`

## Sumário

O lote validou a experiência operacional de Customer Account com fixture local autenticada, ajustou lacunas pequenas de UX/admin e sanitizou textos customer-facing da fixture para não carregar linguagem interna como evidência de QA. Não houve migration, alteração de contrato backend, importação de CSV ou uso de dados reais.

## Auditoria inicial

- `/admin/tenants` já consumia `vw_admin_customer_account_*` e escrevia por RPCs administrativas.
- `/support/customers`, `/support/customers/:tenantId` e `/support/tickets/:ticketId` já consumiam contexto operacional por read models de suporte.
- `/portal`, `/portal/tickets` e `/portal/help` continuavam sem receber tabelas ou campos internos de Customer Account.
- Ações reais presentes antes do lote: salvar profile, adicionar integração, adicionar customização, adicionar alerta, arquivar integração/customização/alerta e alterar feature flag.
- Lacuna encontrada: edição de integração/customização/alerta existente não estava exposta na aba `Conta B2B`, apesar dos RPCs `update` existirem.
- Lacuna de QA encontrada: a fixture usava termos como `handoff técnico` e `retorno de engenharia` em título/descrição/mensagem customer-facing de ticket.

## Usuários QA

| Papel | Email | Senha | Rotas testadas |
| --- | --- | --- | --- |
| platform_admin | `qa.local.platform-admin@genius.local` | `LOCAL_QA_ADMIN_PASSWORD` | `/admin/tenants` |
| support_manager | `qa.local.support-manager-a@genius.local` | `LOCAL_QA_SUPPORT_MANAGER_PASSWORD` | `/support/customers`, `/support/customers/:tenantId`, `/support/tickets/:ticketId` |
| support_agent | `qa.local.support-agent-a@genius.local` | `LOCAL_QA_SUPPORT_AGENT_PASSWORD` | `/support/customers` |
| customer_user | `marina.ops@support-qa-a.local` | `LOCAL_QA_CLIENT_PASSWORD` | `/portal/tickets/:ticketId` |
| customer_manager | `gestao.portal@support-qa-a.local` | `LOCAL_QA_CUSTOMER_MANAGER_PASSWORD` | `/portal`, `/portal/tickets`, `/portal/help`, artigos autorizados/bloqueados |

Observação: usuários não-admin ainda redirecionam inicialmente para `/access-denied` após login, e a sessão fica válida para navegação direta à rota correta. Esse achado já existia no P0-C.

## IDs úteis

| Entidade | ID / valor |
| --- | --- |
| Tenant QA A | `ba69ddb9-aa0c-4edc-b791-0c00db5e1f38` / `support-qa-a` |
| Ticket QA principal | `734a5b81-3123-435d-a4f7-f76092b79d08` |
| Ticket QA principal sanitizado | `QA Support | Operação crítica com histórico extenso, anexos e retorno operacional` |
| Customer account profile | `456a5d63-5e8c-412d-903a-9c170522b9b3` |
| Artigo restrito autorizado | `expedicao-checklist-autenticado-tenant-a` |
| Artigo interno bloqueado | `erp-diagnostico-interno-webhook` |
| Artigo restrito sem entitlement | `erp-observacoes-restritas-rollout` |

## Rotas testadas

| Rota | Usuário | Resultado | Métrica visual |
| --- | --- | --- | --- |
| `/admin/tenants` | platform_admin | Lista abriu, tenant QA A selecionado, aba `Conta B2B` carregou profile, integrações, customizações, alertas, features e ações reais. Edição de integração entrou em modo edição e chamou salvar sem erro cru. | `1920x893`, sem scroll global, sem scroll horizontal |
| `/support/customers` | support_manager | Lista operacional carregou cliente B2B, recortes úteis, preview e sinais de conta; não parece CRM comercial. | `1920x893`, sem scroll global, sem scroll horizontal |
| `/support/customers` | support_agent | Login real validado; rota abriu a carteira permitida sem erro cru. | `1920x893`, sem scroll global, sem scroll horizontal |
| `/support/customers/:tenantId` | support_manager | Cockpit mostrou perfil, tickets recentes, contatos, sinais, integrações e contexto operacional sem dados sensíveis. | `1920x893`, sem scroll global, sem scroll horizontal |
| `/support/tickets/:ticketId` | support_manager | Ticket manteve conversa/fila como foco e contexto de cliente no rail sem virar CRM pesado. | `1920x893`, sem scroll global, sem scroll horizontal |
| `/portal` | customer_manager | Portal carregou somente contexto autorizado e copy customer-facing sanitizada. | `1920x893`, sem scroll global, sem scroll horizontal |
| `/portal/tickets` | customer_manager | Lista carregou tickets autorizados sem campos internos de Customer Account. | `1920x893`, sem scroll global, sem scroll horizontal |
| `/portal/tickets/:ticketId` | customer_user | Ticket abriu com título/descrição sanitizados, sem `TOTVS`, `CORREIOS`, alertas internos, customizações internas, audit, storage path ou internal actions. | `1920x893`, sem scroll global, sem scroll horizontal |
| `/portal/help` | customer_manager | Central autorizada carregou artigos permitidos. | `1920x893`, sem scroll global, sem scroll horizontal |
| `/portal/help/expedicao-checklist-autenticado-tenant-a` | customer_manager | Artigo restrito autorizado abriu. | `1920x893`, sem scroll global, sem scroll horizontal |
| `/portal/help/erp-diagnostico-interno-webhook` | customer_manager | Artigo interno bloqueado por slug direto. | `1920x893`, sem scroll global, sem scroll horizontal |
| `/portal/help/erp-observacoes-restritas-rollout` | customer_manager | Artigo restrito sem entitlement bloqueado por slug direto. | `1920x893`, sem scroll global, sem scroll horizontal |

## Correções aplicadas

- `/admin/tenants`: aba `Conta B2B` passou a permitir editar integração, customização e alerta existentes por RPC administrativa.
- `/admin/tenants`: edição de integração deixa tipo/provedor bloqueados com motivo operacional, porque o contrato atual só atualiza status, ambiente e nota segura.
- `/portal`: copy customer-facing deixou de citar explicitamente áreas internas como suporte interno, engenharia e auditoria.
- `/portal/tickets/:ticketId`: descrição da timeline foi reescrita em linguagem de acompanhamento do cliente.
- Fixture funcional: título, descrição e mensagens customer-facing do ticket QA principal foram sanitizados para `retorno operacional`.
- Fixture funcional: suporte a título legado evita duplicar o ticket ao atualizar o título da massa local.

## Boundaries

- Portal não mostrou dados internos de Customer Account: alertas, customizações, integrações internas, observações, audit bruto, storage path, engineering internals ou internal actions.
- Support permaneceu read-only para Customer Account e não virou CRM comercial.
- Admin continuou escrevendo somente por RPCs administrativas.
- Frontend não passou a ler tabelas `customer_account_*` diretamente.
- Nenhum CSV, planilha real, dump ou dado real foi usado.

## Achados visuais

- Admin `Conta B2B` permanece denso, mas agora as ações principais são completas para o corte mínimo.
- Support Customers está em densidade operacional adequada: lista/preview dominantes e sem linguagem de CRM comercial.
- Ticket Workspace mantém o contexto de cliente como apoio ao atendimento, sem roubar foco da conversa.
- Portal está limpo de termos internos no copy principal após ajuste.

## Riscos restantes

- Redirect pós-login de usuários não-admin ainda cai primeiro em `/access-denied`; corrigir em lote de auth shell/redirect.
- Edição de integração ainda não muda tipo/provedor por contrato; comportamento está explícito na UI.
- Contatos B2B tipados por função operacional/técnica/financeira/CS continuam backlog.
- Warning Node `DEP0190` permanece em script legado de fixture de suporte.

## Validações

- `node --check supabase/qa/create-local-support-fixture.mjs` passou.
- `node --check supabase/qa/create-local-functional-fixture.mjs` passou.
- `npm run contracts:typecheck` passou.
- `npm run web:typecheck` passou.
- `npm run web:build` passou.
- `npm run supabase:lint:db` passou.
- `npm run supabase:test:db` passou com `43` arquivos e `887` testes.
- `npm run supabase:qa:local-functional-fixture` passou duas vezes após a sanitização da fixture.

## Próxima fase recomendada

Executar um lote pequeno de `Auth Redirect by Role`, para levar `support_manager`, `support_agent`, `customer_user`, `customer_manager`, `engineering_member` e membros de áreas internas diretamente à rota inicial correta após login, sem depender de navegação manual depois de `/access-denied`.
