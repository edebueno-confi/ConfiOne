# Auditoria de governança da Central de Ajuda pública — 2026-08-12

## Veredito

`inconsistente com ressalvas críticas`: a Central pública está acessível e o corpus atual está publicado, mas a baseline ainda contém referências de imagens sem assets correspondentes, 10 artigos com marcadores de mojibake no corpo, não possui canal de suporte configurado e mantém artigos legados sensíveis publicados sem uma decisão individual registrada para o estado atual.

Esta auditoria foi executada contra o banco Supabase vinculado ao checkout, usando as views/tabelas públicas da Knowledge Base. Não houve escrita remota durante esta auditoria.

## Estado observado

| Indicador | Resultado | Evidência |
| --- | ---: | --- |
| Artigos `published/public` no espaço `genius` | 69 | `knowledge_articles` |
| Categorias `public` no espaço `genius` | 12 | `knowledge_categories` |
| Linhas em `knowledge_article_assets` para artigos públicos | 0 | `knowledge_article_assets` |
| Referências `knowledge-asset:<id>` em artigos públicos | 128 | `body_md` |
| Referências de asset sem linha correspondente | 128 | `LEFT JOIN` por UUID |
| Artigos com caractere de substituição UTF-8 | 0 | `chr(65533)` em título, resumo e corpo |
| Artigos com marcadores de mojibake | 10 | `Ã`, `Â`, `â` ou `ð` em título, resumo ou corpo |
| Artigos com placeholder de FAQ | 0 | busca por `link da FAQ` |
| Contatos públicos configurados | nenhum | `vw_public_knowledge_space_resolver.support_contacts = {}` |

O frontend esconder a imagem ausente evita um placeholder quebrado na tela, mas não corrige a fonte de dados: o artigo continua contendo a referência e o asset não existe no read model público. A checagem anterior por `chr(65533)` também era insuficiente: o estado atual ainda contém 10 corpos com mojibake, que precisam de normalização editorial antes de declarar a qualidade resolvida.

## Os sete tópicos da migração Genius > Aftersale V2

Todos os tópicos abaixo têm pelo menos um artigo `published/public`. Nenhum foi tratado como aprovado para novo publish; a decisão entre manter o legado corrigido ou substituir pelo canônico continua pendente de Produto/CS.

| Tópico | Artigo(s) publicado(s) confirmado(s) |
| --- | --- |
| BlockList | `22895093-a670-4836-8e18-ec9c21761e3b` — `como-configurar-o-blocklist` |
| Estorno automático PIX | `15d7c880-4c8d-4833-902d-92c8e8c3abd7` — `como-configurar-o-estorno-automatico-via-pix` |
| Regra/cálculo de estorno | `d72dd20e-9044-45ab-a339-15fb3f561668` — `como-configurar-o-calculo-do-estorno`; `f2f5fba0-94ee-4159-b63b-0636edb6085c` — `limitando-o-valor-maximo-de-um-estorno`; `b5b2972c-c45c-4d58-af90-bed28909c89d` — `politica-para-estorno-do-frete` |
| Vale-compra | `95654f3b-ac06-4b24-9947-39b436bef979` — `como-automatizar-o-pagamento-de-estorno-e-vale-compra`; `096d01bd-8b3c-4eb4-8392-8a381bf5e39b` — `como-configurar-o-vale-compras-retencao`; `40e23d70-cf7f-4442-a698-2c312574f739` — `como-realizar-alteracoes-em-um-vale-compra-pendente`; `cf5febab-ba03-4c95-bcd2-f0c01216a2ec` — `pedidos-pagos-com-vale-compras`; `7a148387-a690-4662-9492-7ef9958ed331` — `sellers-permitidos-para-criar-vale-compras` |
| Motivos de troca/devolução | `3d3b6d48-7b06-435b-aeaf-018d3670fcef` — `como-cadastrar-motivos-para-troca-ou-devolucao`; `96c630b8-7912-45c0-a456-aa4b89789dad` — `como-iniciar-uma-troca-ou-devolucao-pelo-e-commerce` |
| Logística reversa | `f6e84831-4299-4df1-a69b-3042164a1041` — `como-o-consumidor-solicita-uma-reversa`; `7224ca4a-286b-4b58-9fab-5c57d6e1ba0c` — `habilitar-a-api-de-logistica-reversa-do-correios`; `672b1a48-a89a-494b-8f86-22c29c44e35c` — `pendencia-de-logistica-reversa`; `e361c695-8391-4736-aab0-9879a9df03bd` — `posso-filtrar-as-solicitacoes-de-reversas`; `10fe946f-7407-43ce-85b9-68b6ef14ab70` — `regra-de-excecao-para-motivos-nao-gerar-logistica-reversa` |
| Prazo de postagem | `beea958a-1e18-465a-b919-5defcb199135` — `como-configurar-o-prazo-logistico-por-estado` |

Não foi encontrado artigo público com `antifraude` no título, resumo ou corpo na consulta atual.

## Causa raiz dos problemas de qualidade

- **Mojibake:** a origem `raw_knowledge/octadesk_export/latest` ainda contém textos como `Ã¡` e `Ã§Ã£` em `article.json`/`content.*`. A migration `20260812150000_help_center_public_corpus_quality_v2.sql` fez forward-fix direcionado para um único artigo (`como-atualizar-os-dados-de-integracao-do-e-commerce`); os 10 artigos listados na consulta atual não passaram por essa normalização.
- **Imagens:** o índice local registra 129 assets em 53 artigos, e os arquivos dos sete tópicos auditados existem no export local. O runtime público, porém, tem zero linhas em `knowledge_article_assets`, enquanto os corpos publicados já carregam 128 markers `knowledge-asset:<id>`. A causa é a separação entre a migration editorial que gravou os markers e o reprocessador de assets `scripts/knowledge/reprocess-octadesk-article-assets.mjs`, que ainda não foi aplicado ao ambiente público.
- **FAQ:** o placeholder foi removido no forward-fix de qualidade e a consulta atual não encontrou ocorrência publicada.
- **Suporte:** o resolver público lê `brand_settings.support_contacts`; o valor atual é `{}`, portanto não existe canal real para o frontend exibir.

Artigos públicos com marcador de mojibake confirmado: `api-docs-swagger-e-referencia-tecnica`, `como-atualizar-os-dados-de-integracao-do-e-commerce`, `como-automatizar-o-pagamento-de-estorno-e-vale-compra`, `como-configurar-o-blocklist`, `como-consultar-processos-e-acompanhar-status`, `como-iniciar-uma-troca-ou-devolucao-pelo-e-commerce`, `permissoes-tray`, `permissoes-vtex`, `posso-filtrar-as-solicitacoes-de-reversas` e `variacao-do-produto`.

## Artigos publicados com tema sensível explícito

O conjunto abaixo foi detectado por termo no título ou resumo, portanto é a lista de alta confiança para decisão editorial. Todos estão atualmente `published/public`.

| Tema | ID | Slug | Encaminhamento canônico/documental | Decisão atual |
| --- | --- | --- | --- | --- |
| Correios | `c81f6e3c-4fc6-4515-b8a8-353c794c9141` | `erros-na-integracao-do-contrato-do-correios` | `KNOWLEDGE_LOGISTICA_POSTAGEM_CLUSTER_CLOSURE.md` — integração bloqueada por risco | Pendente Produto + Engenharia + Suporte/CS |
| Correios | `7224ca4a-286b-4b58-9fab-5c57d6e1ba0c` | `habilitar-a-api-de-logistica-reversa-do-correios` | Mesmo fechamento — API/autorização fora da trilha pública atual | Pendente Produto + Engenharia + Suporte/CS |
| Correios | `135e946f-0892-465c-8fe3-701527e8666c` | `integracao-e-configuracao-com-os-correios` | Mesmo fechamento — integração técnica sensível | Pendente Produto + Engenharia + Suporte/CS |
| Estorno | `95654f3b-ac06-4b24-9947-39b436bef979` | `como-automatizar-o-pagamento-de-estorno-e-vale-compra` | `KNOWLEDGE_VALE_COMPRA_SUBCLUSTER_PREP.md` — automação financeira, sem candidato público aprovado | Pendente Produto + Engenharia + Suporte/CS |
| Estorno | `d72dd20e-9044-45ab-a339-15fb3f561668` | `como-configurar-o-calculo-do-estorno` | `KNOWLEDGE_ESTORNO_CALCULO_LIMITES_SUBCLUSTER_PREP.md` — risco financeiro alto | Pendente Produto + Suporte/CS |
| Estorno | `77ec5001-4d8e-4845-b1b7-a362959f4ffb` | `configurando-as-formas-de-estorno` | `KNOWLEDGE_ESTORNO_CANONICAL_REWRITE.md` — canônico candidato ainda pendente | Pendente Produto + Suporte/CS |
| Estorno | `14f93f8e-dbb3-4b6f-b795-0c4b0f863abe` | `erro-ao-tentar-realizar-o-estorno` | `KNOWLEDGE_ESTORNO_TROUBLESHOOTING_SUBCLUSTER_PREP.md` — revisar recorte técnico | Pendente Produto + Engenharia + Suporte/CS |
| Estorno | `a5afc13f-c192-439c-b399-7536738acb63` | `formas-de-estorno-por-motivo` | `KNOWLEDGE_ESTORNO_CALCULO_LIMITES_SUBCLUSTER_PREP.md` — política por motivo | Pendente Produto + Suporte/CS |
| Estorno | `f2f5fba0-94ee-4159-b63b-0636edb6085c` | `limitando-o-valor-maximo-de-um-estorno` | `KNOWLEDGE_ESTORNO_CALCULO_LIMITES_SUBCLUSTER_PREP.md` — teto financeiro | Pendente Produto + governança financeira/operacional |
| Estorno | `b5b2972c-c45c-4d58-af90-bed28909c89d` | `politica-para-estorno-do-frete` | `KNOWLEDGE_ESTORNO_CALCULO_LIMITES_SUBCLUSTER_PREP.md` — política comercial/financeira | Pendente Produto + Suporte/CS |
| Estorno/Sellers | `c8aa09a0-c79a-46f6-8a7c-bfd7a0eae5cd` | `regras-de-cadastro-e-configuracoes-de-sellers-estorno-e-logistica` | `KNOWLEDGE_INTEGRACOES_GATEWAY_SUBCLUSTER_PREP.md` e `KNOWLEDGE_VALE_COMPRA_SUBCLUSTER_PREP.md` | Pendente Produto + Engenharia + Suporte/CS |
| Estorno | `15f439cb-baaf-43c7-ad65-f561ecc020cb` | `valor-manual-para-estorno-automatico` | `KNOWLEDGE_ESTORNO_CALCULO_LIMITES_SUBCLUSTER_PREP.md` — valor manual em automação | Pendente Produto + Engenharia |
| PIX | `15d7c880-4c8d-4833-902d-92c8e8c3abd7` | `como-configurar-o-estorno-automatico-via-pix` | `KNOWLEDGE_PIX_ESTORNO_SUBCLUSTER_PREP.md` — bloquear por risco | Pendente Produto + Engenharia + Suporte/CS |
| Sellers | `9740640b-388d-4d16-8956-cfe019e251ca` | `configuracao-de-sellers-permitidos` | `KNOWLEDGE_INTEGRACOES_GATEWAY_SUBCLUSTER_PREP.md` — permissões e integração | Pendente Produto + Engenharia + Suporte/CS |
| Sellers | `7a148387-a690-4662-9492-7ef9958ed331` | `sellers-permitidos-para-criar-vale-compras` | `KNOWLEDGE_VALE_COMPRA_SUBCLUSTER_PREP.md` — seller e crédito | Pendente Produto + Engenharia + Suporte/CS |

### Watchlist lexical no corpo

Outros 15 artigos possuem um termo sensível apenas no `body_md`, frequentemente em links relacionados, texto de exemplo ou alt de imagem. Eles não foram classificados como violação semântica automática. Permanecem na fila de revisão porque o runbook anterior não distinguia conteúdo principal de referência incidental:

`como-automatizar-a-conclusao-de-uma-solicitacao`, `como-cadastrar-lojas-fisicas`, `como-configurar-a-cor-exibida-nos-filtros-basicos-das-solicitacoes`, `como-configurar-o-vale-compras-retencao`, `como-configurar-os-textos-do-front`, `como-criar-um-usuario`, `como-realizar-alteracoes-em-um-vale-compra-pendente`, `configurando-parametrizacao-geral`, `erro-nao-autorizado-ao-gerar-codigo-reverso-postagem`, `erro-de-autorizacao-ao-acessar-pedidos-na-vtex`, `erro-no-cep-ou-endereco-incorreto`, `pedidos-pagos-com-vale-compras`, `pendencia-de-logistica-reversa`, `permissoes-vtex` e `posso-alterar-a-forma-de-reembolso-do-meu-consumidor`.

## Decisão necessária

Há duas opções legítimas, e a escolha não deve ser inferida pelo frontend nem por este relatório:

1. **Exceção legada temporária:** manter os artigos já publicados para evitar regressão de cobertura, registrando Produto/Engenharia/Suporte/CS por artigo, removendo ou substituindo referências de imagem sem asset e proibindo novos artigos canônicos até aprovação.
2. **Saneamento conservador:** retirar da visibilidade pública os artigos sensíveis e publicar apenas rewrites canônicos depois de aprovação explícita. Reduz risco editorial, mas remove cobertura imediata da Central.

Recomendação técnica: opção 1 apenas como exceção com prazo e lista nominal, sem considerar o corpus aprovado para migração como aprovação de conteúdo atual. A exceção não libera credenciais, endpoints privados, permissões críticas ou regras financeiras novas.

## Bloqueadores para declarar a Central pronta

- reconciliar as 128 referências de imagem: fazer upload/aprovação dos assets reais ou remover as referências do conteúdo;
- cadastrar um canal público real de suporte em `brand_settings`, sem inventar e-mail ou WhatsApp;
- obter e registrar a decisão humana por artigo sensível no registro de aprovações;
- revisar semanticamente a watchlist lexical do corpo;
- manter o runbook alinhado à exceção legada, sem usar a exceção como atalho para novas publicações.

## Limitação e próximo gate

Não foi executada escrita remota nesta auditoria. A publicação/alteração do corpus público e a reconciliação de assets exigem decisão humana explícita de Produto/CS (e Engenharia quando houver integração), conforme `docs/knowledge/KNOWLEDGE_FULL_CORPUS_APPROVAL_COLLECTION_PLAYBOOK.md`.
