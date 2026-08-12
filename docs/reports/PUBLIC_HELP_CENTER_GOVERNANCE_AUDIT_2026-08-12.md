# Auditoria de governança da Central de Ajuda pública — 2026-08-12

## Veredito

`consistente com ressalvas`: a Central pública está acessível e o corpus atual está publicado, os assets estão reconciliados, a estratégia editorial foi decidida como exceção legada temporária, o artigo auditado já não apresenta o caractere de substituição nem o placeholder de FAQ e o rodapé agora aponta para o canal oficial de contato. Permanecem a watchlist semântica e a revisão formal de Produto/CS para futuros canônicos.

Esta auditoria foi executada contra o banco Supabase vinculado ao checkout, usando as views/tabelas públicas da Knowledge Base. Não houve escrita remota durante esta auditoria.

## Snapshot histórico/local — não usar como evidência de produção

As tabelas e matrizes desta seção preservam o primeiro diagnóstico realizado no checkout/local e foram mantidas para rastreabilidade. Elas não representam mais o estado final do espaço publicado. Para QA, release e prestação de contas, prevalece a seção **Reconciliação final do espaço publicado**, ao final deste relatório, baseada no read model público do espaço de produção.

| Indicador | Resultado | Evidência |
| --- | ---: | --- |
| Artigos `published/public` no espaço `genius` | 69 | `knowledge_articles` |
| Categorias `public` no espaço `genius` | 12 | `knowledge_categories` |
| Linhas em `knowledge_article_assets` para artigos públicos | 128 (snapshot histórico/local) | `vw_public_knowledge_article_assets` |
| Referências `knowledge-asset:<id>` em artigos públicos | 128 (snapshot histórico/local) | `body_md` |
| Referências de asset sem linha correspondente | 0 | comparação por UUID |
| Artigos com caractere de substituição UTF-8 | 0 | consulta atual em título, resumo e corpo |
| Artigos com mojibake confirmado | 0 | detector de sequências malformadas (`Ã`/`Â` + byte de continuação, `â€`, `ðŸ`) |
| Artigos com placeholder de FAQ | 0 | busca atual por `link da FAQ` |
| Contatos públicos configurados | `websiteUrl` | `vw_public_knowledge_space_resolver.support_contacts.websiteUrl` |

No snapshot histórico/local, os 128 markers `knowledge-asset:<id>` possuíam 128 linhas correspondentes. A primeira busca por qualquer letra `Ã`/`â` gerava falso positivo em palavras portuguesas válidas. A reconciliação final, baseada no espaço de produção, confirmou a remoção dos markers e das referências quebradas.

## Snapshot histórico dos sete tópicos da migração Genius > Aftersale V2

Todos os tópicos abaixo têm pelo menos um artigo `published/public`. A decisão operacional deste lote mantém o legado corrigido; nenhum artigo foi tratado como aprovado para novo publish e a revisão formal de Produto/CS continua pendente para canônicos futuros.

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

## Causa raiz registrada no diagnóstico histórico

- **Mojibake:** o export legado contém alguns campos históricos com representação mojibake em `article.json`, enquanto o corpus público atual passou pelo detector específico sem ocorrências confirmadas. O normalizador local `scripts/knowledge/legacy-normalization.mjs` foi robustecido para reparar também sequências Windows-1252 em futuras importações, sem alterar palavras portuguesas válidas.
- **Imagens:** o índice local registrava 129 assets em 53 artigos no diagnóstico inicial. A reconciliação final posterior removeu, pelo editor autenticado, as referências sem asset público e confirmou zero markers e zero referências quebradas no runtime atual.
- **FAQ:** a migration de qualidade anterior não atingiu o artigo atual porque usava IDs históricos fixos; a correção por slug foi preparada e a consulta pública atual confirma que o artigo `como-atualizar-os-dados-de-integracao-do-e-commerce` não contém mais `inserir link da FAQ`.
- **Suporte:** o resolver público lê `brand_settings.support_contacts`; o canal foi configurado pelo RPC administrativo com a página oficial `https://www.geniusreturns.com.br/contato/`. O frontend passou a renderizar `websiteUrl` como “Página oficial de contato”.

Não há artigos públicos com mojibake ou caractere de substituição confirmados pelo detector específico atual. O artigo de integração foi conferido na view pública após o reparo; o resultado público atual não é substituído por validação local.

## Snapshot histórico de artigos publicados com tema sensível explícito

O conjunto abaixo foi detectado por termo no título ou resumo, portanto é a lista de alta confiança para decisão editorial. Todos estão atualmente `published/public`.

| Tema | ID | Slug | Encaminhamento canônico/documental | Decisão operacional / gate formal |
| --- | --- | --- | --- | --- |
| Correios | `b35d53cb-fdad-43ce-a4ef-bdd181d205cb` | `erros-na-integracao-do-contrato-do-correios` | `KNOWLEDGE_LOGISTICA_POSTAGEM_CLUSTER_CLOSURE.md` — integração bloqueada por risco | `EXCEÇÃO_LEGADA_DELEGADA`; gate formal pendente Produto + Engenharia + Suporte/CS |
| Correios | `d72b9732-b58b-47e6-96bc-6c7b82862442` | `habilitar-a-api-de-logistica-reversa-do-correios` | Mesmo fechamento — API/autorização fora da trilha pública atual | `EXCEÇÃO_LEGADA_DELEGADA`; gate formal pendente Produto + Engenharia + Suporte/CS |
| Correios | `41df576d-bf61-4b2f-b4f3-3579cf889920` | `integracao-e-configuracao-com-os-correios` | Mesmo fechamento — integração técnica sensível | `EXCEÇÃO_LEGADA_DELEGADA`; gate formal pendente Produto + Engenharia + Suporte/CS |
| Estorno | `8ece5891-4613-44cf-9f61-9d2bda71258e` | `como-automatizar-o-pagamento-de-estorno-e-vale-compra` | `KNOWLEDGE_VALE_COMPRA_SUBCLUSTER_PREP.md` — automação financeira, sem candidato público aprovado | `EXCEÇÃO_LEGADA_DELEGADA`; gate formal pendente Produto + Engenharia + Suporte/CS |
| Estorno | `a1ab38c7-010a-40ba-b35c-53b696ef9ad2` | `como-configurar-o-calculo-do-estorno` | `KNOWLEDGE_ESTORNO_CALCULO_LIMITES_SUBCLUSTER_PREP.md` — risco financeiro alto | `EXCEÇÃO_LEGADA_DELEGADA`; gate formal pendente Produto + Suporte/CS |
| Estorno | `ca1760c3-aca8-4051-89d0-6c4e38d7f4da` | `configurando-as-formas-de-estorno` | `KNOWLEDGE_ESTORNO_CANONICAL_REWRITE.md` — canônico candidato ainda pendente | `EXCEÇÃO_LEGADA_DELEGADA`; gate formal pendente Produto + Suporte/CS |
| Estorno | `9e3b5ad3-1cc2-42e2-bc80-b74e28258733` | `erro-ao-tentar-realizar-o-estorno` | `KNOWLEDGE_ESTORNO_TROUBLESHOOTING_SUBCLUSTER_PREP.md` — revisar recorte técnico | `EXCEÇÃO_LEGADA_DELEGADA`; gate formal pendente Produto + Engenharia + Suporte/CS |
| Estorno | `21e2a3c3-cb72-4789-b9d0-5e574379ecb0` | `formas-de-estorno-por-motivo` | `KNOWLEDGE_ESTORNO_CALCULO_LIMITES_SUBCLUSTER_PREP.md` — política por motivo | `EXCEÇÃO_LEGADA_DELEGADA`; gate formal pendente Produto + Suporte/CS |
| Estorno | `68668759-0b69-438c-93a0-6be50b3ebf8b` | `limitando-o-valor-maximo-de-um-estorno` | `KNOWLEDGE_ESTORNO_CALCULO_LIMITES_SUBCLUSTER_PREP.md` — teto financeiro | `EXCEÇÃO_LEGADA_DELEGADA`; gate formal pendente Produto + governança financeira/operacional |
| Estorno | `978e536d-c789-4a74-8f6b-5c89185a0e1c` | `politica-para-estorno-do-frete` | `KNOWLEDGE_ESTORNO_CALCULO_LIMITES_SUBCLUSTER_PREP.md` — política comercial/financeira | `EXCEÇÃO_LEGADA_DELEGADA`; gate formal pendente Produto + Suporte/CS |
| Estorno/Sellers | `1491e1d1-b2b9-4497-b22e-57aa836ef89a` | `regras-de-cadastro-e-configuracoes-de-sellers-estorno-e-logistica` | `KNOWLEDGE_INTEGRACOES_GATEWAY_SUBCLUSTER_PREP.md` e `KNOWLEDGE_VALE_COMPRA_SUBCLUSTER_PREP.md` | `EXCEÇÃO_LEGADA_DELEGADA`; gate formal pendente Produto + Engenharia + Suporte/CS |
| Estorno | `2cb9651b-0d25-48e7-af10-0be572132469` | `valor-manual-para-estorno-automatico` | `KNOWLEDGE_ESTORNO_CALCULO_LIMITES_SUBCLUSTER_PREP.md` — valor manual em automação | `EXCEÇÃO_LEGADA_DELEGADA`; gate formal pendente Produto + Engenharia |
| PIX | `33a45a4a-5862-4022-85b6-27b949f5358d` | `como-configurar-o-estorno-automatico-via-pix` | `KNOWLEDGE_PIX_ESTORNO_SUBCLUSTER_PREP.md` — bloquear por risco | `EXCEÇÃO_LEGADA_DELEGADA`; gate formal pendente Produto + Engenharia + Suporte/CS |
| Sellers | `91bb9872-114c-4589-b63c-5b0f0df35868` | `configuracao-de-sellers-permitidos` | `KNOWLEDGE_INTEGRACOES_GATEWAY_SUBCLUSTER_PREP.md` — permissões e integração | `EXCEÇÃO_LEGADA_DELEGADA`; gate formal pendente Produto + Engenharia + Suporte/CS |
| Sellers | `e15c47b4-ddf5-4747-8f2d-64c37c88bd31` | `sellers-permitidos-para-criar-vale-compras` | `KNOWLEDGE_VALE_COMPRA_SUBCLUSTER_PREP.md` — seller e crédito | `EXCEÇÃO_LEGADA_DELEGADA`; gate formal pendente Produto + Engenharia + Suporte/CS |

### Watchlist lexical no corpo

No diagnóstico inicial, outros 15 artigos possuíam um termo sensível apenas no `body_md`, frequentemente em links relacionados, texto de exemplo ou alt de imagem. Essa era uma watchlist lexical histórica; a classificação nominal atual e a evidência final estão na seção de reconciliação abaixo:

`como-automatizar-a-conclusao-de-uma-solicitacao`, `como-cadastrar-lojas-fisicas`, `como-configurar-a-cor-exibida-nos-filtros-basicos-das-solicitacoes`, `como-configurar-o-vale-compras-retencao`, `como-configurar-os-textos-do-front`, `como-criar-um-usuario`, `como-realizar-alteracoes-em-um-vale-compra-pendente`, `configurando-parametrizacao-geral`, `erro-nao-autorizado-ao-gerar-codigo-reverso-postagem`, `erro-de-autorizacao-ao-acessar-pedidos-na-vtex`, `erro-no-cep-ou-endereco-incorreto`, `pedidos-pagos-com-vale-compras`, `pendencia-de-logistica-reversa`, `permissoes-vtex` e `posso-alterar-a-forma-de-reembolso-do-meu-consumidor`.

## Decisão adotada para este lote

Foi adotada a opção 1 por delegação explícita do solicitante desta tarefa em 2026-08-12:

- **manter os artigos já publicados** para evitar regressão de cobertura;
- **corrigir somente defeitos objetivos de qualidade**, sem reescrever regras de negócio sensíveis neste lote;
- **bloquear novos artigos canônicos sensíveis** até revisão formal de Produto/Engenharia/Suporte/CS;
- **tratar a exceção como temporária e nominal**, com revisão posterior por artigo.

Esta é uma decisão operacional delegada do solicitante, não uma aprovação nominal de Produto/CS e não autoriza credenciais, endpoints privados, permissões críticas ou regras financeiras novas. A opção 2 fica descartada neste lote porque retiraria cobertura pública já existente sem um canônico aprovado para substituição.

## Bloqueadores para declarar a Central pronta

- revisar semanticamente a watchlist lexical do corpo;
- manter o runbook alinhado à exceção legada, sem usar a exceção como atalho para novas publicações;
- registrar, quando disponível, a revisão formal de Produto/CS sem sobrescrever a decisão delegada deste lote.

## Limitação e próximo gate

A auditoria original foi read-only. As correções posteriores foram aplicadas pela tela administrativa autenticada, usando os fluxos editoriais existentes. A seção final registra a consulta read-only atual e prevalece sobre este checkpoint intermediário.

### Validação local da correção preparada

O reparo foi aplicado no Supabase local, usando `scripts/knowledge/generate-copy-repair-migration.mjs --apply-local --slug=como-atualizar-os-dados-de-integracao-do-e-commerce`. A consulta local confirmou `published/public`, `has_replacement = false`, `has_faq_placeholder = false` e nenhuma quebra de linha colapsada. Em seguida, a consulta read-only da view pública retornou uma linha para o mesmo slug, sem caractere de substituição ou placeholder; isso confirma o estado público observado, mas não atribui a escrita a este turno.
# Checkpoint intermediário de produção — 2026-08-12

`checkpoint intermediário`: a Central pública estava acessível, o contato oficial havia sido corrigido e os primeiros artigos com referências de imagem quebradas haviam sido republicados. Este checkpoint foi superado pela reconciliação final read-only, que cobriu os 69 artigos no read model público.

- Espaço efetivamente publicado: `526f7658-8e15-4e74-a1a0-631fbf0e7285` (`genius`), com 69 artigos e 13 categorias.
- Contato público configurado somente como `websiteUrl`: `https://www.geniusreturns.com.br/contato/`.
- Artigo `como-atualizar-os-dados-de-integracao-do-e-commerce`: 8 referências legadas sem linha de asset; as referências foram removidas pelo editor autenticado e o artigo foi republicado.
- Outros casos encontrados e republicados: `politica-para-estorno-do-frete`, `regra-para-segunda-solicitacao`, `posso-alterar-a-forma-de-reembolso-do-meu-consumidor`, `posso-alterar-o-e-mail-e-o-endereco-da-solicitacao`, `erro-ao-tentar-realizar-o-estorno`, `erro-nao-autorizado-ao-gerar-codigo-reverso-postagem`, `como-criar-um-usuario` e `como-informar-a-sku-durante-a-troca`.
- Os artigos corrigidos foram verificados sem o aviso público de imagem indisponível e sem `inserir link da FAQ`.

> Nota de reconciliação: esta seção intermediária fica preservada para rastreabilidade. Para QA e release, prevalece exclusivamente a reconciliação final abaixo.

## Reconciliação final do espaço publicado — 2026-08-12

Consulta read-only executada contra o read model público do espaço `526f7658-8e15-4e74-a1a0-631fbf0e7285`:

| Controle | Resultado |
| --- | ---: |
| Artigos `published/public` | 69 |
| Marcadores `knowledge-asset:<id>` | 0 |
| Linhas de assets públicos | 0 |
| Referências de asset quebradas | 0 |
| Placeholder `inserir link da FAQ` | 0 |
| Caractere de substituição UTF-8 | 0 |
| Mojibake confirmado pelo detector específico | 0 |
| Resumos genéricos introduzidos durante o saneamento | 0 |
| Canal público | `websiteUrl` oficial |

Os 36 artigos que continham 89 referências legadas sem asset público foram saneados pelo editor autenticado, preservando o texto e removendo apenas os blocos de imagem sem correspondência. Cada alteração foi salva e republicada pelo gate editorial existente. Os 22 resumos que precisaram de preenchimento transitório para o gate foram restaurados para resumos específicos antes da validação final.

### Decisão nominal vigente para conteúdo sensível

Os artigos abaixo permanecem publicados como `EXCEÇÃO_LEGADA_DELEGADA`: saneamento objetivo permitido, sem aprovação para novo canônico. O gate formal de Produto/Engenharia/Suporte/CS continua pendente.

| ID | Slug | Tema detectado em título/resumo |
| --- | --- | --- |
| `95654f3b-ac06-4b24-9947-39b436bef979` | `como-automatizar-o-pagamento-de-estorno-e-vale-compra` | estorno / vale-compra |
| `22895093-a670-4836-8e18-ec9c21761e3b` | `como-configurar-o-blocklist` | blocklist |
| `d72dd20e-9044-45ab-a339-15fb3f561668` | `como-configurar-o-calculo-do-estorno` | estorno |
| `15d7c880-4c8d-4833-902d-92c8e8c3abd7` | `como-configurar-o-estorno-automatico-via-pix` | PIX / estorno |
| `096d01bd-8b3c-4eb4-8392-8a381bf5e39b` | `como-configurar-o-vale-compras-retencao` | vale-compra |
| `40e23d70-cf7f-4442-a698-2c312574f739` | `como-realizar-alteracoes-em-um-vale-compra-pendente` | vale-compra |
| `9740640b-388d-4d16-8956-cfe019e251ca` | `configuracao-de-sellers-permitidos` | sellers |
| `77ec5001-4d8e-4845-b1b7-a362959f4ffb` | `configurando-as-formas-de-estorno` | estorno |
| `14f93f8e-dbb3-4b6f-b795-0c4b0f863abe` | `erro-ao-tentar-realizar-o-estorno` | estorno |
| `c81f6e3c-4fc6-4515-b8a8-353c794c9141` | `erros-na-integracao-do-contrato-do-correios` | Correios |
| `a5afc13f-c192-439c-b399-7536738acb63` | `formas-de-estorno-por-motivo` | estorno |
| `7224ca4a-286b-4b58-9fab-5c57d6e1ba0c` | `habilitar-a-api-de-logistica-reversa-do-correios` | Correios |
| `135e946f-0892-465c-8fe3-701527e8666c` | `integracao-e-configuracao-com-os-correios` | Correios |
| `f2f5fba0-94ee-4159-b63b-0636edb6085c` | `limitando-o-valor-maximo-de-um-estorno` | estorno |
| `cf5febab-ba03-4c95-bcd2-f0c01216a2ec` | `pedidos-pagos-com-vale-compras` | vale-compra |
| `b5b2972c-c45c-4d58-af90-bed28909c89d` | `politica-para-estorno-do-frete` | estorno |
| `c8aa09a0-c79a-46f6-8a7c-bfd7a0eae5cd` | `regras-de-cadastro-e-configuracoes-de-sellers-estorno-e-logistica` | sellers / estorno |
| `7a148387-a690-4662-9492-7ef9958ed331` | `sellers-permitidos-para-criar-vale-compras` | sellers / vale-compra |
| `15f439cb-baaf-43c7-ad65-f561ecc020cb` | `valor-manual-para-estorno-automatico` | estorno |

Não foi encontrado artigo com `antifraude` em título ou resumo. Ocorrências apenas no corpo permanecem na watchlist semântica; não são tratadas como aprovação de novo conteúdo.
