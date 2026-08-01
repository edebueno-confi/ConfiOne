# INTEGRATIONS-03 — Correções de produção

## Escopo

Este lote versiona a correção do carregamento inicial de CS/Support do HubSpot,
alinha o contrato de CORS das Edge Functions afetadas e registra a validação
do snapshot OMIE já existente. Nenhuma migration, seed ou alteração de layout
foi incluída.

## Causas confirmadas

- O preflight anterior retornava 404 porque as funções usadas pelo Analytics
  ainda não estavam publicadas no projeto remoto.
- A etapa CS do HubSpot consultava o último sucesso global, incluindo Comercial,
  e por isso podia iniciar como incremental sem histórico próprio de CS.
- O contrato OMIE usa `App Key` e `App Secret`; não existe token único no
  cliente read-only implementado.

## Correções

- `hubspot-sync` usa watermark separado por `companies`, `commercial` e `cs`.
- A primeira execução de CS sem histórico próprio não reutiliza o watermark de
  Comercial.
- O preflight CORS valida Production e Preview conhecidos; localhost só é
  permitido quando `ALLOW_LOCAL_CORS=true`.
- As funções `hubspot-sync`, `omie-sync`, `analytics-integration-run` e
  `analytics-scheduled-run` permanecem versionadas no repositório e foram
  publicadas durante o diagnóstico.

## Validação remota

- OMIE: execução já existente com 3.433 recebidos, 3.433 aceitos e zero
  rejeitados; não foi executada nova sincronização neste lote.
- HubSpot: Comercial e empresas persistiram dados; a carga inicial CS ainda
  depende de autorização explícita antes do write remoto.
- CORS: preflight autorizado responde 200; POST sem autenticação responde 403.
- Nenhum segredo, token, senha, cookie, JWT ou payload sensível foi versionado.

## Limitações e próximos gates

- A validação automatizada `supabase:verify` local foi interrompida no fixture
  de QA porque `LOCAL_QA_ADMIN_PASSWORD` não estava configurada; o reset local,
  testes pgTAP e lint de schema executados antes dessa etapa passaram.
- A autorização para a única carga inicial CS/Support deve ser obtida antes da
  execução. A carga não deve alterar objetos no HubSpot.
