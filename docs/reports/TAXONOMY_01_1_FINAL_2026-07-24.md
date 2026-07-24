# TAXONOMY-01.1 — Correções finais

## Divergência de visibilidade

A divergência foi localizada no artigo `Como atualizar os dados de integrações do e-commerce` (`964e5bf7-7de7-4bf4-828e-f199ea40e45a`). A matriz TAXONOMY-01 e a curadoria legada registravam `draft/restricted`, enquanto o banco local estava em `published/public`, com publicação em 24/07/2026. O conteúdo contém referências antigas a AppKey, AppToken, API Token e permissões; portanto, a publicação não estava autorizada pelo corpus canônico. A causa foi uma promoção local de publicação fora da classificação aprovada, não uma mudança necessária de taxonomia. O estado foi restaurado para `draft/restricted`, sem apagar conteúdo, revisão ou assets, na migration `20260724193000_knowledge_taxonomy_visibility_reconciliation.sql`.

## Taxonomia definitiva

Mantidos os agrupamentos aprovados: `Trocas e devoluções > Logística reversa` para prazo logístico; `Configuração da operação > Estornos e vale-compras` para alterações de vale-compra; e `Suporte técnico` como categoria independente para contato, evidências, contexto e acompanhamento. Não houve criação de subcategoria adicional nem alteração de IDs ou slugs de artigos.

## Artigos de confiança média

A matriz contém exatamente três artigos de confiança média: filtros básicos das solicitações, alterações em vale-compra pendente e notificação de análise ao cliente. A referência anterior a um quarto artigo de regras visuais de estágio não corresponde a um registro distinto; não foi inventado nem classificado.

## Primeiros passos

O artigo público `Visão geral da Central Genius` foi preservado. A categoria `Primeiros passos` foi removida da navegação, home, filtros e sidebar públicos; o artigo continua acessível pela sua URL. Nenhuma nova estrutura de banco foi criada.

## Suporte técnico

Permanece independente e não foi absorvido por `Solução de problemas`. Diagnóstico técnico continua nessa última categoria; suporte técnico permanece restrito a orientação de contato, evidências, contexto e acompanhamento.

## Nome público padronizado

O rótulo público `Operação de trocas e devoluções` é apresentado como `Trocas e devoluções`. O nome estrutural interno e os slugs permanecem preservados.

## Assets vazios

O artigo `Configurando parametrização geral` possui nove referências comprovadas na origem e nove registros públicos aprovados no bucket `knowledge-public-assets`. Todos os objetos existem no storage local, são PNG e correspondem aos metadados registrados: dimensões entre 741×275 e 1452×527, 11.329–126.720 bytes, sem bloqueio. As referências foram recolocadas nas seções `Funcionalidades principais`, `Operações permitidas`, `Fique com o item`, `Sellers permitidos`, `Produtos em exceção`, `Segunda solicitação`, `Segurança`, `Informar o SKU da troca por texto` e `Variação do produto`. Não foram associados assets por inferência.

## Timestamps editoriais

As superfícies públicas de home e artigo passaram a exibir `published_at`, não `updated_at`. Isso impede que uma alteração de taxonomia ou reprocessamento técnico anuncie falsamente “Atualizado hoje”. A base ainda possui `updated_at` homogêneo em consequência da reescrita editorial anterior; não foi feita migração ampla de datas. Quando a data editorial pública não existe, a interface mantém o fallback neutro.

## Distribuição final

| Estado | Quantidade |
|---|---:|
| Artigos no espaço `genius` | 75 |
| `published/public` | 62 |
| `draft/restricted` | 11 |
| `draft/internal` | 1 |
| `published/restricted` | 1 |
| `published/internal` | 0 |
| Artigos públicos sem categoria | 0 |
| Categorias públicas vazias na navegação | 0 |
| Profundidade máxima | 2 níveis |

Distribuição pública por raiz: Configuração da operação 32; Integrações e API 13; Trocas e devoluções 7; Sellers e lojas 4; Solução de problemas 3; Suporte técnico 2; Primeiros passos preservado fora da navegação principal 1.

## Validações

Validados localmente: `npm run contracts:typecheck`; `npm run web:typecheck`; `npm run web:build`; `npm run repository:check-root`; `npx supabase test db --local supabase/tests/077_knowledge_taxonomy.sql` (9/9); testes editoriais (8/8); existência e metadados dos nove objetos de asset; referências do artigo; contagens de visibilidade; matriz de confiança; regra de navegação de `Primeiros passos`; uso de `published_at`; smoke focado de sete rotas; smoke de todos os 62 artigos públicos; console sem erros; rede sem falhas; overflow zero; e `git diff --check`.

## Evidências

As evidências finais estão em `output/playwright/taxonomy-011-home-desktop.png`, `taxonomy-011-home-mobile.png`, `taxonomy-011-articles-desktop.png`, `taxonomy-011-articles-mobile.png`, `taxonomy-011-subcategory-logistics.png`, `taxonomy-011-parametrizacao.png`, `taxonomy-011-vale-compra.png`, `taxonomy-011-prazo-logistico.png`, `taxonomy-011-search-estorno.png`, `taxonomy-011-search-logistica.png` e `taxonomy-011-restricted.png`. A captura de parametrização mostra as nove imagens, incluindo Segurança, SKU e Variação.

## Commits

- `dde7333` — `fix(knowledge): normalizar conteúdo e assets públicos` — regras editoriais, reescrita auditável e nove referências de assets comprovadas.
- `a8620d7` — `fix(help-center): reconciliar navegação e datas editoriais` — filtro público de `Primeiros passos`, nome canônico, datas por `published_at` e restauração de visibilidade.
- `6e35f7b` — `test(knowledge): validar taxonomia assets e timestamps` — testes focados, smoke scripts e este relatório.

## Estado do Git

Branch `codex/release-pilot-dashboard-help-center-v1`, base remota `215c700`, três commits locais à frente antes do push. O working tree está limpo; nenhuma alteração foi descartada ou enviada remotamente.

## Bloqueios

Nenhum bloqueio estrutural. PR, merge, deploy, migration remota e uso de secrets permanecem fora desta execução. O push da branch é o único gate remoto autorizado pelo lote.

## Recomendação para RELEASE-01

Prosseguir para RELEASE-01 mantendo o artigo de integração restaurado fora do escopo público até revisão editorial autorizada. O push pode ser executado após confirmação do gate remoto.
