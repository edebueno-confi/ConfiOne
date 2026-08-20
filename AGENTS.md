# AGENTS.md

Instruções permanentes para agentes Codex no repositório ConfiOne.

## Identidade e objetivo do produto

- O nome atual e oficial do produto é **ConfiOne**. Use `Genius Support OS`, `GeniusOS` e nomes derivados apenas ao citar referências históricas ou identificadores técnicos legados ainda existentes no repositório.
- O ConfiOne é uma plataforma operacional interna que conecta contexto, atendimento, conhecimento, suporte, clientes B2B, Customer Success, indicadores, integrações, administração, acessos e governança.
- Não tratar o produto como CRM genérico nem apenas como sistema de tickets.
- Priorizar fluxo operacional antes de módulo e contexto antes de dashboard.
- Backend é a fonte da verdade. IA é assistente operacional, não enfeite nem fonte decisória.

## Hierarquia documental

Antes de alterar arquivos, leia esta hierarquia e os documentos específicos da frente:

1. `AGENTS.md`, para regras permanentes de execução.
2. `docs/PROJECT_STATE.md`, como checkpoint corrente do projeto, sempre validado contra comportamento e contratos executáveis.
3. `docs/README.md`, para o índice e a classificação da documentação canônica.
4. `docs/ROADMAP_BUILDOUT_V3.md`, para a direção corrente de produto e execução.
5. Contratos, especificações e decisões canônicas da área afetada, incluindo:
   - `docs/OPERATIONAL_CONTROL_PLANE_V1.md`, quando a frente envolver Operational Control Plane;
   - `docs/GOAL_EXECUTION_PLAN.md`, quando o trabalho for executado via `/goal`;
   - `docs/ARCHITECTURE_RULES.md`;
   - `docs/VIEW_RPC_CONTRACTS.md`;
   - `docs/AUTH_CONTEXT_STRATEGY.md`;
   - `docs/AI_GOVERNANCE.md`;
   - contratos vigentes indicados por `docs/PROJECT_STATE.md` e `docs/README.md`.
6. `docs/CODEX_EXECUTION_RULES.md` e `docs/VALIDATION_CHECKLIST.md`, para execução e aceite.
7. `docs/DOCUMENTATION_UPDATE_POLICY.md` e `docs/DOCUMENTATION_GOVERNANCE_RUNBOOK.md`, para atualização e governança documental.
8. `docs/DOCUMENTATION_LEDGER.md`, para governança e trilha documental.
9. `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md` e contratos visuais com precedência mais recente, quando houver UI/UX.

Código executável, migrations, views, RPCs, policies, schemas e testes prevalecem como evidência do comportamento real. Documentos canônicos orientam intenção e decisões vigentes, mas devem ser reconciliados quando divergirem da implementação. `docs/GPT/`, `.worktrees/*` e relatórios históricos podem oferecer contexto, mas não prevalecem sobre código, contratos reais ou documentos canônicos correntes. Se fontes canônicas conflitarem e a evidência local não resolver o conflito, pare e peça decisão humana.

## Arquitetura e stack

- Monorepo npm workspaces, com frontend em `apps/web`, contratos compartilhados em `packages/contracts`, scripts em `scripts`, backend local em `supabase` e testes em `tests`.
- Frontend: React, TypeScript, Vite e Tailwind CSS.
- Backend e dados: Supabase/PostgreSQL, migrations versionadas, RLS, views, functions/RPCs, Edge Functions em Deno, constraints, auditoria e testes pgTAP.
- O frontend renderiza views/read models e chama RPCs/commands reais. Não calcula regra de negócio, SLA, permissão, status, prioridade, elegibilidade ou visibilidade.
- Não criar mock, regra local, endpoint, contrato, dado ou tela falsa quando houver fonte real.
- Não criar tabela, RPC, view, policy ou contrato sem auditar equivalentes existentes.

## Diagnóstico e preparação obrigatórios

Antes de trabalhar:

1. Confirme o diretório com `git rev-parse --show-toplevel` e a identidade do remoto com `git remote -v`.
2. Inspecione branch, commit e alterações existentes com `git branch --show-current`, `git rev-parse HEAD` e `git status --short --branch`.
3. Leia integralmente os `AGENTS.md` aplicáveis ao caminho alterado.
4. Inspecione documentação, estrutura, contratos, migrations, testes e scripts relacionados ao escopo.
5. Diferencie fatos encontrados no código, resultados reproduzidos, documentação histórica e hipóteses.
6. Preserve alterações preexistentes, rastreadas ou não rastreadas. Não misture trabalhos independentes no mesmo diff.

Diagnostique por evidências antes de corrigir. Registre comando, resultado e limitação relevante. Não invente APIs, variáveis, tabelas, contratos, credenciais ou comportamentos.

## Comandos oficiais

Use os scripts do `package.json` e o lockfile existente. Não atualize dependências sem necessidade comprovada e autorização compatível com o escopo.

```bash
npm ci
npm run dev
npm run lint
npm run contracts:typecheck
npm run web:typecheck
npm run build
npm run web:build
npm run test
npm run test:all
npm run docs:validate
npm run supabase:start
npm run supabase:status
npm run supabase:lint:db
npm run supabase:test:db
npm run supabase:verify
```

Antes de executar `supabase:verify` ou qualquer agregador semelhante, leia integralmente o script e seus comandos dependentes. Se houver reset, limpeza, reidratação ou perda de dados, mesmo locais, exija autorização humana explícita. Nunca execute contra ambiente remoto.

- `npm run test` executa a suíte focada; `npm run test:all` executa a suíte ampla.
- `npm run build` executa o build dos workspaces. Se algum workspace não expuser `build`, reporte a limitação; não altere scripts ou arquitetura apenas para mascarar a falha.
- Para Supabase local, use os scripts `supabase:*` e `local:qa:*` existentes. Confirme que o alvo é local antes de qualquer reset, seed, fixture ou escrita.
- Escolha validações proporcionais ao escopo. Em mudanças de comportamento, atualize ou adicione testes sem enfraquecer asserções para fazê-los passar.
- Auditorias de qualidade devem usar `$genius-code-quality`; ela é read-only por padrão e correções exigem autorização explícita.
- Auditorias documentais devem usar `$genius-documentation-governance`; ela é read-only por padrão, aplica somente com escopo aprovado e nunca deixa histórico prevalecer sobre contratos reais.

## Regras de execução e escopo

- Faça mudanças pequenas, coesas, auditáveis, rastreáveis e limitadas ao pedido.
- Reutilize padrões e contratos existentes. Não faça refatoração, redesign ou atualização de dependências fora do escopo.
- Não crie frontend antes de validar o contrato backend correspondente.
- Não silencie erros, warnings relevantes, falhas de validação ou limitações do ambiente.
- Revise o diff completo antes de concluir e verifique que arquivos alheios não foram incorporados.
- Quando houver impacto real, atualize `docs/PROJECT_STATE.md`, `docs/DOCUMENTATION_LEDGER.md`, o documento específico da área e o índice `docs/README.md` conforme a política documental. Se não houver impacto documental, declare isso objetivamente.

## Segurança e autorização

- Todo dado operacional exige tenant ou escopo explícito, isolamento, RLS, permissões, auditoria e logs quando aplicável.
- Nunca assumir tenant, papel ou permissão pelo contexto visual ou somente pelo frontend.
- Toda funcionalidade deve considerar contrato de dados, autorização, trilha de auditoria, histórico e teste mínimo de acesso.
- IA nunca decide permissão, nunca substitui fonte citável e nunca executa ação voltada ao cliente sem revisão humana.
- Não exponha secrets, tokens, cookies, JWTs, `service_role`, credenciais ou dados sensíveis em código, logs, relatórios ou respostas.

Sem autorização humana explícita, é proibido:

- executar `git reset`, `git clean`, descartar alterações, excluir conteúdo de forma ampla ou realizar outra ação destrutiva;
- fazer commit, push, force push, merge ou rebase;
- fazer deploy, migration remota, escrita em produção ou alteração de serviços externos;
- criar, revelar, rotacionar ou alterar secrets e credenciais;
- resetar banco, aplicar migration destrutiva ou provocar perda de dados;
- enviar mensagens externas, realizar cobranças, compras ou ações com custo.

Pare e peça decisão humana diante de ambiguidade material de produto, permissão ou domínio; risco cross-tenant; bypass de RLS; exposição de dados; migration destrutiva; ou solução que dependa de gambiarra.

## Regras permanentes de produto e interface

- Não duplicar acessos ou navegação no frontend.
- O menu do usuário deve existir em um único ponto global.
- Não reposicionar pesquisa, menu do usuário ou outros elementos globais sem autorização.
- Não redesenhar telas nem alterar o shell fora do escopo aprovado.
- Preservar padrões visuais e blueprints aprovados, respeitando a precedência dos contratos vigentes.
- Gerar exatamente uma tela por imagem ou PNG. Nunca reunir duas ou mais telas em mosaico, contact sheet, composição ou arquivo único, salvo pedido explícito.
- Usar `1920 × 1080` como referência prioritária de composição e validação visual, sem tratá-la como a única viewport válida quando o contrato vigente exigir comportamento responsivo.
- Buscar densidade útil, baixo peso cognitivo e interface orientada à ação. Evitar estética genérica de template administrativo.
- Não publicar superfície parcial como pronta. Ações, rotas, permissões, estados e dados exibidos devem ter comportamento real validado.

## Validação e critério de conclusão

Antes de declarar conclusão:

1. Execute testes relevantes e, quando aplicável, lint, typecheck e build.
2. Valide o comportamento principal e os contratos afetados.
3. Em interface, valide renderização, fluxo, console, rede, runtime e viewport relevante.
4. Em banco e backend, valide migrations, RLS, isolamento, permissões, auditoria e pgTAP quando aplicável.
5. Execute `git diff --check`, inspecione o diff completo e confira o estado final do Git.

Diferencie explicitamente:

- código compilado;
- página renderizada;
- fluxo funcional;
- integração real validada;
- comportamento apenas inferido;
- bloqueio ou limitação do ambiente.

## Relatório final obrigatório

Comece pelo resultado e informe objetivamente:

1. o que foi feito e quais arquivos foram alterados;
2. decisões técnicas e impacto no produto, operação, segurança e manutenção;
3. testes e validações executados, com resultados;
4. o que não foi validado e por quê;
5. problemas, riscos e pendências, separando itens fora do escopo;
6. próximo passo recomendado;
7. branch, commit atual e `git status --short --branch`;
8. confirmação de que não houve commit, push, deploy ou ação remota, salvo se expressamente autorizados e reportados.

## Colaboração multiagente e handoff canônico

O fluxo persistente entre Codex e Claude está em
docs/engineering/REVIEW_PROTOCOL.md e handoffs/README.md.

Os artefatos canônicos do ciclo corrente são:

- `handoffs/current/TASK.md`: escopo e critérios antes da implementação;
- `handoffs/current/IMPLEMENTATION.md`: pedido de revisão e evidência produzida pelo Codex;
- `handoffs/current/REVIEW.md`: findings e veredito formal do Claude;
- `handoffs/current/STATUS.md`: estado e responsável pelo próximo passo.

`Owner` significa o agente responsável pelo próximo passo do estado atual, não o
autor da última alteração. Codex atualiza `Owner` ao entregar para revisão e Claude
ao devolver ou encerrar o lote. A área `.review/` é complemento técnico: o inbox e
os vereditos são opcionais quando os quality gates forem aplicáveis e nunca podem
substituir ou contradizer os quatro arquivos de `handoffs/current/`. O arquivo
`.review/state.json` contém somente metadados de automação, como último HEAD varrido,
contagem de entradas e último ciclo automatizado; ele não define estado ou veredito.

Antes de implementar:

1. leia handoffs/current/STATUS.md;
2. leia handoffs/current/TASK.md;
3. confirme base SHA, branch, escopo, fora de escopo e critérios de aceitação;
4. se o estado for CHANGES_REQUESTED, leia handoffs/current/REVIEW.md e responda
   a cada finding válido;
5. não inicie implementação quando a TASK for insuficiente ou houver conflito
   material não resolvido.

Ao implementar:

- mantenha handoffs/current/IMPLEMENTATION.md atualizado;
- registre base SHA e implementation SHA, ou declare UNCOMMITTED_WORKTREE quando
  não houver commit;
- execute validações reais e registre comandos e resultados;
- mude STATUS.md para READY_FOR_REVIEW somente após fechar o lote;
- nunca altere REVIEW.md para remover ou suavizar finding do Claude;
- nunca autodeclare APPROVED.

Ao entregar para review, `IMPLEMENTATION.md` é o pedido canônico. Rode
`npm run review:gates` quando aplicável e, se o quality gate gerar um pacote
técnico, o JSON em `.review/inbox/<lote>.json` é apenas complemento alinhado ao
handoff.

Durante revisão:

- Claude lê código, diff, TASK, IMPLEMENTATION, contratos e evidências;
- Claude escreve REVIEW.md e STATUS.md, mas não altera código de produto,
  migrations, testes de produto, contratos ou configuração executável;
- resultados válidos são APPROVED, REQUEST_CHANGES e BLOCKED;
- findings precisam de evidência concreta, requisito, impacto e correção esperada;
- sem aprovação formal, a tarefa não pode seguir para merge ou release.

Os níveis canônicos de finding são `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` e `INFO`.
Artefatos históricos podem usar `BLOCKER`, `MAJOR`, `MINOR` ou `NIT`; o mapa é
`BLOCKER → CRITICAL`, `MAJOR → HIGH`, `MINOR → MEDIUM`, `NIT → LOW`, e `INFO → INFO`.

Não há edição concorrente na mesma working tree. Conversa externa e memória de
chat não são fontes normativas. Se houver contradição, registrar:

UNRESOLVED — requires project owner decision

Quando um quality gate for aplicável, o Codex deve registrar seus comandos e
resultados em `IMPLEMENTATION.md`; pode gerar `.review/inbox/<lote>.json` com o
escopo, arquivos, contratos, validações, riscos e pendências. O gate falha apenas
em regressão contra `.review/baseline.json`; o baseline não deve ser alterado para
obter aprovação. Claude pode executar `npm run review:context` e gravar evidência
opcional em `.review/verdicts/<lote>.md`, sempre alinhada a `REVIEW.md`.

Durante revisão, Claude não altera código de produto, migrations, testes de produto,
contratos ou configuração executável. Objeto listado em `SURFACE_PENDING_UI` é
funcionalidade pronta aguardando UI ou release, nunca código morto.

Política de sanitização documental vigente:

- documento desatualizado é **atualizado** no lote que o tornou obsoleto;
- documento depreciado é **arquivado** com cabeçalho de status, nunca apagado;
- funcionalidade desenvolvida e não publicada é **preservada** e registrada em
  `docs/ROADMAP_BUILDOUT_V3.md` como pronta aguardando ativação.
