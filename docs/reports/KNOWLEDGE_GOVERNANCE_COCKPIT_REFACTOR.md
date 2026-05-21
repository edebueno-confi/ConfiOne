# Knowledge Governance Cockpit Refactor

Data: 2026-05-21

## Objetivo

Refatorar `/admin/knowledge` para funcionar como cockpit operacional de governança da base de conhecimento, seguindo o blueprint aprovado de Governança de conhecimento e removendo o padrão anterior de três colunas com pré-visualização lateral comprimida.

## Escopo implementado

- Cabeçalho operacional com título `Governança de conhecimento`, subtítulo curto e ações `Importar legado`, `Novo artigo` e ajuda.
- `Importar legado` permanece desabilitado porque não há fluxo visual contratado; o import segue por script governado.
- Uma única busca principal: `Busca global de conhecimento`.
- Filtros no topo para status de governança, categoria e visibilidade.
- KPIs operacionais com dados reais de artigos/advisories:
  - publicados;
  - precisam atualização;
  - arquivamento sugerido.
- Métrica de visualizações em 30 dias exibida como indisponível porque não existe contrato real de consumo por artigo.
- Tabela central dominante com título, slug/código, categoria, status, visibilidade, última atualização, consumo indisponível e ação `Editar`.
- Paginação local e ordenação por atualização/título sobre o read model administrativo carregado.
- Rail direito com categorias reais, resumo operacional e alertas editoriais.
- Criação e edição continuam em superfície dedicada, não em preview lateral.

## Dados reais usados

- `vw_admin_knowledge_spaces`
- `vw_admin_knowledge_categories_v2`
- `vw_admin_knowledge_articles_list_v2`
- `vw_admin_knowledge_article_detail_v2`
- `vw_admin_knowledge_article_review_advisories`
- `vw_admin_knowledge_article_assets`
- RPCs editoriais administrativas já existentes para criação/edição quando o operador aciona os fluxos.

## Limites mantidos

- Nenhuma publicação foi executada.
- Nenhum import foi executado.
- Nenhum status ou visibility foi alterado em massa.
- Nenhum backend, migration, RPC, view ou RLS foi criado.
- Nenhum mock foi usado para métricas.
- Busca semântica real não foi simulada; a tela usa busca textual sobre os campos disponíveis no contrato de lista administrativa.

## Observações de produto

A busca do cockpit está preparada visualmente como busca global, mas o contrato de listagem administrativa atual não expõe `body_md`; portanto, a busca local cobre título, resumo, categoria, slug, origem e hash. Para busca real por conteúdo, a próxima evolução deve ser um contrato administrativo explícito de busca Knowledge, sem o frontend ler tabelas base.
