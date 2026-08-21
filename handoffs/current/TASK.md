# Task

## Task ID

COMMERCIAL-RECONCILIATION-2026-08-21

## Título

Reconciliar totais, perdidos e fechados

## Estado

READY_FOR_IMPLEMENTATION

## Contexto

As métricas comerciais do ConfiOne apresentam uma divergência operacional que
precisa ser investigada na fonte de dados, nos contratos e nos consumidores.
O lote deve explicar a diferença observada entre 208 e 206 e o valor exibido
para perdidos, sem ajustar números por hardcode ou cosmética de interface.

## Objetivo

Reconciliar os totais comerciais, os registros perdidos e os registros fechados
no caminho executável atual, mantendo explícitas a fonte, a janela temporal, o
universo, os filtros, os nulos e a diferença entre movimento e estoque.

## Escopo

- localizar as fontes, RPCs, views, read models e consumidores responsáveis por
  totais, perdidos e fechados;
- reproduzir a divergência 208 versus 206 e identificar sua causa com evidência;
- verificar se perdidos e fechados usam o mesmo universo, período, timezone,
  pipeline, stage, tenant e filtros de autorização;
- corrigir somente divergências comprovadas no caminho atual;
- adicionar ou ajustar testes comportamentais e contra-testes sem enfraquecer
  asserções;
- atualizar o catálogo ou documentação canônica somente quando a correção
  tornar o documento obsoleto.

## Fora de escopo

- alterar dados históricos para obter números esperados;
- criar KPI, regra de negócio, integração, credencial, tabela, RPC ou catálogo
  paralelo sem contrato e fonte real;
- alterar release surface, landing, rotas públicas ou permissões;
- corrigir findings não relacionados, incluindo P-GOV-001 do lote anterior;
- executar migration remota, push, merge, deploy, alterar secrets ou publicar.

## Requisitos de aceitação

1. A causa da divergência 208 versus 206 deve ser reproduzida por comando,
   fixture ou consulta local verificável.
2. Totais, perdidos e fechados devem declarar universo, período, timezone,
   filtros, nulos e semântica de movimento ou estoque no contrato aplicável.
3. A correção deve ocorrer na fonte da verdade, não em heurística local do
   frontend.
4. Deve existir contra-teste para impedir que a divergência ou um total global
   silencioso retorne.
5. Tenant isolation, RLS, autorização, auditoria e compatibilidade devem ser
   preservados.
6. `IMPLEMENTATION.md` deve registrar investigação, arquivos, comandos,
   resultados, limitações e allowlist.
7. Ao concluir, Forge deve entregar `READY_FOR_REVIEW` com `Owner = Sentinel`.

## Documentos normativos aplicáveis

- `AGENTS.md`
- `docs/PROJECT_STATE.md`
- `docs/README.md`
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/engineering/REVIEW_PROTOCOL.md`
- `handoffs/README.md`

## Base e autorização

- Base commit SHA: `8d9e7da1c70d1aee8aad21e4e0896c3bf325d2d2`
- Branch: `main`
- Owner: Forge
- Reviewer active: Sentinel
- Approval: APPROVED na fila canônica
- Dependências: `DATA-PIPELINE-STAGE-SCOPE-2026-08-21` e
  `DATA-TEMPORAL-SEMANTICS-2026-08-21`, ambas DONE.

## Guardrails

- Não absorver alterações preexistentes do worktree.
- Não alterar baseline para obter aprovação.
- Se a semântica não puder ser determinada com segurança, registrar
  `UNRESOLVED — requires project owner decision` e parar o lote.
