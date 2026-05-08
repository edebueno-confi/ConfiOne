# Knowledge Estorno Calculo Limites Subcluster Prep

## Objetivo

- preparar a trilha editorial do subcluster `Cálculo e limites de estorno`
- separar o que pode virar orientação pública futura, o que deve permanecer interno e o que exige revisão técnica ou financeira
- impedir que regras de cálculo e teto financeiro sejam absorvidas pelo canônico `Formas de estorno disponíveis na operação`

## Estado atual

- nenhum artigo foi aprovado
- nenhuma aprovação foi simulada
- nenhum artigo foi publicado
- o subcluster continua sensível demais para exposição pública sem validação forte de Produto e governança operacional

## Artigos fonte analisados

### 1. Como configurar o cálculo do estorno
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-configurar-o-calculo-do-estorno`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - permite escolher entre cálculo padrão e proporcional para definir o valor de estorno
- tema principal:
  - regra de cálculo financeiro do estorno
- público-alvo provável:
  - operação interna com validação de Produto
- risco editorial:
  - `alto`
- risco técnico:
  - `alto`
- risco financeiro/operacional:
  - `alto`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `não`
- observação objetiva:
  - o artigo já entra diretamente em política financeira e critério de cálculo, então não é candidato simples a help pública

### 2. Limitando o Valor Máximo de um Estorno
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-limitando-o-valor-maximo-de-um-estorno`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - define um teto percentual para o valor de estorno e permite desativar o limite deixando o campo em branco ou em zero
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
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `não`
- observação objetiva:
  - o artigo transforma política financeira em configuração operacional direta, com risco alto de orientar incorretamente o teto de reembolso

### 3. Política para estorno do frete
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-politica-para-estorno-do-frete`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - define se e como o frete será estornado, inclusive considerando motivo da devolução e eventuais descontos
- tema principal:
  - política comercial e financeira do frete no reembolso
- público-alvo provável:
  - operação interna e financeiro operacional
- risco editorial:
  - `alto`
- risco técnico:
  - `médio`
- risco financeiro/operacional:
  - `alto`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- observação objetiva:
  - o tema cruza política comercial, motivo e reembolso; não cabe como FAQ pública simples

### 4. Formas de estorno por motivo
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-formas-de-estorno-por-motivo`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - define qual política deve prevalecer quando houver concorrência entre estorno financeiro e vale-compra segundo o motivo
- tema principal:
  - política operacional de decisão financeira por motivo
- público-alvo provável:
  - operação interna e configuração funcional
- risco editorial:
  - `alto`
- risco técnico:
  - `alto`
- risco financeiro/operacional:
  - `alto`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- observação objetiva:
  - entra neste subcluster porque liga motivo à política de estorno, mas continua fortemente acoplado a regra interna

### 5. Regra por motivo
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-regra-por-motivo`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - habilita uma regra específica para um motivo já cadastrado
- tema principal:
  - acionamento operacional de regra vinculada a motivo
- público-alvo provável:
  - operação interna
- risco editorial:
  - `médio`
- risco técnico:
  - `médio`
- risco financeiro/operacional:
  - `médio`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- observação objetiva:
  - o artigo é genérico demais, mas precisa ser lido aqui porque pode servir de ponte para limite, cálculo ou política por motivo

### 6. Valor Manual para Estorno Automático
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-valor-manual-para-estorno-automatico`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - permite definir manualmente o valor do estorno automático para diferentes meios de pagamento
- tema principal:
  - ajuste manual de valor em automação de estorno
- público-alvo provável:
  - operação interna com validação de Produto
- risco editorial:
  - `alto`
- risco técnico:
  - `alto`
- risco financeiro/operacional:
  - `alto`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `não`
- observação objetiva:
  - combina automação, valor manual e meios de pagamento, ampliando risco de erro financeiro e técnico

## Temas internos do subcluster

### Cálculo de estorno
- artigos relacionados:
  - `Como configurar o cálculo do estorno`
- leitura editorial:
  - política financeira central, com impacto direto no valor devolvido

### Limite máximo de estorno
- artigos relacionados:
  - `Limitando o Valor Máximo de um Estorno`
- leitura editorial:
  - mecanismo de teto financeiro e governança de risco operacional

### Valor manual para estorno automático
- artigos relacionados:
  - `Valor Manual para Estorno Automático`
- leitura editorial:
  - ajuste manual em automação financeira, sensível demais para orientação pública simples

### Política para estorno do frete
- artigos relacionados:
  - `Política para estorno do frete`
- leitura editorial:
  - política comercial e financeira vinculada ao reembolso

### Relação com motivo da troca ou devolução
- artigos relacionados:
  - `Formas de estorno por motivo`
  - `Regra por motivo`
  - `Política para estorno do frete`
- leitura editorial:
  - o motivo atua como disparador de política, não apenas como classificação operacional

### Relação com forma de estorno
- artigos relacionados:
  - `Formas de estorno por motivo`
  - `Valor Manual para Estorno Automático`
- leitura editorial:
  - cálculo e valor não podem ser dissociados da forma financeira escolhida

### Exceções e limites financeiros
- artigos relacionados:
  - `Limitando o Valor Máximo de um Estorno`
  - `Política para estorno do frete`
  - `Como configurar o cálculo do estorno`
- leitura editorial:
  - tema de governança financeira e política comercial da conta

### Diferença entre explicação pública de alto nível e regra interna de cálculo
- leitura editorial:
  - uma help pública pode, no máximo, explicar que a conta possui políticas de reembolso próprias; a regra concreta de cálculo e limite deve continuar sob validação interna

## Fronteiras editoriais

### O que pode ser orientação pública futura
- explicação conceitual de que a operação pode adotar políticas diferentes de reembolso
- orientação de alto nível para revisar internamente a política da conta antes de alterar critérios financeiros

### O que deve permanecer interno
- escolha entre cálculo padrão e proporcional como instrução operacional pronta
- definição de teto percentual de estorno
- parametrização manual de valor automático por meio de pagamento
- política detalhada de estorno do frete

### O que exige revisão técnica
- qualquer explicação que relacione cálculo a automação de estorno
- qualquer instrução envolvendo valor manual
- qualquer dependência entre forma de estorno, motivo e critério de cálculo

### O que exige validação financeira/operacional
- limite máximo de estorno
- política de frete
- regra de cálculo proporcional
- qualquer exceção comercial ou desconto aplicado ao reembolso

### O que não deve ser misturado com o canônico de formas de estorno
- cálculo padrão ou proporcional
- limite percentual
- política financeira do frete

### O que não deve ser misturado com Pix e estorno
- valor manual em automação
- critérios financeiros de pagamento

### O que não deve ser misturado com Vale-compra e crédito
- concorrência entre crédito e estorno financeiro
- retenção e incentivo financeiro

### O que não deve ser misturado com Regras e políticas por motivo
- cadastro operacional de motivos
- exceções logísticas
- nomenclatura pública dos motivos

### O que não deve ser misturado com Integrações e gateway
- credenciais, permissões e comportamento externo de plataforma

### O que não deve ser misturado com Troubleshooting técnico
- falhas de autorização
- erros por status externo
- checklists de suporte para integração

## Matriz de possíveis artigos canônicos futuros

| Título candidato | Categoria pública | Subcategoria futura opcional | Prioridade | Escopo | Fora de escopo | Bloqueadores | Validação necessária | Pode avançar para reescrita agora |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Como revisar a política de reembolso da operação | Estornos e reembolsos | Políticas de estorno | backlog | visão conceitual de que a conta pode ter critérios próprios de reembolso | cálculo detalhado, limite, frete, automação e valores manuais | subcluster ainda excessivamente financeiro e técnico | Produto + Suporte/CS | não |
| Quando o cálculo de estorno exige revisão interna | Estornos e reembolsos | Políticas de estorno | backlog | alerta de governança para revisar critérios financeiros com o time responsável | regra concreta de cálculo, percentual, exemplos numéricos e descontos | risco financeiro alto | Produto | não |
| Como a política de frete impacta o reembolso | Estornos e reembolsos | Frete e estorno | backlog | explicação conceitual sobre relação entre frete e política de devolução | valores, descontos, motivo e regra comercial detalhada | cruza comercial, financeiro e motivo | Produto + Suporte/CS | não |
| Como limites financeiros de estorno devem ser governados | Estornos e reembolsos | Limites de estorno | backlog | visão de governança interna sobre teto de estorno | instrução de configuração, percentual exato e automação | não é help pública segura nesta fase | Produto | não |

## Recomendação do subcluster

- classificação recomendada:
  - `bloquear por risco`

### Justificativa
- o subcluster concentra:
  - política de cálculo
  - teto financeiro
  - valor manual
  - política de frete
  - concorrência entre formas de reembolso
- isso torna o tema mais próximo de governança financeira e configuração sensível do que de FAQ pública
- qualquer abertura futura deve nascer de recorte novo, muito mais abstrato e validado, não de reaproveitamento direto do legado

## Decisão desta fase

- o subcluster `Cálculo e limites de estorno` foi preparado documentalmente
- nenhum artigo foi reescrito por completo
- nenhum artigo foi aprovado
- nenhuma aprovação foi simulada
- nenhum artigo foi publicado
