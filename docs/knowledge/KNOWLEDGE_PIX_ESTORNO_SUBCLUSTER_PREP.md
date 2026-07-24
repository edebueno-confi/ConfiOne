# Knowledge Pix Estorno Subcluster Prep

## Objetivo

- preparar a trilha editorial do subcluster `Pix e estorno`
- separar o que pode virar orientação pública futura, o que deve permanecer interno e o que exige revisão técnica ou financeira
- impedir que o tema seja absorvido pelo canônico `Formas de estorno disponíveis na operação`

## Estado atual

- nenhum artigo foi aprovado
- nenhuma aprovação foi simulada
- nenhum artigo foi publicado
- o subcluster continua de alto risco e depende de revisão técnica e humana explícita

## Artigos fonte analisados

### 1. Como configurar o estorno automatico via pix
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-configurar-o-estorno-automatico-via-pix`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - habilita estorno automático via Pix e menciona possibilidade de informar gateway de pagamento
- tema principal:
  - Pix como mecanismo automatizado de reembolso
- público-alvo provável:
  - operação interna com validação técnica
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
  - já entra diretamente em automação de pagamento e dependência de gateway

### 2. Como automatizar o pagamento de Estorno e Vale-Compra
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-automatizar-o-pagamento-de-estorno-e-vale-compra`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - configura estorno ou vale-compra automático por status, incluindo desabilitar coleta de dados de Pix e transferência
- tema principal:
  - automação de pagamento com gatilhos operacionais
- público-alvo provável:
  - operação interna e times com validação de Produto
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
  - mistura Pix, vale-compra, estorno automático, status e recomendação operacional

### 3. Formas de estorno por motivo
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-formas-de-estorno-por-motivo`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - parametriza concorrência entre estorno financeiro e vale-compra com base no motivo da solicitação
- tema principal:
  - regra operacional de decisão de forma de estorno
- público-alvo provável:
  - operação interna e configuração funcional
- risco editorial:
  - `médio`
- risco técnico:
  - `alto`
- risco financeiro/operacional:
  - `alto`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- observação objetiva:
  - encosta em Pix só de forma indireta, pela regra de forma de estorno; não é artigo específico de Pix

### 4. Como configurar as formas de Estorno
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-configurar-as-formas-de-estorno`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - apresenta formas gerais de estorno e cita como exemplo conta bancária, conta bancária + Pix e apenas Pix
- tema principal:
  - formas gerais de estorno
- público-alvo provável:
  - cliente B2B responsável pela operação
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
  - serve apenas como origem contextual; não deve carregar detalhamento de Pix

### 5. Configurando as Formas de Estorno
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-configurando-as-formas-de-estorno`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - repete o mesmo conteúdo do artigo duplicado sobre formas de estorno, incluindo menção a Pix
- tema principal:
  - formas gerais de estorno
- público-alvo provável:
  - cliente B2B responsável pela operação
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
  - permanece apenas como origem histórica do canônico geral

### 6. Posso alterar a forma de reembolso do meu consumidor?
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-posso-alterar-a-forma-de-reembolso-do-meu-consumidor`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - descreve alteração manual da forma de reembolso dentro da solicitação, com seleção de vale-compra
- tema principal:
  - mudança manual de forma de reembolso
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
  - relevante para o subcluster porque mostra a mudança manual da forma, mas o texto não é específico de Pix

### 7. Erro ao Tentar Realizar o Estorno
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/erros-comuns-e-solucoes/erros-e-pendencias/000-erro-ao-tentar-realizar-o-estorno`
- categoria original:
  - `Erros comuns e soluções / Erros e pendências`
- resumo objetivo:
  - atribui o erro ao status não faturado do pedido na VTEX e recomenda aguardar o fluxo correto
- tema principal:
  - troubleshooting operacional de estorno
- público-alvo provável:
  - suporte operacional e cliente B2B avançado
- risco editorial:
  - `médio`
- risco técnico:
  - `alto`
- risco financeiro/operacional:
  - `médio`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- observação objetiva:
  - relaciona estorno com status VTEX, mas não explica o recorte específico de Pix

### 8. Permissões Vtex
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/cadastros/integracao-e-atualizacao/000-permissoes-vtex`
- categoria original:
  - `Cadastros / Integração e atualização`
- resumo objetivo:
  - lista permissões VTEX para leitura, reservas, estornos, pagamentos sensíveis e gift cards
- tema principal:
  - integração e permissões do ecossistema VTEX
- público-alvo provável:
  - times internos de integração
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
  - só tem relação com Pix/estorno quando o fluxo passa pelo gateway VTEX; continua tema de integração restrita

## Temas internos do subcluster

### Pix como forma de estorno
- artigos relacionados:
  - `Como configurar o estorno automatico via pix`
  - menções contextuais em `Como configurar as formas de Estorno`
  - menções contextuais em `Configurando as Formas de Estorno`
- leitura editorial:
  - tema conceitual de alto risco, mas potencialmente público no futuro em formato bem controlado

### Estorno automático via Pix
- artigos relacionados:
  - `Como configurar o estorno automatico via pix`
  - `Como automatizar o pagamento de Estorno e Vale-Compra`
- leitura editorial:
  - tema técnico e financeiro, dependente de configuração e gatilhos

### Vínculo com gateway ou provedor externo
- artigos relacionados:
  - `Como configurar o estorno automatico via pix`
  - `Permissões Vtex`
- leitura editorial:
  - tema de integração/gateway, não de ajuda pública comum

### Permissões necessárias
- artigos relacionados:
  - `Permissões Vtex`
- leitura editorial:
  - trilha interna de integração e segurança operacional

### Automação de pagamento
- artigos relacionados:
  - `Como automatizar o pagamento de Estorno e Vale-Compra`
  - `Valor Manual para Estorno Automático`
- leitura editorial:
  - governança de automação e parâmetros financeiros

### Relação com vale-compra
- artigos relacionados:
  - `Como automatizar o pagamento de Estorno e Vale-Compra`
  - `Formas de estorno por motivo`
  - `Posso alterar a forma de reembolso do meu consumidor?`
- leitura editorial:
  - o tema aparece como concorrência ou alternativa, então não pode ser misturado ao recorte puro de Pix

### Erros operacionais de estorno via Pix
- artigos relacionados:
  - `Erro ao Tentar Realizar o Estorno`
  - `Permissões Vtex`
- leitura editorial:
  - hoje o legado só mostra estorno e integração em geral; falta um artigo de erro específico para Pix

### Mudança de forma de reembolso envolvendo Pix
- artigos relacionados:
  - `Posso alterar a forma de reembolso do meu consumidor?`
- leitura editorial:
  - recorte operacional de backoffice, não orientação pública de alto nível

### Limites, prazos ou validações financeiras
- artigos relacionados:
  - `Valor Manual para Estorno Automático`
  - `Como automatizar o pagamento de Estorno e Vale-Compra`
- leitura editorial:
  - qualquer limite ou regra financeira deve continuar fora da trilha pública até revisão forte

## Fronteiras editoriais

### O que pode ser orientação pública futura
- explicação conceitual de que Pix pode existir como uma das formas de estorno da operação
- orientação de alto nível sobre quando a conta deve revisar o uso de Pix no fluxo de reembolso

### O que deve permanecer interno
- escolha e configuração de gateway
- permissões VTEX ou equivalentes
- alteração manual de forma de reembolso em backoffice

### O que exige revisão técnica
- habilitação de estorno automático via Pix
- automação por status
- parâmetros de valor manual
- dependência de status do pedido em plataforma externa

### O que exige validação financeira/operacional
- confirmação do meio de devolução do valor
- compatibilidade do método de pagamento
- impacto de ocultar ou exibir valores de reembolso
- decisão entre Pix, vale-compra e outras formas de reembolso

### O que não deve ser misturado com o canônico de formas de estorno
- automação de Pix
- gateway
- permissões
- validações financeiras

### O que não deve ser misturado com o subcluster de vale-compra
- retenção
- emissão de crédito
- concorrência entre Pix e vale-compra como política editorial única

### O que não deve ser misturado com troubleshooting técnico
- erro de status VTEX
- permissão insuficiente
- falha de integração

### O que não deve ser misturado com integrações/gateway
- explicação conceitual ao cliente B2B sobre o que é Pix no fluxo

## Matriz de possíveis artigos canônicos futuros

| Título candidato | Categoria pública | Subcategoria futura opcional | Prioridade | Escopo | Fora de escopo | Bloqueadores | Validação necessária | Pode avançar para reescrita agora |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Como o Pix entra na operação de estorno | Estornos e reembolsos | PIX | P1 | visão conceitual do Pix como possibilidade de estorno na operação | gateway, permissões, automação detalhada, vale-compra e troubleshooting | alto risco técnico e financeiro | Produto + Suporte/CS | não |
| Quando revisar o uso de Pix no reembolso da operação | Estornos e reembolsos | PIX | P1 | sinais de quando a operação precisa validar o uso de Pix | configuração interna, gatilhos e setup de integração | depende de confirmação funcional e operacional do produto atual | Produto + Suporte/CS | não |
| Como automatizações de estorno via Pix devem ser revisadas | Estornos e reembolsos | PIX | backlog | governança de automação e gatilhos de Pix | qualquer instrução específica de habilitação | automação e gateway continuam sensíveis demais | Produto | não |
| Como permissões e gateway impactam o Pix no estorno | Integrações | VTEX | backlog | visão de dependências técnicas para times internos | ajuda pública para cliente final | permissões e dados sensíveis | Produto | não |
| Como interpretar falhas comuns no estorno via Pix | Erros conhecidos e troubleshooting | Estorno | backlog | troubleshooting conceitual e sinais de erro | resolução técnica profunda ou credenciais | hoje o legado não separa claramente erro específico de Pix | Produto + Suporte/CS | não |

## Recomendação do subcluster

- classificação recomendada:
  - `bloquear por risco`

### Justificativa
- o subcluster toca diretamente em:
  - pagamento
  - automação
  - gateway
  - permissão
  - decisão financeira
- ainda não existe recorte confiável no legado para orientar Pix de forma pública sem risco de promessa técnica ou operacional indevida
- a abertura futura, se existir, precisa nascer de um recorte conceitual novo e validado, não do reaproveitamento direto do material legado

## Decisão desta fase

- o subcluster `Pix e estorno` foi preparado documentalmente
- nenhum artigo foi reescrito por completo
- nenhum artigo foi aprovado
- nenhuma aprovação foi simulada
- nenhum artigo foi publicado
