# Preview de release local e as três camadas de autorização de tela

Data: 2026-08-05
Checkout canônico: `C:\Projetos\GSO-old`
Branch: `codex/react-router-v8-migration-20260804`

## Decisão tomada

O usuário delegou a decisão sobre publicar as telas com `release_enabled = false`.
A decisão é **não publicar**. `release_enabled` é contrato de produto: define a
superfície que o primeiro release expõe. Ligar tela em migration versionada para
viabilizar teste expõe superfície não aprovada em qualquer ambiente onde a
migration rodar, o que troca controle de escopo por conveniência de QA.

O caminho escolhido separa as duas coisas: pré-visualização restrita ao banco
local, reversível, fora de `supabase/migrations/`.

## Entrega 1: `local-release-preview`

Novo `supabase/qa/local-release-preview.mjs` e três scripts:

```bash
npm run supabase:qa:local-release-preview:status
npm run supabase:qa:local-release-preview -- --screens=tenants
npm run supabase:qa:local-release-preview:disable
```

Salvaguardas:

- roda atrás de `assertLocalSupabaseEnvironment`, então aborta fora do Supabase
  local;
- grava o estado original de todas as 18 telas em
  `output/local-qa/release-preview-backup.json` antes da primeira alteração;
- `--disable` restaura exatamente as telas que estavam `false`;
- exige lista explícita de telas. Sem `--screens` o comando falha com
  `LOCAL_RELEASE_PREVIEW_SEM_SCREENS`;
- nenhuma migration versionada é tocada, portanto não existe caminho para
  produção.

Ciclo verificado em execução real: status inicial com 4 telas publicadas, liga
tudo, smoke, restaura, status final idêntico ao inicial.

### Por que a lista explícita é obrigatória

Na primeira execução liguei o catálogo inteiro. O smoke autenticado passou a
falhar:

```text
LOCAL_QA_BROWSER_SMOKE_FAILED: platform_admin desktop
consoleErrors: 1, unexpectedResponses: 1
401 http://127.0.0.1:54321/rest/v1/vw_admin_auth_context?select=*
```

Publicar tudo de uma vez muda a superfície navegável e o app passa a fazer
chamadas que o backend nega. Restaurei o estado e mudei o script para exigir
`--screens`, com o motivo registrado na própria mensagem de erro.

## Entrega 2: as três camadas de autorização, mapeadas

Ligar `release_enabled` para `tenants` não foi suficiente: `/admin/tenants`
continuou respondendo `/access-denied`. A investigação em
`rpc_internal_actor_workspace_context` e `app_private.has_internal_capability`
revelou três camadas independentes:

| Camada | Fonte | Estado para `platform_admin` local |
| --- | --- | --- |
| Release | `internal_screen_catalog.release_enabled` | `true` só para `analytics`, `knowledge`, `access`, `settings` |
| Grant de tela | `internal_role_screen_grants` | **concedido** para todas as internas, inclusive `tenants` e `system` |
| Capability | `internal_role_capability_grants`, grant de perfil ou override de usuário; chave `screen.<key>.view` quando não há requisito explícito | ausente para as telas não publicadas |

Ou seja, a hipótese de "falta de grant" estava errada, e a hipótese seguinte, de
que bastaria o flag de release, também. São três controles em série.

## Entrega 3: limite deliberado da ferramenta

O preview cobre apenas a camada 1. Não implementei concessão de capability, e a
razão é explícita: capability é o controle mais sensível do control plane
interno. Abrir isso por script de QA para reduzir avisos de lint é desproporcional
ao ganho e cria um caminho fácil para relaxar autorização.

Consequência assumida: os 37 avisos de `rules-of-hooks` das telas fora do release
permanecem congelados, agora com a causa completa documentada em
`docs/FRONTEND_DATA_LOADING_PATTERNS.md`.

## Validações executadas

| Comando | Resultado |
| --- | --- |
| `supabase:qa:local-release-preview:status` | inicial e final idênticos |
| `supabase:qa:local-release-preview -- --screens=tenants` | liga só `tenants` |
| `supabase:qa:local-release-preview:disable` | restaura o estado original |
| `npm run local:qa:smoke` | 10 personas, 3 rotas internas, cenário do editor, 7 sondadas |
| `npm run lint` | 0 erros, 183 avisos |
| `npm run web:typecheck` | pass |
| `npm run local:qa:secret-scan` | 0 correspondências |

## Limitações

- Nenhuma capability foi concedida, portanto as telas fora do release continuam
  sem QA local possível.
- O banco local terminou o lote no estado original, conferido por `--status`.
- O cenário de escrita em Conhecimento, autorizado pelo usuário, não entrou neste
  lote e continua pendente.
- Nenhuma migration, contrato, view ou RPC foi alterado.
- Nenhum segredo, token, JWT, cookie ou service role key foi lido ou exposto.

## Próximo lote recomendado

1. Cenário de escrita em Conhecimento no harness, já autorizado, para destravar os
   dois avisos restantes de `KnowledgePage.tsx`.
2. `exhaustive-deps` nas telas publicadas: 27 avisos, com risco real de dado velho
   em tela e verificação possível pelo smoke.
3. Se o produto decidir publicar alguma tela interna, aí sim tratar os hooks dela,
   usando o preview local para a camada 1 e um grant de capability decidido de
   forma explícita.
