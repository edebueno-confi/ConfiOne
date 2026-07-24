# Knowledge Vale-Compra Subcluster Prep

## Objetivo

- preparar a trilha editorial do subcluster `Vale-compra e crédito`
- separar o que pode virar orientação pública futura, o que deve permanecer interno e o que exige revisão técnica ou financeira
- evitar que o tema seja absorvido pelo canônico `Formas de estorno disponíveis na operação`

## Estado atual

- nenhum artigo foi aprovado
- nenhuma aprovação foi simulada
- nenhum artigo foi publicado
- o subcluster continua dependente de revisão humana e técnica antes de qualquer reescrita pública

## Artigos fonte analisados

### 1. Como automatizar o pagamento de Estorno e Vale-Compra
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-automatizar-o-pagamento-de-estorno-e-vale-compra`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - configura automação de estorno ou vale-compra, gatilhos por status e opções como geração automática, coleta de dados para Pix e ocultação de valores de reembolso
- tema principal:
  - automação financeira e gatilhos operacionais
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
  - `sim`
- observação objetiva:
  - mistura automação, Pix, status de reversa e política financeira; não é candidato direto a exposição pública

### 2. Sellers Permitidos para Criar Vale-Compras
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/sellers-e-lojafisica/000-sellers-permitidos-para-criar-vale-compras`
- categoria original:
  - `Configurações / Sellers e Loja Fisica`
- resumo objetivo:
  - define quais sellers podem gerar vale-compra e permite liberar todos quando o campo fica vazio
- tema principal:
  - permissão operacional para emissão de crédito
- público-alvo provável:
  - operação interna e governança de sellers
- risco editorial:
  - `alto`
- risco técnico:
  - `médio`
- risco financeiro/operacional:
  - `alto`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `não`
- observação objetiva:
  - é tema de governança operacional, não de orientação pública direta para cliente B2B

### 3. Como realizar alterações em um Vale-compra pendente?
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-realizar-alteracoes-em-um-vale-compra-pendente`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - mostra ações sobre vale-compra pendente em uma solicitação, incluindo trocar para estorno, informar vale gerado, gerar vale ou informar manualmente
- tema principal:
  - manipulação operacional de pendência de vale-compra
- público-alvo provável:
  - operação interna e suporte avançado
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
  - o artigo depende fortemente de fluxo interno de solicitação e de ações pendentes; não está pronto para exposição pública

### 4. Como configurar o Vale-Compras(Retenção)
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-configurar-o-vale-compras-retencao`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - configura ofertas de vale-compra para retenção, com descrição, valor percentual e expiração, em momentos diferentes da jornada
- tema principal:
  - retenção e incentivo financeiro por vale-compra
- público-alvo provável:
  - operação interna, produto e financeiro operacional
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
  - toca estratégia comercial e retenção; não deve ser tratado como FAQ pública simples

### 5. Pedidos pagos com vale-compras
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-pedidos-pagos-com-vale-compras`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - configura o comportamento do sistema quando troca ou devolução envolve pedido pago com vale-compra
- tema principal:
  - regra operacional para casos com crédito prévio
- público-alvo provável:
  - operação interna e time de suporte avançado
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
  - depende de regra financeira e comportamento do sistema em devolução; não deve avançar sem validação forte

## Temas internos do subcluster

### Vale-compra como forma de reembolso ou crédito
- artigos relacionados:
  - `Pedidos pagos com vale-compras`
  - `Como automatizar o pagamento de Estorno e Vale-Compra`
- leitura editorial:
  - envolve mecanismo de crédito e política operacional

### Retenção via vale-compra
- artigos relacionados:
  - `Como configurar o Vale-Compras(Retenção)`
- leitura editorial:
  - tema de retenção comercial com impacto financeiro direto

### Alteração de vale-compra pendente
- artigos relacionados:
  - `Como realizar alterações em um Vale-compra pendente?`
- leitura editorial:
  - tema de backoffice e gestão operacional de pendência

### Sellers autorizados a criar vale-compra
- artigos relacionados:
  - `Sellers Permitidos para Criar Vale-Compras`
- leitura editorial:
  - governança de permissão e emissão de crédito

### Pedidos pagos com vale-compra
- artigos relacionados:
  - `Pedidos pagos com vale-compras`
- leitura editorial:
  - política de tratamento de devolução/troca quando já existe crédito usado

### Automação de pagamento envolvendo estorno e vale-compra
- artigos relacionados:
  - `Como automatizar o pagamento de Estorno e Vale-Compra`
- leitura editorial:
  - automação com gatilhos, risco técnico e financeiro alto

## Fronteiras editoriais

### O que pode ser orientação pública futura
- visão conceitual de como o vale-compra pode participar da operação de reembolso
- orientação de alto nível sobre quando uma conta deve revisar a política de crédito ao cliente

### O que deve permanecer interno
- permissão de seller para emitir vale-compra
- alteração manual de pendência operacional
- configuração detalhada de retenção

### O que exige revisão técnica
- automação de pagamento de estorno e vale-compra
- regras de comportamento do sistema em pedidos pagos com vale-compra

### O que exige validação financeira ou operacional
- retenção via vale-compra
- combinação entre estorno e crédito
- regras de uso de vale em troca e devolução

### O que não deve ser misturado com o canônico de formas de estorno
- retenção
- crédito por vale-compra
- emissão por seller
- automação por status
- regra para pedido pago com vale-compra

## Matriz de possíveis artigos canônicos futuros

| Título candidato | Categoria pública | Subcategoria futura opcional | Prioridade | Escopo | Fora de escopo | Bloqueadores | Validação necessária | Pode avançar para reescrita agora |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Como o vale-compra entra na operação de reembolso | Estornos e reembolsos | Vale-compra | P1 | visão operacional de vale-compra como crédito ou alternativa de reembolso | retenção, seller, automação e regras financeiras detalhadas | mistura temas operacionais e financeiros ainda ambíguos | Produto + Suporte/CS | não |
| Quando revisar pedidos pagos com vale-compra | Estornos e reembolsos | Vale-compra | P1 | entendimento conceitual de casos com pedido já pago por vale-compra | configuração interna detalhada e regra de sistema | forte dependência de comportamento atual do produto | Produto + Suporte/CS | não |
| Como a retenção por vale-compra funciona na operação | Estornos e reembolsos | Vale-compra | backlog | retenção e oferta de crédito em momentos da jornada | automação, percentuais e estratégia financeira detalhada | risco comercial e financeiro alto | Produto + Suporte/CS | não |
| Como automatizações de vale-compra devem ser revisadas | Estornos e reembolsos | Vale-compra | backlog | visão de governança sobre automação do crédito | qualquer instrução específica de setup | gatilhos e automação ainda sensíveis demais | Produto | não |
| Como a permissão de seller afeta a emissão de vale-compra | Operação de trocas e devoluções | Sellers e lojas | backlog | governança de quem pode emitir vale-compra | exposição de regra interna de permissão | tema de governança interna, não de ajuda pública | Produto | não |

## Recomendação do subcluster

- classificação recomendada:
  - `revisar tecnicamente antes`

### Justificativa
- o subcluster tem partes que podem virar orientação pública futura, mas hoje a maior parte do conteúdo está presa a:
  - retenção
  - crédito
  - permissões de seller
  - automação por status
  - comportamento financeiro do sistema
- isso impede tratar o conjunto como candidato público simples nesta fase
- a abertura futura mais segura é por recorte conceitual e controlado, não por reaproveitamento direto dos artigos legados

## Decisão desta fase

- o subcluster `Vale-compra e crédito` foi preparado documentalmente
- nenhum artigo foi reescrito por completo
- nenhum artigo foi aprovado
- nenhuma aprovação foi simulada
- nenhum artigo foi publicado
