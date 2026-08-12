# Relatório de execução META — Help Center Genius Support OS

Data: 11/08/2026
Branch: `codex/help-center-reorganization`
Worktree: `C:\Projetos\GSO-old-help-center`

## Resultado executivo

O corpus anexado foi lido integralmente e tratado como especificação operacional. A carga, curadoria e publicação foram executadas somente no Supabase local, sem deploy, push, merge ou alteração remota.

O processo agora diferencia conteúdo por evidência: artigo público é o que ensina a usar, configurar, integrar ou solucionar a plataforma; artigo interno fica reservado a instruções explicitamente internas, segredos, endpoint privado ou conteúdo que não deve ser compartilhado. Termos como “integração”, “token” ou “permissão” não bloqueiam um tutorial público por si só.

## Corpus e publicação local

- 70 artigos na central local.
- 57 artigos distintos do corpus Octadesk avaliados pelo publicador oficial.
- 57 artigos publicados no fluxo local: 1 sem limpeza e 56 com normalização pública mínima.
- 0 bloqueios críticos e 0 duplicidades publicadas automaticamente.
- 69 artigos visíveis na Central pública local após a publicação; o único artigo interno restante é `Space Aware CI Fixture`, um fixture de validação da CI.
- 128 relações de assets reprocessadas; os assets dos artigos publicados foram promovidos para consumo público.
- 0 marcadores de asset não resolvidos.

Comandos executados:

```text
node scripts/knowledge/publish-octadesk-public-help.mjs --local --space-slug genius --apply --actor-user-id f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0
node scripts/knowledge/reprocess-octadesk-article-assets.mjs --local --space-slug genius --all --apply --email <credencial local de QA> --password <credencial local de QA>
```

Relatório detalhado do publicador: [OCTADESK_PUBLICATION_EXECUTION_REPORT_2026-08-11.md](OCTADESK_PUBLICATION_EXECUTION_REPORT_2026-08-11.md).

## Fluxo de publicação manual

O fluxo foi validado no artigo real “Erros na integração do contrato do Correios” e, com o caminho de confirmação completo, em “API Docs, Swagger e referência técnica”. A publicação manual agora:

1. salva a alteração antes de avançar;
2. mantém o gate editorial de revisão e as oito confirmações humanas;
3. prepara a evidência pública antes do RPC de publicação;
4. publica pelo RPC existente;
5. mostra “Artigo publicado” e o link “Ver na Central de Ajuda”.

O problema visual que fazia a confirmação parecer inacessível era o overflow do editor e do painel lateral. A confirmação pública passou a participar do fluxo vertical da página, sem contêiner interno cortando o botão.

## Tela de conhecimento

Em `apps/web/src/features/knowledge/KnowledgePage.tsx`:

- a página administrativa passou a ser o contêiner vertical de rolagem;
- a tabela deixou de possuir uma altura interna que escondia paginação e artigos abaixo;
- a margem superior do card foi normalizada para separar o cabeçalho do painel;
- filtros de origem, classificação editorial e duplicidade foram preservados;
- nenhum mock, endpoint, RPC, tabela ou regra de negócio nova foi criado.

QA no viewport 1280x720:

- `.gso-knowledge-cockpit`: `clientHeight=668`, `scrollHeight=1433`, `overflow-y=auto`;
- rolagem física alcançou `scrollTop=765`;
- a tela exibiu `Artigos (70)`, paginação `1 de 7` e o botão para avançar aos artigos seguintes.

## Central pública local

Validação em [http://127.0.0.1:5183/help/genius](http://127.0.0.1:5183/help/genius):

- a home exibiu títulos reais do corpus, como “Como configurar o cálculo do estorno”;
- a lista exibiu `Página 1 de 7 · 69 artigos`;
- o artigo de Correios carregou corpo, imagens e artigos relacionados;
- as imagens renderizaram sem marcadores de asset pendentes.
- um artigo sem advisory abriu o checklist de oito confirmações, permitiu rolar até o botão e publicou após “Confirmar e publicar”.

## Validação técnica

- `git diff --check`: passou.
- `npm run lint`: passou.
- `npm run contracts:typecheck`: passou.
- `npm run quality:changed`: 0 blockers e 0 findings; veredito não conclusivo por falha de typecheck global.
- `npm run web:typecheck`: falha em dois erros preexistentes de `isActive` implícito em `apps/web/src/features/customer-portal/CustomerPortalPage.tsx`, linhas 300 e 501.
- Build web: não considerado verde enquanto o typecheck global permanecer bloqueado.

## Segurança e limite de escopo

- Supabase remoto não foi consultado nem alterado.
- Não houve deploy, push, merge, migration remota, alteração de secrets ou exclusão permanente.
- O publicador bloqueia valores de segredo, bearer/JWT, service role, endpoint privado e instrução explicitamente interna.
- A publicação local é reversível pelo fluxo editorial/admin; nenhuma exclusão de corpus foi feita.

## Taxonomia semântica e ordenação

A leitura dos títulos, resumos e corpos foi concluída. A matriz completa está em [KNOWLEDGE_SEMANTIC_TAXONOMY_MATRIX_2026-08-11.md](KNOWLEDGE_SEMANTIC_TAXONOMY_MATRIX_2026-08-11.md).

- 69 artigos públicos distribuídos e nenhum artigo sem categoria.
- Integrações de plataformas concentra Shopify, VTEX, TrayCorp/TrayCommerce, Nuvemshop e Correios.
- Integrações e API ficou reservada à documentação técnica para integrar sistemas ao Genius Returns.
- Pendência de Logística Reversa foi classificada como status operacional, não como erro.
- 12 categorias públicas retornam na ordem persistida por `knowledge_categories.sort_order`.
- Categorias legadas vazias foram mantidas como internas para preservar histórico.
- A reordenação futura está disponível pelo contrato `rpc_admin_reorder_knowledge_categories_v1`.

Migração local aplicada: `supabase/migrations/20260811090000_knowledge_semantic_taxonomy_v2.sql`.

QA comportamental no browser local confirmou a ordem visível das 12 áreas e, na lista filtrada, `Integrações e API` mostrou 12 artigos técnicos (Swagger, autenticação, processos, credenciais e recursos), sem misturar os tutoriais de plataformas externas.

## Estado Git

- Branch: `codex/help-center-reorganization`.
- Commit: não criado.
- Push/deploy: não realizados.
- Alterações permanecem no worktree para revisão.
