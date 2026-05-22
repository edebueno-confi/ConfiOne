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

### Content author QA

- `ede.oliveira@confi.com.vc`
- senha: `Admin123!`
- papel global esperado: `platform_admin`

## Observações operacionais

- Para validar `/support/tickets/:ticketId`, prefira primeiro reidratar a fixture local de suporte.
- A fixture local de suporte pode recriar os tickets com novos UUIDs. Não assuma que um `ticketId` antigo continua válido após reidratação.
- Depois de reidratar, abra `/support/queue` ou `/support/tickets` e use um ticket atual da fila para validar o workspace autenticado.
- `Invalid login credentials` indica drift de fixture/credencial/Auth.
- `Failed to fetch` ou `502` no Kong/Auth local indica instabilidade do runtime local e deve ser tratado separadamente de credencial inválida.
