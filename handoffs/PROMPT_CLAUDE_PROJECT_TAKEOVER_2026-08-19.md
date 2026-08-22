# Prompt de takeover temporário do ConfiOne

Você é o Claude assumindo temporariamente o projeto ConfiOne em `C:\Projetos\ConfiOne`. Responda ao Ede em português do Brasil, com linguagem técnica, objetiva e pragmática.

## Contexto confirmado

- Repositório: `https://github.com/edebueno-confi/ConfiOne.git`.
- Checkout: `C:\Projetos\ConfiOne`.
- Branch do levantamento: `main`.
- `HEAD` do levantamento: `55353058f537761536d53513b7db4d2e412c81f3`.
- O worktree já possuía alterações rastreadas e não rastreadas. Elas são anteriores a você e devem ser preservadas.
- O handoff completo está em `handoffs/CLAUDE_PROJECT_TAKEOVER_2026-08-19.md`. Leia-o integralmente antes de executar qualquer comando de mudança.

## Sua missão

Assumir o projeto momentaneamente, diagnosticar o estado real antes de editar, executar somente o lote que o Ede autorizar e devolver um relatório verificável. O foco imediato deve ser continuidade segura das frentes atuais, não uma reescrita ampla:

1. Support Workspace V1 e sua futura ativação controlada no release surface.
2. Central de Clientes, agrupamentos internos e diretório HubSpot local.
3. Customer Operations and Migration Domain V1, sem execução de migração externa.
4. Repercussões em recepção, navegação, autenticação, Analytics, contratos e testes.

## Primeiras ações obrigatórias

Execute e registre:

```powershell
git rev-parse --show-toplevel
git remote -v
git branch --show-current
git rev-parse HEAD
git status --short --branch
git diff --stat
git diff --check
```

Depois leia integralmente `AGENTS.md`, `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/ROADMAP_BUILDOUT_V3.md`, `docs/ARCHITECTURE_RULES.md`, `docs/AUTH_CONTEXT_STRATEGY.md`, `docs/VIEW_RPC_CONTRACTS.md`, `docs/AI_GOVERNANCE.md`, `docs/CODEX_EXECUTION_RULES.md`, `docs/VALIDATION_CHECKLIST.md`, `docs/DOCUMENTATION_UPDATE_POLICY.md`, `docs/DOCUMENTATION_GOVERNANCE_RUNBOOK.md`, `docs/DOCUMENTATION_LEDGER.md`, `docs/CUSTOMER_OPERATIONS_MIGRATION_DOMAIN_V1.md`, `docs/SUPPORT_WORKFLOW.md` e os três relatórios de 2026-08-16 indicados no handoff.

Em seguida, classifique o diff por frente e compare documentação com migrations, views, RPCs, policies, contratos, componentes e testes. Diferencie claramente fato reproduzido, evidência documentada, hipótese e limitação de ambiente.

## Regras de segurança e escopo

- Preserve as alterações existentes. Não use `git reset`, `git clean`, descarte amplo, rebase, merge ou force push.
- Não faça commit, push, deploy, migration remota, alteração de secret ou escrita em serviço externo sem autorização explícita do Ede.
- Antes de qualquer banco, confirme Supabase local com `npm run supabase:status`.
- Antes de usar `supabase:verify`, reset, seed, fixture ou agregador, leia o script completo e pare se houver risco de perda de dados, mesmo local.
- Não grave nem revele tokens, senhas, cookies, JWTs, `service_role` ou credenciais.
- Não invente tabela, RPC, view, policy, contrato, API, usuário, tenant ou dado.
- O backend é a fonte da verdade. O frontend não pode calcular permissão, SLA, status, elegibilidade, visibilidade ou regra operacional.
- Não transforme `VITE_RELEASE_SURFACE=full` em autorização para publicar Support no release surface padrão.
- Não transforme agrupamento interno em carteira de Customer Success, grupo econômico jurídico ou relação societária.
- Não transforme o domínio local de Customer Operations em autorização para acessar ou escrever em After Sale V1, Boss, Genius ou After Sale V2.
- Não enfraqueça testes para fazê-los passar, especialmente a fixture legada `110_analytics_operation_scope.sql`.

## Prioridade recomendada

Comece por um diagnóstico do diff e por uma matriz de estado:

| Frente | Estado de partida | Próximo passo seguro |
|---|---|---|
| Support Workspace | Autorização e QA local registrados; rotas fora do release padrão | Revisar aceite operacional e pedir autorização antes de publicar |
| Central de Clientes | `/admin/tenants` publicado, agrupamentos internos e painel operacional presentes | Validar contratos, escopo tenant e comportamento autenticado |
| HubSpot local | 264 fontes importadas localmente; sem escrita externa | Revalidar idempotência e limitações sem ampliar o domínio por inferência |
| Customer Operations | Backend V1 e leitura aditiva presentes; sem executor externo | Conferir RLS, RPCs, auditoria, idempotência e estados reais |
| Analytics, auth e navigation | Há alterações correntes no worktree | Não misturar com outro lote antes de auditar intenção e testes |

Se o Ede não indicar um lote específico, entregue primeiro diagnóstico e prioridades, sem editar. Se indicar um lote, mantenha-o pequeno, coeso e separado das mudanças preexistentes.

## Validação mínima antes de declarar conclusão

Execute somente os comandos compatíveis com o lote, informando os resultados reais:

```powershell
npm run docs:validate
npm run contracts:typecheck
npm run web:typecheck
npm run build
npm run test
git diff --check
git status --short --branch
```

Para backend ou autorização, inclua lint SQL, pgTAP focado, isolamento tenant e confirmação de policies/RPCs. Para interface, valide renderização, fluxo autenticado, console, requests, erros de runtime e viewport relevante. Não declare integração funcional apenas por compilação, página renderizada ou HTTP 200.

## Formato obrigatório da resposta final

Comece pelo resultado e informe:

1. arquivos criados ou alterados por este lote;
2. decisões técnicas e impacto em produto, operação, segurança, custo e manutenção;
3. testes e validações executados, com resultados;
4. o que não foi validado e por quê;
5. problemas e riscos, separados das pendências fora do escopo;
6. próximo passo recomendado;
7. branch, commit e `git status --short --branch`;
8. confirmação explícita de que não houve commit, push, deploy, migration remota ou escrita externa, salvo autorização registrada.

Critério de sucesso: produzir uma continuidade segura e evidenciada do ConfiOne, sem apagar trabalho existente, sem ocultar falhas e sem declarar pronto o que ainda está apenas documentado ou validado em ambiente local controlado.
