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

As senhas são somente variáveis do arquivo ignorado `.env.local.qa`. Elas não
devem ser registradas em documentação, scripts rastreados ou relatórios.

### Support Workspace

- `qa.local.support-manager-a@genius.local`
- senha: `LOCAL_QA_SUPPORT_MANAGER_PASSWORD`
- papel global: `support_manager`
- membership esperada: tenant fixture `support-qa-a`, status `active`

### Admin QA

- `qa.local.platform-admin@genius.local`
- senha: `LOCAL_QA_ADMIN_PASSWORD`
- papel global: `platform_admin`

### Área interna

- `qa.local.internal-area-member@genius.local`
- senha: `LOCAL_QA_INTERNAL_AREA_MEMBER_PASSWORD`
- papel operacional: membro ativo da área `finance` no tenant `support-qa-a`

- `qa.local.internal-area-empty@genius.local`
- senha: `LOCAL_QA_INTERNAL_AREA_EMPTY_PASSWORD`
- papel operacional: membro ativo da área `operations` no tenant `support-qa-a`, sem acionamentos persistidos pela fixture

- `qa.local.internal-area-non-member@genius.local`
- senha: `LOCAL_QA_INTERNAL_AREA_NON_MEMBER_PASSWORD`
- papel operacional: usuário ativo no tenant `support-qa-a`, sem membership de área interna

### Customer Success

- `qa.local.customer-success-a@genius.local`
- senha: `LOCAL_QA_CUSTOMER_SUCCESS_PASSWORD`
- papel operacional: membership ativa `customer_success` no tenant `support-qa-a`
- escopo esperado: apenas clientes retornados por `vw_cs_customer_portfolio`

### Engineering

- `qa.local.engineering-member-a@genius.local`
- senha: `LOCAL_QA_ENGINEERING_PASSWORD`
- papel global: `engineering_member`

### Customer Portal

- `marina.ops@support-qa-a.local`
- senha: `LOCAL_QA_CLIENT_PASSWORD`
- papel customer-facing: `customer_user`

- `gestao.portal@support-qa-a.local`
- senha: `LOCAL_QA_CUSTOMER_MANAGER_PASSWORD`
- papel customer-facing: `customer_manager`

### Content author QA

- `ede.oliveira@confi.com.vc`
- senha: `LOCAL_QA_ADMIN_PASSWORD`
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

## Runbook validado de QA autenticado — 2026-08-04

Sequência confirmada em execução real, sem digitar senha e sem expor credencial.

1. Confirme o Supabase local respondendo em `http://127.0.0.1:54321`.
2. Confirme `NODE_ENV=development` no shell. Com `NODE_ENV=production` o Vite sobe
   sem o preâmbulo do React Refresh, a tela fica branca com
   `$RefreshSig$ is not defined` e o login do harness falha sem relação com
   credencial.
3. Autenticação por API:

```bash
npm run local:qa:smoke:auth
```

Esperado: `admin`, `dashboard_viewer`, `support_manager`, `support_agent` e
`customer_user` com `authenticated: true`.

4. Smoke visual autenticado:

```bash
npm run local:qa:smoke
```

O script sobe o próprio Vite exclusivamente em `4173`. O launcher verifica o
processo que ocupa a porta: reinicia automaticamente apenas uma instância
marcada como deste projeto e falha com a identificação do processo quando o
serviço é desconhecido. Não há fallback para outra porta.

Saída esperada: 10 cenários, 5 papéis em desktop e mobile, com `consoleErrors`,
`pageErrors`, `requestFailures` e `unexpectedResponses` em zero. Capturas em
`output/local-qa/`.

5. Para escrita real na UI de Suporte e Portal, com checagem de isolamento
   cross-tenant, use `npm run local:qa:writes`. Ele grava mensagens de QA no banco
   local e depende dos IDs atuais da fixture.

Cobertura atual do smoke: Dashboard Gerencial autenticado, escopo de
`dashboard_viewer`, bloqueio de rota administrativa para suporte e cliente,
bloqueio de rota interna para `customer_user` e, desde 2026-08-04, as superfícies
internas `/admin/knowledge` e `/admin/access` para `platform_admin` em desktop,
declaradas em `extraRoutes` dentro de `scripts/local-qa/browser-smoke.mjs`.

As telas internas fora do primeiro release não entram no smoke porque dependem de
três camadas em série: `release_enabled` no `internal_screen_catalog`, grant de
tela e capability. O `platform_admin` da fixture já tem grant de tela para todas
elas; faltam release e capability.

Para a camada de release existe ferramenta local:

```bash
npm run supabase:qa:local-release-preview:status
npm run supabase:qa:local-release-preview -- --screens=tenants
npm run supabase:qa:local-release-preview:disable
```

Ela altera somente o banco local, guarda o estado original em
`output/local-qa/release-preview-backup.json` e exige lista explícita de telas.
Ligar o catálogo inteiro faz o smoke falhar com 401 em `vw_admin_auth_context`.
A camada de capability não é aberta por script de QA por decisão explícita.
