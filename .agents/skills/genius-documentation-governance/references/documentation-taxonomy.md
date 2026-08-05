# Taxonomia documental

## Tipos

`product-vision`, `architecture`, `technical-contract`, `security`, `data-model`, `integration`, `specification`, `plan`, `backlog`, `project-state`, `execution-report`, `visual-evidence`, `handoff`, `runbook`, `decision`, `tutorial`, `historical`, `experimental`.

## Status

`CURRENT`, `CANONICAL`, `HISTORICAL`, `SUPERSEDED`, `DEPRECATED`, `EXPERIMENTAL`, `DRAFT`, `GENERATED`, `ARCHIVED`, `UNKNOWN`.

Tipo responde “o que é”; status responde “como deve orientar trabalho”. Um relatório pode ser `HISTORICAL` e continuar sendo evidência válida do momento registrado.

## Inferência segura

- `PROJECT_STATE`, contratos e policies: candidato a `CANONICAL`, confirmar no topo e no ledger;
- `docs/reports/` e snapshots datados: normalmente `HISTORICAL`;
- `docs/specs/`, runbooks e policies: `CURRENT`/`CANONICAL` somente após verificar links, código e ledger;
- protótipos, exports e arquivos em `output/`: `EXPERIMENTAL`/`GENERATED`;
- cabeçalho `Status: SUPERSEDED` ou `Substituído por:` deve ser preservado;
- ausência de evidência deve permanecer `UNKNOWN`, nunca virar `CURRENT` por conveniência.

