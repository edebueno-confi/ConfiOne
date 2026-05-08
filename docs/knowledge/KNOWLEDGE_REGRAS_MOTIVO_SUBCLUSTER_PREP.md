# Knowledge Regras Motivo Subcluster Prep

## Objetivo

- preparar a trilha editorial do subcluster `Regras e políticas por motivo`
- separar o que pode virar orientação pública futura, o que deve permanecer interno e o que exige revisão técnica, financeira ou logística
- impedir que o tema seja absorvido de forma simplista pelo canônico `Formas de estorno disponíveis na operação`

## Estado atual

- nenhum artigo foi aprovado
- nenhuma aprovação foi simulada
- nenhum artigo foi publicado
- o subcluster continua dependente de revisão humana, operacional e técnica antes de qualquer reescrita pública

## Artigos fonte analisados

### 1. Regra por motivo
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-regra-por-motivo`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - habilita uma regra específica apenas para um motivo já cadastrado
- tema principal:
  - associação entre motivo e regra operacional
- público-alvo provável:
  - operação interna
- risco editorial:
  - `médio`
- risco técnico:
  - `médio`
- risco financeiro/operacional:
  - `médio`
- risco logístico:
  - `médio`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- observação objetiva:
  - o artigo é abstrato demais e não explica qual regra está sendo ativada nem seus impactos

### 2. Formas de estorno por motivo
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-formas-de-estorno-por-motivo`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - define concorrência entre estorno financeiro e vale-compra de acordo com o motivo da solicitação
- tema principal:
  - relação entre motivo e forma de estorno
- público-alvo provável:
  - operação interna e configuração funcional
- risco editorial:
  - `médio`
- risco técnico:
  - `alto`
- risco financeiro/operacional:
  - `alto`
- risco logístico:
  - `baixo`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- observação objetiva:
  - é o ponto em que o subcluster passa a tocar diretamente política financeira e concorrência com vale-compra

### 3. Como cadastrar motivos para troca ou devolução
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-cadastrar-motivos-para-troca-ou-devolucao`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - cadastra motivos e classifica como troca ou devolução
- tema principal:
  - base de taxonomia operacional de motivos
- público-alvo provável:
  - cliente B2B responsável pela operação
- risco editorial:
  - `baixo`
- risco técnico:
  - `baixo`
- risco financeiro/operacional:
  - `baixo`
- risco logístico:
  - `baixo`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- observação objetiva:
  - é o artigo mais próximo de uma futura orientação pública, desde que fique restrito ao cadastro e à organização dos motivos

### 4. Regra de Exceção para Motivos - Não Gerar Logística Reversa
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-regra-de-excecao-para-motivos-nao-gerar-logistica-reversa`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - impede geração automática de logística reversa para certos motivos e exige gestão manual posterior
- tema principal:
  - exceção logística associada ao motivo
- público-alvo provável:
  - operação interna e SAC
- risco editorial:
  - `alto`
- risco técnico:
  - `alto`
- risco financeiro/operacional:
  - `médio`
- risco logístico:
  - `alto`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- observação objetiva:
  - é tema fortemente operacional e expõe fluxo manual, filtros internos e comportamento de autorização postal

### 5. Política para estorno do frete
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-politica-para-estorno-do-frete`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - define se e como o frete será estornado em devolução, inclusive dependendo do motivo
- tema principal:
  - política financeira e comercial aplicada ao frete
- público-alvo provável:
  - operação interna e financeiro operacional
- risco editorial:
  - `alto`
- risco técnico:
  - `médio`
- risco financeiro/operacional:
  - `alto`
- risco logístico:
  - `médio`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- observação objetiva:
  - cruza motivo, frete e política comercial; não deve ser tratado como FAQ pública simples

### 6. Como configurar o cálculo do estorno
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-configurar-o-calculo-do-estorno`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - escolhe entre cálculo padrão ou proporcional de estorno
- tema principal:
  - cálculo financeiro do estorno
- público-alvo provável:
  - operação interna e Produto
- risco editorial:
  - `alto`
- risco técnico:
  - `alto`
- risco financeiro/operacional:
  - `alto`
- risco logístico:
  - `baixo`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `não`
- observação objetiva:
  - só entra neste subcluster como impacto indireto, quando uma regra por motivo pode depender do tipo de cálculo

### 7. Limitando o Valor Máximo de um Estorno
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-limitando-o-valor-maximo-de-um-estorno`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - define teto percentual para estorno
- tema principal:
  - limite financeiro do estorno
- público-alvo provável:
  - operação interna e Produto
- risco editorial:
  - `alto`
- risco técnico:
  - `alto`
- risco financeiro/operacional:
  - `alto`
- risco logístico:
  - `baixo`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `não`
- observação objetiva:
  - entra no subcluster apenas como dependência indireta de política por motivo; não deve ser misturado com orientação pública de motivos

## Temas internos do subcluster

### Cadastro de motivos de troca ou devolução
- artigos relacionados:
  - `Como cadastrar motivos para troca ou devolução`
- leitura editorial:
  - tema-base de classificação operacional, com potencial público futuro

### Regras associadas ao motivo
- artigos relacionados:
  - `Regra por motivo`
  - `Formas de estorno por motivo`
- leitura editorial:
  - tema de política operacional que só pode ficar público se houver abstração segura

### Exceções por motivo
- artigos relacionados:
  - `Regra de Exceção para Motivos - Não Gerar Logística Reversa`
- leitura editorial:
  - tema interno com forte dependência de processo manual

### Bloqueio ou geração de logística reversa
- artigos relacionados:
  - `Regra de Exceção para Motivos - Não Gerar Logística Reversa`
- leitura editorial:
  - impacto logístico e de atendimento; não deve ser simplificado como FAQ geral

### Relação entre motivo e forma de estorno
- artigos relacionados:
  - `Formas de estorno por motivo`
  - `Regra por motivo`
- leitura editorial:
  - mistura forma financeira com política operacional

### Relação entre motivo e frete
- artigos relacionados:
  - `Política para estorno do frete`
- leitura editorial:
  - tema comercial e financeiro dependente de política da conta

### Relação entre motivo e cálculo ou limite de estorno
- artigos relacionados:
  - `Como configurar o cálculo do estorno`
  - `Limitando o Valor Máximo de um Estorno`
- leitura editorial:
  - dependência indireta; deve ficar fora da futura orientação pública de motivos

### Diferença entre orientação pública e regra interna de operação
- leitura editorial:
  - o que o cliente B2B pode entender sobre organização de motivos é diferente do que a operação configura em exceções, cálculo, frete e logística reversa

## Fronteiras editoriais

### O que pode ser orientação pública futura
- organização e cadastro de motivos de troca e devolução
- explicação conceitual de que motivos ajudam a padronizar a operação

### O que deve permanecer interno
- regra por motivo sem explicação do efeito real
- exceções que exigem ação manual da operação
- filtros internos, símbolos e fluxo de autorização manual

### O que exige revisão técnica
- concorrência entre estorno financeiro e vale-compra por motivo
- qualquer dependência entre motivo e cálculo de estorno
- qualquer limite financeiro atrelado ao motivo

### O que exige validação financeira/operacional
- política de estorno do frete
- política de reembolso por motivo
- combinação entre motivo e forma financeira

### O que exige validação logística
- bloqueio ou geração de logística reversa
- autorização de postagem manual
- impacto de exceções sobre o fluxo operacional

### O que não deve ser misturado com o canônico de formas de estorno
- regra específica por motivo
- concorrência entre estorno e vale-compra
- exceção logística

### O que não deve ser misturado com Pix e estorno
- gateway, automação e estorno via Pix

### O que não deve ser misturado com vale-compra e crédito
- retenção, crédito e emissão de vale

### O que não deve ser misturado com cálculo e limites de estorno
- cálculo padrão/proporcional
- teto percentual de estorno

### O que não deve ser misturado com integrações/gateway
- permissões e dependências externas de plataforma

## Matriz de possíveis artigos canônicos futuros

| Título candidato | Categoria pública | Subcategoria futura opcional | Prioridade | Escopo | Fora de escopo | Bloqueadores | Validação necessária | Pode avançar para reescrita agora |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Como organizar motivos de troca e devolução na operação | Operação de trocas e devoluções | Motivos de troca | P0 | cadastro, classificação e uso operacional de motivos | exceções, logística reversa, frete, forma de estorno, cálculo e limite | aprovação humana ainda pendente do artigo base já existente | Produto + Suporte/CS | sim |
| Como os motivos influenciam a política de devolução | Operação de trocas e devoluções | Motivos de troca | P1 | visão conceitual de que motivos afetam decisões operacionais | configuração técnica, frete, cálculo, Pix e vale-compra | legado muito acoplado a regra interna | Produto + Suporte/CS | não |
| Quando uma exceção de motivo deve bloquear a logística reversa | Logística reversa e postagem | Autorização de postagem | backlog | visão operacional das exceções logísticas por motivo | filtros internos, SAC, fluxos manuais e e-ticket | risco logístico alto | Produto + Suporte/CS | não |
| Como as regras por motivo afetam o estorno | Estornos e reembolsos | Políticas de estorno | P1 | relação entre motivo e forma de estorno | cálculo, limite, Pix, vale-compra e política de frete detalhada | política financeira e operacional ainda ambígua | Produto + Suporte/CS | não |
| Como a política de frete se relaciona com o motivo da devolução | Estornos e reembolsos | Políticas de estorno | backlog | visão de alto nível sobre frete em devolução | valores, desconto, cálculo e regra comercial detalhada | risco financeiro e comercial alto | Produto + Suporte/CS | não |

## Recomendação do subcluster

- classificação recomendada:
  - `candidato parcial a público`

### Justificativa
- existe um núcleo com potencial público claro:
  - cadastro e organização de motivos
- mas o restante do subcluster mistura:
  - política de frete
  - forma de estorno
  - exceção logística
  - cálculo e limite financeiro
- por isso, o subcluster não pode ser liberado como bloco único; ele precisa ser fracionado entre parte pública futura e parte interna ou técnica

## Decisão desta fase

- o subcluster `Regras e políticas por motivo` foi preparado documentalmente
- nenhum artigo foi reescrito por completo
- nenhum artigo foi aprovado
- nenhuma aprovação foi simulada
- nenhum artigo foi publicado

## Vinculo com reescrita publica segura

- a versao candidata do recorte publico seguro de motivos ficou registrada em:
  - `docs/knowledge/KNOWLEDGE_MOTIVOS_TROCA_DEVOLUCAO_REWRITE.md`
- essa reescrita cobre apenas:
  - cadastro e organizacao de motivos
  - diferenca de alto nivel entre troca e devolucao
  - uso operacional nao tecnico dos motivos
- continuam fora da reescrita:
  - regras internas por motivo
  - excecoes logisticas
  - politicas de frete
  - calculo, limite e forma de estorno
