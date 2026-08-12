# Auditoria de governança da Central de Ajuda pública — 2026-08-12

## Veredito

`inconsistente com ressalvas críticas`: a Central pública está acessível e o corpus atual está publicado, os assets agora estão reconciliados, mas ainda há um artigo com caractere de substituição UTF-8, um placeholder de FAQ, nenhum canal de suporte configurado e artigos legados sensíveis publicados sem decisão individual registrada para o estado atual.

Esta auditoria foi executada contra o banco Supabase vinculado ao checkout, usando as views/tabelas públicas da Knowledge Base. Não houve escrita remota durante esta auditoria.

## Estado observado

| Indicador | Resultado | Evidência |
| --- | ---: | --- |
| Artigos `published/public` no espaço `genius` | 69 | `knowledge_articles` |
| Categorias `public` no espaço `genius` | 12 | `knowledge_categories` |
| Linhas em `knowledge_article_assets` para artigos públicos | 128 | `vw_public_knowledge_article_assets` |
| Referências `knowledge-asset:<id>` em artigos públicos | 128 | `body_md` |
| Referências de asset sem linha correspondente | 0 | comparação por UUID |
| Artigos com caractere de substituição UTF-8 | 1 | `chr(65533)` em título, resumo e corpo |
| Artigos com mojibake confirmado | 0 | detector de sequências malformadas (`Ã`/`Â` + byte de continuação, `â€`, `ðŸ`) |
| Artigos com placeholder de FAQ | 1 | busca por `link da FAQ` |
| Contatos públicos configurados | nenhum | `vw_public_knowledge_space_resolver.support_contacts = {}` |

Os 128 markers `knowledge-asset:<id>` agora possuem 128 linhas correspondentes no read model público; a lacuna de assets foi resolvida externamente e precisa apenas permanecer coberta pela validação. A primeira busca por qualquer letra `Ã`/`â` gerava falso positivo em palavras portuguesas válidas; a consulta atual não confirmou mojibake, mas encontrou um artigo com `chr(65533)` e um placeholder de FAQ que ainda exigem correção editorial.

## Os sete tópicos da migração Genius > Aftersale V2

Todos os tópicos abaixo têm pelo menos um artigo `published/public`. Nenhum foi tratado como aprovado para novo publish; a decisão entre manter o legado corrigido ou substituir pelo canônico continua pendente de Produto/CS.

| Tópico | Artigo(s) publicado(s) confirmado(s) |
| --- | --- |
| BlockList | `19826c33-03f4-4d8b-8f21-29f184f39125` — `como-configurar-o-blocklist` |
| Estorno automático PIX | `33a45a4a-5862-4022-85b6-27b949f5358d` — `como-configurar-o-estorno-automatico-via-pix` |
| Regra/cálculo de estorno | `a1ab38c7-010a-40ba-b35c-53b696ef9ad2` — `como-configurar-o-calculo-do-estorno`; `68668759-0b69-438c-93a0-6be50b3ebf8b` — `limitando-o-valor-maximo-de-um-estorno`; `978e536d-c789-4a74-8f6b-5c89185a0e1c` — `politica-para-estorno-do-frete` |
| Vale-compra | `8ece5891-4613-44cf-9f61-9d2bda71258e` — `como-automatizar-o-pagamento-de-estorno-e-vale-compra`; `470da711-46b1-4b56-b18d-059fd829f409` — `como-configurar-o-vale-compras-retencao`; `0c76840c-9a49-4e76-94c8-78aec2e36bdc` — `como-realizar-alteracoes-em-um-vale-compra-pendente`; `0766342f-e8eb-4927-a4ba-c5f3284a5982` — `pedidos-pagos-com-vale-compras`; `e15c47b4-ddf5-4747-8f2d-64c37c88bd31` — `sellers-permitidos-para-criar-vale-compras` |
| Motivos de troca/devolução | `38e67946-8956-43d3-98f4-b1bcb31bbf79` — `como-cadastrar-motivos-para-troca-ou-devolucao`; `40270318-8a7e-4114-bc49-3486c52cb96c` — `como-iniciar-uma-troca-ou-devolucao-pelo-e-commerce` |
| Logística reversa | `b84c1f9e-528f-4d93-b577-db1fac69de31` — `como-o-consumidor-solicita-uma-reversa`; `d72b9732-b58b-47e6-96bc-6c7b82862442` — `habilitar-a-api-de-logistica-reversa-do-correios`; `d860e673-1912-4d34-9c47-6dc5f3420947` — `pendencia-de-logistica-reversa`; `7b3f7c81-1e17-4829-8bb3-a1fab5ef4228` — `posso-filtrar-as-solicitacoes-de-reversas`; `336f8f01-0c9d-4ba8-8612-2436e3731c77` — `regra-de-excecao-para-motivos-nao-gerar-logistica-reversa` |
| Prazo de postagem | `8b00aec4-e373-4f94-a8cd-35ef7c825707` — `como-configurar-o-prazo-logistico-por-estado` |

Não foi encontrado artigo público com `antifraude` no título, resumo ou corpo na consulta atual.

## Causa raiz dos problemas de qualidade

- **Mojibake:** o export legado contém alguns campos históricos com representação mojibake em `article.json`, enquanto o corpus público atual passou pelo detector específico sem ocorrências confirmadas. O normalizador local `scripts/knowledge/legacy-normalization.mjs` foi robustecido para reparar também sequências Windows-1252 em futuras importações, sem alterar palavras portuguesas válidas.
- **Imagens:** o índice local registra 129 assets em 53 artigos, e o runtime público agora expõe 128 linhas em `vw_public_knowledge_article_assets`, exatamente correspondentes aos 128 markers publicados. O reprocessamento de assets foi aplicado após o snapshot anterior.
- **FAQ:** a migration de qualidade anterior não atingiu o artigo atual porque usava IDs históricos fixos; o artigo `como-atualizar-os-dados-de-integracao-do-e-commerce` ainda contém `inserir link da FAQ`.
- **Suporte:** o resolver público lê `brand_settings.support_contacts`; o valor atual é `{}`, portanto não existe canal real para o frontend exibir.

Não há artigos públicos com mojibake confirmado pelo detector específico atual; há, porém, um artigo com caractere de substituição UTF-8 que precisa ser recuperado da origem local antes da escrita remota.

## Artigos publicados com tema sensível explícito

O conjunto abaixo foi detectado por termo no título ou resumo, portanto é a lista de alta confiança para decisão editorial. Todos estão atualmente `published/public`.

| Tema | ID | Slug | Encaminhamento canônico/documental | Decisão atual |
| --- | --- | --- | --- | --- |
| Correios | `b35d53cb-fdad-43ce-a4ef-bdd181d205cb` | `erros-na-integracao-do-contrato-do-correios` | `KNOWLEDGE_LOGISTICA_POSTAGEM_CLUSTER_CLOSURE.md` — integração bloqueada por risco | Pendente Produto + Engenharia + Suporte/CS |
| Correios | `d72b9732-b58b-47e6-96bc-6c7b82862442` | `habilitar-a-api-de-logistica-reversa-do-correios` | Mesmo fechamento — API/autorização fora da trilha pública atual | Pendente Produto + Engenharia + Suporte/CS |
| Correios | `41df576d-bf61-4b2f-b4f3-3579cf889920` | `integracao-e-configuracao-com-os-correios` | Mesmo fechamento — integração técnica sensível | Pendente Produto + Engenharia + Suporte/CS |
| Estorno | `8ece5891-4613-44cf-9f61-9d2bda71258e` | `como-automatizar-o-pagamento-de-estorno-e-vale-compra` | `KNOWLEDGE_VALE_COMPRA_SUBCLUSTER_PREP.md` — automação financeira, sem candidato público aprovado | Pendente Produto + Engenharia + Suporte/CS |
| Estorno | `a1ab38c7-010a-40ba-b35c-53b696ef9ad2` | `como-configurar-o-calculo-do-estorno` | `KNOWLEDGE_ESTORNO_CALCULO_LIMITES_SUBCLUSTER_PREP.md` — risco financeiro alto | Pendente Produto + Suporte/CS |
| Estorno | `ca1760c3-aca8-4051-89d0-6c4e38d7f4da` | `configurando-as-formas-de-estorno` | `KNOWLEDGE_ESTORNO_CANONICAL_REWRITE.md` — canônico candidato ainda pendente | Pendente Produto + Suporte/CS |
| Estorno | `9e3b5ad3-1cc2-42e2-bc80-b74e28258733` | `erro-ao-tentar-realizar-o-estorno` | `KNOWLEDGE_ESTORNO_TROUBLESHOOTING_SUBCLUSTER_PREP.md` — revisar recorte técnico | Pendente Produto + Engenharia + Suporte/CS |
| Estorno | `21e2a3c3-cb72-4789-b9d0-5e574379ecb0` | `formas-de-estorno-por-motivo` | `KNOWLEDGE_ESTORNO_CALCULO_LIMITES_SUBCLUSTER_PREP.md` — política por motivo | Pendente Produto + Suporte/CS |
| Estorno | `68668759-0b69-438c-93a0-6be50b3ebf8b` | `limitando-o-valor-maximo-de-um-estorno` | `KNOWLEDGE_ESTORNO_CALCULO_LIMITES_SUBCLUSTER_PREP.md` — teto financeiro | Pendente Produto + governança financeira/operacional |
| Estorno | `978e536d-c789-4a74-8f6b-5c89185a0e1c` | `politica-para-estorno-do-frete` | `KNOWLEDGE_ESTORNO_CALCULO_LIMITES_SUBCLUSTER_PREP.md` — política comercial/financeira | Pendente Produto + Suporte/CS |
| Estorno/Sellers | `1491e1d1-b2b9-4497-b22e-57aa836ef89a` | `regras-de-cadastro-e-configuracoes-de-sellers-estorno-e-logistica` | `KNOWLEDGE_INTEGRACOES_GATEWAY_SUBCLUSTER_PREP.md` e `KNOWLEDGE_VALE_COMPRA_SUBCLUSTER_PREP.md` | Pendente Produto + Engenharia + Suporte/CS |
| Estorno | `2cb9651b-0d25-48e7-af10-0be572132469` | `valor-manual-para-estorno-automatico` | `KNOWLEDGE_ESTORNO_CALCULO_LIMITES_SUBCLUSTER_PREP.md` — valor manual em automação | Pendente Produto + Engenharia |
| PIX | `33a45a4a-5862-4022-85b6-27b949f5358d` | `como-configurar-o-estorno-automatico-via-pix` | `KNOWLEDGE_PIX_ESTORNO_SUBCLUSTER_PREP.md` — bloquear por risco | Pendente Produto + Engenharia + Suporte/CS |
| Sellers | `91bb9872-114c-4589-b63c-5b0f0df35868` | `configuracao-de-sellers-permitidos` | `KNOWLEDGE_INTEGRACOES_GATEWAY_SUBCLUSTER_PREP.md` — permissões e integração | Pendente Produto + Engenharia + Suporte/CS |
| Sellers | `e15c47b4-ddf5-4747-8f2d-64c37c88bd31` | `sellers-permitidos-para-criar-vale-compras` | `KNOWLEDGE_VALE_COMPRA_SUBCLUSTER_PREP.md` — seller e crédito | Pendente Produto + Engenharia + Suporte/CS |

### Watchlist lexical no corpo

Outros 15 artigos possuem um termo sensível apenas no `body_md`, frequentemente em links relacionados, texto de exemplo ou alt de imagem. Eles não foram classificados como violação semântica automática. Permanecem na fila de revisão porque o runbook anterior não distinguia conteúdo principal de referência incidental:

`como-automatizar-a-conclusao-de-uma-solicitacao`, `como-cadastrar-lojas-fisicas`, `como-configurar-a-cor-exibida-nos-filtros-basicos-das-solicitacoes`, `como-configurar-o-vale-compras-retencao`, `como-configurar-os-textos-do-front`, `como-criar-um-usuario`, `como-realizar-alteracoes-em-um-vale-compra-pendente`, `configurando-parametrizacao-geral`, `erro-nao-autorizado-ao-gerar-codigo-reverso-postagem`, `erro-de-autorizacao-ao-acessar-pedidos-na-vtex`, `erro-no-cep-ou-endereco-incorreto`, `pedidos-pagos-com-vale-compras`, `pendencia-de-logistica-reversa`, `permissoes-vtex` e `posso-alterar-a-forma-de-reembolso-do-meu-consumidor`.

## Decisão necessária

Há duas opções legítimas, e a escolha não deve ser inferida pelo frontend nem por este relatório:

1. **Exceção legada temporária:** manter os artigos já publicados para evitar regressão de cobertura, registrando Produto/Engenharia/Suporte/CS por artigo, removendo ou substituindo referências de imagem sem asset e proibindo novos artigos canônicos até aprovação.
2. **Saneamento conservador:** retirar da visibilidade pública os artigos sensíveis e publicar apenas rewrites canônicos depois de aprovação explícita. Reduz risco editorial, mas remove cobertura imediata da Central.

Recomendação técnica: opção 1 apenas como exceção com prazo e lista nominal, sem considerar o corpus aprovado para migração como aprovação de conteúdo atual. A exceção não libera credenciais, endpoints privados, permissões críticas ou regras financeiras novas.

## Bloqueadores para declarar a Central pronta

- corrigir o artigo `como-atualizar-os-dados-de-integracao-do-e-commerce` a partir da origem local, removendo o caractere de substituição e o placeholder de FAQ;
- cadastrar um canal público real de suporte em `brand_settings`, sem inventar e-mail ou WhatsApp;
- obter e registrar a decisão humana por artigo sensível no registro de aprovações;
- revisar semanticamente a watchlist lexical do corpo;
- manter o runbook alinhado à exceção legada, sem usar a exceção como atalho para novas publicações.

## Limitação e próximo gate

Não foi executada escrita remota nesta auditoria. A inspeção read-only atual confirmou 128 assets públicos correspondentes aos 128 markers; a correção textual restante e qualquer alteração de visibilidade exigem decisão humana explícita de Produto/CS (e Engenharia quando houver integração), conforme `docs/knowledge/KNOWLEDGE_FULL_CORPUS_APPROVAL_COLLECTION_PLAYBOOK.md`.
