# GOAL_EXECUTION_PLAN.md

Camada de orquestração para execução autônoma controlada via Codex Goal Mode (`/goal`) no Genius Support OS.

Este documento não é um novo roadmap. Ele referencia os documentos canônicos e traduz a execução em macro-lotes, gates, validações e condições de parada.

## Fonte de verdade

Use como fonte prioritária:

- `docs/PROJECT_STATE.md`: estado real atual.
- `docs/README.md`: navegação documental e regra de leitura.
- `docs/ROADMAP_BUILDOUT_V3.md`: roadmap vivo de buildout.
- `docs/OPERATIONAL_CONTROL_PLANE_V1.md`: plano canônico da frente OCP.
- `docs/reports/CODEX_GOAL_MODE_READINESS_AUDIT.md`: auditoria que motivou este plano.
- `docs/CODEX_EXECUTION_RULES.md`: regras operacionais do Codex.
- `docs/VALIDATION_CHECKLIST.md`: checklist mínimo e bloqueadores.
- `docs/ARCHITECTURE_RULES.md`: arquitetura backend-first.
- `docs/VIEW_RPC_CONTRACTS.md`: contratos de views/RPCs.
- `docs/AUTH_CONTEXT_STRATEGY.md`: auth, papéis e boundaries.
- `docs/AI_GOVERNANCE.md`: limites para IA.
- `docs/DOCUMENTATION_LEDGER.md`: trilha documental.
- `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`: contrato visual quando houver UI.

Não use `docs/GPT/`, `.worktrees/*`, `docs/ROADMAP.md` ou `docs/IMPLEMENTATION_PLAN.md` como plano corrente se houver divergência com as fontes acima.

## Ordem de leitura obrigatória

Para qualquer `/goal`:

1. `AGENTS.md`
2. `docs/PROJECT_STATE.md`
3. `docs/README.md`
4. `docs/ROADMAP_BUILDOUT_V3.md`
5. `docs/GOAL_EXECUTION_PLAN.md`
6. Documentos de regra: `CODEX_EXECUTION_RULES.md`, `VALIDATION_CHECKLIST.md`, `ARCHITECTURE_RULES.md`
7. Documentos de domínio afetado: contratos, auth, IA, design, OCP ou relatório recente
8. Estado local: `git status --short`, branch atual e arquivos impactados

Para OCP, leia também `docs/OPERATIONAL_CONTROL_PLANE_V1.md` e os relatórios OCP recentes antes de escolher o próximo lote.

## Macro-lotes executáveis

### 1. Auditoria e estado atual

Objetivo: confirmar estado real antes de implementar.

Entradas:

- `PROJECT_STATE.md`
- `ROADMAP_BUILDOUT_V3.md`
- relatório recente do domínio
- `git status --short`

Saída esperada:

- escopo confirmado;
- documentos/contratos relevantes identificados;
- riscos e bloqueios explícitos;
- nenhum runtime alterado quando o lote for documental.

### 2. Planejamento de lote autorizado

Objetivo: transformar um item do roadmap em lote pequeno, validável e autorizado.

Regras:

- reaproveitar o roadmap, sem criar roadmap concorrente;
- declarar objetivo, fora de escopo, arquivos prováveis, contratos afetados e validações;
- parar se houver decisão de produto pendente, ambiguidade de domínio ou conflito documental.

### 3. Contratos backend quando necessários

Objetivo: materializar ou ajustar fonte real antes de UI.

Regras:

- auditar `VIEW_RPC_CONTRACTS.md`, migrations e testes existentes antes de propor novo contrato;
- leitura deve usar view/read model;
- escrita deve usar RPC/command;
- RLS, tenant, permissões, auditoria e eventos entram no mesmo lote quando aplicáveis;
- não usar service_role nem alterar remoto sem autorização explícita.

### 4. Frontend somente após contrato real

Objetivo: conectar UI a fonte real já validada.

Regras:

- não inventar regra de negócio no frontend;
- não usar mocks como fonte do produto;
- estados loading, erro, vazio e indisponível devem refletir contrato real;
- quando houver UI, seguir `GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`, screen specs e blueprints aprovados.

### 5. QA, documentação e relatório

Objetivo: fechar o lote com evidência.

Regras:

- rodar validações proporcionais ao tipo de alteração;
- atualizar documentação viva quando comportamento, contrato, regra ou decisão mudar;
- criar relatório em `docs/reports/` quando o lote for relevante;
- reportar claramente validações que não foram rodadas e motivo.

### 6. Parada para decisão humana

Objetivo: impedir autonomia insegura.

Pare quando o próximo passo depender de:

- escolha de produto;
- autorização de deploy/remoto;
- uso de segredo ou service_role;
- alteração destrutiva;
- risco de segurança;
- dados reais de cliente;
- custo;
- conflito entre documentos canônicos.

## Gates de entrada

Antes de executar qualquer macro-lote:

- worktree revisado com `git status --short`;
- branch compatível com o escopo ou status reportado;
- documentos canônicos lidos;
- escopo permitido e proibido identificado;
- contratos existentes auditados quando houver backend/UI;
- validações esperadas definidas;
- stop conditions reconhecidas.

Para lote documental:

- confirmar que não haverá runtime/backend/Supabase/UI;
- limitar alterações a docs e índices necessários.

Para lote com backend/Supabase local:

- confirmar autorização explícita para mexer em schema, migration, RLS, functions, policies ou seeds;
- auditar equivalentes existentes;
- planejar testes pgTAP e gates Supabase locais.

Para lote com UI:

- confirmar contrato real de dados;
- ler design system, screen specs e blueprints aplicáveis;
- planejar QA visual/comportamental.

## Validações mínimas por tipo de alteração

Docs-only:

- `git status --short`
- busca textual dos arquivos alterados
- `git diff --check`

Contratos TypeScript:

- `npm run contracts:typecheck`
- validação de consumidores impactados quando aplicável

Frontend:

- `npm run web:typecheck`
- `npm run web:build`
- QA visual/comportamental quando houver alteração de tela

Supabase local:

- `npm run supabase:lint:db`
- `npm run supabase:test:db`
- `npm run supabase:verify` quando o lote alterar contrato relevante ou infraestrutura local

Documentação interna:

- `npm run documentation:validate:internal-docs` quando Product Docs, Build Journal ou catálogo interno forem afetados

Release/staging:

- usar checklists em `docs/release/`;
- não executar deploy remoto, migration remota ou ação em cliente real sem autorização humana explícita.

## Stop conditions

Interrompa o `/goal` e peça decisão humana antes de:

- deploy remoto, push de produção, db push remoto ou migration remota;
- reset destrutivo de banco, exclusão permanente ou perda de dados;
- uso, leitura desnecessária, alteração ou exposição de secrets, tokens, cookies, JWTs, service_role ou credenciais;
- envio externo de e-mail/mensagem, cobrança, compra ou operação com custo;
- operação com dados reais de cliente sem necessidade e autorização;
- criação de contrato novo quando existir equivalente não auditado;
- UI sem contrato backend real;
- mock virando fonte do produto;
- bypass de RLS/permissão, vazamento cross-tenant ou exposição de audit/log bruto;
- IA decidindo permissão, status, publicação, resposta customer-facing ou ação operacional;
- decisão de produto pendente;
- conflito entre documentos canônicos;
- falha de validação que comprometa o lote.

## Regras para commits e checkpoints

- Não faça commit sem autorização explícita.
- Antes de commitar, rode `git status --short`, revise `git diff --check` e confira arquivos staged.
- Não use `git add .` nem `git add -A` em worktree misto.
- Separe commits por domínio quando houver alterações de naturezas diferentes.
- Não use `git reset --hard`, `git clean -fd`, branch delete forçado ou stash genérico sem autorização explícita.
- Se o worktree já tiver alterações de outra frente, preserve-as e limite o lote ao escopo autorizado.
- Em lote longo, registre checkpoint documental ou relatório antes de avançar para o próximo macro-lote.

## Regra de relatório final

Ao finalizar qualquer lote, reporte:

- arquivos criados/alterados;
- resumo do que mudou;
- validações executadas;
- validações não executadas e motivo;
- lacunas fechadas;
- lacunas ainda abertas;
- recomendação de próximo passo;
- `git status --short`;
- se houve commit ou não.

## Quando usar `/goal`

Use `/goal` quando:

- o objetivo couber em macro-lotes claros;
- houver fonte canônica suficiente;
- os stop conditions estiverem explícitos;
- as validações forem conhecidas;
- o lote puder avançar com autonomia controlada;
- o escopo não exigir decisão de produto durante a execução.

Bons casos:

- auditoria documental;
- preparação de governança;
- hardening com contrato já definido;
- QA e relatório;
- implementação pequena com contratos reais e gates claros.

## Quando não usar `/goal`

Não use `/goal` para autonomia ampla quando:

- o roadmap estiver ambíguo;
- houver decisão de produto pendente;
- o lote exigir deploy remoto, migration remota, secrets, service_role ou dados reais;
- houver risco de segurança ou privacidade ainda não delimitado;
- a UI depender de contrato backend inexistente;
- o trabalho exigir exploração aberta de produto sem stop condition.

Nesses casos, faça primeiro um lote de auditoria/planejamento e peça decisão humana.

## Modelo recomendado de prompt `/goal`

```text
/goal
Objetivo: executar o lote [nome do lote] do Genius Support OS com autonomia controlada.

Leia primeiro:
- AGENTS.md
- docs/PROJECT_STATE.md
- docs/README.md
- docs/GOAL_EXECUTION_PLAN.md
- docs/ROADMAP_BUILDOUT_V3.md
- [documentos do domínio]

Escopo permitido:
- [listar arquivos/domínios permitidos]

Escopo proibido:
- sem deploy remoto
- sem secrets/service_role
- sem migration destrutiva
- sem dados reais de cliente
- sem UI sem contrato real
- sem mocks como fonte do produto

Gates:
- auditar contratos existentes antes de criar qualquer novo
- validar com [comandos]
- parar diante das stop conditions de docs/GOAL_EXECUTION_PLAN.md

Entrega:
- implementar somente o lote autorizado
- atualizar documentação necessária
- gerar relatório final com arquivos alterados, validações, lacunas, recomendação, git status e indicação se houve commit
```
