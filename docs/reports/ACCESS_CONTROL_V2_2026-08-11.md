# ACCESS CONTROL V2 — ciclo de vida e evidência de permissões — 2026-08-11

## Escopo

Lote local da branch `codex/access-control-v2`, limitado ao control plane interno
de `/admin/access`. Não altera governança de dados, Dashboard, integrações,
deploy, push, PR ou migration remota.

## Auditoria concluída

- `internal_organizational_areas` é o catálogo organizacional; `internal_action_target_areas` permanece o catálogo legado de roteamento de acionamentos.
- Usuários internos são determinados por `user_actor_contexts.actor_type = internal`; o frontend continua consumindo read models e RPCs, sem DML direto.
- Capabilities efetivas já combinavam papel global, perfil de área e override. O detalhe agora explicita origem, escopo, fontes e conflito, mantendo a precedência backend: bloqueio efetivo prevalece sobre concessão conflitante.
- Mutations relevantes continuam protegidas por `access.*.manage`, `SECURITY DEFINER`, `SET search_path = ''`, RLS e auditoria append-only.

## Entrega real

- `vw_admin_access_areas` passa a expor referências de membership, funções, convites, referência legada, `dependency_count` e `can_delete`.
- Área com usuários, vínculos, funções, convites ou histórico não é apagada; pode ser desativada e reativada preservando histórico.
- `rpc_admin_delete_internal_area(area_key, confirmed)` só exclui área não sistêmica sem dependências e exige confirmação explícita.
- A aba de Convites não faz parte da UI corrente. O cadastro ocorre diretamente em Usuários; dados, APIs e auditoria históricos permanecem preservados fora da superfície principal.
- A tela confirma ações sensíveis, mantém seleção e detalhe no mesmo quadro de trabalho, usa listas compactas em Estrutura e Perfis e abre edições em diálogo contextual, sem formulário perdido abaixo da lista.
- As telas concedidas por perfil e por colaborador foram compactadas em painéis paralelos com rolagem interna; o corpo do shell continua rolável para formulários e detalhes completos.

## Limites e decisões pendentes

- Não foi criado um catálogo genérico novo de `Environment → Domain → Resource → Action → Scope`; o lote evidencia o que o modelo existente realmente calcula.
- Os sete presets nominais e a decisão de tratar Conteúdo/Conhecimento como função de CS/Suporte continuam dependentes de decisão de domínio e não receberam grants implícitos.
- QA autenticado responsivo e execução pgTAP dependem de Supabase local disponível; nenhum banco remoto foi tocado.

## Validação

> O bloco abaixo registra o checkpoint inicial do lote, antes da revisão UX.
> Os resultados finais desta entrega estão na seção seguinte.

- Passou: testes Node focados de Access existentes e `access-control-v2-contract.test.mjs` (11 testes).
- Passou: `git diff --check`.
- Passou com ressalvas: auditoria `genius-documentation-governance changed` (sem blockers; encontrou drift histórico fora deste lote) e `npm run documentation:validate:internal-docs` (alertas preexistentes de menções sensíveis, sem bloqueio).
- Não executado: `npm run contracts:typecheck` e `npm run web:typecheck`; o worktree não possui `tsc`/dependências instaladas.
- Não executado: Supabase/pgTAP, build, lint e QA visual autenticado pelo mesmo bloqueio de dependências/runtime local.

## Revisão UX e remoção da aba de Convites — 2026-08-11

- Passou: `npm run web:typecheck`, `npm run web:build`, `npm run lint`,
  `git diff --check` e `node tests/scripts/access-control-v2-contract.test.mjs`
  (3/3).
- Passou: validação documental `npm run docs:validate`; 0 documentos bloqueados.
  Os alertas são menções históricas/sensíveis já existentes no catálogo.
- Passou: inspeção do runtime em `4173`, confirmando lista compacta, diálogo de
  edição, catálogo de telas compacto e ausência da aba Convites no componente.
- Limitação: o Playwright chegou à tela de login, mas não havia sessão
  autenticada disponível; portanto não foi afirmado QA visual autenticado nesta
  revisão.
