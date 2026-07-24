# TAXONOMY-01 — Reorganização da Central

## Diagnóstico anterior

A categoria `Configuração de ambiente` concentrava 38 artigos públicos de intenções diferentes. Havia também categorias antigas vazias e a categoria `Integração e atualização` mantinha oito artigos restritos sem uma classificação pública clara.

## Taxonomia final

| Categoria principal | Subcategorias públicas | Artigos públicos |
|---|---|---:|
| Configuração da operação | Configurações gerais; Solicitações e regras de devolução; Estornos e vale-compras; Cadastros, produtos e catálogo; Portal e notificações; Acessos e segurança | 32 |
| Operação de trocas e devoluções | Gestão de solicitações; Logística reversa | 7 |
| Sellers e lojas | — | 4 |
| Integrações e API | — | 13 |
| Solução de problemas | — | 3 |
| Primeiros passos | — | 1 |
| Suporte técnico | — | 2 |

A profundidade máxima é de dois níveis. A home mantém cinco cards principais para não poluir a composição; `Primeiros passos` preserva seu artigo público, mas foi removida da taxonomia principal, filtros e sidebar públicos.

## Matriz artigo por artigo

A matriz completa, com ID, título, status, visibilidade, categoria, subcategoria, intenção e confiança, está em [TAXONOMY_01_ARTICLE_MATRIX_2026-07-24.md](TAXONOMY_01_ARTICLE_MATRIX_2026-07-24.md). Contém os 75 artigos do espaço `genius`: 62 públicos e 13 restritos/internos após a reconciliação de visibilidade do artigo legado de integração.

## Categorias criadas

- Configurações gerais
- Solicitações e regras de devolução
- Estornos e vale-compras
- Cadastros, produtos e catálogo
- Portal e notificações
- Acessos e segurança
- Gestão de solicitações
- Logística reversa
- E-commerce e permissões, restrita

## Categorias renomeadas

- `Configuração de ambiente` → `Configuração da operação`
- `Operação de reversa` → `Operação de trocas e devoluções`
- `Sellers e Loja Fisica` → `Sellers e lojas`
- `Erros e pendências` → `Solução de problemas`
- `Integração e atualização` → `Integrações de plataformas`, interna

IDs e slugs dos artigos foram preservados. Apenas nomes e slugs de categorias foram normalizados.

## Categorias removidas da navegação pública

`Cadastros`, `Configurações` e `Erros comuns e soluções` foram mantidas como categorias internas vazias para preservar histórico, mas não aparecem na navegação pública.

## Artigos movidos

Todos os 75 artigos foram avaliados e reclassificados quando necessário. Os 38 artigos anteriormente ligados a `Configuração de ambiente` foram distribuídos entre seis subcategorias e, nos casos de operação diária, para `Gestão de solicitações` ou `Logística reversa`.

## Artigos mantidos

Os 13 artigos restritos/internos permanecem preservados no banco, fora da home, filtros, contagens e busca pública. O conteúdo técnico e os assets não foram alterados neste lote.

## Artigos com classificação incerta

Três artigos foram marcados com confiança média na matriz por cruzarem configuração e operação: alteração de vale-compra pendente, filtros de solicitações e notificação de análise. A referência anterior a um quarto artigo de regras visuais de estágio não corresponde a nenhum artigo distinto da base e não foi inventada.

## Contagens antes e depois

| Métrica | Antes | Depois |
|---|---:|---:|
| Artigos no espaço | 75 | 75 |
| Artigos públicos | 62 | 63 |
| Artigos restritos/internos | 13 | 12 |
| Artigos públicos sem categoria | 0 | 0 |
| Profundidade máxima | existente/inconsistente | 2 níveis |
| Categoria pública dominante | Configuração de ambiente: 38 | Configuração da operação: 32 no subtree |
| Categorias públicas vazias na navegação | legadas | 0 |

## Busca e navegação

Foram validados filtros por subcategoria, breadcrumbs, URL direta de artigo, busca por `estorno`, `logística`, `sellers` e `API`, estado sem resultado e navegação mobile. Os slugs dos artigos não foram alterados.

## Segurança e permissões

O lote não alterou RLS, autorização ou contratos de acesso. Artigos restritos não aparecem na view pública, na busca pública ou na navegação pública. A contagem pública considera somente `published/public`.

## Validações

- `supabase/tests/077_knowledge_taxonomy.sql`: 9/9 PASS.
- Testes de navegação existentes: PASS.
- `npm run web:typecheck`: PASS.
- `npm run web:build`: PASS.
- Smoke público em 1440px e 390px: PASS.
- Filtros, breadcrumbs e busca: PASS.
- Console sem erros, rede sem falhas e overflow horizontal não detectado.

## Evidências

As evidências atualizadas estão em `output/playwright/taxonomy-01-*.png`, incluindo home desktop/mobile, categorias desktop/mobile, subcategoria de estornos, breadcrumb, buscas por estorno/seller/API, busca sem resultado e tentativa de artigo restrito. A matriz completa e este relatório documentam a classificação aplicada.

## Bloqueios

Nenhum bloqueio estrutural foi encontrado. Não houve migration remota, alteração de RLS, PR, merge ou deploy.

## Recomendação para RELEASE-01

Prosseguir para validação visual do RELEASE-01 após revisão humana das três classificações de confiança média e aprovação da nomenclatura pública.
