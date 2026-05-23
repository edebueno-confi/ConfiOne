# Local QA Auth

Credenciais locais de QA para o Genius Support OS.

Escopo:
- apenas ambiente local com Supabase local;
- não usar em produção;
- não copiar para `.env`;
- reidratação sempre via fixture oficial.

## Reidratação oficial

```bash
npm run supabase:qa:local-support-fixture
```

Esse comando recria o conjunto canônico de QA do Support Workspace, incluindo usuários Auth, `profiles`, roles globais e memberships do tenant fixture.

Para QA funcional autenticado ponta a ponta das rotas privadas, use:

```bash
npm run supabase:qa:local-functional-fixture
```

Esse comando reaproveita a fixture de suporte, valida que o Supabase é local, cria usuários estáveis de área interna, adiciona membership `finance` por RPC administrativa e materializa acionamentos internos persistidos para `/internal-actions` e `/support/tickets/:ticketId`.

Desde o lote P1-B, a fixture funcional também preserva o ticket QA principal com título customer-facing sanitizado:

```text
QA Support | Operação crítica com histórico extenso, anexos e retorno operacional
```

O título legado com `handoff técnico` é reconhecido apenas para atualizar massa local antiga sem duplicar ticket.

## Credenciais locais de referência

### Support Workspace

- `qa.local.support-manager-a@genius.local`
- senha: `Local-QA-Manager-A-2026!`
- papel global: `support_manager`
- membership esperada: tenant fixture `support-qa-a`, status `active`

### Admin QA

- `qa.local.platform-admin@genius.local`
- senha: `Local-QA-Admin-2026!`
- papel global: `platform_admin`

### Área interna

- `qa.local.internal-area-member@genius.local`
- senha: `Local-QA-Internal-Area-2026!`
- papel operacional: membro ativo da área `finance` no tenant `support-qa-a`

- `qa.local.internal-area-non-member@genius.local`
- senha: `Local-QA-Internal-NoArea-2026!`
- papel operacional: usuário ativo no tenant `support-qa-a`, sem membership de área interna

### Engineering

- `qa.local.engineering-member-a@genius.local`
- senha: `Local-QA-Engineering-A-2026!`
- papel global: `engineering_member`

### Customer Portal

- `marina.ops@support-qa-a.local`
- senha: `Local-QA-Customer-A-2026!`
- papel customer-facing: `customer_user`

- `gestao.portal@support-qa-a.local`
- senha: `Local-QA-Customer-Manager-A-2026!`
- papel customer-facing: `customer_manager`

### Content author QA

- `ede.oliveira@confi.com.vc`
- senha: `Admin123!`
- papel global esperado: `platform_admin`

## Observações operacionais

- Para validar `/support/tickets/:ticketId`, prefira primeiro reidratar a fixture local de suporte.
- A fixture local de suporte pode recriar os tickets com novos UUIDs. Não assuma que um `ticketId` antigo continua válido após reidratação.
- A fixture funcional imprime IDs atuais de tenant, ticket, acionamentos internos, work item e slugs de Knowledge no final da execução.
- Para QA do Portal, valide o ticket atual impresso pela fixture e confirme ausência de termos internos como `handoff técnico`, `retorno de engenharia`, `storage_bucket`, `storage_object_path`, `internal_actions` e `engineering_work_items`.
- Depois de reidratar, abra `/support/queue` ou `/support/tickets` e use um ticket atual da fila para validar o workspace autenticado.
- `Invalid login credentials` indica drift de fixture/credencial/Auth.
- `Failed to fetch` ou `502` no Kong/Auth local indica instabilidade do runtime local e deve ser tratado separadamente de credencial inválida.
