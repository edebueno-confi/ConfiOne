# OCTADESK_PUBLIC_HELP_PILOT_PLAN.md

## Objetivo

Planejar um lote piloto publico para a Central de Ajuda Genius a partir do corpus Octadesk, sem publicar automaticamente e sem promover o corpus inteiro para runtime.

Este documento e apenas planejamento editorial/operacional. Ele nao altera banco, frontend, status de artigos ou contratos.

## Atualizacao de curadoria humana em 2026-05-20

Depois do import local controlado, os 4 artigos do lote piloto permanecem `draft/internal`, com advisories `pending` e sem exposicao em `/help/genius`.

O pacote operacional para revisao humana foi criado em:

- `docs/reports/OCTADESK_PUBLIC_HELP_PILOT_HUMAN_REVIEW.md`

Esse pacote nao aprova publicacao. Ele organiza identificacao, riscos editoriais, sugestao de versao publica e checklist humano por artigo.

## Atualizacao editorial em 2026-05-20

As versoes editoriais sugeridas para os 4 drafts piloto foram preparadas em:

- `docs/reports/OCTADESK_PUBLIC_HELP_PILOT_EDITORIAL_DRAFTS.md`

As versoes sugeridas removem linguagem herdada do corpus legado, contatos operacionais e dependencia obrigatoria de prints. Elas continuam bloqueadas para publicacao automatica: a revisao humana ainda precisa validar titulo, resumo, corpo, categoria, assets, links e ausencia de conteudo sensivel antes de qualquer mudanca para review ou publish.

Aplicacao local controlada: os 4 drafts foram atualizados no Admin Knowledge pela RPC existente `rpc_admin_update_knowledge_article_draft_v2`, preservando `draft/internal`, `source_path`, `source_hash` e advisories `pending`. Nenhum artigo foi publicado ou exposto em `/help/genius`.

## Atualizacao de review interno em 2026-05-20

Os 4 artigos do lote piloto foram submetidos para revisao formal interna via RPC existente `rpc_admin_submit_knowledge_article_for_review_v2`.

Estado apos submissao:

- Status: `review`
- Visibility: `internal`
- Advisories: `pending`
- Exposicao publica: `0` registros nas views publicas e nenhum resultado em `/help/genius`

Esta etapa nao publica conteudo, nao muda visibilidade para `public`, nao marca advisory como `reviewed` e nao preenche checklist humano automaticamente. A publicacao continua bloqueada ate revisao humana completa, revisao de assets e decisao explicita sobre cada artigo.

## Fontes usadas

- Corpus real: `raw_knowledge/octadesk_export/latest`
- Indice real: `raw_knowledge/octadesk_export/latest/articles-index.json`
- Backlog operacional: `docs/reports/KNOWLEDGE_LEGACY_CURATION_BACKLOG.json`
- Relatorio de inventario: `docs/reports/KNOWLEDGE_LEGACY_INVENTORY_REPORT.md`
- Relatorio editorial: `docs/reports/LEGACY_CORPUS_EDITORIAL_AUDIT.md`

## Inventario consolidado

- Total de artigos: `58`
- Total de assets: `129`
- Artigos com assets: `53`
- Categorias raiz: `3`
- Secoes: `4`
- Grupo duplicado por hash: `1`
- Artigos no grupo duplicado: `2`
- Artigos materializados no Knowledge runtime a partir do corpus Octadesk: `0`

Categorias do corpus:

| Categoria | Artigos |
|---|---:|
| Configuracoes | 45 |
| Cadastros | 8 |
| Erros comuns e solucoes | 5 |

Secoes do corpus:

| Secao | Artigos |
|---|---:|
| Configuracao de ambiente | 41 |
| Integracao e atualizacao | 8 |
| Erros e pendencias | 5 |
| Sellers e Loja Fisica | 4 |

## Divergencias resolvidas

O relatorio `KNOWLEDGE_LEGACY_INVENTORY_REPORT.md` registra uma triagem preliminar com:

- public: `4`
- internal: `35`
- restricted: `19`
- obsolete: `4`

O backlog operacional atual, regenerado pelo script de curadoria, registra:

- public: `4`
- internal: `34`
- restricted: `16`
- obsolete: `2`
- duplicate: `2`

Decisao desta fase:

- usar o backlog JSON como fonte operacional atual para classificacao inicial;
- preservar a leitura do inventario anterior como historico;
- tratar os 2 duplicados como classe separada, o que explica parte da divergencia;
- manter qualquer artigo com asset em `needs_asset_review` ate revisao humana.

## Regras de classificacao

Classes usadas:

- `public_safe_candidate`: candidato inicial a publico, sem flags sensiveis no backlog.
- `internal_only`: util para operacao interna, mas nao adequado para publico sem reescrita.
- `restricted`: contem sinal de integracao, credencial, permissao, estorno, PIX, Correios, endpoint, erro interno ou fluxo sensivel.
- `obsolete`: possivel fluxo legado/desatualizado.
- `duplicate`: conteudo duplicado por hash ou grupo duplicado.
- `needs_rewrite`: precisa reescrita ou adaptacao antes de qualquer publicacao.
- `needs_asset_review`: possui asset/imagem/anexo e precisa revisao visual.

## Classificacao dos 58 artigos

| # | Artigo | Assets | Flags | Classes | Decisao |
|---|---|---:|---|---|---|
| 1 | Como atualizar os dados de integracoes do e-commerce | 8 | integracoes, credenciais, permissoes, endpoints_api, erros_internos | internal_only, restricted, obsolete, needs_asset_review, needs_rewrite | tirar do piloto |
| 2 | Erros na integracao do contrato do Correios | 6 | integracoes, permissoes, correios, erros_internos | restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 3 | Habilitar a API de Logistica Reversa do Correios | 2 | integracoes, permissoes, correios, endpoints_api, erros_internos | restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 4 | Intalacao e integracao Nuvemshop | 0 | integracoes, credenciais, permissoes, estorno, endpoints_api, erros_internos | restricted, needs_rewrite | tirar do piloto |
| 5 | Integracao e configuracao com os Correios | 6 | integracoes, credenciais, permissoes, correios, endpoints_api, erros_internos | restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 6 | Permissoes Shopify | 0 | integracoes, credenciais, permissoes | restricted, needs_rewrite | tirar do piloto |
| 7 | Permissoes TrayCorp | 0 | integracoes, credenciais, permissoes, endpoints_api, erros_internos | restricted, needs_rewrite | tirar do piloto |
| 8 | Permissoes Vtex | 0 | integracoes, permissoes, estorno, erros_internos | internal_only, restricted, needs_rewrite | tirar do piloto |
| 9 | Como alterar ou aprovar os produtos de uma solicitacao? | 1 | - | public_safe_candidate, needs_asset_review, needs_rewrite | revisar manualmente antes |
| 10 | Como automatizar a conclusao de uma solicitacao | 3 | permissoes, estorno, correios, erros_internos | restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 11 | Como automatizar o pagamento de Estorno e Vale-Compra | 3 | integracoes, permissoes, estorno, pix, correios, endpoints_api | restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 12 | Como cadastrar motivos para troca ou devolucao | 2 | permissoes, erros_internos | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 13 | Como cadastrar os e-mails para notificacoes automaticas | 3 | permissoes, erros_internos | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 14 | Como configurar a cor exibida nos filtros basicos das solicitacoes | 2 | integracoes, permissoes, estorno, endpoints_api | restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 15 | Como configurar as formas de Estorno | 1 | permissoes, estorno, pix | restricted, duplicate, needs_asset_review, needs_rewrite | tirar do piloto |
| 16 | Como configurar o BlockList? | 2 | permissoes | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 17 | Como configurar o calculo do estorno | 1 | permissoes, estorno | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 18 | Como configurar o estorno automatico via pix | 1 | permissoes, estorno, pix | restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 19 | Como Configurar o Prazo Logistico por Estado? | 1 | integracoes, erros_internos | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 20 | Como configurar o Vale-Compras(Retencao) | 3 | permissoes | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 21 | Como configurar os textos do Front | 6 | permissoes, estorno | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 22 | Como criar um usuario | 3 | credenciais, permissoes, erros_internos | restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 23 | Como informar a SKU durantge a troca | 1 | permissoes | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 24 | Como o consumidor solicita uma reversa | 9 | permissoes | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 25 | Como realizar alteracoes em um Vale-compra pendente? | 1 | estorno | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 26 | Configurando as Formas de Estorno | 1 | permissoes, estorno, pix | restricted, duplicate, needs_asset_review, needs_rewrite | tirar do piloto |
| 27 | Configurando parametrizacao geral | 9 | permissoes, estorno, erros_internos | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 28 | Configurar padroes de seguranca | 3 | permissoes, erros_internos | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 29 | Criando e atualizando o cadastro | 3 | permissoes, erros_internos | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 30 | Criar Lojas Virtuais | 3 | permissoes, erros_internos | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 31 | Configurando a funcionalidade Fique com o Item | 1 | permissoes, erros_internos | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 32 | Formas de estorno por motivo | 1 | permissoes, estorno | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 33 | Limitando o Valor Maximo de um Estorno | 1 | permissoes, estorno | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 34 | MODO SAC | 2 | permissoes | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 35 | Operacoes permitidas durante a criacao de sua solicitacao | 1 | permissoes | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 36 | Pedidos pagos com vale-compras | 1 | permissoes, estorno | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 37 | Politica para estorno do frete | 1 | permissoes, estorno | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 38 | Posso alterar a forma de reembolso do meu consumidor? | 2 | permissoes, estorno | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 39 | Posso alterar o e-mail e o endereco da solicitacao? | 3 | permissoes | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 40 | Posso alterar o status de uma solicitacao? | 2 | permissoes | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 41 | Posso enviar uma notificacao de analise ao cliente? | 2 | - | public_safe_candidate, needs_asset_review, needs_rewrite | revisar manualmente antes |
| 42 | Posso filtrar as solicitacoes de reversas? | 1 | permissoes | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 43 | Produtos em Excecao | 1 | permissoes | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 44 | Reenviar um e-mail ao consumidor | 1 | - | public_safe_candidate, needs_asset_review, needs_rewrite | revisar manualmente antes |
| 45 | Regra de Excecao para Motivos - Nao Gerar Logistica Reversa | 5 | integracoes, permissoes, endpoints_api, erros_internos | restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 46 | Regra para segunda solicitacao | 1 | permissoes | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 47 | Regra por motivo | 1 | - | public_safe_candidate, needs_asset_review, needs_rewrite | revisar manualmente antes |
| 48 | Valor Manual para Estorno Automatico | 1 | permissoes, estorno | internal_only, restricted, obsolete, needs_asset_review, needs_rewrite | tirar do piloto |
| 49 | Variacao do Produto | 1 | permissoes | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 50 | Como cadastrar Lojas Fisicas | 4 | permissoes, erros_internos | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 51 | Configuracao de Sellers Permitidos | 3 | permissoes | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 52 | Regras de Cadastro  e configuracoes de Sellers( Estorno e Logistica) | 0 | integracoes, credenciais, estorno, correios, erros_internos | restricted, needs_rewrite | tirar do piloto |
| 53 | Sellers Permitidos para Criar Vale-Compras | 1 | permissoes, estorno | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 54 | Erro ao Tentar Realizar o Estorno | 1 | integracoes, permissoes, estorno, erros_internos | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 55 | Erro de autorizacao ao acessar pedidos na Vtex | 1 | integracoes, credenciais, permissoes, erros_internos | restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 56 | Erro "Nao Autorizado" ao Gerar Codigo de postagem | 2 | integracoes, credenciais, permissoes, correios, erros_internos | restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 57 | Erro no CEP ou Endereco Incorreto | 3 | correios, erros_internos | restricted, needs_asset_review, needs_rewrite | tirar do piloto |
| 58 | Pendencia de Logistica Reversa | 1 | erros_internos | internal_only, restricted, needs_asset_review, needs_rewrite | tirar do piloto |

## Allowlist piloto proposta

O lote piloto proposto tem 4 artigos. Todos continuam bloqueados para `apply` ate revisao humana, porque os quatro possuem assets e precisam reescrita para o padrao Genius.

| Artigo | Source path | Source hash | Assets | Categoria publica sugerida | Decisao |
|---|---|---|---:|---|---|
| Como alterar ou aprovar os produtos de uma solicitacao? | `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-alterar-ou-aprovar-os-produtos-de-uma-solicitacao` | `59b0619bf620261477c2491feaf6d274f68f95ea0ac7a1faf686704fba1a364a` | 1 | Operacao de trocas e devolucoes | revisar manualmente antes |
| Posso enviar uma notificacao de analise ao cliente? | `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-posso-enviar-uma-notificacao-de-analise-ao-cliente` | `7161e4ec3c080f510fbf31b30d0425ac69d5544b19bf5fdb6d0eb89a89dc9619` | 2 | Comunicacao com cliente | revisar manualmente antes |
| Reenviar um e-mail ao consumidor | `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-reenviar-um-e-mail-ao-consumidor` | `b2d6f54bf368cbf3e823a55e461d463ba61fb8b5482fd22d5756a5406ee13d43` | 1 | Comunicacao com cliente | revisar manualmente antes |
| Regra por motivo | `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-regra-por-motivo` | `fb3075312afaaa4cbb9ed019a683681c0c0902026f08a46283cb74906cc17aeb` | 1 | Regras de operacao | revisar manualmente antes |

### Justificativa dos candidatos

- Entraram porque nao possuem flags sensiveis no backlog atual.
- Ainda nao podem ser publicados porque todos possuem assets.
- Todos exigem reescrita para remover linguagem legada de consumidor/SAC e alinhar com cliente B2B.
- Nenhum deles deve virar `published/public` sem checklist humano completo.

## Artigos bloqueados por risco

Resumo dos artigos fora do piloto:

| Motivo principal | Quantidade aproximada | Tratamento recomendado |
|---|---:|---|
| Sensivel/restrito | 50 | manter fora do piloto; revisar com produto/engenharia antes de qualquer uso publico |
| Duplicado | 2 | consolidar antes de qualquer import/publicacao |
| Obsoleto | 2 | revalidar com operacao; possivel arquivamento editorial |
| Interno/precisa reescrita | 34 | usar como base interna ou reescrever para publico em onda futura |
| Depende de asset | 53 | revisar imagens/anexos antes de qualquer publicacao |

Observacao: as categorias se sobrepoem. Um artigo pode ser simultaneamente restrito, interno, com asset e precisar reescrita.

## Resultado dos dry-runs

Comandos executados:

```powershell
npm run knowledge:curation:backlog
npm run knowledge:verify:octadesk:space-aware
npm run knowledge:import:octadesk:local -- --space-slug genius
npm run knowledge:review:advisories:local -- --space-slug genius
```

Resultados:

- `knowledge:curation:backlog`: 58 artigos; public 4; internal 34; restricted 16; obsolete 2; duplicate 2.
- `knowledge:verify:octadesk:space-aware`: verificacao concluida com sucesso. A saida do script informa criacao de fixture local para validar o contrato; nao houve publicacao.
- `knowledge:import:octadesk:local -- --space-slug genius`: dry-run; 58 artigos; 3 categorias; 1 grupo duplicado; 30 candidatos restritos listados pelo import.
- `knowledge:review:advisories:local -- --space-slug genius`: dry-run; 58 linhas de backlog; 0 artigos correspondentes no banco; 58 ausentes; 0 reviews humanos preservados.

Verificacao adicional apos os comandos:

- artigos Octadesk materializados por `source_path`: `0`
- corpus ainda nao foi promovido para runtime
- nenhum artigo foi publicado

## Riscos

- Assets podem conter UI legada, dados internos, URLs ou contexto sensivel.
- Conteudo de integracao, permissao, estorno, PIX, Correios e erros internos deve ficar fora do piloto publico.
- O HTML legado nao deve ser usado como fonte publica sem saneamento.
- A classificacao atual e heuristica; nao substitui revisao humana.
- O comando de verificacao `knowledge:verify:octadesk:space-aware` executa fixture local para validar contrato, apesar de ser comando de verificacao.

## Pendencias antes de qualquer apply

- Aprovar explicitamente a allowlist dos 4 artigos piloto.
- Revisar manualmente o texto de cada artigo piloto.
- Revisar todos os assets dos 4 candidatos.
- Definir categoria publica final no Knowledge.
- Confirmar que o import com `--apply` sera limitado ao lote piloto, nao aos 58.
- Garantir que o import aplicara artigos como `draft`, nunca como `published`.
- Sincronizar advisories somente depois dos drafts existirem.
- Fazer QA publico apenas apos review/publicacao controlada.

## Execucao controlada em 2026-05-20

Resultado do lote tecnico piloto:

- allowlist versionada criada em `docs/reports/OCTADESK_PUBLIC_HELP_PILOT_ALLOWLIST.json`;
- importador Octadesk passou a aceitar `--allowlist`;
- sync de advisories passou a aceitar `--allowlist`;
- pacote editorial criado em `docs/reports/OCTADESK_PUBLIC_HELP_PILOT_REVIEW_PACK.md`;
- import local executado apenas para os 4 artigos da allowlist;
- os 4 artigos foram criados como `draft` e `internal`;
- `source_path` e `source_hash` foram preservados;
- advisories foram sincronizados apenas para os 4 artigos;
- `review_status` ficou `pending`;
- nenhum artigo foi publicado;
- `/help/genius` nao exibe os 4 drafts.

Artigos criados como draft:

- `Como alterar ou aprovar os produtos de uma solicitacao?`
- `Posso enviar uma notificacao de analise ao cliente?`
- `Reenviar um e-mail ao consumidor`
- `Regra por motivo`

Estado aprovado para a proxima fase:

- revisao humana artigo por artigo;
- revisao visual dos assets;
- reescrita editorial para padrao Genius B2B;
- decisao explicita antes de mover qualquer artigo para `published/public`.

## Comandos permitidos na proxima fase

Somente depois de aprovada a allowlist:

```powershell
npm run knowledge:import:octadesk:local -- --space-slug genius
npm run knowledge:review:advisories:local -- --space-slug genius
```

Com `--apply`, apenas quando houver allowlist implementada no script ou mecanismo equivalente para limitar o lote piloto.

## Comandos proibidos ate aprovacao

```powershell
npm run knowledge:import:octadesk:local -- --space-slug genius --apply
npm run knowledge:review:advisories:local -- --space-slug genius --apply
```

Tambem fica proibido publicar qualquer artigo diretamente sem passar por draft, advisory, revisao humana e QA publico.
