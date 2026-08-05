# Manifesto de release, cenário do editor e token de recarga

Data: 2026-08-05
Checkout canônico: `C:\Projetos\GSO-old`
Branch: `codex/react-router-v8-migration-20260804`

## Resultado

| Indicador | Antes | Depois |
| --- | --- | --- |
| `npm run lint` | 0 erros, 184 avisos | 0 erros, **183** avisos |
| Cenário profundo no smoke | nenhum | **editor de artigo real** |
| Causa do bloqueio de QA interno | suposta como falta de grant | **confirmada como `release_enabled = false`** |

## Lote 1: a causa real do bloqueio de QA nas telas internas

Na recomendação anterior eu sugeri conceder screen keys na fixture local. A
consulta ao banco local desmentiu essa hipótese.

`rpc_internal_actor_workspace_context` só devolve tela com
`release_enabled = true` em `public.internal_screen_catalog`. Estado atual:

| `release_enabled = true` | `release_enabled = false` |
| --- | --- |
| `analytics`, `knowledge`, `access`, `settings` | `admin_overview`, `tenants`, `system`, `internal_areas`, `product_docs`, `customer_portal_admin`, `cs_portfolio`, `customers_b2b`, `home`, `internal_actions`, `product`, `support_inbox`, `support_queue`, `support_tickets` |

Isso casa exatamente com o mapa que o smoke produziu por sondagem: as quatro
publicadas abrem, as demais respondem `/access-denied`.

Consequência para o planejamento: ligar QA local nessas telas não é ajuste de
fixture, é publicar tela no release, o que é decisão de produto. Conceder screen
key por role não muda nada enquanto `release_enabled` for `false`. A recomendação
anterior foi corrigida no handoff, no `docs/FRONTEND_DATA_LOADING_PATTERNS.md` e
nos comentários do próprio harness.

## Lote 2: cenário profundo do editor de Conhecimento

O smoke ganhou `knowledgeEditorScenario`. Para `platform_admin` em desktop, ele
abre `/admin/knowledge`, clica no primeiro `Editar`, confirma que a rota virou
`/admin/knowledge/<id>/edit`, checa overflow horizontal e captura evidência.

Execução real alcançou `/admin/knowledge/c2ade576-a987-4806-b6db-5365241b784d/edit`
sem erro de console, com a captura
`browser-platform_admin-knowledge-editor-desktop.png`.

Valor: `KnowledgeArticleEditorPage.tsx` tem cerca de 5.100 linhas, foi tocado em
dois lotes anteriores de limpeza e até agora só tinha cobertura de typecheck e
build. Agora monta com dado real dentro do smoke.

## Lote 3: token de recarga no bootstrap de Conhecimento

Primeiro uso em produção do Caso 3 do padrão canônico.

- Novo estado `spacesReloadToken` e `requestSpacesReload` estável.
- O Effect de bootstrap passou a observar o token, preservando o guard
  `didBootstrapRef` para não duplicar a carga inicial.
- O botão `Tentar novamente` deixou de chamar o Effect Event e agora só sinaliza
  a intenção de recarregar.

`loadKnowledgeSpaces` segue como `useEffectEvent`, que é o correto: ele lê seleção
e filtros atuais e continua sendo chamado somente de dentro do Effect.

Restam dois avisos no arquivo, em `refreshSelectedSpace` e `refreshArticleDetail`,
chamados por handlers de escrita de artigo, categoria e revisão. Ficam para quando
existir QA de escrita em Conhecimento, porque é justamente o caminho que muda.

## Validações executadas

| Comando | Resultado |
| --- | --- |
| `npm run lint` | 0 erros, 183 avisos |
| `npm run web:typecheck` | pass |
| `npm run web:build` | pass |
| `npm run local:qa:secret-scan` | 1981 arquivos, 0 correspondências |
| `npm run local:qa:smoke` | 10 personas, 3 rotas internas, 1 cenário profundo, 7 sondadas |
| `npm run quality:changed` | aprovado |

## Limitações

- 37 avisos de `rules-of-hooks` seguem congelados por decisão registrada; 35 deles
  em telas com `release_enabled = false`.
- O cenário profundo cobre a montagem do editor, não escrita. Salvar artigo,
  categoria ou revisão continua sem cobertura automatizada.
- A consulta ao catálogo foi somente leitura. Nenhuma linha de
  `internal_screen_catalog`, grant ou membership foi alterada.
- Nenhum backend, contrato, RPC, view ou permissão foi alterado.
- Banco local preservado. Sem push, merge, reset, clean, rebase ou cherry-pick.

## Próximo lote recomendado

1. Decisão de produto: publicar ou não as telas com `release_enabled = false`.
   Enquanto forem `false`, 35 avisos de hooks e a cobertura visual dessas telas
   ficam bloqueados por definição, e não por falta de trabalho técnico.
2. Criar cenário de escrita em Conhecimento no harness, salvando um artigo de QA
   sanitizado, para destravar os dois avisos restantes de `KnowledgePage.tsx`.
3. Seguir com `exhaustive-deps` nas telas publicadas, que hoje somam 27 avisos e
   podem esconder dado velho em tela.
