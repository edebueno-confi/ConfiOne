# Mapa de superfícies no smoke, hooks do Access e padrão de carregamento

Data: 2026-08-05
Checkout canônico: `C:\Projetos\GSO-old`
Branch: `codex/react-router-v8-migration-20260804`

## Resultado

| Indicador | Antes | Depois |
| --- | --- | --- |
| `npm run lint` | 0 erros, 187 avisos | 0 erros, **184** avisos |
| Superfícies internas cobertas com asserção | 2 | **3** |
| Superfícies internas inventariadas | 0 | **7** sondadas |
| Padrão de carregamento documentado | não existia | `docs/FRONTEND_DATA_LOADING_PATTERNS.md` |

## Lote 1: inventário de superfícies internas no harness

O harness ganhou `probeRoutes`, sondagem sem asserção que registra qual rota
interna a fixture local realmente alcança. O resultado explica por que a dívida de
hooks não podia ser atacada às cegas:

| Rota | Resultado com `platform_admin` da fixture |
| --- | --- |
| `/admin/analytics` | alcançada |
| `/admin/knowledge` | alcançada |
| `/admin/access` | alcançada |
| `/admin/settings` | alcançada, redireciona para `/admin/settings/integrations` |
| `/admin/visao-geral` | `/access-denied` |
| `/admin/tenants` | `/access-denied` |
| `/admin/system` | `/access-denied` |
| `/admin/internal-areas` | `/access-denied` |
| `/admin/product-docs` | `/access-denied` |
| `/admin/build-journal` | `/access-denied` |
| `/admin/customer-portal` | `/access-denied` |

`/admin/settings` foi promovida de sondagem para cobertura com asserção, então o
smoke agora exige `/admin/knowledge`, `/admin/access` e `/admin/settings`.

### Efeito colateral encontrado e tratado

Na primeira execução com sondagem, o cenário `platform_admin` desktop passou a
falhar com `401` em `vw_admin_auth_context`. Causa: navegar para rota sem screen
key faz o app tentar ler o read model de contexto administrativo e receber 401,
comportamento esperado para usuário sem grant. Como a sondagem visita sete rotas
negadas de propósito, ela contaminava a asserção do cenário coberto.

Correção no harness: a sondagem passou a rodar por último, depois do veredito do
persona, com comentário explicando o motivo. O 401 continua sendo produzido pelo
caminho negado, o que fica registrado aqui em vez de escondido.

## Lote 2: `rules-of-hooks` em `features/access/AccessPage.tsx`

`loadSurface` era Effect Event chamado no bootstrap, em dois handlers de escrita e
no botão de nova tentativa. O corpo só lê `markSessionExpired`, que é
`useCallback(..., [])` no provider de auth, portanto estável.

Conversão aplicada: `useCallback(async () => { ... }, [markSessionExpired])`, com
`loadSurface` entrando nas dependências do Effect de bootstrap. Referência
estável, nenhum refetch novo, nenhum loop. Três avisos eliminados.

A tela é `/admin/access`, que o smoke cobre com asserção, então a mudança foi
verificada em execução autenticada real.

## Lote 3: padrão canônico de carregamento documentado

Novo `docs/FRONTEND_DATA_LOADING_PATTERNS.md` classifica o carregador em três
casos e prescreve o tratamento de cada um:

1. não lê valor reativo, converte para `useCallback`;
2. lê valor reativo e só é chamado de Effect, mantém `useEffectEvent`;
3. lê valor reativo e também precisa ser chamado de handler, usa token de
   recarga, com o handler apenas sinalizando e o Effect seguindo como único
   chamador.

O documento também registra a decisão explícita de congelar os 38 avisos
restantes, todos do Caso 3, com a razão: 35 deles estão em telas que hoje
respondem `/access-denied` para as personas da fixture, ou seja, sem caminho de
verificação. Converter esses casos para `useCallback` sem QA trocaria dívida de
lint por risco de comportamento.

## Validações executadas

| Comando | Resultado |
| --- | --- |
| `npm run lint` | 0 erros, 184 avisos |
| `npm run web:typecheck` | pass |
| `npm run web:build` | pass |
| `npm run local:qa:secret-scan` | 1979 arquivos, 0 correspondências |
| `npm run local:qa:smoke` | 10 personas limpas, 3 rotas internas com asserção, 7 sondadas |
| `npm run quality:changed` | aprovado |

Capturas novas em `output/local-qa/`, incluindo
`browser-platform_admin-admin-settings-desktop.png`.

## Limitações

- 38 avisos de `rules-of-hooks` seguem abertos por decisão registrada, não por
  esquecimento.
- A sondagem cobre apenas a persona `platform_admin`; outras personas seguem com
  os cenários fixos anteriores.
- Nenhum backend, banco, contrato, RPC, view, permissão ou dado foi alterado.
- Nenhum segredo, token, JWT, cookie ou service role key foi lido ou exposto.
- Banco local preservado. Sem push, merge, reset, clean, rebase ou cherry-pick.

## Próximo lote recomendado

1. Decidir se a fixture local passa a conceder as screen keys que faltam. Sem
   isso, sete superfícies internas continuam sem QA local possível, e a dívida de
   hooks nelas fica bloqueada por definição.
2. Com `KnowledgePage.tsx` já coberta pelo smoke, aplicar nela o token de recarga
   do Caso 3 e validar antes e depois. É o único caso publicado da lista.
3. Seguir a triagem de código morto pendente de decisão de produto.
