# Octadesk Public Help Release Status

Data: `2026-05-20`

## Resultado

- Artigos avaliados: `58`.
- Artigos no Knowledge runtime: `54`.
- Artigos publicados nesta fase: `0`.
- Artigos Octadesk com `visibility = public`: `0`.
- Artigos Octadesk expostos em views publicas: `0`.
- `/help/genius` permanece com os `6` artigos publicos seed/manuais.

## Distribuicao runtime

| Status | Visibility | Total |
| --- | --- | ---: |
| review | internal | 4 |
| draft | internal | 24 |
| draft | restricted | 26 |

Advisories pendentes: `54`.

## Publicacao

A primeira onda publica nao foi executada. Motivo: nenhum artigo possui simultaneamente checklist humano real, advisory revisado, revisao de assets e aprovacao do gate backend para publicacao segura.

## Estado da Central Publica

A Central de Ajuda publica continua funcional e navegavel com os artigos seed/manuais. O corpus Octadesk importado permanece invisivel para o publico ate revisao humana.

## Proxima onda segura

1. Selecionar poucos artigos em `needs_human_decision` e `internal_help_only`.
2. Revisar/remover assets.
3. Revisar advisory e preencher checklist humano real.
4. Converter visibilidade para `public` apenas se a versao final for segura.
5. Publicar por RPC editorial existente e validar `/help/genius`.

## Fechamento operacional

- `docs/reports/OCTADESK_PUBLICATION_WAVES.md` organiza o corpus em ondas operacionais.
- `docs/reports/OCTADESK_WAVE_0_PUBLICATION_CHECKLIST.md` define a checklist humana dos 4 artigos em `review/internal`.
- `docs/reports/GENIUS_HELP_CENTER_READINESS_REPORT.md` consolida o readiness da Central de Ajuda Genius.
- A Central Publica permanece com os 6 artigos seed/manuais ate revisao humana real.
