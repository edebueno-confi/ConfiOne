# P3-B AI Readiness Admin Visibility + Functional Fixture Reliability

Data: 2026-05-24
Branch: `codex/p3-b-ai-readiness-admin-fixture-reliability`

## Objetivo
Corrigir a confiabilidade da fixture funcional local e expor em `/admin/system` uma leitura compacta e honesta de readiness AI-native, sem criar IA real, provider, modelo, embedding, job, chatbot, Copilot, segredo, token ou API key.

## Causa do hang da fixture
A fixture funcional chamava `supabase/qa/create-local-support-fixture.mjs` por `spawnSync` sem timeout. A fixture de suporte, por sua vez, tinha chamadas críticas sem timeout:
- health check da Edge Runtime;
- Supabase CLI;
- Auth admin/local login;
- chamadas REST/RPC;
- upload seguro de evidências.

Quando qualquer uma dessas chamadas ficava pendente, o processo não falhava nem indicava a etapa. O bloqueio observado no P3 ficou concentrado no script filho da fixture de suporte, sem evidência de falha de contrato AI-native.

## Correção aplicada
- Adicionados timeouts configuráveis por ambiente:
  - `GENIUS_QA_FETCH_TIMEOUT_MS`
  - `GENIUS_QA_PROCESS_TIMEOUT_MS`
  - `GENIUS_QA_SUPPORT_FIXTURE_TIMEOUT_MS`
- Adicionado `fetchWithTimeout` para Auth, RPCs, health check e upload.
- Adicionado timeout em `spawnSync` da fixture funcional, Supabase CLI e bootstrap local.
- Adicionados logs curtos de etapa com prefixos:
  - `[functional-fixture]`
  - `[support-fixture]`
- A fixture agora falha com etapa identificável em vez de permanecer pendurada sem saída.

## Auditoria inicial resumida
- As views AI-native criadas no P3 já eram suficientes para leitura administrativa compacta.
- Não foi necessária migration nova.
- `/admin/system` já era a superfície correta para observabilidade administrativa segura.
- O ledger de uso AI (`vw_ai_usage_audit_events`) não foi usado na tela para evitar exposição desnecessária de metadata/source_ids/review notes.

## Decisões técnicas
- Usar somente views/read models existentes:
  - `vw_ai_operational_context_readiness`
  - `vw_ai_context_source_policies`
  - `vw_ai_action_policies`
- Não chamar RPCs AI na tela.
- Não criar provider config, botão de ativação, campo de segredo ou placeholder de Copilot.
- Mostrar AI-native como governança preparada, não como produto ativo.

## Arquivos alterados
- `supabase/qa/create-local-functional-fixture.mjs`
- `supabase/qa/create-local-support-fixture.mjs`
- `apps/web/src/contracts/admin-contracts.ts`
- `apps/web/src/features/admin/admin-api.ts`
- `apps/web/src/features/system/SystemPage.tsx`
- `docs/AI_GOVERNANCE.md`
- `docs/AI_NATIVE_OPERATIONAL_READINESS.md`
- `docs/PROJECT_STATE.md`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/LOCAL_QA_AUTH.md`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/reports/P3_AI_READINESS_ADMIN_VISIBILITY_AND_FIXTURE_RELIABILITY_2026-05-24.md`

## Migrations
Nenhuma migration criada.

## Views/RPCs/tabelas
Nenhuma view, RPC ou tabela nova.

Views consumidas no frontend:
- `vw_ai_operational_context_readiness`
- `vw_ai_context_source_policies`
- `vw_ai_action_policies`

## Frontend
`/admin/system` ganhou card compacto `AI-native readiness` após `Governança de canais`.

O card mostra:
- preparada para governança, não ativa;
- fontes permitidas/restritas/futuras;
- políticas de ação;
- automações bloqueadas;
- revisão humana obrigatória;
- auditoria obrigatória;
- provider/modelo não configurado;
- embeddings inativos;
- última atualização das policies, quando disponível.

Não há:
- botão de gerar resposta;
- botão de ativar IA;
- campo de token/API key;
- provider config;
- Copilot;
- chatbot;
- prompt real;
- output gerado.

## Fixture QA
Fixture alterada para confiabilidade e observabilidade. Dados, usuários e senhas existentes foram preservados.

Primeira execução validada:
- `npm run supabase:qa:local-functional-fixture`
- resultado: concluiu e imprimiu credenciais/IDs úteis.

IDs úteis da execução local:
- tenant `support-qa-a`: `c12185f7-cc66-4731-b1e5-aa81023ef1a8`
- ticket principal: `b86df683-9756-4047-b954-350e02063aa2`
- internal action aberta: `a8ff272d-5fd2-47fc-85d6-ad632c9fcbec`
- internal action retornada: `cdf38392-0505-49d5-a7ca-973643c65163`
- engineering work item: `46a2a89f-0788-46a0-a5de-8b2a6158e4fb`

## Usuários e senhas QA
- `qa.local.platform-admin@genius.local` / `Local-QA-Admin-2026!`
- `qa.local.support-manager-a@genius.local` / `Local-QA-Manager-A-2026!`
- `qa.local.support-agent-a@genius.local` / `Local-QA-Agent-A-2026!`
- `qa.local.engineering-member-a@genius.local` / `Local-QA-Engineering-A-2026!`
- `qa.local.internal-area-member@genius.local` / `Local-QA-Internal-Area-2026!`
- `qa.local.internal-area-empty@genius.local` / `Local-QA-Internal-Empty-2026!`
- `qa.local.internal-area-non-member@genius.local` / `Local-QA-Internal-NoArea-2026!`
- `marina.ops@support-qa-a.local` / `Local-QA-Customer-A-2026!`
- `gestao.portal@support-qa-a.local` / `Local-QA-Customer-Manager-A-2026!`

## Boundaries
Confirmado por implementação e contrato:
- Portal não recebe AI readiness interna.
- Support não ganhou IA ativa nem botão de geração.
- Admin não consegue ativar provider real.
- Nenhum segredo/token/API key foi criado.
- Nenhum prompt real com dado sensível foi gravado.
- Nenhum embedding foi gerado.
- Nenhum job de IA foi criado.
- Nenhuma resposta automática existe.
- IA não altera status.
- IA não publica Knowledge.
- IA não cria delivery, internal action ou engineering work item.
- Access policies continuam backend-first.

## Validações
Executadas:
- `node --check supabase/qa/create-local-functional-fixture.mjs`
- `node --check supabase/qa/create-local-support-fixture.mjs`
- `npm run web:typecheck`
- `npm run contracts:typecheck`
- `npm run web:build`
- `npm run supabase:lint:db`
- `npm run supabase:test:db` - 47 arquivos, 979 testes
- `npm run supabase:qa:local-functional-fixture` - duas execuções concluídas

Durante a validação, `supabase:test:db` falhou uma vez porque o teste `042_communication_delivery_readiness` contava todos os audit logs de `ticket_message_deliveries` no banco local persistido. A fixture funcional já havia criado registros adicionais, então o teste foi ajustado para contar apenas os audit logs dos deliveries criados pelo próprio cenário pgTAP.

## Smoke browser
Viewport: `1440x900`.

Rotas validadas:
- `platform_admin` em `/admin/system`: card `AI-native readiness` visível; sem botão fake; sem campo de segredo; sem ativação de IA real; sem scroll global/horizontal.
- `support_manager` em `/support/queue`: fila carregou com dados da fixture; sem Copilot, sem botão de geração e sem readiness AI interna.
- `support_manager` em `/support/tickets/b86df683-9756-4047-b954-350e02063aa2`: ticket carregou; sem Copilot, sem botão de IA ativo.
- `customer_user` em `/portal`: portal carregou sem readiness AI interna e sem dados internos.
- `customer_user` em `/portal/tickets/8e5ee201-7e27-45ef-9e61-f3209f6ad202`: conversa customer-facing carregou; sem provider_state, nota interna, internal actions, engineering, audit bruto ou storage path.
- `public_anon` em `/help/genius`: Public Help carregou e não recebeu readiness AI interna.

Observação de QA: houve erro de console de refresh token durante troca manual de usuários no browser automation. Ele foi provocado pela substituição direta de sessão/localStorage no smoke e não gerou falha visual ou funcional nas rotas validadas.

## Riscos restantes
- A fixture ainda depende da saúde do Supabase local e Edge Runtime; agora, porém, falha com timeout e etapa identificável.
- IA real segue fora do produto até provider/modelo, redaction, prompt evaluation, opt-in, kill switch, rate limits, custo, monitoramento e retenção serem aprovados.
- A UI administrativa mostra readiness, não governança granular de policies; detalhamento pode virar fase futura se houver necessidade operacional real.

## Próxima fase recomendada
`P3-C AI Policy Review Workflow`: criar, se necessário, fluxo administrativo de revisão humana de policies e uso AI futuro, ainda sem provider real.
