# REPOSITORY_SANITIZATION_REPORT.md

## Escopo

Higiene de repositório e organização estrutural em `C:\Trabalho`, sem alterar
regra de negócio, schema, migrations, RLS, RPCs, views, contratos, backend,
frontend funcional ou testes oficiais.

## Auditoria executada antes da limpeza

- `git status --short`
- `git ls-files --others --exclude-standard`
- inventário de logs e artefatos locais na raiz
- inventário de `.tmp/`, `.playwright-mcp/` e `test-results/`
- leitura de `.gitignore`, `docs/README.md` e `docs/REPOSITORY_STRUCTURE.md`
- busca de referências para documentos e specs recém-adicionados
- varredura básica de strings sensíveis em logs soltos antes da remoção

## Arquivos removidos

- `.codex-web-dev.log`
- `.tmp_web_dev.log`
- `.tmp-admin-context-dev.log`
- `.tmp-customer-portal-regression.log`
- `.tmp-engineering-qa-dev.log`
- `.tmp-portal-4175.out.log`
- `.tmp-portal-search-dev.log`
- `.tmp-web-branding.err.log`
- `.tmp-web-branding.out.log`
- `.tmp-web-dev-customer-portal.err.log`
- `.tmp-web-dev-customer-portal.out.log`
- `.tmp-web-dev-err.log`
- `.tmp-web-dev-out.log`
- `.tmp-web-dev.err.log`
- `.tmp-web-dev.log`
- `.tmp-web-dev.out.log`
- `.tmp-web-help-env.err.log`
- `.tmp-web-help-env.out.log`
- `.tmp-web-help.err.log`
- `.tmp-web-help.out.log`
- `.tmp-web-portal.err.log`
- `.tmp-web-portal.out.log`
- diretório `.playwright-mcp/`
- diretório `test-results/`

## Arquivos movidos

- nenhum

## Arquivos preservados e motivo

- `apps/`, `packages/`, `supabase/`, `tests/`, `raw_knowledge/`, `package.json`,
  `package-lock.json` e `.env.example`: fazem parte da estrutura canônica.
- `docs/` estratégicos em caixa alta: continuam como fonte oficial.
- `docs/GPT/` e arquivos/documentos não rastreados relacionados a produto e UI:
  preservados por indício de trabalho ativo e por não serem lixo inequívoco.
- `PRODUCT.md`, `DESIGN.md` e `README.md` da raiz: preservados e validados.
  `README.md` foi ajustado apenas para atuar como ponte curta para a
  documentação canônica; `PRODUCT.md` e `DESIGN.md` permaneceram consistentes
  com as fontes oficiais em `docs/`.

## Riscos encontrados

- logs locais continham strings sensíveis e contexto operacional, incluindo
  indícios de credenciais/tokens/URLs. O relatório não replica esses valores.
- o worktree já estava sujo com mudanças funcionais e documentais anteriores.
  Esta fase evitou tocar nesses arquivos para não misturar higiene com feature.
- os arquivos raiz complementares precisam continuar alinhados com as fontes
  canônicas em `docs/` para evitar drift documental.

## Mudanças no .gitignore

- adicionados padrões explícitos para `/.codex-*.log`
- adicionados padrões explícitos para `/.tmp*.log`, `/.tmp_*.log`,
  `/.tmp-*.log`
- adicionados padrões para dumps locais `/*.out`, `/*.err` e diretórios
  temporários no padrão `/.tmp-*/`

## Documentação atualizada

- `docs/README.md`: adicionada referência ao relatório de sanitização
- `docs/REPOSITORY_STRUCTURE.md`: explicitados `docs/design/`, `docs/knowledge/`,
  `docs/reports/`, `docs/superpowers/` e `scripts/`

## Validações executadas

- `npm run contracts:typecheck`
  - resultado: sucesso
- `npm run web:typecheck`
  - resultado: sucesso
- `npm run web:build`
  - resultado: sucesso
- `npm run supabase:verify`
  - resultado: sucesso
  - observações:
    - reset local do Supabase executado com sucesso
    - suíte `supabase test db --local` passou com `Files=38`, `Tests=765`
    - `supabase db lint --local` terminou sem erros de schema
    - o wrapper reidratou a fixture QA local ao final

## Pendências

- revisar futuramente se `docs/GPT/` deve permanecer como área oficial,
  arquivada ou consolidada em `docs/`

## Fechamento

- processos locais de `web:dev` que mantinham handles abertos foram encerrados
- arquivos residuais removidos nesta rodada:
  - `.codex-web-dev.log`
  - `.tmp/codex-support-ticket-fidelity.out.log`
- o diretório `.tmp/` foi removido após ficar vazio
- não houve alteração funcional nesta etapa final; o fechamento atuou apenas em
  processo local, remoção de resíduos e atualização do relatório
- pendências estruturais deixadas para fase futura:
  - decisão sobre `docs/GPT/`
  - revisão do worktree funcional pré-existente

## Follow-up executável — triagem controlada da raiz (2026-05-20)

Fonte de verdade aplicada nesta fase:

- `docs/ROOT_ARTIFACT_HYGIENE_POLICY.md`
- este relatório (`docs/reports/REPOSITORY_SANITIZATION_REPORT.md`)

### Inventário triado e movido

- `113` screenshots/evidências visuais soltas na raiz foram movidas para `.tmp/qa/<surface>/2026-05-20--root-triage/`
- `32` dumps, métricas, snapshots markdown/json/cjs foram movidos para `.tmp/runs/<surface>/2026-05-20--root-triage/`
- `12` logs/saídas locais foram movidos para `.tmp/logs/root-artifact-hygiene/2026-05-20--root-triage/`
- `3` diretórios ambíguos/temporários de tooling foram movidos para `.tmp/quarantine/2026-05-20-root-triage/`
  - `.codex-local/`
  - `test-results/`
  - `tmp/`
- `2` resíduos ambíguos foram movidos para quarentena:
  - `sanitize_root.py`
  - `{`

### Famílias cobertas

- `build-journal`
- `help-genius`
- `product-docs`
- `internal-actions`
- `support-auth`
- `support-ticket`
- `support-workspace`
- logs/tooling `.tmp-web*` e `.codex*`

### Promoções para documentação canônica

- nenhuma nesta rodada
- decisão explícita: os artefatos soltos da raiz eram majoritariamente evidência transitória, dumps de execução ou séries intermediárias (`before`, `debug`, `pass`, `fixed`, `v2`, `final-check`), então não houve promoção automática para `docs/design/` nem `docs/reports/`
- blueprints já preservados em `docs/design/blueprint/` seguiram como fonte visual estável; o lote solto foi tratado como evidência temporária, não como asset oficial adicional

### Estado final da raiz após a triagem

A raiz ficou restrita a:

- arquivos canônicos (`README.md`, `package.json`, `.gitignore`, `PRODUCT.md`, `DESIGN.md`, `.env.example`)
- diretórios estruturais (`apps/`, `docs/`, `packages/`, `scripts/`, `supabase/`, `tests/`, `raw_knowledge/`, `.github/`, `.skills/`)
- diretórios locais ignorados e explicitamente temporários (`.tmp/`, `.playwright-mcp/`, `/.tmp-*`)
- `node_modules/` como dependência local ignorada

### Guardrails complementares aplicados

- `.gitignore` passou a ignorar explicitamente `/.codex-local/`
- um resumo estruturado da triagem foi salvo em `.tmp/runs/root-artifact-hygiene/2026-05-20--root-triage/summary.json`
- a quarentena criada em `.tmp/quarantine/2026-05-20-root-triage/README.md` registra origem, motivo e decisão pendente para os itens ambíguos

### Validação desta fase

- listagem da raiz validada após a movimentação, sem arquivos soltos fora das exceções canônicas/temporárias ignoradas
- `git status --short --branch` revalidado para garantir que o saneamento não tocou código de produto nem mascarou mudanças humanas em andamento
