# Handoff temporário do ConfiOne para o Claude

**Data:** 2026-08-19
**Finalidade:** permitir que o Claude assuma temporariamente a análise e a execução controlada do projeto, preservando o trabalho existente e sem transformar documentação histórica em evidência de release.

## 1. Resumo executivo

O checkout atual é o repositório canônico do ConfiOne em `C:\Projetos\ConfiOne`.

- Remoto confirmado: `https://github.com/edebueno-confi/ConfiOne.git`.
- Branch: `main`.
- `HEAD` local no levantamento: `55353058f537761536d53513b7db4d2e412c81f3`.
- `origin/main` no levantamento: `87d7a406c5c131ca23602e00e55f7003d5aa873`.
- O branch local estava à frente do remoto por um commit.
- O worktree estava sujo, com 70 entradas rastreadas ou não rastreadas no primeiro levantamento. Essas alterações já existiam antes deste handoff e devem ser preservadas.
- `AGENTS.md` também está modificado no worktree. Leia a versão atual antes de agir.

O estado de produto mais relevante está concentrado em quatro frentes:

1. Support Workspace V1 possui contrato de autorização, smoke autenticado e smoke de escritas locais, mas as rotas continuam fora do release surface padrão. A próxima etapa documentada é `Support Release Surface Activation V1`.
2. A Central de Clientes foi movida visualmente para `Minha área`, mantendo `/admin/tenants`, e recebeu agrupamentos internos de contas e marcas.
3. O diretório local recebeu empresas HubSpot de After Sale V1 e existe um domínio backend para operações de clientes e preparação de migração para After Sale V2. Essa camada ainda não executa escrita externa nem migração real.
4. Existem alterações correntes em recepção, navegação, autenticação, Analytics, contratos, smoke tests e superfície de release. Não assuma que todo o diff tenha o mesmo grau de conclusão.

## 2. Fontes que devem ser lidas antes de qualquer mudança

Leia integralmente, na ordem abaixo, e reconcilie a documentação com o código executável:

1. `AGENTS.md`.
2. `docs/PROJECT_STATE.md`.
3. `docs/README.md`.
4. `docs/ROADMAP_BUILDOUT_V3.md`.
5. `docs/ARCHITECTURE_RULES.md`.
6. `docs/AUTH_CONTEXT_STRATEGY.md`.
7. `docs/VIEW_RPC_CONTRACTS.md`.
8. `docs/AI_GOVERNANCE.md`.
9. `docs/CODEX_EXECUTION_RULES.md`.
10. `docs/VALIDATION_CHECKLIST.md`.
11. `docs/DOCUMENTATION_UPDATE_POLICY.md`.
12. `docs/DOCUMENTATION_GOVERNANCE_RUNBOOK.md`.
13. `docs/DOCUMENTATION_LEDGER.md`.
14. `docs/CUSTOMER_OPERATIONS_MIGRATION_DOMAIN_V1.md`.
15. `docs/SUPPORT_WORKFLOW.md`.
16. `docs/reports/CUSTOMER_RELATIONSHIP_GROUPS_V1_2026-08-16.md`.
17. `docs/reports/HUBSPOT_CUSTOMER_DIRECTORY_IMPORT_2026-08-16.md`.
18. `docs/reports/OPERATIONAL_SUPPORT_FLOW_V1_KICKOFF_2026-08-16.md`.

As migrations, views, RPCs, policies, contratos compartilhados, testes e scripts são a evidência de comportamento. Documentos históricos só devem ser usados como contexto.

## 3. O que já existe segundo os artefatos correntes

### Support Workspace V1

- `supabase/migrations/20260816100000_support_screen_capability_grants_v1.sql` corrige a capacidade `screen.support.view` para `platform_admin`, `support_manager` e `support_agent`.
- `supabase/tests/114_support_screen_capability_grants_v1.sql` cobre a matriz de grants.
- `scripts/local-qa/support-release-smoke.mjs` testa 10 combinações de perfil e rota em modo local com `VITE_RELEASE_SURFACE=full`.
- `scripts/local-qa/support-operational-write-smoke.mjs` reutiliza o harness de escritas da UI.
- O release surface padrão ainda não publica `/support/queue` e `/support/tickets`.
- A publicação definitiva depende de aceite operacional de ações, tenant, timeline, mensagens, classificação, SLA, Knowledge e handoff.

### Central de Clientes e agrupamentos

- A rota técnica permanece `/admin/tenants`.
- O painel `apps/web/src/features/tenants/CustomerGroupsPanel.tsx` usa agrupamentos internos, sem afirmar relação societária, jurídica ou financeira.
- `tenants` continua sendo a conta operacional. `customer_account_groups` e `customer_account_group_members` são contexto interno.
- `portfolio` não deve ser criado como novo agrupamento. Carteira de Customer Success continua em `cs_customer_portfolio_assignments`.
- As fontes principais são `vw_admin_customer_account_groups_list`, `vw_admin_customer_account_group_detail` e `vw_admin_tenant_group_context`, protegidas por backend e RLS.
- As migrations e testes focados da frente são `20260816110000`, `20260816112000`, `20260816113000`, `20260816114000`, `supabase/tests/115_customer_relationship_groups_v1.sql` e `supabase/tests/116_customer_relationship_groups_scope_fix.sql`.

### Diretório HubSpot local

- Foram importadas localmente 264 empresas `COMPANY` com `e_cliente_aftersale_ = Sim`.
- O diretório local da Central aparece com 267 linhas, sem duplicidade nas fontes importadas.
- A execução local documentada do sincronizador terminou com `success`, 48 itens `succeeded`, 61.843 registros recebidos e 62.066 promovidos ao snapshot local.
- Não houve escrita no HubSpot, OMIE/OME, produção ou outro serviço externo.
- A ACL do runner foi corrigida localmente por `supabase/migrations/20260816153000_hubspot_orchestrator_service_acl_fix_v1.sql`.
- A limitação de domínio permanece: CNPJ, domínio, MRR, proprietário de CS e produtos contratados não foram copiados para novos campos operacionais sem decisão explícita.

### Customer Operations and Migration Domain V1

- O domínio cobre fontes After Sale V1 e Genius, lojas, inventário versionado, observações, evidências privadas, projetos, elegibilidade, aprovação, lotes, levas, solicitação de executor, validação pós-save e histórico.
- A UI atual em `apps/web/src/features/tenants/CustomerOperationsPanel.tsx` é leitura operacional aditiva. Lojas, inventário e projetos vazios são estados reais quando não há escopo confirmado.
- O domínio não faz login automático, scraping, armazenamento de credenciais, escrita em V1, Boss, Genius ou V2, nem migração remota.
- As migrations `20260816150000` até `20260816152000` e o teste `supabase/tests/117_customer_operations_migration_domain_v1.sql` devem ser lidos antes de qualquer alteração.
- A validação documentada cita 52 testes focados aprovados. A suíte completa percorreu 120 arquivos e 1.859 testes, com uma falha de fixture legada em `110_analytics_operation_scope.sql` causada pela presença do snapshot real local. Não enfraqueça o teste para esconder essa divergência.

## 4. Estado de validação e limites da evidência

Os resultados acima são evidências registradas nos documentos do worktree, não uma nova execução feita durante a criação deste handoff.

Também estão registrados:

- lint JavaScript sem erros, com 159 avisos legados;
- lint SQL sem falhas, com 19 avisos não bloqueantes;
- typecheck de contracts e web, build, pgTAP, smoke de autenticação, smoke Playwright, smoke Support, secret scan e quality gate aprovados na rodada documentada;
- uma falha conhecida da suíte ampla em `110_analytics_operation_scope.sql` por fixture legada e snapshot local real.

Antes de afirmar que algo está pronto, reexecute a validação proporcional ao escopo. Não trate HTTP 200 isolado como prova de fluxo funcional.

## 5. Procedimento obrigatório de retomada

1. Reconfirme identidade, branch, commit, remoto e status:

   ```powershell
   git rev-parse --show-toplevel
   git remote -v
   git branch --show-current
   git rev-parse HEAD
   git status --short --branch
   git diff --stat
   git diff --check
   ```

2. Preserve tudo que já estiver modificado ou não rastreado. Não use `reset`, `clean`, checkout destrutivo, rebase, merge, force push ou descarte de arquivos.
3. Audite o diff antes de selecionar um lote. Separe as mudanças de `Support`, `Central de Clientes`, `Customer Operations`, `Analytics`, `auth`, `navigation` e documentação.
4. Confirme o estado local do Supabase com `npm run supabase:status`. Só use migrations, fixtures, seeds ou scripts de escrita depois de confirmar que o alvo é local.
5. Leia o script completo antes de executar qualquer agregador que possa resetar banco, limpar dados ou reidratar fixtures.
6. Se o objetivo for ativar Support no release padrão, pare antes da alteração e peça aceite humano explícito para essa publicação. A validação em `VITE_RELEASE_SURFACE=full` não é autorização de release.
7. Se o objetivo for continuar a migração After Sale, mantenha descoberta, de-para aprovado, escrita e validação pós-migração como etapas separadas. Não use o domínio local como autorização para acessar painéis externos.
8. Ao finalizar qualquer lote, execute os testes relevantes, `git diff --check`, revise o diff completo e informe o estado final do Git.

## 6. Proibições durante a transferência

- Não fazer commit, push, deploy, migration remota ou alteração de secret sem autorização explícita do Ede.
- Não escrever em HubSpot, OMIE/OME, After Sale V1, Boss, Genius ou After Sale V2.
- Não persistir senha, token, cookie, JWT, `service_role` ou credencial em arquivo, log, código ou resposta.
- Não criar mock para substituir read model, RPC, RLS, permissão ou dado real.
- Não mover navegação global, duplicar menu do usuário ou redesenhar o shell fora do escopo.
- Não criar carteira CS a partir de agrupamento de marcas, grupo econômico ou guarda-chuva de serviço.
- Não afirmar que Support está publicado enquanto o release surface padrão continuar sem as rotas.
- Não declarar a suíte ampla verde enquanto a fixture `110_analytics_operation_scope.sql` continuar falhando.

## 7. Critérios de conclusão do takeover

O Claude só deve declarar o lote concluído quando:

- o escopo executado estiver explicitamente separado do que já existia no worktree;
- contratos backend, RLS, autorização, isolamento tenant e auditoria tiverem sido conferidos;
- comportamento principal tiver sido validado além de compilação ou HTTP 200;
- testes, lint, typecheck, build e limitações forem reportados com resultado real;
- documentação afetada estiver coerente com o código;
- nenhum segredo ou escrita externa tiver sido exposto ou executado;
- o relatório final trouxer arquivos alterados, riscos, pendências, próximo passo, branch, commit e `git status --short --branch`.

## 8. Arquivo de prompt

Use [`PROMPT_CLAUDE_PROJECT_TAKEOVER_2026-08-19.md`](./PROMPT_CLAUDE_PROJECT_TAKEOVER_2026-08-19.md) como instrução inicial copiável para o Claude.
