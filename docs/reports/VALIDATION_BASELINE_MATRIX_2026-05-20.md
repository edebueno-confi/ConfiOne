# Validation Baseline Matrix — 2026-05-20

## Objetivo
Estabelecer a baseline real das validações técnicas do repositório `genius-support-os`, separando o que roda com segurança no estado atual, o que depende de ambiente local e o que não deve entrar em uma rotina de QA segura por ser destrutivo.

## Escopo avaliado
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:test:db`
- `npm run supabase:lint:db`
- `npm run supabase:verify`
- `npm run documentation:validate:internal-docs`

## Contexto real observado
- Workspace: `C:\Trabalho`
- Monorepo npm workspaces com `apps/web` e `packages/contracts`
- Dependências presentes em `node_modules`
- CLI do Supabase disponível
- `supabase status -o env` retornou stack local ativa em `127.0.0.1`, com core em portas `54321/54322`
- Serviços marcados como parados pelo status: `imgproxy`, `edge_runtime`, `pooler`
- O projeto possui mudanças locais humanas em andamento; esta baseline não alterou código de produto nem executou reset de banco

## Matriz de validação

| Ordem | Comando | Status atual | Segurança operacional | Pré-requisitos reais | Duração observada | Valor | Evidência resumida |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `npm run contracts:typecheck` | PASS | Seguro | `node_modules` instalados | 3s | Garante integridade dos contratos TS compartilhados | `tsc -p tsconfig.json --noEmit` concluiu com exit 0 |
| 2 | `npm run web:typecheck` | PASS | Seguro | `node_modules` instalados | 17s | Garante integridade do frontend em TypeScript | `tsc --noEmit` concluiu com exit 0 |
| 3 | `npm run documentation:validate:internal-docs` | PASS COM ALERTAS | Seguro | `node_modules`; whitelist `docs/internal-documents.whitelist.json` | <1s | Valida whitelist e bloqueios de conteúdo sensível nos docs internos | 12 docs avaliados, 5 válidos, 7 com alerta, 0 bloqueados |
| 4 | `npm run web:build` | PASS | Seguro | `node_modules` instalados | 18s | Detecta regressões de build, bundling e imports reais | `tsc --noEmit && vite build` concluiu com exit 0 |
| 5 | `npm run supabase:lint:db` | PASS | Seguro se o Supabase local já estiver ligado | Stack local do Supabase acessível em `127.0.0.1:54322` | 2s | Detecta problemas de schema SQL | `No schema errors found` |
| 6 | `npm run supabase:test:db` | PASS | Seguro se o Supabase local já estiver ligado | Stack local do Supabase acessível em `127.0.0.1:54322`; pgTAP disponível no ambiente local | 12s | Regressão estrutural principal do backend/RLS/RPC/views | 40 arquivos, 831 testes, PASS |
| 7 | `npm run supabase:verify` | NÃO RECOMENDADO na baseline segura | Destrutivo para banco local | Supabase local; permissão para reset; fixture local; script de readiness coerente com as portas reais | não executado integralmente | Pipeline ampla de reset + testes + import verification + fixture | Script chama `supabase:db:reset`, depois `supabase:test:db`, `knowledge:verify:octadesk:space-aware`, `supabase:lint:db`, `wait-for-supabase-ready` e `supabase:qa:local-admin-fixture --with-denied-user` |

## Evidências detalhadas por comando

### 1. `contracts:typecheck`
- Script raiz: `npm run typecheck --workspace @genius-support-os/contracts`
- Script workspace: `tsc -p tsconfig.json --noEmit`
- Resultado observado: PASS

### 2. `web:typecheck`
- Script raiz: `npm run typecheck --workspace @genius-support-os/web`
- Script workspace: `tsc --noEmit`
- Resultado observado: PASS

### 3. `documentation:validate:internal-docs`
- Script raiz: `node scripts/documentation/validate-internal-documents.mjs`
- Natureza: dry-run sem escrita em disco e sem gravação no banco
- Resultado observado: PASS com alertas informativos
- Resumo observado:
  - 12 documentos na whitelist
  - 5 válidos
  - 7 com alerta
  - 0 bloqueados
- Alertas atuais são de menções textuais sensíveis (`token-mention`, `service-role-mention`) e não bloquearam a execução

### 4. `web:build`
- Script workspace: `tsc --noEmit && vite build`
- Resultado observado: PASS
- Observação útil: o build gerou `dist/` normalmente, sem erro de bundling

### 5. `supabase:lint:db`
- Script raiz: `supabase db lint --local`
- Resultado observado: PASS
- Dependência real: banco local ativo
- Observação útil: não depende do `edge_runtime` ativo para a checagem de schema

### 6. `supabase:test:db`
- Script raiz: `supabase test db --local`
- Resultado observado: PASS
- Dependência real: banco local ativo
- Resumo observado: 40 arquivos, 831 testes, `Result: PASS`
- Observação útil: apesar de `edge_runtime` e `pooler` aparecerem como stopped em `supabase status`, a suíte de banco rodou normalmente

### 7. `supabase:verify`
- Script raiz: `node scripts/ci/run-supabase-verify.mjs`
- Fluxo inspecionado:
  1. `supabase:db:reset`
  2. `supabase:test:db`
  3. `knowledge:verify:octadesk:space-aware`
  4. `supabase:lint:db`
  5. `scripts/ci/wait-for-supabase-ready.mjs`
  6. `supabase:qa:local-admin-fixture --with-denied-user` (fora de CI)
- Motivo para não executar na baseline segura:
  - viola a restrição desta task de não resetar banco local
  - recria fixture administrativa local após o reset

## Falha objetiva encontrada na cadeia de `supabase:verify`
Mesmo sem rodar o verify completo, a etapa segura `node scripts/ci/wait-for-supabase-ready.mjs` foi executada isoladamente para validar a coerência do ambiente.

Resultado observado:
- FAIL após 64s
- motivo imediato: o script tenta verificar `127.0.0.1:55321` e `127.0.0.1:55322`
- estado real do projeto hoje: `supabase/config.toml` e `supabase status -o env` apontam para `54321` e `54322`

Impacto:
- no estado atual, `supabase:verify` tende a falhar mesmo com o core local do Supabase saudável, porque a readiness probe está desalinhada com as portas reais do projeto

Conclusão técnica:
- `supabase:verify` não está apenas fora da baseline segura por resetar o banco
- ele também está operacionalmente inconsistente com a configuração atual de portas do repositório

## Comandos seguros vs. comandos dependentes de ambiente

### Seguros para rotina local sem mexer no banco
1. `npm run contracts:typecheck`
2. `npm run web:typecheck`
3. `npm run documentation:validate:internal-docs`
4. `npm run web:build`

### Seguros somente quando o Supabase local já estiver ativo
5. `npm run supabase:lint:db`
6. `npm run supabase:test:db`

### Fora da rotina segura / requer decisão explícita
7. `npm run supabase:verify`
- motivo: inclui reset de banco local e reidratação de fixture
- adicionalmente, hoje depende de correção no readiness script para alinhar portas

## Ordem recomendada de validação

### Ordem rápida e segura (sem tocar no banco)
1. `npm run contracts:typecheck`
2. `npm run web:typecheck`
3. `npm run documentation:validate:internal-docs`
4. `npm run web:build`

### Ordem completa local quando o Supabase já estiver ligado
1. `npm run contracts:typecheck`
2. `npm run web:typecheck`
3. `npm run documentation:validate:internal-docs`
4. `npm run web:build`
5. `npm run supabase:lint:db`
6. `npm run supabase:test:db`

### Ordem de verify destrutivo somente em contexto controlado
1. corrigir `scripts/ci/wait-for-supabase-ready.mjs` para usar as portas reais do projeto ou ler o status/env de forma consistente
2. confirmar que reset do banco local é aceitável
3. executar `npm run supabase:verify`

## Próximas ações recomendadas
1. Corrigir `scripts/ci/wait-for-supabase-ready.mjs` para não fixar `55321/55322` quando o projeto está em `54321/54322`
2. Separar no README ou em runbook curto a distinção entre:
   - validações seguras de rotina
   - validações dependentes de Supabase local
   - validação destrutiva (`supabase:verify`)
3. Manter `documentation:validate:internal-docs` na rotina rápida, porque o comando é barato, seguro e já detecta deriva relevante da whitelist interna
