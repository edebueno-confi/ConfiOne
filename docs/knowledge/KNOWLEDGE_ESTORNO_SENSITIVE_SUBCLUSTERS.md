# Knowledge Estorno Sensitive Subclusters

## Objetivo

- mapear os subclusters sensíveis derivados de `Estornos e reembolsos`
- separar explicitamente o que fica fora do canônico `Formas de estorno disponíveis na operação`
- preparar trilhas editoriais futuras por subcluster, sem reescrever artigos completos nesta fase

## Estado atual

- nenhum artigo foi aprovado
- nenhuma aprovação foi simulada
- nenhum artigo foi publicado
- o canônico `Formas de estorno disponíveis na operação` continua restrito ao tema de formas gerais de estorno
- próximos lotes devem trabalhar por subcluster, não por artigo isolado

## Artigos relacionados encontrados no corpus

- `Como configurar as formas de Estorno`
- `Configurando as Formas de Estorno`
- `Formas de estorno por motivo`
- `Como configurar o estorno automatico via pix`
- `Como automatizar o pagamento de Estorno e Vale-Compra`
- `Valor Manual para Estorno Automático`
- `Sellers Permitidos para Criar Vale-Compras`
- `Como realizar alterações em um Vale-compra pendente?`
- `Como configurar o Vale-Compras(Retenção)`
- `Pedidos pagos com vale-compras`
- `Como configurar o cálculo do estorno`
- `Limitando o Valor Máximo de um Estorno`
- `Política para estorno do frete`
- `Regra por motivo`
- `Como cadastrar motivos para troca ou devolução`
- `Regra de Exceção para Motivos - Não Gerar Logística Reversa`
- `Regras de Cadastro  e configurações de Sellers( Estorno e Logística)`
- `Permissões Vtex`
- `Erro ao Tentar Realizar o Estorno`
- `Erro de autorização ao acessar pedidos na Vtex`
- `Posso alterar a forma de reembolso do meu consumidor?`

## Subclusters editoriais sensíveis

### 1. Formas de estorno
- descrição:
  - núcleo funcional de formas gerais de estorno disponíveis na operação
- artigos fonte relacionados:
  - `Como configurar as formas de Estorno`
  - `Configurando as Formas de Estorno`
- risco editorial: `médio`
- risco técnico: `médio`
- risco financeiro/operacional: `médio`
- público-alvo provável:
  - cliente B2B responsável pela operação
- destino recomendado:
  - `candidato a público`
- Produto necessário: `sim`
- Suporte/CS necessário: `sim`
- observação objetiva:
  - este subcluster já possui canônico candidato criado, mas continua pendente de validação humana

### 2. Pix e estorno
- descrição:
  - regras, automação e combinações operacionais envolvendo Pix como meio de estorno
- artigos fonte relacionados:
  - `Como configurar o estorno automatico via pix`
  - `Valor Manual para Estorno Automático`
  - `Como automatizar o pagamento de Estorno e Vale-Compra`
  - menções contextuais herdadas de `Como configurar as formas de Estorno`
  - menções contextuais herdadas de `Configurando as Formas de Estorno`
- risco editorial: `alto`
- risco técnico: `alto`
- risco financeiro/operacional: `alto`
- público-alvo provável:
  - operação interna e times com validação técnica
- destino recomendado:
  - `revisar tecnicamente`
- Produto necessário: `sim`
- Suporte/CS necessário: `sim`
- observação objetiva:
  - não deve entrar no canônico geral enquanto o comportamento atual e os limites financeiros não forem validados
- preparação editorial específica registrada em:
  - `docs/knowledge/KNOWLEDGE_PIX_ESTORNO_SUBCLUSTER_PREP.md`

### 3. Vale-compra e crédito
- descrição:
  - regras de retenção, emissão, pendência e uso de vale-compra como mecanismo de crédito ou reembolso
- artigos fonte relacionados:
  - `Sellers Permitidos para Criar Vale-Compras`
  - `Como realizar alterações em um Vale-compra pendente?`
  - `Como configurar o Vale-Compras(Retenção)`
  - `Pedidos pagos com vale-compras`
  - `Como automatizar o pagamento de Estorno e Vale-Compra`
- risco editorial: `alto`
- risco técnico: `alto`
- risco financeiro/operacional: `alto`
- público-alvo provável:
  - operação interna, financeiro operacional e suporte avançado
- destino recomendado:
  - `revisar tecnicamente`
- Produto necessário: `sim`
- Suporte/CS necessário: `sim`
- observação objetiva:
  - o cluster mistura crédito operacional, permissão de seller e comportamento financeiro, então não está pronto para exposição pública
- preparação editorial específica registrada em:
  - `docs/knowledge/KNOWLEDGE_VALE_COMPRA_SUBCLUSTER_PREP.md`

### 4. Cálculo e limites de estorno
- descrição:
  - lógica de cálculo, teto financeiro e valores manuais aplicados ao estorno
- artigos fonte relacionados:
  - `Como configurar o cálculo do estorno`
  - `Limitando o Valor Máximo de um Estorno`
  - `Valor Manual para Estorno Automático`
  - `Política para estorno do frete`
- risco editorial: `alto`
- risco técnico: `alto`
- risco financeiro/operacional: `alto`
- público-alvo provável:
  - operação interna com validação de Produto
- destino recomendado:
  - `bloquear por risco`
- Produto necessário: `sim`
- Suporte/CS necessário: `não`
- observação objetiva:
  - a chance de orientar incorretamente decisão financeira é alta demais para abrir reescrita pública agora

### 5. Regras e políticas por motivo
- descrição:
  - regras de estorno associadas ao motivo da troca ou devolução
- artigos fonte relacionados:
  - `Formas de estorno por motivo`
  - `Regra por motivo`
  - `Como cadastrar motivos para troca ou devolução`
  - `Regra de Exceção para Motivos - Não Gerar Logística Reversa`
  - `Política para estorno do frete`
- risco editorial: `médio`
- risco técnico: `alto`
- risco financeiro/operacional: `alto`
- público-alvo provável:
  - cliente B2B com maturidade operacional e validação do time interno
- destino recomendado:
  - `consolidar depois`
- Produto necessário: `sim`
- Suporte/CS necessário: `sim`
- observação objetiva:
  - pode virar trilha pública futura, mas só depois de separar claramente regra operacional, política financeira e exceções logísticas

### 6. Integrações e gateway
- descrição:
  - dependências de integração e permissões relacionadas ao fluxo de estorno
- artigos fonte relacionados:
  - `Permissões Vtex`
  - `Erro de autorização ao acessar pedidos na Vtex`
  - `Como automatizar o pagamento de Estorno e Vale-Compra`
- risco editorial: `alto`
- risco técnico: `alto`
- risco financeiro/operacional: `alto`
- público-alvo provável:
  - times internos e responsáveis por integração
- destino recomendado:
  - `bloquear por risco`
- Produto necessário: `sim`
- Suporte/CS necessário: `não`
- observação objetiva:
  - o cluster depende de credenciais, permissões e comportamento externo do gateway/plataforma

### 7. Erros e troubleshooting de estorno
- descrição:
  - falhas operacionais e técnicas que impedem a execução do estorno
- artigos fonte relacionados:
  - `Erro ao Tentar Realizar o Estorno`
  - `Erro de autorização ao acessar pedidos na Vtex`
  - `Posso alterar a forma de reembolso do meu consumidor?`
- risco editorial: `médio`
- risco técnico: `alto`
- risco financeiro/operacional: `médio`
- público-alvo provável:
  - cliente B2B avançado e suporte operacional
- destino recomendado:
  - `revisar tecnicamente`
- Produto necessário: `sim`
- Suporte/CS necessário: `sim`
- observação objetiva:
  - pode gerar artigos públicos de troubleshooting no futuro, mas só com revisão técnica explícita

## Relação com o canônico de formas de estorno

### O que permanece no canônico `Formas de estorno disponíveis na operação`
- visão geral das formas de estorno
- contexto operacional de escolha
- cuidados básicos antes de revisar a configuração

### O que deve ser removido do canônico se aparecer em validação futura
- detalhamento de Pix automático
- regras de vale-compra ou retenção
- cálculo financeiro do estorno
- limites máximos
- políticas por motivo
- troubleshooting técnico
- detalhes de integração ou permissões

### Temas que viram artigos próprios futuros
- Pix e estorno
- Vale-compra e crédito
- Regras e políticas por motivo
- Erros e troubleshooting de estorno

### Temas que devem ficar internos até revisão técnica
- Cálculo e limites de estorno
- Integrações e gateway

## Matriz de próximos artigos canônicos possíveis

| Título candidato | Categoria pública | Subcategoria futura opcional | Prioridade | Escopo | Bloqueadores | Validação necessária | Pode avançar para reescrita agora |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Formas de estorno disponíveis na operação | Estornos e reembolsos | Formas de estorno | P0 | visão geral das formas e cuidados básicos | aprovação humana ainda pendente | Produto + Suporte/CS | sim |
| Como o Pix entra na operação de estorno | Estornos e reembolsos | PIX | P1 | contexto e limites do uso de Pix no estorno | alto risco técnico e financeiro | Produto + Suporte/CS | não |
| Como o vale-compra entra na operação de reembolso | Estornos e reembolsos | Vale-compra | P1 | visão operacional de vale-compra e crédito | mistura retenção, pendência e permissão de seller | Produto + Suporte/CS | não |
| Como revisar regras de cálculo e limite de estorno | Estornos e reembolsos | Políticas de estorno | backlog | cálculo, teto e parâmetros financeiros | risco financeiro alto | Produto | não |
| Como as regras por motivo afetam o estorno | Estornos e reembolsos | Políticas de estorno | P1 | relação entre motivo, regra e forma de estorno | ambiguidade entre política e exceção operacional | Produto + Suporte/CS | não |
| Como preparar integrações relacionadas ao estorno | Integrações | VTEX | backlog | permissões e integrações que afetam o estorno | credenciais, gateway e risco técnico alto | Produto | não |
| Como interpretar erros de estorno na operação | Erros conhecidos e troubleshooting | Estorno | P2 | erros recorrentes e sinais de troubleshooting | depende de revisão técnica e critérios atualizados de suporte | Produto + Suporte/CS | não |

## Decisão desta fase

- os subclusters sensíveis de estorno foram mapeados
- o canônico de formas de estorno continua isolado e não absorve temas financeiros ou técnicos sensíveis
- nenhum artigo foi aprovado
- nenhum artigo foi publicado
- nenhuma aprovação foi simulada
