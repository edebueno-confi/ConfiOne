# Octadesk Article Taxonomy Remap

Data: 2026-05-21

## Atualizacao de execucao - 2026-05-21

A taxonomia Genius B2B foi criada no Knowledge local e aplicada aos 54 artigos Octadesk como metadado editorial/admin, sem republicar o corpus.

Distribuicao apos remap local:

| Categoria Genius | Artigos Octadesk |
| --- | ---: |
| Operacao de trocas e devolucoes | 11 |
| Reembolsos, estornos e vale-compras | 11 |
| Configuracoes da plataforma | 7 |
| Integrações e permissões | 6 |
| Correios e logística reversa | 8 |
| Notificações e comunicação | 4 |
| Sellers e lojas físicas | 5 |
| Primeiros passos | 2 |

Observacao: artigos restritos continuam restritos; a mudança foi de organizacao editorial e nao de publicacao.

Escopo: proposta de remapeamento editorial. Nenhum artigo foi alterado nesta rodada.

## Diagnostico

A taxonomia original Octadesk tinha 3 categorias e 4 secoes. Ela era funcional para a base antiga, mas nao e adequada como taxonomia publica Genius porque concentra 45 de 58 artigos em Configuracoes.

No runtime atual, 43 artigos Octadesk estao publicados e 37 deles aparecem em `Configuração de ambiente`. A correcao necessaria e criar uma camada de taxonomia Genius independente da estrutura antiga, preservando `source_path` e `source_hash` apenas como rastreabilidade.

## Taxonomia Genius alvo

| Categoria Genius | Objetivo | Prioridade |
| --- | --- | --- |
| Primeiros passos | Conceitos e configuracao inicial | Alta |
| Configuracoes da plataforma | Parametros administrativos gerais | Alta |
| Operacao de trocas e devolucoes | Execucao diaria das solicitacoes | Alta |
| Reembolsos, estornos e vale-compras | Regras financeiras e vale-compras | Alta |
| Integracoes e permissoes | Conexoes com ecommerce e autorizacoes | Media |
| Correios e logistica reversa | Contratos, postagem e reversa | Media |
| Sellers e lojas fisicas | Multi-seller, loja fisica e loja virtual | Media |
| Notificacoes e comunicacao | E-mails, textos e comunicacao com cliente | Alta |
| Erros comuns e solucoes | Troubleshooting seguro | Media |
| Boas praticas operacionais | Padroes de uso e recomendacoes | Baixa |
| Suporte no portal | Ajuda sobre a propria central e suporte | Media |

## Remapeamento proposto dos 58 artigos

| Artigo Octadesk | Origem | Assets | Categoria Genius sugerida | Decisao | Observacao |
| --- | --- | ---: | --- | --- | --- |
| Configuração de Sellers Permitidos | Configuracoes > Sellers e Loja Fisica | 3 | Sellers e lojas fisicas | Reprocessar com imagens | Tutorial depende de prints para clareza. |
| Sellers Permitidos para Criar Vale-Compras | Configuracoes > Sellers e Loja Fisica | 1 | Sellers e lojas fisicas | Reprocessar com imagens | Relaciona seller e vale-compras; revisar risco financeiro. |
| Regras de Cadastro e configurações de Sellers (Estorno e Logística) | Configuracoes > Sellers e Loja Fisica | 0 | Sellers e lojas fisicas | Manter restrito ate revisar | Mistura estorno e logistica. |
| Como cadastrar Lojas Físicas | Configuracoes > Sellers e Loja Fisica | 4 | Sellers e lojas fisicas | Reprocessar com imagens | Bom candidato publico apos assets. |
| Configurando parametrização geral | Configuracoes > Configuracao de ambiente | 9 | Primeiros passos | Reprocessar com imagens | Artigo guarda-chuva; precisa quebrar ou resumir. |
| Como configurar o cálculo do estorno | Configuracoes > Configuracao de ambiente | 1 | Reembolsos, estornos e vale-compras | Revisao pesada | Tema financeiro. |
| Como automatizar o pagamento de Estorno e Vale-Compra | Configuracoes > Configuracao de ambiente | 3 | Reembolsos, estornos e vale-compras | Revisao pesada | Risco operacional/financeiro. |
| Valor Manual para Estorno Automático | Configuracoes > Configuracao de ambiente | 1 | Reembolsos, estornos e vale-compras | Revisao pesada | Pode expor politica financeira. |
| Formas de estorno por motivo | Configuracoes > Configuracao de ambiente | 1 | Reembolsos, estornos e vale-compras | Consolidar duplicado | Possivel duplicidade com formas de estorno. |
| Limitando o Valor Máximo de um Estorno | Configuracoes > Configuracao de ambiente | 1 | Reembolsos, estornos e vale-compras | Revisao pesada | Tema financeiro sensivel. |
| Como configurar as formas de Estorno | Configuracoes > Configuracao de ambiente | 1 | Reembolsos, estornos e vale-compras | Consolidar duplicado | Consolidar com artigo equivalente. |
| Como configurar os textos do Front | Configuracoes > Configuracao de ambiente | 6 | Notificacoes e comunicacao | Reprocessar com imagens | Renomear para portal do cliente. |
| Como informar a SKU durantge a troca | Configuracoes > Configuracao de ambiente | 1 | Operacao de trocas e devolucoes | Corrigir titulo e reprocessar | Typo no titulo. |
| Regra de Exceção para Motivos - Não Gerar Logística Reversa | Configuracoes > Configuracao de ambiente | 5 | Correios e logistica reversa | Revisao pesada | Regra operacional com risco. |
| Como automatizar a conclusão de uma solicitação | Configuracoes > Configuracao de ambiente | 3 | Operacao de trocas e devolucoes | Reprocessar com imagens | Publicavel apos estrutura. |
| Como Configurar o Prazo Logístico por Estado? | Configuracoes > Configuracao de ambiente | 1 | Correios e logistica reversa | Reprocessar com imagens | Requer clareza por UF/prazo. |
| Como o consumidor solicita uma reversa | Configuracoes > Configuracao de ambiente | 9 | Operacao de trocas e devolucoes | Reescrever B2B | Trocar perspectiva do consumidor por loja. |
| Como realizar alterações em um Vale-compra pendente? | Configuracoes > Configuracao de ambiente | 1 | Reembolsos, estornos e vale-compras | Revisao pesada | Vale-compra pendente. |
| Regra para segunda solicitação | Configuracoes > Configuracao de ambiente | 1 | Operacao de trocas e devolucoes | Reprocessar com imagens | Publicavel se regra for explicada. |
| Como alterar ou aprovar os produtos de uma solicitação? | Configuracoes > Configuracao de ambiente | 1 | Operacao de trocas e devolucoes | Onda 0 | Ja revisado editorialmente; falta asset/estrutura. |
| Posso alterar o status de uma solicitação? | Configuracoes > Configuracao de ambiente | 2 | Operacao de trocas e devolucoes | Reprocessar com imagens | Publicavel apos validação visual. |
| Configurando a funcionalidade Fique com o Item | Configuracoes > Configuracao de ambiente | 1 | Operacao de trocas e devolucoes | Reprocessar com imagens | Pode ser publico com contexto. |
| Reenviar um e-mail ao consumidor | Configuracoes > Configuracao de ambiente | 1 | Notificacoes e comunicacao | Onda 0 | Ja revisado editorialmente; falta asset/estrutura. |
| Como configurar o BlockList? | Configuracoes > Configuracao de ambiente | 2 | Configuracoes da plataforma | Reprocessar com imagens | Validar sensibilidade de bloqueio. |
| Como cadastrar os e-mails para notificações automáticas | Configuracoes > Configuracao de ambiente | 3 | Notificacoes e comunicacao | Reprocessar com imagens | Bom candidato publico. |
| Como configurar a cor exibida nos filtros básicos das solicitações | Configuracoes > Configuracao de ambiente | 2 | Configuracoes da plataforma | Reprocessar com imagens | Baixo risco. |
| Como configurar o Vale-Compras(Retenção) | Configuracoes > Configuracao de ambiente | 3 | Reembolsos, estornos e vale-compras | Revisao pesada | Tema financeiro/retencao. |
| Configurar padrões de segurança | Configuracoes > Configuracao de ambiente | 3 | Configuracoes da plataforma | Revisar risco | Validar se nao expõe regra interna. |
| Configurando as Formas de Estorno | Configuracoes > Configuracao de ambiente | 1 | Reembolsos, estornos e vale-compras | Consolidar duplicado | Duplicidade exata/proxima. |
| Criar Lojas Virtuais | Configuracoes > Configuracao de ambiente | 3 | Sellers e lojas fisicas | Reprocessar com imagens | Bom candidato publico apos taxonomia. |
| Operações permitidas durante a criação de sua solicitação | Configuracoes > Configuracao de ambiente | 1 | Operacao de trocas e devolucoes | Reprocessar com imagens | Ajustar linguagem. |
| Pedidos pagos com vale-compras | Configuracoes > Configuracao de ambiente | 1 | Reembolsos, estornos e vale-compras | Revisao pesada | Tema financeiro. |
| Produtos em Exceção | Configuracoes > Configuracao de ambiente | 1 | Configuracoes da plataforma | Revisar risco | Pode ser publico com contexto. |
| Variação do Produto | Configuracoes > Configuracao de ambiente | 1 | Configuracoes da plataforma | Reprocessar com imagens | Baixo/medio risco. |
| MODO SAC | Configuracoes > Configuracao de ambiente | 2 | Operacao de trocas e devolucoes | Revisar linguagem | Nome e conceito precisam contexto B2B. |
| Posso alterar a forma de reembolso do meu consumidor? | Configuracoes > Configuracao de ambiente | 2 | Reembolsos, estornos e vale-compras | Revisao pesada | Financeiro e linguagem B2C. |
| Posso alterar o e-mail e o endereço da solicitação? | Configuracoes > Configuracao de ambiente | 3 | Operacao de trocas e devolucoes | Reprocessar com imagens | Bom candidato apos estrutura. |
| Posso enviar uma notificação de análise ao cliente? | Configuracoes > Configuracao de ambiente | 2 | Notificacoes e comunicacao | Onda 0 | Ja revisado editorialmente; falta asset/estrutura. |
| Posso filtrar as solicitações de reversas? | Configuracoes > Configuracao de ambiente | 1 | Operacao de trocas e devolucoes | Reprocessar com imagens | Publicavel apos estrutura. |
| Política para estorno do frete | Configuracoes > Configuracao de ambiente | 1 | Reembolsos, estornos e vale-compras | Revisao pesada | Politica financeira. |
| Como configurar o estorno automatico via pix | Configuracoes > Configuracao de ambiente | 1 | Reembolsos, estornos e vale-compras | Manter restrito ate revisar | PIX exige cautela. |
| Como cadastrar motivos para troca ou devolução | Configuracoes > Configuracao de ambiente | 2 | Configuracoes da plataforma | Reprocessar com imagens | Publicavel apos estrutura. |
| Criando e atualizando o cadastro | Configuracoes > Configuracao de ambiente | 3 | Primeiros passos | Reprocessar com imagens | Pode ser artigo introdutorio. |
| Como criar um usuario | Configuracoes > Configuracao de ambiente | 3 | Integracoes e permissoes | Manter restrito ate revisar | Permissao/acesso. |
| Regra por motivo | Configuracoes > Configuracao de ambiente | 1 | Configuracoes da plataforma | Onda 0 com decisao | Decidir se publico ou interno. |
| Como atualizar os dados de integrações do e-commerce | Cadastros > Integracao e atualizacao | 8 | Integracoes e permissoes | Reprocessar com imagens | Publicavel com cuidado. |
| Permissões Vtex | Cadastros > Integracao e atualizacao | 0 | Integracoes e permissoes | Manter restrito ate revisar | Permissoes tecnicas. |
| Permissões Shopify | Cadastros > Integracao e atualizacao | 0 | Integracoes e permissoes | Manter restrito ate revisar | Permissoes tecnicas. |
| Permissões TrayCorp | Cadastros > Integracao e atualizacao | 0 | Integracoes e permissoes | Manter restrito ate revisar | Permissoes tecnicas. |
| Intalação e integração Nuvemshop | Cadastros > Integracao e atualizacao | 0 | Integracoes e permissoes | Manter restrito ate revisar | Integracao; corrigir titulo. |
| Integração e configuração com os Correios | Cadastros > Integracao e atualizacao | 6 | Correios e logistica reversa | Manter restrito ate revisar | Correios/integracao. |
| Habilitar a API de Logística Reversa do Correios | Cadastros > Integracao e atualizacao | 2 | Correios e logistica reversa | Manter restrito ate revisar | API/credenciais potenciais. |
| Erros na integração do contrato do Correios | Cadastros > Integracao e atualizacao | 6 | Correios e logistica reversa | Manter restrito ate revisar | Contrato Correios e erros. |
| Pendência de Logística Reversa | Erros comuns e solucoes > Erros e pendencias | 1 | Erros comuns e solucoes | Reprocessar com imagens | Publicavel apos contexto. |
| Erro ao Tentar Realizar o Estorno | Erros comuns e solucoes > Erros e pendencias | 1 | Erros comuns e solucoes | Revisao pesada | Financeiro. |
| Erro "Não Autorizado" ao Gerar Código de postagem | Erros comuns e solucoes > Erros e pendencias | 2 | Correios e logistica reversa | Manter restrito ate revisar | Autorizacao/Correios. |
| Erro no CEP ou Endereço Incorreto | Erros comuns e solucoes > Erros e pendencias | 3 | Erros comuns e solucoes | Reprocessar com imagens | Bom candidato publico. |
| Erro de autorização ao acessar pedidos na Vtex | Erros comuns e solucoes > Erros e pendencias | 1 | Integracoes e permissoes | Manter restrito ate revisar | Autorizacao VTEX. |

## Distribuicao esperada apos remap

| Categoria Genius | Artigos estimados |
| --- | ---: |
| Primeiros passos | 2 |
| Configuracoes da plataforma | 8 |
| Operacao de trocas e devolucoes | 11 |
| Reembolsos, estornos e vale-compras | 13 |
| Integracoes e permissoes | 7 |
| Correios e logistica reversa | 6 |
| Sellers e lojas fisicas | 5 |
| Notificacoes e comunicacao | 4 |
| Erros comuns e solucoes | 3 |
| Boas praticas operacionais | 0 |
| Suporte no portal | 0 |

## Criterio de aceite para implementar o remap

- Nenhuma categoria publica com mais de 30% dos artigos publicados, salvo decisao explicita.
- Artigos de integracao, permissao, PIX, Correios e estorno passam por fila de risco.
- Todo artigo com asset e publicado deve ter imagem renderizavel ou decisao explicita de remover imagem.
- Artigos duplicados de estorno devem ser consolidados antes da republicacao.
- Titulos com typos devem ser corrigidos antes de voltarem ao publico.
