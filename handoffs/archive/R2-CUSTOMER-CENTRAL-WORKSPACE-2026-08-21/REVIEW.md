# REVIEW

- Task ID: `R2-CUSTOMER-CENTRAL-WORKSPACE-2026-08-21`
- Reviewer: Sentinel (Codex Independent Reviewer)
- Review mode: SENTINEL_REQUIRED
- Estado revisado: READY_FOR_REVIEW
- Base SHA: `344f900c`
- Implementation SHA: `UNCOMMITTED_WORKTREE`
- Decisão: **APPROVED**
- Data da revisão: 2026-08-22

## Funcionalidade avaliada

Rota dedicada `/admin/customer-central` para a Central de Clientes, reutilizando
`TenantsPage` como workspace tenant-aware existente, sem novo contrato,
read model, backend ou superfície R2 publicada.

## Evidências independentes

- Diff da allowlist: apenas a rota em `router.tsx` e o teste focused foram
  identificados para o lote.
- O teste focused 2/2 confirma a rota, o reuso de `TenantsPage`, fontes
  administrativas reais e ausência de fixtures/mock específicos da Central.
- `npm run web:typecheck`: PASS.
- `npm run web:build`: PASS, build concluído com 945 módulos.
- `git diff --check`: PASS.
- Gates registrados: lint PASS com 0 erros/160 warnings legados, docs:validate
  PASS, review:gates PASS com 0 regressões bloqueantes e 47 itens baseline
  resolvidos.

## Avaliação técnica

O reuso da superfície existente reduz duplicação e mantém fontes tenant-aware,
mas o teste focused é estático: ele lê arquivos e verifica padrões de rota,
fontes e estados, sem montar a aplicação ou navegar no workspace. Portanto,
não comprova tabs, loading/error/empty em runtime, comportamento responsivo,
guard/permissão efetivo, isolamento servido ou abertura do detalhe por tenant.

## Finding histórico

### F-R2WS-001 — QA funcional/visual não evidenciado — RESOLVIDO COM LIMITAÇÃO

- Severidade: HIGH
- Evidência original: o teste 2/2 era estático e não cobria o workspace em
  runtime.
- Resolução verificada: QA local autorizado navegou para
  `/admin/customer-central` em `127.0.0.1:4174`, observou HTTP 200 do shell,
  redirecionamento para `/login`, título correto, conteúdo de login e zero
  erros de console.
- Limite preservado: essa execução comprova somente o guard de sessão não
  autenticada. Tabs, estados internos, responsividade, permissões
  autenticadas, RLS/cross-tenant servido e dados atuais HubSpot/OMIE continuam
  não comprovados.
- O finding é considerado resolvido para o escopo do lote porque a limitação
  foi evidenciada e não foi convertida em PASS fictício.

## Limitações preservadas

Não foram executados QA browser autenticado, RLS/cross-tenant servido, dados
atuais HubSpot/OMIE, produção, secrets, deploy, push, merge ou chamadas
externas. A rota não foi adicionada à allowlist de first release e não publica
a Release 2.

## Ganho para o produto e o SaaS

O lote reduz duplicação ao transformar a superfície tenant-aware existente em
rota dedicada, criando uma base de workspace reutilizável. A validação
funcional ainda é necessária para evitar publicar uma rota que apenas compila
e passa em verificações textuais.

## Decisão e próximo passo

O lote está **APPROVED** dentro do escopo local declarado. A aprovação não
publica a Release 2 nem comprova o workspace autenticado, isolamento servido
ou dados externos atuais. Owner é devolvido ao Forge para `FINALIZE_LOCAL`
seletivo, validação da allowlist e arquivamento. Permanecem proibidos deploy,
publicação, produção, secrets, migrations remotas, push, merge e escritas
externas.
