# GSO Release Readiness e Próximos Ciclos — Plano de Implementação

> For agentic workers: REQUIRED SUB-SKILL: Use executing-plans para executar este plano por tarefas, com revisão entre lotes e validação real antes de declarar conclusão.

Goal: fechar a prontidão técnica do Dashboard Gerencial e organizar a continuidade do GSO em lotes SDD auditáveis, sem writes externos não aprovados.

## Estado de execução do lote atual — 2026-07-21

- Concluídos: W1 higiene, W2 QA do Dashboard, W3 sincronização faseada/ACL do
  scheduler e W5 reidratação local da Central de Ajuda.
- Parcialmente concluído: W4 preflight/hardening CS Ops; nenhum `apply` externo.
- Auditoria concluída: W6 segurança/performance, sem scheduler remoto ou secrets.
- Próximo lote: fingerprint de catálogo, lease atômico, cursor por escopo e
  medição de consultas pesadas.

Architecture: HubSpot, OMIE e planilhas continuam adapters controlados; Supabase concentra leitura, regra, RLS e auditoria. O frontend consome views/read models e RPCs existentes. Cada frente tem escopo de escrita separado e documentação própria.

Tech Stack: React/Vite/TypeScript, Supabase/Postgres/RLS, Edge Functions Deno, pgTAP, Node test runner, Vite, Playwright e Markdown versionado.

---

## Regras de execução

- Começar cada lote com git status --short --branch, leitura da spec e dos documentos canônicos.
- Usar subagentes somente em escopos independentes; nenhum subagente edita docs/spec.md, docs/plan.md, migrations compartilhadas ou integrações externas sem escopo escrito.
- Não usar git reset --hard, git clean -fd, force push ou exclusão permanente sem decisão humana.
- Não fazer push, deploy, migration remota, alteração de secret ou write HubSpot/OMIE sem gate explícito.
- Fechar cada lote com testes, relatório, atualização de PROJECT_STATE, DOCUMENTATION_LEDGER e documento específico afetado.

## Tarefa 1 — Baseline e coordenação

Arquivos: AGENTS.md, docs/spec.md, docs/PROJECT_STATE.md, docs/README.md, docs/ROADMAP_BUILDOUT_V3.md, docs/CODEX_EXECUTION_RULES.md, docs/VALIDATION_CHECKLIST.md, docs/ARCHITECTURE_RULES.md, docs/VIEW_RPC_CONTRACTS.md, docs/AUTH_CONTEXT_STRATEGY.md, docs/AI_GOVERNANCE.md, docs/DOCUMENTATION_LEDGER.md e a spec guarda-chuva.

- [ ] Registrar branch, HEAD, remoto, status, lock do índice e contagem de mudanças.
- [ ] Registrar subagentes em execução e confirmar escopos disjuntos.
- [ ] Confirmar que a auditoria não executa reset de banco.
- [ ] Unificar no relatório atual os conflitos históricos de branch, contagem de testes, escopo dashboard_viewer, OMIE e cache HubSpot.

Comandos:

    git status --short --branch
    git log -5 --oneline --decorate
    git remote -v
    git diff --check

Aceite: identidade reproduzível e nenhum estado externo alterado.

## Tarefa 2 — Higiene documental e da raiz

Arquivos: docs/CLEANUP_REPORT.md, docs/README.md, docs/ROOT_ARTIFACT_HYGIENE_POLICY.md, docs/reports/REPOSITORY_CLEANUP_AUDIT_2026-07-21.md e um script local de verificação em scripts/ ou tests/scripts/.

- [ ] Mapear referências de docs/CLEANUP_REPORT.md com rg.
- [ ] Classificar links históricos, canônicos e substituíveis pelo relatório de sanitização.
- [ ] Preservar o documento histórico ou arquivá-lo somente após atualizar todos os links.
- [ ] Verificar consumidores dos scripts Windows antes de mover ou manter os arquivos.
- [ ] Criar verificação read-only que reporte screenshots, dumps, logs e diagnósticos proibidos na raiz sem apagar nada.
- [ ] Atualizar o relatório de cleanup com a decisão e a validação.

Comandos:

    rg -n --hidden --glob '!node_modules/**' --glob '!.git/**' 'CLEANUP_REPORT|INICIAR-GENIUS|CRIAR-USUARIOS' .
    git ls-files --others --exclude-standard
    git diff --check

Aceite: raiz auditável, temporários em .tmp e referências válidas.

## Tarefa 3 — Qualificação do Dashboard

Arquivos: apps/web/src/features/analytics/, apps/web/src/components/GeniusMascot.tsx, apps/web/src/index.css, contratos/views/RPCs referenciados e novo relatório em docs/reports/.

- [ ] Levantar telas, RPCs e estados loading/error/empty.
- [ ] Confirmar que período, pipeline, alias, origem, status e responsável vêm do backend.
- [ ] Confirmar consolidação server-side de by_status e by_owner com pipeline_breakdown.
- [ ] Validar hints de fonte, fórmula, frescor, cobertura, timezone e caveat.
- [ ] Validar exportação visual sem shell e somente com abas selecionadas.
- [ ] Fazer QA autenticado em claro/escuro, desktop e mobile, mantendo evidência em .tmp.

Comandos:

    npm run web:typecheck
    npm run web:build
    git diff --check

Aceite: período global consistente, totais sem duplicação, estados honestos e nenhum cálculo crítico no frontend.

## Tarefa 4 — Integrações e timeout

Arquivos: supabase/functions/hubspot-sync/index.ts, supabase/functions/omie-sync/index.ts, supabase/functions/analytics-integration-run/index.ts, supabase/functions/_shared/, migrations analytics e testes de adapter.

- [ ] Revisar janela incremental, particionamento de tickets, limites de concorrência, timeout e retry.
- [ ] Confirmar carga completa de Deals somente pela ausência de incrementalidade confirmada.
- [ ] Confirmar status partial OMIE e fallback sem dupla contagem.
- [ ] Confirmar run_id, contadores e erros sanitizados.
- [ ] Cobrir timeout, worker failure, 400/546, retry esgotado, concorrência e snapshot parcial.

Comandos:

    npm run contracts:typecheck
    node --test tests/scripts/*omie*.test.mjs
    npm run supabase:test:db

Aceite: reexecução idempotente, falha parcial honesta e nenhum segredo em UI/payload/log.

## Tarefa 5 — CS Ops e carteira

Arquivos: supabase/functions/hubspot-cs-migration/index.ts, supabase/functions/_shared/cs-migration.ts, migrations/testes do ledger, apps/web/src/features/analytics/ e relatórios de reconciliação.

- [ ] Revalidar hash, aba, linhas e versão de mapeamento da BD_Clientes.
- [ ] Separar match seguro, criação, conflito, ambiguidade, sem correspondência e matriz/filial.
- [ ] Vincular dry-run e apply ao mesmo snapshot/versionamento do catálogo.
- [ ] Confirmar bloqueio quando catálogo live estiver vazio.
- [ ] Confirmar precedência da planilha apenas nos campos aprovados.
- [ ] Não criar, mover ou alterar tickets/pipelines de Suporte.
- [ ] Só depois do ledger validado, preparar seed da carteira local sem dados fictícios.

Comandos:

    node --test tests/scripts/cs-migration.test.mjs
    npm run supabase:test:db
    npm run web:typecheck

Aceite: nenhum alvo ambíguo escrito; cada empresa tem ID, origem, payload, resultado e auditoria.

## Tarefa 6 — Help Center, Portal e viewer

Arquivos: rotas Knowledge/Portal, migrations de entitlements/assets/roles, testes de acesso e docs/reports/.

- [ ] Validar views públicas, assets governados e ausência de caminho privado exposto.
- [ ] Validar leitura/edição de artigos pelo papel correto.
- [ ] Validar dashboard_viewer por backend, sem inferência de e-mail/localStorage/frontend.
- [ ] Validar isolamento de tenant e recuperação de sessão/rede.
- [ ] Registrar convite real, publicação remota e deploy como gates externos.

Comandos:

    npm run supabase:verify
    npm run web:typecheck
    npm run web:build

Aceite: nenhuma publicação automática ou conta externa criada no teste.

## Tarefa 7 — Segurança, contratos e performance

Arquivos: migrations/Edge Functions alteradas, docs/ARCHITECTURE_RULES.md, docs/VIEW_RPC_CONTRACTS.md, docs/AUTH_CONTEXT_STRATEGY.md e relatório de revisão.

- [ ] Auditar security definer, search_path, grants, RLS, tenant scope e audit log.
- [ ] Auditar queries de reconciliação, paginação, índices e timeout.
- [ ] Reavaliar CORS e scheduler somente com inventário de consumidores e rotação definida.
- [ ] Separar warnings históricos de regressões novas.
- [ ] Rodar lint DB e audit de dependências.

Comandos:

    npm run supabase:lint:db
    npm audit --omit=dev --audit-level=high

Aceite: sem vulnerabilidades high e sem bypass novo.

## Tarefa 8 — Release pack e handoff

Arquivos: novo relatório em docs/reports/, docs/PROJECT_STATE.md, docs/plan.md, docs/DOCUMENTATION_LEDGER.md e docs/README.md.

- [ ] Registrar arquivos, decisões, testes, warnings, limitações e commits.
- [ ] Separar gates locais de push/deploy/migration/secret/write externo.
- [ ] Criar matriz de QA por rota, papel, tema, viewport e estado.
- [ ] Atualizar prompt de continuidade com branch, HEAD, docs e próximo ciclo.
- [ ] Solicitar aprovação apenas para o gate que exige intervenção humana.

Comandos:

    git status --short --branch
    git log -5 --oneline --decorate
    git diff --check

Aceite: outro agente reproduz o estado local e a decisão de release é explícita.

## Critérios globais de conclusão

- npm run web:typecheck passa.
- npm run web:build passa.
- npm run supabase:test:db passa sem falha não classificada.
- npx supabase db lint --local não apresenta warning novo.
- testes de contrato OMIE, CS Ops e HubSpot estão verdes.
- QA autenticado cobre Dashboard, Settings, Logs, Help Center, Portal e viewer.
- docs/spec, docs/plan, PROJECT_STATE, ledger, README e relatórios descrevem o mesmo estado.
- nenhum push/deploy/write remoto ou secret alterado sem aprovação.

## Primeiro lote

Executar Tarefa 2 com auditoria read-only e atualização do índice documental. Depois, executar Tarefas 3 e 4 em paralelo. A aprovação humana será solicitada antes de arquivar/remover documento ainda referenciado e antes de qualquer ação remota ou write externo.
