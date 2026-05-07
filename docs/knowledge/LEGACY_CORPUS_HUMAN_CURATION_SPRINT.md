# LEGACY_CORPUS_HUMAN_CURATION_SPRINT.md

## Objetivo
Transformar a auditoria do corpus legado em uma sprint documental de curadoria humana, com foco em:
- reescrita editorial dos candidatos a publico
- consolidacao manual das duplicidades reais
- normalizacao definitiva da taxonomia antes de qualquer novo lote de publicacao publica

Esta sprint nao publica artigo, nao altera runtime e nao cria contrato novo. Ela organiza o trabalho humano necessario para o proximo ciclo editorial.

## Premissas desta sprint
- o corpus auditado continua preservado em `raw_knowledge/octadesk_export/latest/`
- o backlog por artigo continua referenciado por `docs/reports/KNOWLEDGE_LEGACY_CURATION_BACKLOG.md`
- a auditoria consolidada continua registrada em `docs/reports/LEGACY_CORPUS_EDITORIAL_AUDIT.md`
- conteudo legado nao pode virar publico por heuristica
- deduplicacao continua manual e operacional
- publicacao publica continua bloqueada sem curadoria humana

## Taxonomia publica definitiva recomendada

### 1. Primeiros passos
Definicao:
- orientacoes iniciais de uso e operacao sem segredo, setup tecnico sensivel ou dependencia forte de UI interna

Entra:
- aprovacoes iniciais de solicitacao
- comunicacao basica com o cliente dentro do fluxo

Nao entra:
- parametrizacao geral
- regras internas de permissao
- trilhas de estorno automatico

### 2. Operacao de trocas e devolucoes
Definicao:
- configuracoes e orientacoes operacionais que ajudam o cliente B2B a conduzir trocas, devolucoes, motivos e excecoes sem expor regra interna sensivel

Entra:
- motivos de troca ou devolucao
- aprovacao de itens
- regras por motivo
- orientacoes de SKU quando reescritas em linguagem segura

Nao entra:
- calculo financeiro de estorno
- trilhas com dependencia de seller principal

### 3. Logistica reversa e postagem
Definicao:
- orientacoes operacionais sobre reversa, prazo logistico e excecoes de postagem, desde que nao dependam de credencial, contrato externo ou detalhe tecnico interno

Entra:
- prazo logistico por estado, se reescrito
- pendencias operacionais de reversa, se saneadas

Nao entra:
- API dos Correios
- troubleshooting de autorizacao
- contrato do Correios

### 4. Integracoes
Definicao:
- camada publica futura apenas para guias seguros de preparacao e entendimento de integracoes, sem credenciais, permissao ou endpoint

Entra:
- orientacoes conceituais de preparo, se existirem em versao reescrita e aprovada

Nao entra:
- permissoes Shopify, VTEX, TrayCorp
- setup com API
- manutencao de contrato dos Correios

### 5. Estornos e reembolsos
Definicao:
- politica operacional explicada em linguagem segura, separada de configuracao financeira interna

Entra:
- somente artigos reescritos sobre politica ou regra geral aprovada

Nao entra:
- automacao de estorno
- PIX
- limite maximo
- valor manual
- configuracao interna de vale-compra

### 6. Erros conhecidos e troubleshooting
Definicao:
- incidentes ou falhas recorrentes que possam ser explicados sem expor detalhe tecnico interno, credencial ou dependencia contratual sensivel

Entra:
- erros operacionais simples e saneados

Nao entra:
- erros de autorizacao de integracao
- erro de postagem dependente de contrato e credencial

## Criterios finais para publico vs interno

### Um artigo pode seguir para trilha publica quando:
- o titulo puder ser reescrito em linguagem B2B clara
- o corpo nao depender de caminho tecnico interno como `Configurações > Ambiente > ...`
- nao houver credencial, permissao, API, token, contrato externo ou regra operacional sensivel
- o artigo fizer sentido para um cliente B2B da Genius/Confi, nao para consumidor final
- suporte/CS validar a recorrencia do tema
- quando necessario, produto ou engenharia validarem aderencia funcional

### Um artigo deve permanecer interno ou bloqueado quando:
- expuser setup tecnico ou detalhe de backoffice
- tratar de estorno automatico, PIX, contrato logístico ou integracao sensivel
- depender fortemente de UI legada
- tiver tom B2C, SAC ou consumidor final
- misturar governanca interna com orientacao publica

## Matriz editorial priorizada

Legenda:
- prioridade `P0`: primeiro lote de curadoria humana
- prioridade `P1`: consolidar ou revisar antes de pensar em publico
- prioridade `P2`: manter fora da primeira sprint de reescrita

| Título original | Categoria original | Risco editorial | Destino recomendado | Categoria pública proposta | Prioridade | Revisão técnica | Revisão suporte/CS | Observação curta |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Configuração de Sellers Permitidos | Configurações / Sellers e Loja Fisica | medio | manter interno | - | P2 | nao | sim | governanca de seller/loja |
| Sellers Permitidos para Criar Vale-Compras | Configurações / Sellers e Loja Fisica | medio | manter interno | - | P2 | nao | sim | governanca de seller/loja |
| Regras de Cadastro e configurações de Sellers( Estorno e Logística) | Configurações / Sellers e Loja Fisica | medio | manter interno | - | P2 | nao | sim | governanca de seller/loja |
| Como cadastrar Lojas Físicas | Configurações / Sellers e Loja Fisica | medio | manter interno | - | P2 | nao | sim | governanca de seller/loja |
| Configurando parametrização geral | Configurações / Configuração de ambiente | alto | arquivar como legado | - | P1 | sim | nao | naming legado ou UI antiga |
| Como configurar o cálculo do estorno | Configurações / Configuração de ambiente | alto | revisar tecnicamente antes de decidir | Estornos e reembolsos | P1 | sim | sim | politica financeira ou operacional |
| Como automatizar o pagamento de Estorno e Vale-Compra | Configurações / Configuração de ambiente | alto | revisar tecnicamente antes de decidir | Estornos e reembolsos | P1 | sim | sim | politica financeira ou operacional |
| Valor Manual para Estorno Automático | Configurações / Configuração de ambiente | alto | revisar tecnicamente antes de decidir | Estornos e reembolsos | P1 | sim | sim | politica financeira ou operacional |
| Formas de estorno por motivo | Configurações / Configuração de ambiente | alto | consolidar com artigo existente | Estornos e reembolsos | P0 | sim | sim | cluster de estorno a consolidar |
| Limitando o Valor Máximo de um Estorno | Configurações / Configuração de ambiente | alto | revisar tecnicamente antes de decidir | Estornos e reembolsos | P1 | sim | sim | politica financeira ou operacional |
| Como configurar as formas de Estorno | Configurações / Configuração de ambiente | alto | consolidar com artigo existente | Estornos e reembolsos | P0 | sim | sim | duplicidade confirmada |
| Como configurar os textos do Front | Configurações / Configuração de ambiente | alto | arquivar como legado | - | P1 | sim | nao | naming legado ou UI antiga |
| Como informar a SKU durantge a troca | Configurações / Configuração de ambiente | medio | reescrever para público | Operação de trocas e devoluções | P0 | nao | sim | ajustar ortografia, foco B2B e linguagem |
| Regra de Exceção para Motivos - Não Gerar Logística Reversa | Configurações / Configuração de ambiente | medio | manter interno | Logística reversa e postagem | P2 | nao | sim | depende de regra interna |
| Como automatizar a conclusão de uma solicitação | Configurações / Configuração de ambiente | medio | manter interno | - | P2 | nao | sim | automacao interna de fluxo |
| Como Configurar o Prazo Logístico por Estado? | Configurações / Configuração de ambiente | medio | manter interno | Logística reversa e postagem | P2 | nao | sim | depende de regra operacional e UI interna |
| Como o consumidor solicita uma reversa | Configurações / Configuração de ambiente | alto | arquivar como legado | - | P1 | nao | sim | tom B2C e dependencia de front legado |
| Como realizar alterações em um Vale-compra pendente? | Configurações / Configuração de ambiente | alto | revisar tecnicamente antes de decidir | Estornos e reembolsos | P1 | sim | sim | fluxo financeiro interno |
| Regra para segunda solicitação | Configurações / Configuração de ambiente | medio | manter interno | - | P2 | nao | sim | regra de negocio interna |
| Como alterar ou aprovar os produtos de uma solicitação? | Configurações / Configuração de ambiente | medio | reescrever para público | Primeiros passos | P0 | nao | sim | alto valor recorrente e baixo risco |
| Posso alterar o status de uma solicitação? | Configurações / Configuração de ambiente | medio | manter interno | - | P2 | nao | sim | depende de governanca operacional interna |
| Configurando a funcionalidade Fique com o Item | Configurações / Configuração de ambiente | medio | manter interno | - | P2 | nao | sim | precisa validar aderencia atual do fluxo |
| Reenviar um e-mail ao consumidor | Configurações / Configuração de ambiente | medio | reescrever para público | Operação de trocas e devoluções | P0 | nao | sim | reescrever sem tom B2C |
| Como configurar o BlockList? | Configurações / Configuração de ambiente | alto | arquivar como legado | - | P1 | sim | nao | naming legado ou UI antiga |
| Como cadastrar os e-mails para notificações automáticas | Configurações / Configuração de ambiente | medio | manter interno | - | P2 | nao | sim | configuracao interna |
| Como configurar a cor exibida nos filtros básicos das solicitações | Configurações / Configuração de ambiente | medio | manter interno | - | P2 | nao | sim | configuracao de UI interna |
| Como configurar o Vale-Compras(Retenção) | Configurações / Configuração de ambiente | alto | revisar tecnicamente antes de decidir | Estornos e reembolsos | P1 | sim | sim | regra financeira interna |
| Configurar padrões de segurança | Configurações / Configuração de ambiente | alto | arquivar como legado | - | P1 | sim | nao | naming legado ou tema interno |
| Configurando as Formas de Estorno | Configurações / Configuração de ambiente | alto | consolidar com artigo existente | Estornos e reembolsos | P0 | sim | sim | duplicidade confirmada |
| Criar Lojas Virtuais | Configurações / Configuração de ambiente | medio | manter interno | - | P2 | nao | sim | governanca de conta/loja |
| Operações permitidas durante a criação de sua solicitação | Configurações / Configuração de ambiente | medio | manter interno | - | P2 | nao | sim | depende de regras internas de fluxo |
| Pedidos pagos com vale-compras | Configurações / Configuração de ambiente | alto | revisar tecnicamente antes de decidir | Estornos e reembolsos | P1 | sim | sim | impacto financeiro |
| Produtos em Exceção | Configurações / Configuração de ambiente | medio | manter interno | - | P2 | nao | sim | regra operacional interna |
| Variação do Produto | Configurações / Configuração de ambiente | medio | manter interno | - | P2 | nao | sim | depende de contexto de catalogo e UI |
| MODO SAC | Configurações / Configuração de ambiente | alto | arquivar como legado | - | P1 | sim | nao | naming desalinhado ao produto atual |
| Posso alterar a forma de reembolso do meu consumidor? | Configurações / Configuração de ambiente | alto | revisar tecnicamente antes de decidir | Estornos e reembolsos | P1 | sim | sim | tom B2C e regra financeira |
| Posso alterar o e-mail e o endereço da solicitação? | Configurações / Configuração de ambiente | medio | manter interno | Logística reversa e postagem | P2 | nao | sim | regra operacional interna |
| Posso enviar uma notificação de análise ao cliente? | Configurações / Configuração de ambiente | medio | reescrever para público | Primeiros passos | P0 | nao | sim | orientacao clara e recorrente |
| Posso filtrar as solicitações de reversas? | Configurações / Configuração de ambiente | medio | manter interno | - | P2 | nao | sim | depende de UI interna |
| Política para estorno do frete | Configurações / Configuração de ambiente | alto | revisar tecnicamente antes de decidir | Estornos e reembolsos | P1 | sim | sim | politica financeira sensivel |
| Como configurar o estorno automatico via pix | Configurações / Configuração de ambiente | alto | revisar tecnicamente antes de decidir | Estornos e reembolsos | P1 | sim | sim | risco financeiro e PIX |
| Como cadastrar motivos para troca ou devolução | Configurações / Configuração de ambiente | medio | reescrever para público | Operação de trocas e devoluções | P0 | nao | sim | alto valor e baixa exposicao tecnica |
| Criando e atualizando o cadastro | Configurações / Configuração de ambiente | alto | arquivar como legado | - | P1 | sim | nao | amplo demais e legado |
| Como criar um usuario | Configurações / Configuração de ambiente | alto | arquivar como legado | - | P1 | sim | nao | administracao interna e permissao |
| Regra por motivo | Configurações / Configuração de ambiente | medio | reescrever para público | Operação de trocas e devoluções | P0 | nao | sim | exige reescrita editorial curta |
| Como atualizar os dados de integrações do e-commerce | Cadastros / Integração e atualização | alto | arquivar como legado | - | P1 | sim | nao | alta chance de obsolescencia e trilha tecnica |
| Permissões Vtex | Cadastros / Integração e atualização | alto | bloquear por risco | - | P0 | sim | nao | conteudo tecnico e sensivel |
| Permissões Shopify | Cadastros / Integração e atualização | alto | bloquear por risco | - | P0 | sim | nao | conteudo tecnico e sensivel |
| Permissões TrayCorp | Cadastros / Integração e atualização | alto | bloquear por risco | - | P0 | sim | nao | conteudo tecnico e sensivel |
| Intalação e integração Nuvemshop | Cadastros / Integração e atualização | alto | bloquear por risco | - | P0 | sim | nao | setup tecnico e linguagem legada |
| Integração e configuração com os Correios | Cadastros / Integração e atualização | alto | bloquear por risco | - | P0 | sim | nao | depende de contrato e setup tecnico |
| Habilitar a API de Logística Reversa do Correios | Cadastros / Integração e atualização | alto | bloquear por risco | Logística reversa e postagem | P0 | sim | nao | API e dependencia contratual |
| Erros na integração do contrato do Correios | Cadastros / Integração e atualização | alto | revisar tecnicamente antes de decidir | Erros conhecidos e troubleshooting | P1 | sim | sim | troubleshooting restrito |
| Pendência de Logística Reversa | Erros comuns e soluções / Erros e pendências | alto | revisar tecnicamente antes de decidir | Logística reversa e postagem | P1 | sim | sim | pode virar troubleshooting publico so apos saneamento |
| Erro ao Tentar Realizar o Estorno | Erros comuns e soluções / Erros e pendências | alto | revisar tecnicamente antes de decidir | Erros conhecidos e troubleshooting | P1 | sim | sim | ligado a regra financeira |
| Erro "Não Autorizado" ao Gerar Código de postagem | Erros comuns e soluções / Erros e pendências | alto | revisar tecnicamente antes de decidir | Erros conhecidos e troubleshooting | P1 | sim | sim | depende de contrato e autorizacao |
| Erro no CEP ou Endereço Incorreto | Erros comuns e soluções / Erros e pendências | medio | revisar tecnicamente antes de decidir | Erros conhecidos e troubleshooting | P1 | sim | sim | candidato futuro apos saneamento |
| Erro de autorização ao acessar pedidos na Vtex | Erros comuns e soluções / Erros e pendências | alto | revisar tecnicamente antes de decidir | Erros conhecidos e troubleshooting | P1 | sim | sim | integracao sensivel |

## Primeiro lote priorizado de curadoria humana

### Lote seguro recomendado
1. `Como alterar ou aprovar os produtos de uma solicitação?`
2. `Como cadastrar motivos para troca ou devolução`
3. `Como informar a SKU durantge a troca`
4. `Posso enviar uma notificação de análise ao cliente?`
5. `Reenviar um e-mail ao consumidor`
6. `Regra por motivo`

### Motivo da priorizacao
- sao temas recorrentes na operacao do cliente B2B
- nao dependem diretamente de token, endpoint, credencial ou contrato externo
- podem ser reescritos sem prometer funcionalidade inexistente
- ajudam a estruturar as categorias `Primeiros passos` e `Operação de trocas e devoluções`
- permitem testar o padrao editorial da camada publica sem abrir trilhas de alto risco

### Risco do lote inicial
- risco predominante: `medio`
- principal cuidado: retirar tom B2C, remover dependencia de menu interno e padronizar a linguagem para cliente B2B Genius/Confi

### Revisao necessaria antes de qualquer publicacao
- revisao editorial humana
- revisao suporte/CS para validar recorrencia e clareza operacional
- conferência final de aderencia com produto atual

## Consolidacao manual das duplicidades reais

### Duplicidade confirmada
Artigos envolvidos:
- `Como configurar as formas de Estorno`
- `Configurando as Formas de Estorno`

### Artigo canônico proposto
- titulo seguro sugerido: `Formas de estorno disponíveis na operação`
- categoria publica sugerida: `Estornos e reembolsos`
- destino dos artigos atuais:
  - manter um como base canônica de curadoria
  - arquivar o outro como duplicado legado

### Pontos que exigem revisao antes de qualquer promocao
- separar politica operacional de configuracao interna
- validar se o texto pode existir sem expor menu interno nem detalhe financeiro sensivel
- revisar com suporte/CS a terminologia de reembolso, estorno e vale-compra
- revisar tecnicamente se qualquer trecho depende de regra de PIX, conta bancaria ou automacao

## Clusters candidatos mapeados sem consolidacao automatica

### Cluster: estorno e reembolso
- `Como configurar o cálculo do estorno`
- `Como automatizar o pagamento de Estorno e Vale-Compra`
- `Valor Manual para Estorno Automático`
- `Formas de estorno por motivo`
- `Limitando o Valor Máximo de um Estorno`
- `Política para estorno do frete`
- `Como configurar o estorno automatico via pix`
- `Pedidos pagos com vale-compras`

Decisao sugerida:
- nao consolidar nesta fase
- quebrar entre politica publica, regra financeira interna e automacao restrita

### Cluster: integrações e Correios
- `Como atualizar os dados de integrações do e-commerce`
- `Intalação e integração Nuvemshop`
- `Integração e configuração com os Correios`
- `Habilitar a API de Logística Reversa do Correios`
- `Erros na integração do contrato do Correios`
- `Erro de autorização ao acessar pedidos na Vtex`

Decisao sugerida:
- manter bloqueado ou restrito
- tratar como trilha tecnica, nao como lote publico

### Cluster: sellers e operação de loja
- `Configuração de Sellers Permitidos`
- `Sellers Permitidos para Criar Vale-Compras`
- `Regras de Cadastro e configurações de Sellers( Estorno e Logística)`
- `Como cadastrar Lojas Físicas`
- `Criar Lojas Virtuais`

Decisao sugerida:
- manter interno por enquanto
- revisar separadamente governanca de seller, governanca de loja e regra financeira

## Exemplos de reescrita editorial

### Exemplo 1
- titulo legado: `Como alterar ou aprovar os produtos de uma solicitação?`
- titulo publico sugerido: `Como revisar os itens de uma solicitação`
- categoria legado: `Configurações / Configuração de ambiente`
- categoria publica sugerida: `Primeiros passos`
- resumo publico seguro:
  - `Entenda quando revisar os itens enviados em uma solicitação e como manter o fluxo operacional consistente antes de seguir para a próxima etapa.`

### Exemplo 2
- titulo legado: `Como cadastrar motivos para troca ou devolução`
- titulo publico sugerido: `Como organizar motivos de troca e devolução na operação`
- categoria legado: `Configurações / Configuração de ambiente`
- categoria publica sugerida: `Operação de trocas e devoluções`
- resumo publico seguro:
  - `Veja como estruturar motivos de troca e devolução de forma clara para apoiar a triagem e a comunicação com o cliente.`

### Exemplo 3
- titulo legado: `Reenviar um e-mail ao consumidor`
- titulo publico sugerido: `Reenviar uma comunicação ao cliente`
- categoria legado: `Configurações / Configuração de ambiente`
- categoria publica sugerida: `Operação de trocas e devoluções`
- resumo publico seguro:
  - `Saiba quando reenviar uma comunicação operacional ao cliente e quais cuidados tomar para manter o histórico consistente.`

### Exemplo 4
- titulo legado: `Como informar a SKU durantge a troca`
- titulo publico sugerido: `Como orientar o envio de SKU em uma troca`
- categoria legado: `Configurações / Configuração de ambiente`
- categoria publica sugerida: `Operação de trocas e devoluções`
- resumo publico seguro:
  - `Entenda em quais cenários a SKU precisa ser informada e como orientar esse passo sem expor regra interna de configuração.`

## O que não pode ser publicado sem revisão
- integrações sensíveis
- permissões por plataforma
- artigos com API, endpoint, credencial ou setup técnico
- estornos e reembolsos com risco operacional ou financeiro
- PIX, vale-compra, limite de estorno e automação financeira
- Correios e postagem quando houver dependência de contrato, autorização ou trilha técnica
- conteúdo que dependa de UI antiga, naming legado ou menus internos
- material com tom B2C, SAC ou foco em consumidor final
- material interno de operação, governança de loja, seller ou backoffice

## Sequencia operacional sugerida
1. Revisar e aprovar a taxonomia final.
2. Abrir uma fila humana apenas para o lote `P0`.
3. Consolidar a duplicidade confirmada de estorno antes de qualquer reescrita desse tema.
4. Isolar clusters de alto risco em trilha interna/restrita.
5. So depois iniciar um novo lote de publicacao publica.

## Desdobramento da primeira leva P0
As versoes candidatas da primeira sprint manual de reescrita ficaram registradas em:
- `docs/knowledge/LEGACY_CORPUS_P0_REWRITE_CANDIDATES.md`

O gate humano formal de elegibilidade da leva `P0` ficou registrado em:
- `docs/knowledge/KNOWLEDGE_P0_HUMAN_REVIEW_GATE.md`

O pacote documental de pre-publicacao dos quatro artigos `P0` elegiveis com ajustes ficou registrado em:
- `docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md`
