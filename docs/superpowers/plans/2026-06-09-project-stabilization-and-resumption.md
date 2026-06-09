# Project Stabilization and Resumption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preservar o projeto recuperado, restabelecer um baseline tecnico confiavel e preparar o primeiro lote de produto pos-recuperacao.

**Architecture:** A retomada sera executada em gates independentes. Preservacao Git e seguranca local precedem a reconstrucao do Supabase; somente depois do baseline completo a documentacao sera reconciliada e a frente read-only de CS podera ser especificada.

**Tech Stack:** Git/GitHub, Node.js 22, npm workspaces, TypeScript, React 19, Vite 8, Supabase CLI, PostgreSQL/pgTAP e Docker Desktop.

---

## Ordem de execucao

### Task 1: Preservar o historico Git recuperado

**Arquivos:** nenhum arquivo-fonte.

- [x] Confirmar `HEAD`, worktree e divergencia:

```powershell
git status --short --branch
git rev-parse HEAD
git rev-list --count origin/main..HEAD
```

Esperado: branch `codex/mvp-operational-completion-goal`, HEAD `0e9ff70...` e
239 commits a frente.

- [x] Autenticar o GitHub:

```powershell
gh auth login
gh auth status
```

- [x] Com autorizacao humana explicita, publicar sem reescrever historico:

```powershell
git push --set-upstream origin codex/mvp-operational-completion-goal
```

- [x] Confirmar que o hash remoto e igual ao local:

```powershell
git ls-remote --heads origin codex/mvp-operational-completion-goal
```

Nunca usar `--force`.

### Task 2: Remover material de autenticacao local literal

**Arquivos:**
- Modify: `scripts/knowledge/reprocess-octadesk-article-assets.mjs`
- Create: `tests/scripts/reprocess-octadesk-article-assets.test.mjs`
- Modify: `package.json`, somente se necessario para expor o teste.

- [x] Criar teste que rejeite URL nao local e aceite configuracao local
  explicitamente fornecida:

```javascript
assert.throws(
  () => resolveLocalSupabaseConfig({ url: 'https://example.supabase.co' }),
  /local Supabase/
);
assert.equal(resolveLocalSupabaseConfig({
  url: 'http://127.0.0.1:54321',
  anonKey: 'test-local-key',
}).anonKey, 'test-local-key');
```

- [x] Confirmar falha inicial:

```powershell
node --test tests/scripts/reprocess-octadesk-article-assets.test.mjs
```

- [x] Implementar resolver que leia URL/key de variavel de ambiente ou
  `supabase status -o env`, rejeite host nao loopback e nao contenha fallback
  literal de chave ou senha.

- [x] Validar:

```powershell
node --test tests/scripts/reprocess-octadesk-article-assets.test.mjs
node --check scripts/knowledge/reprocess-octadesk-article-assets.mjs
```

- [x] Executar scanner de arquivos rastreados que reporte arquivo e regra, sem
  imprimir valores sensiveis.

- [x] Commit sugerido:

```powershell
git commit -m "security: remover credenciais locais literais"
```

### Task 3: Restaurar o baseline Supabase local

**Arquivos:**
- Create: `docs/reports/POST_RECOVERY_BASELINE_2026-06-09.md`

- [x] Com autorizacao humana para instalacao, instalar/iniciar Docker Desktop.

- [x] Verificar runtime:

```powershell
docker version
docker info
```

- [x] Subir e reconstruir o Supabase:

```powershell
npm run supabase:start
npm run supabase:wait:ready
npm run supabase:db:reset
```

- [x] Executar gates:

```powershell
npm run supabase:lint:db
npm run supabase:test:db
npm run supabase:verify
```

- [x] Reidratar fixture canonica:

```powershell
$env:GENIUS_QA_SUPPORT_FIXTURE_TIMEOUT_MS='1200000'
npm run supabase:qa:local-functional-fixture
```

- [x] Registrar versoes, comandos, contagens e falhas no relatorio, sem
  credenciais.

### Task 4: Reconciliar documentacao corrente

**Arquivos:**
- Modify: `docs/PROJECT_STATE.md`
- Modify: `docs/ROADMAP_BUILDOUT_V3.md`
- Modify: `docs/GOAL_EXECUTION_PLAN.md`
- Modify: `docs/DOCUMENTATION_LEDGER.md`
- Modify: `docs/README.md`

- [x] Marcar recomendacoes superadas sem apagar historico.
- [x] Registrar hash remoto, baseline Supabase e resultado do hardening.
- [x] Apontar um unico proximo lote corrente.
- [x] Validar:

```powershell
npm run documentation:validate:internal-docs
git diff --check
```

- [x] Commit sugerido:

```powershell
git commit -m "docs: consolidar retomada pos-recuperacao"
```

### Task 5: Auditar dependencias vulneraveis

**Arquivos:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `apps/web/package.json`, se a dependencia direta mudar.

- [x] Capturar advisories:

```powershell
npm audit --json
```

- [x] Identificar as menores versoes compativeis corrigidas.
- [x] Nao executar `npm audit fix --force`.
- [x] Aplicar apenas upgrades auditados.
- [x] Validar:

```powershell
npm run contracts:typecheck
npm run web:typecheck
npm run web:build
npm audit
```

- [x] Commit sugerido:

```powershell
git commit -m "chore: atualizar dependencias vulneraveis"
```

### Task 6: Especificar CS Portfolio read-only

**Arquivos:**
- Create: `docs/design/CS_PORTFOLIO_READONLY_SCREEN_SPEC.md`
- Modify: `docs/PROJECT_STATE.md`
- Modify: `docs/DOCUMENTATION_LEDGER.md`

- [ ] Auditar migration, pgTAP e tipos do contrato
  `vw_cs_customer_portfolio`.
- [ ] Definir `/cs/portfolio`, route gate, loading, erro, vazio e portfolio.
- [ ] Manter health como `Indisponivel`.
- [ ] Excluir mutations, follow-ups, tarefas, projetos, billing e financeiro.
- [ ] Obter aprovacao humana do screen spec antes de implementar.

### Task 7: Implementar CS Portfolio read-only

**Arquivos provaveis:**
- Create: `apps/web/src/features/cs/cs-api.ts`
- Create: `apps/web/src/features/cs/CsGate.tsx`
- Create: `apps/web/src/features/cs/CsPortfolioPage.tsx`
- Modify: router e navegacao identificados na Task 6.
- Test: testes focados de API, gate e rota conforme convencao local.

- [ ] Criar testes falhando para leitura exclusiva da view CS e bloqueio de
  usuario sem acesso.
- [ ] Implementar adapter tipado sem adicionar campos ao contrato.
- [ ] Implementar gate e pagina conforme screen spec aprovado.
- [ ] Executar:

```powershell
npm run contracts:typecheck
npm run web:typecheck
npm run web:build
npm run supabase:test:db
npm run documentation:validate:internal-docs
```

- [ ] Fazer QA autenticado para CS autorizado, platform admin, usuario sem
  acesso, portfolio vazio e cliente multiproduto.
- [ ] Commit sugerido:

```powershell
git commit -m "feat: adicionar portfolio cs somente leitura"
```

## Gate de conclusao

O ciclo de retomada termina somente quando:

- o historico recuperado estiver publicado e verificado;
- nao houver material de autenticacao literal em scripts rastreados;
- reset, lint, pgTAP e verify passarem no notebook restaurado;
- a documentacao canonica indicar um unico proximo passo;
- advisories forem corrigidos ou aceitos com evidencia;
- `/cs/portfolio` respeitar especificacao previamente aprovada.
