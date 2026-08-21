# Implementation

## Task ID

COMMERCIAL-PREDICTION-2026-08-21

## Implementador

Forge (Codex)

## Estado do handoff

READY_FOR_IMPLEMENTATION

## Base e SHAs

- Base SHA: `158069d34d6ab191177cfab32d77fa5349ba9d91`.
- Implementation SHA: `UNCOMMITTED_WORKTREE`.
- Branch: `main`.

## Plano inicial

- [ ] mapear fontes reais de pipeline, conversão, lead time e ticket;
- [ ] confirmar contratos, períodos, coortes, filtros e estados de cobertura;
- [ ] separar observado, derivado, projetado e indisponível;
- [ ] identificar o menor lote implementável sem inventar dados;
- [ ] executar gates aplicáveis;
- [ ] entregar `READY_FOR_REVIEW` ao Sentinel.

## Limites

- Nenhum código, SQL, migration, RPC, UI ou contrato será alterado antes da
  investigação confirmar necessidade e suporte por fonte real.
- IA generativa não será usada para matemática, totais ou probabilidade.
- Push, merge, deploy, migration remota, secrets, publicação e release surface
  continuam proibidos.
