# P1-C Auth Redirect by Role

Data: `2026-05-22`

Branch: `codex/p1-c-auth-redirect-by-role`

## Sumario

O lote corrigiu o redirect inicial pós-login para resolver a landing page por papel/contexto autenticado, sem criar backend novo, migration, RLS, contrato paralelo ou redesign de login. O login deixou de usar `/admin/tenants` como fallback universal e passou a consultar read models existentes antes de navegar.

## Causa raiz

- `LoginPage` normalizava ausência de `redirectTo` para `/admin/tenants`.
- Usuários não-admin autenticavam corretamente, mas eram enviados ao `AdminGate`.
- O `AdminGate` negava corretamente quem não tinha `platform_admin`, resultando em `/access-denied` como etapa intermediária indevida.
- `/internal-actions` também não estava contemplada na whitelist anterior de redirect explícito.

## Contrato usado

- Global/internal roles: `vw_admin_auth_context`.
- Portal customer-facing: `vw_customer_portal_auth_context`.
- Área interna acionada: `vw_internal_action_queue_by_area`.
- Nenhuma permissão nova foi decidida por e-mail, `localStorage`, mock ou regra persistida no frontend.
- Os gates finais continuam sendo a barreira real das rotas. O helper de login apenas escolhe destino inicial.

## Matriz final

| Contexto | Destino default |
| --- | --- |
| `platform_admin` | `/admin` |
| `support_manager` | `/support/queue` |
| `support_agent` | `/support/queue` |
| membro ativo de área interna com fila visível | `/internal-actions` |
| `engineering_member` / `engineering_manager` | `/engineering` |
| `customer_user` / `customer_manager` com contexto portal ativo | `/portal` |
| usuário autenticado sem área autorizada | `/access-denied` |

## `redirectTo`

- `redirectTo` relativo e autorizado é preservado.
- `redirectTo` para `/login` ou `/access-denied` é ignorado.
- `redirectTo` proibido não bypassa gate e cai no destino default do papel.
- Rotas públicas `/help/*` continuam podendo ser destino explícito.

## QA autenticado

| Papel | Email | Senha | Esperado | Resultado |
| --- | --- | --- | --- | --- |
| platform_admin | `qa.local.platform-admin@genius.local` | `Local-QA-Admin-2026!` | `/admin` | abriu `/admin/tenants` pelo index route |
| support_manager | `qa.local.support-manager-a@genius.local` | `Local-QA-Manager-A-2026!` | `/support/queue` | abriu `/support/queue` |
| support_agent | `qa.local.support-agent-a@genius.local` | `Local-QA-Agent-A-2026!` | `/support/queue` | abriu `/support/queue` |
| internal_area_member | `qa.local.internal-area-member@genius.local` | `Local-QA-Internal-Area-2026!` | `/internal-actions` | abriu `/internal-actions/a0db3e33-db8c-4bcf-bfca-a0b53ce905c5` pelo auto-select da rota |
| engineering_member | `qa.local.engineering-member-a@genius.local` | `Local-QA-Engineering-A-2026!` | `/engineering` | abriu `/engineering` |
| customer_user | `marina.ops@support-qa-a.local` | `Local-QA-Customer-A-2026!` | `/portal` | abriu `/portal` |
| customer_manager | `gestao.portal@support-qa-a.local` | `Local-QA-Customer-Manager-A-2026!` | `/portal` | abriu `/portal` |
| internal_area_non_member | `qa.local.internal-area-non-member@genius.local` | `Local-QA-Internal-NoArea-2026!` | `/access-denied` | abriu `/access-denied` |

## Cenários `redirectTo` testados

| Usuário | `redirectTo` | Resultado |
| --- | --- | --- |
| support_manager | `/support/customers/ba69ddb9-aa0c-4edc-b791-0c00db5e1f38` | preservado |
| support_manager | `/admin/tenants` | caiu em `/support/queue` |
| customer_manager | `/admin/tenants` | caiu em `/portal` |

## Acesso negado

- `customer_manager` autenticado navegando diretamente para `/admin/tenants` foi redirecionado para `/access-denied`.
- `internal_area_non_member` autenticado sem workspace autorizado caiu em `/access-denied`.

## Limites mantidos

- Sem backend novo.
- Sem migration.
- Sem alteração de RLS.
- Sem alteração de contratos de domínio.
- Sem redesign do login.
- Sem decisão por e-mail.
- Sem criação de auth paralela.

## Riscos restantes

- A detecção de membro de área interna usa a fila contratual `vw_internal_action_queue_by_area`. Se um membro ativo não tiver nenhum acionamento visível, o login não consegue diferenciar "membro sem fila" de "sem workspace autorizado" sem um read model dedicado de contexto de área.
- O warning `DEP0190` do script legado de fixture permanece fora do escopo deste lote.

## Validações

- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:qa:local-functional-fixture`
- Smoke browser autenticado em `http://127.0.0.1:5173/login` para todos os papéis da matriz.
