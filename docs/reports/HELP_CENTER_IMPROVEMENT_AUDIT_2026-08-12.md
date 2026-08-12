# Relatório de melhorias — Central de Ajuda Genius Returns

> **Status documental:** relatório histórico da primeira varredura. Para o estado atual do banco e a decisão de governança, consulte `docs/reports/PUBLIC_HELP_CENTER_GOVERNANCE_AUDIT_2026-08-12.md`. A auditoria corrente confirmou 69 artigos, 12 categorias, zero ocorrências de mojibake confirmado, 128 referências de asset sem linha correspondente, FAQ sem placeholder e nenhum canal público configurado.

**Data:** 12/08/2026
**Escopo:** auditoria read-only da Central pública em produção, ambiente local e implementação frontend.
**Ambientes verificados:**

- Produção: <https://genius-support-os.vercel.app/help/genius>
- Local: <http://127.0.0.1:4173/help/genius>
- Rotas: home, lista de artigos, filtro por categoria e artigo de integração.

## Resumo executivo

A Central publicada está funcionalmente atualizada: a fonte pública retornou **69 artigos, 13 categorias e 69 artigos públicos**. A navegação por categoria também foi validada: a categoria “Configurações da plataforma” permaneceu na rota com filtro e exibiu os quatro artigos corretos.

O maior risco atual não é mais publicação ou roteamento. É a qualidade da experiência e do corpus publicado:

1. há corrupção de caracteres em conteúdo público visível;
2. artigos importados exibem repetidamente avisos de imagem indisponível;
3. não há canal de contato configurado no rodapé;
4. a lista busca todos os artigos no cliente e só depois pagina;
5. existem lacunas de acessibilidade nos filtros e no menu mobile;
6. o conteúdo de integração ainda contém placeholders editoriais como “inserir link da FAQ”.

O aviso do portal, que anteriormente aparecia atrás do hero, **não reproduziu o problema em produção durante esta auditoria**: o modal foi renderizado via portal no `body`, com overlay fixo, `z-index: 9999`, fechamento por Escape e restauração do foco.

## Achados priorizados

| ID | Prioridade | Área | Evidência | Recomendação |
|---|---|---|---|---|
| HC-01 | P1 | Integridade editorial | Na home e no artigo “Como atualizar os dados de integrações do e-commerce” aparecem textos como `INTEGRA��O` e `integra��o`. | Corrigir a codificação do corpus na origem, validar UTF-8 antes da publicação e criar teste que rejeite caracteres de substituição (`�`) em título, resumo e corpo. |
| HC-02 | P1 | Imagens públicas | O artigo de integração exibiu vários avisos “A imagem não está disponível...”. A auditoria remota anterior confirmou `article_assets = 0`; os marcadores de asset foram removidos na sincronização para evitar links quebrados. | Criar fluxo oficial de migração/publicação dos assets no bucket público, com vínculo por `article_id`, alt text, dimensões e smoke test que abra pelo menos um artigo com imagem. |
| HC-03 | P1 | Qualidade do conteúdo | O artigo de integração contém `Consulte a FAQ (inserir link da FAQ)`, além de campos de integração sem orientação suficiente. | Fazer revisão editorial por lote: substituir placeholders por links reais ou remover a promessa; separar credenciais, permissões, teste e troubleshooting por plataforma. |
| HC-04 | P1 | Performance e escala | `listPublicKnowledgeArticles()` carrega todos os artigos da view pública sem `range`, `limit` ou paginação (`public-api.ts:69-82`). A tela pagina os 69 itens apenas no cliente (`HelpCenterArticlesPage.tsx:66-87`). | Implementar paginação server-side com total, filtros de categoria e busca no contrato público. Manter `page` e filtros na URL, com estado de carregamento e erro por página. |
| HC-05 | P2 | Suporte | Produção mostra “Canais de contato indisponíveis no momento.” no rodapé. O componente só mostra links quando email ou WhatsApp estão presentes (`public-ui.tsx:570-605`). | Configurar ao menos um canal público validado ou trocar o rodapé por uma ação explícita de suporte indisponível. |
| HC-06 | P2 | Filtros acessíveis | Na lista de artigos, o campo de busca depende apenas do placeholder e não tem `aria-label`/`name`; o `select` também não tem label programático (`HelpCenterArticlesPage.tsx:136-169`). | Adicionar label visível ou `sr-only`, `id`, `htmlFor` e `name` para busca e categoria. Anunciar alteração de resultados com `aria-live="polite"`. |
| HC-07 | P2 | Menu mobile | O menu usa `<details><summary>` com apenas um ícone, sem nome acessível explícito nem estado controlado (`public-ui.tsx:473-476`). | Usar botão com nome “Abrir menu da Central de Ajuda”, estado explícito e fechamento previsível por Escape e clique fora. |
| HC-08 | P2 | Modal do portal | O modal atual está visualmente correto em produção e usa `createPortal`, mas não há armadilha de foco para impedir tabulação em elementos atrás do diálogo (`public-ui.tsx:348-383`). | Adicionar focus trap ou usar primitivo de diálogo acessível já existente; manter foco inicial, Escape, backdrop e retorno de foco. |
| HC-09 | P2 | Taxonomia visual | A home resolve ícone e tom por padrões do nome da categoria (`HelpCenterHomePage.tsx:190-240`), enquanto `CategoryCard` recalcula o visual a partir do título (`HelpCenterHomePage.tsx:530-541`). | Preferir metadados de apresentação vindos da taxonomia pública ou um único mapper centralizado. |
| HC-10 | P2 | Conteúdo duplicado | O artigo de integração mostra um preâmbulo bruto em caixa alta antes do conteúdo normalizado, duplicando o assunto. A limpeza de lead existe (`HelpCenterArticlePage.tsx:320-338`), mas não cobre o caso observado. | Ampliar a normalização para comparar resumo, primeiro parágrafo e primeiro heading; remover duplicações antes da renderização e adicionar fixture. |
| HC-11 | P3 | Sugestões da home | As sugestões do hero dependem de três títulos exatos (`HelpCenterHomePage.tsx:38-54`) e deixam de aparecer se os artigos forem renomeados. | Derivar sugestões por dados editoriais publicados, prioridade ou categoria; manter fallback somente quando houver artigo real. |
| HC-12 | P3 | Loading/SEO | O loading usa marca e slug fixos “Genius Returns” e o diretório inicial define meta genérica “ConfiOne | Central de Ajuda B2B” (`HelpCenterPage.tsx:44-56`, `102-106`). | Usar marca neutra no loading e atualizar metadados depois da resolução do espaço, evitando flash de marca e título incorreto em futuras centrais. |

## O que passou na verificação

- Home pública de produção carregou sem overflow horizontal em desktop e mobile.
- Logo atual de produção carregou como `/brand-assets/genius-returns-help.svg`.
- Home listou as 13 categorias com contagens reais.
- Rota `/help/genius/categories` está acessível pelo header.
- Filtro por categoria permaneceu na URL e retornou artigos corretos.
- Lista exibiu 69 artigos, com paginação de 10 por página e 7 páginas.
- Modal “Entrar no portal” ficou acima do conteúdo e acessível por teclado no cenário testado.
- Artigo possui breadcrumb, tempo de leitura, índice lateral condicional, links relacionados e estados de erro/vazio.
- `npm run web:typecheck`: passou.
- `npm run lint --workspace @genius-support-os/web`: passou com 180 warnings preexistentes no workspace e nenhum erro.
- `npm run security:audit:prod`: passou; 0 vulnerabilidades reportadas pelo gate.
- `git diff --check`: passou no estado auditado.

## Testes com ressalva

Os contratos focados de navegação passaram. Dois grupos de testes de contrato não devem ser usados como prova de regressão funcional sem atualização:

- `pilot-03-help-center.test.mjs` falhou porque procura literalmente `Erros e solu` no arquivo da home, embora a categoria seja resolvida pela taxonomia pública em runtime.
- `knowledge-editorial-rules.test.mjs` falhou porque procura os padrões de categoria em `public-ui.tsx`, enquanto a implementação atual os mantém em outro módulo.
- `pilot-06-editorial.test.mjs` contém uma asserção de analytics comercial fora do escopo da Central; o cenário de normalização da Central passou.

Essas falhas indicam drift entre testes de contrato e implementação, e devem ser corrigidas em lote separado, sem usar teste textual como substituto do QA de rota.

## Plano recomendado

### Lote 1 — qualidade publicada

1. Corrigir UTF-8 e bloquear `�` no conteúdo público.
2. Resolver assets públicos ou remover referências visuais de artigos ainda sem imagem.
3. Remover placeholders editoriais e revisar artigos de integração.
4. Configurar canal de suporte público.

### Lote 2 — acessibilidade e conversão

1. Corrigir labels dos filtros e menu mobile.
2. Completar focus trap do modal.
3. Melhorar estados de busca, paginação e anúncio de resultados.
4. Revisar copy do hero e fallback de sugestões.

### Lote 3 — escala e governança

1. Mover paginação e filtros para a fonte pública/backend.
2. Centralizar metadados visuais de categorias.
3. Atualizar testes de contrato para testar comportamento real e não localização textual de implementação.
4. Criar smoke test de produção para home, categorias, filtro, artigo, modal, assets e ausência de caracteres inválidos.

## Critério de aceite sugerido

A próxima versão deve ser considerada pronta quando:

- nenhum título, resumo ou corpo público contiver `�`, placeholder ou link editorial incompleto;
- pelo menos um artigo com imagem renderizar o asset público correto;
- houver canal de suporte público ou mensagem de indisponibilidade com ação clara;
- filtros tiverem labels acessíveis e a lista não carregar o corpus inteiro para cada visita;
- o teste visual em 390 px, 1024 px e 1440 px não apresentar overflow ou conteúdo cortado;
- os testes de contrato da Central estiverem alinhados ao contrato atual;
- produção e local exibirem o mesmo corpus e o mesmo comportamento.

A revisão de acessibilidade foi orientada pelas [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md), especialmente os itens de labels, foco, diálogos, overflow, listas grandes e estados assíncronos.

## Atualização do lote de correção — 12/08/2026

Implementado no frontend e nos contratos locais:

- paginação, busca e filtro de artigos no backend público, com estados de carregamento, erro e vazio;
- rota de categorias preservada sem retorno indevido para a home;
- logo legado do espaço Genius substituído pelo mascote oficial da Central;
- modal do portal com portal de renderização, foco inicial, focus trap, Escape e retorno de foco;
- links de suporte sem elementos interativos aninhados, menu mobile nomeado e filtros com labels acessíveis;
- taxonomia visual e descrições centralizadas, sugestões derivadas de artigos reais e ausência de blocos de imagem quebrados;
- migration local preparada para corrigir o artigo de integração com caracteres de substituição e placeholders editoriais.

Validações do lote: typecheck, build, lint, quality gate, auditoria de dependências, testes focados, QA local das rotas home/artigos/categorias, modal, consulta paginada e viewport de 390 px.

Limitação operacional: a migration de saneamento editorial e qualquer publicação/deploy remoto permanecem pendentes de autorização explícita. O ambiente local está atualizado; a aplicação ainda não prova que a produção recebeu este lote.
