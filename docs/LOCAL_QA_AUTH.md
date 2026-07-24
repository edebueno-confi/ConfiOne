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

Esse comando reaproveita a fixture de suporte, valida que o Supabase é local, cria usuários estáveis de área interna, adiciona memberships `finance`, `operations` e `customer_success` por RPC administrativa e materializa acionamentos internos persistidos para `/internal-actions`, `/support/tickets/:ticketId` e carteira tenant-aware para `/cs/portfolio`.

Desde o P3-B, a fixture funcional e a fixture de suporte possuem logs de etapa e timeouts explícitos para Supabase CLI, child process, Edge Runtime health check, Auth, RPCs e upload seguro. Se o ambiente local ficar indisponível, o comando deve falhar com etapa identificável em vez de permanecer pendurado sem saída.

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

- `qa.local.internal-area-empty@genius.local`
- senha: `Local-QA-Internal-Empty-2026!`
- papel operacional: membro ativo da área `operations` no tenant `support-qa-a`, sem acionamentos persistidos pela fixture

- `qa.local.internal-area-non-member@genius.local`
- senha: `Local-QA-Internal-NoArea-2026!`
- papel operacional: usuário ativo no tenant `support-qa-a`, sem membership de área interna

### Customer Success

- `qa.local.customer-success-a@genius.local`
- senha: `Local-QA-Customer-Success-A-2026!`
- papel operacional: membership ativa `customer_success` no tenant `support-qa-a`
- escopo esperado: apenas clientes retornados por `vw_cs_customer_portfolio`

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
- No P4-A, a fixture funcional levou mais de 240s em Windows local e concluiu com timeout maior. Use timeout operacional de pelo menos 10 a 15 minutos para gates completos da fixture funcional.
- No P4-B, o pacote de release readiness formalizou esse timeout maior como requisito do checklist e do runbook de smoke. Para piloto controlado, rode `npm run supabase:qa:local-functional-fixture` duas vezes e use os IDs impressos pela fixture no smoke de Admin, Support, Portal, Internal Actions, Engineering e Public Help.
- O QA ponta a ponta P4 pode criar tickets locais sanitizados com prefixo `QA P4 MVP |`; esses registros não são versionados e podem ser descartados por reset/reidratação local.
- Se a fixture funcional parar por timeout, use a última linha `[functional-fixture]` ou `[support-fixture]` como ponto de investigação antes de alterar dados.
- Para QA do Portal, valide o ticket atual impresso pela fixture e confirme ausência de termos internos como `handoff técnico`, `retorno de engenharia`, `storage_bucket`, `storage_object_path`, `internal_actions` e `engineering_work_items`.
- Depois de reidratar, abra `/support/queue` ou `/support/tickets` e use um ticket atual da fila para validar o workspace autenticado.
- `Invalid login credentials` indica drift de fixture/credencial/Auth.
- `Failed to fetch` ou `502` no Kong/Auth local indica instabilidade do runtime local e deve ser tratado separadamente de credencial inválida.
