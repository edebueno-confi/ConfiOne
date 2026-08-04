# Smoke estendido, hooks da Central Pública e Fast Refresh

Data: 2026-08-04
Checkout canônico: `C:\Projetos\GSO-old`
Branch: `codex/react-router-v8-migration-20260804`

## Resultado

| Indicador | Antes | Depois |
| --- | --- | --- |
| `npm run lint` | 0 erros, 196 avisos | 0 erros, **187** avisos |
| `react-hooks/rules-of-hooks` na Central Pública | 5 | **0** |
| `react-refresh/only-export-components` na Central Pública | 4 | **0** |
| Superfícies internas no smoke autenticado | 1 (`/admin/analytics`) | **3** |

Acumulado do dia: 256 avisos para 187, `npm audit --omit=dev` de 2 altas para 0,
higiene da raiz de 1 violação para OK e QA autenticado de indisponível para
harness em uso.

## Lote 1: smoke autenticado com superfícies internas

`scripts/local-qa/browser-smoke.mjs` passou a aceitar `extraRoutes` por persona.
Para `platform_admin`, em desktop, o smoke agora visita `/admin/knowledge` e
`/admin/access` depois do cenário principal, valida que a rota foi alcançada,
que não há overflow horizontal e captura evidência.

Novas capturas em `output/local-qa/`:

- `browser-platform_admin-admin-knowledge-desktop.png`
- `browser-platform_admin-admin-access-desktop.png`

A saída JSON ganhou o bloco `internalRoutes`, que registra rota pedida e rota
alcançada.

### Achado de permissão

`/admin/customer-portal` estava no plano inicial e foi retirado do harness após
falhar com `LOCAL_QA_INTERNAL_ROUTE_UNREACHABLE`. Investigação em
`apps/web/src/features/auth/internal-route-access.ts` mostra que a rota exige a
screen key `customer_portal_admin`:

```text
['/admin/customer-portal', 'customer_portal_admin']
```

A fixture local de QA não concede essa screen ao `platform_admin`, então a
resposta `/access-denied` é contrato funcionando, não defeito. Consequência
prática: essa superfície não é testável hoje sem conceder o grant na fixture.
Registrado como pendência, não corrigido por conta própria.

## Lote 2: `useEffectEvent` fora de Effect na Central Pública

O aviso `rules-of-hooks` aparecia porque carregadores criados com
`useEffectEvent` eram chamados também em `onClick` de botões de nova tentativa,
uso que a regra proíbe.

| Arquivo | Função | Dependências do `useCallback` |
| --- | --- | --- |
| `HelpCenterPage.tsx` | `loadSpaces` | `[]`, não captura valor reativo |
| `HelpCenterPage.tsx` | `loadSpace` | `[]`, usa só parâmetro e setters |
| `HelpCenterArticlePage.tsx` | `loadArticle` | `[]`, usa só parâmetros e setters |
| `HelpCenterHomePage.tsx` | `loadSearch` | `[context.primaryRoute.knowledge_space_slug]` |

Cada Effect que chamava a função passou a listá-la nas dependências. O
comportamento é idêntico: as funções não capturavam estado reativo, exceto
`loadSearch`, cuja única dependência real já constava no Effect anterior.

Este é o primeiro corte real dos 46 avisos de hooks. Os 41 restantes estão em
superfícies internas grandes, `SupportWorkspacePage.tsx` e `TenantsPage.tsx` com
15 cada, e continuam pendentes.

## Lote 3: Fast Refresh na Central Pública

`public-ui.tsx` exportava componentes e também quatro funções puras, o que quebra
o Fast Refresh do módulo inteiro em desenvolvimento. As funções foram movidas sem
alteração de lógica para o novo `public-presentation.ts`:

- `getCategoryVisuals`
- `formatRelativePublicDate`
- `getPublicCategoryLabel`
- `isPublicNavigationCategory`

Consumidores atualizados: `HelpCenterPage.tsx`, `HelpCenterHomePage.tsx`,
`HelpCenterArticlePage.tsx` e `HelpCenterArticlesPage.tsx`. O texto visível ao
usuário foi preservado, incluindo `Categoria pública` e `Trocas e devoluções`.

## Validações executadas

| Comando | Resultado |
| --- | --- |
| `npm run lint` | 0 erros, 187 avisos |
| `npm run web:typecheck` | pass |
| `npm run web:build` | pass |
| `npm run local:qa:secret-scan` | 1977 arquivos, 0 correspondências |
| `npm run quality:changed` | aprovado, 0 findings |
| `npm run local:qa:smoke` | 10 cenários e 2 rotas internas, 0 erro de console |

QA manual na Central Pública, que é a área alterada nos lotes 2 e 3, com console
limpo em todas as telas:

| Cenário | Rota | Resultado |
| --- | --- | --- |
| Busca por query da URL | `/help/genius?q=estorno` | 5 resultados, mascote em estado de sucesso |
| Artigo público | `/help/genius/articles/como-configurar-o-calculo-do-estorno` | conteúdo, breadcrumb, categoria e data relativa corretos |
| Diretório de centrais | `/help` | lista pública renderizada |

As três telas exercitam exatamente os quatro carregadores migrados e os quatro
helpers movidos.

## Limitações

- Os 41 avisos restantes de `rules-of-hooks` estão em Suporte, Tenants, Access,
  Conhecimento, System e Portal Admin. Suporte e Tenants concentram 30 deles e
  exigem lote próprio, com leitura de fluxo caso a caso.
- `/admin/customer-portal` continua fora do smoke por falta de grant na fixture.
- Nenhum backend, banco, contrato, RPC, view, permissão ou dado foi alterado.
- Nenhum segredo, token, JWT, cookie ou service role key foi lido ou exposto.
- Banco local preservado. Sem push, merge, reset, clean, rebase ou cherry-pick.

## Próximo lote recomendado

1. Conceder `customer_portal_admin` na fixture local de QA, ou registrar
   explicitamente que a superfície fica fora do QA local, e então incluir a rota
   no smoke.
2. Atacar `rules-of-hooks` em `TenantsPage.tsx`, que tem 15 avisos e agora conta
   com evidência autenticada possível via smoke estendido.
3. Só depois `SupportWorkspacePage.tsx`, que é o arquivo mais pesado do projeto e
   pede leitura de fluxo mais longa.
