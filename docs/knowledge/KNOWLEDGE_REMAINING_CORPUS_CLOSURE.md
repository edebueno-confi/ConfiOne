# Knowledge Remaining Corpus Closure

## Objetivo

- consolidar o fechamento documental dos clusters restantes do corpus legado Octadesk
- encerrar a fase de curadoria fragmentada em micro-lotes
- registrar, em um único pacote, o que pode seguir para validação humana, o que exige reescrita futura e o que deve permanecer interno, bloqueado ou arquivado

## Escopo consolidado

- total de artigos do corpus legado: `58`
- artigos já mapeados editorialmente: `58`
- artigos já absorvidos pelos fechamentos anteriores de `Estornos e reembolsos` e `Logística reversa e postagem`: `26`
- artigos restantes fechados neste lote: `32`

## Clusters já fechados antes deste lote

- `Estornos e reembolsos`
  - referência:
    - `docs/knowledge/KNOWLEDGE_ESTORNO_SENSITIVE_CLUSTERS_CLOSURE.md`
- `Logística reversa e postagem`
  - referência:
    - `docs/knowledge/KNOWLEDGE_LOGISTICA_POSTAGEM_CLUSTER_CLOSURE.md`

## Clusters restantes identificados

### 1. Primeiros passos
- artigos fonte:
  - `Como alterar ou aprovar os produtos de uma solicitação?`
  - `Posso enviar uma notificação de análise ao cliente?`
  - `Como automatizar a conclusão de uma solicitação`
  - `Como cadastrar os e-mails para notificações automáticas`
  - `Como configurar a cor exibida nos filtros básicos das solicitações`
  - `Operações permitidas durante a criação de sua solicitação`
  - `Posso alterar o status de uma solicitação?`
  - `Posso filtrar as solicitações de reversas?`
  - `Regra para segunda solicitação`
  - `Como o consumidor solicita uma reversa`
- tema principal:
  - orientação operacional básica, triagem inicial e comunicação recorrente da solicitação
- risco editorial:
  - `médio`
- risco técnico:
  - `baixo`
- risco operacional:
  - `médio`
- risco de exposição interna:
  - `médio`
- destino recomendado:
  - `candidato parcial a público`
- Produto necessário:
  - `sim`
- Engenharia necessária:
  - `não`
- Suporte/CS necessário:
  - `sim`
- pode avançar para reescrita agora:
  - `sim`, apenas para o recorte já pronto
- justificativa objetiva:
  - o cluster mistura dois candidatos seguros já prontos com uma cauda longa de guias internos de UI, automação e governança operacional

### 2. Operação de trocas e devoluções
- artigos fonte:
  - `Como cadastrar motivos para troca ou devolução`
  - `Reenviar um e-mail ao consumidor`
  - `Como informar a SKU durantge a troca`
  - `Regra por motivo`
  - `Configurando a funcionalidade Fique com o Item`
  - `Produtos em Exceção`
  - `Variação do Produto`
- tema principal:
  - organização da rotina operacional de troca e devolução, triagem, comunicação e política de tratamento dos itens
- risco editorial:
  - `médio`
- risco técnico:
  - `baixo`
- risco operacional:
  - `médio`
- risco de exposição interna:
  - `médio`
- destino recomendado:
  - `candidato parcial a público`
- Produto necessário:
  - `sim`
- Engenharia necessária:
  - `não`
- Suporte/CS necessário:
  - `sim`
- pode avançar para reescrita agora:
  - `sim`, para os candidatos já prontos; `não`, para o restante
- justificativa objetiva:
  - há dois recortes seguros já preparados e dois temas ainda promissores para reescrita futura, mas o restante segue mais aderente a regra interna e configuração operacional

### 3. Sellers e operação de loja
- artigos fonte:
  - `Configuração de Sellers Permitidos`
  - `Como cadastrar Lojas Físicas`
  - `Criar Lojas Virtuais`
  - `Regras de Cadastro  e configurações de Sellers( Estorno e Logística)`
- tema principal:
  - governança de seller, loja, escopo operacional e roteamento da operação
- risco editorial:
  - `alto`
- risco técnico:
  - `médio`
- risco operacional:
  - `alto`
- risco de exposição interna:
  - `alto`
- destino recomendado:
  - `manter interno`
- Produto necessário:
  - `sim`
- Engenharia necessária:
  - `sim`
- Suporte/CS necessário:
  - `sim`
- pode avançar para reescrita agora:
  - `não`
- justificativa objetiva:
  - o cluster trata governança interna da conta, seller e escopo de operação, sem recorte público seguro claro no legado

### 4. Cadastros e configurações operacionais
- artigos fonte:
  - `Como configurar o BlockList?`
  - `Como configurar os textos do Front`
  - `Como criar um usuario`
  - `Configurando parametrização geral`
  - `Configurar padrões de segurança`
  - `Criando e atualizando o cadastro`
  - `MODO SAC`
- tema principal:
  - setup administrativo, parametrização interna e administração da conta
- risco editorial:
  - `alto`
- risco técnico:
  - `médio`
- risco operacional:
  - `médio`
- risco de exposição interna:
  - `alto`
- destino recomendado:
  - `arquivar como legado`
- Produto necessário:
  - `não`
- Engenharia necessária:
  - `sim`
- Suporte/CS necessário:
  - `sim`
- pode avançar para reescrita agora:
  - `não`
- justificativa objetiva:
  - o conjunto está fortemente preso a naming legado, UI antiga e procedimentos internos de administração

### 5. Integrações gerais fora de estorno e logística
- artigos fonte:
  - `Como atualizar os dados de integrações do e-commerce`
  - `Intalação e integração Nuvemshop`
  - `Permissões Shopify`
  - `Permissões TrayCorp`
  - `Permissões Vtex`
- tema principal:
  - setup, credenciais, permissões e manutenção de integrações do e-commerce
- risco editorial:
  - `alto`
- risco técnico:
  - `alto`
- risco operacional:
  - `alto`
- risco de exposição interna:
  - `alto`
- destino recomendado:
  - `bloquear por risco`
- Produto necessário:
  - `sim`
- Engenharia necessária:
  - `sim`
- Suporte/CS necessário:
  - `sim`
- pode avançar para reescrita agora:
  - `não`
- justificativa objetiva:
  - o cluster concentra permissões, setup técnico e trilha de integração sensível, sem recorte público confiável no legado

### 6. Erros conhecidos e troubleshooting fora de estorno e logística
- artigos fonte:
  - `nenhum cluster independente remanescente`
- tema principal:
  - os erros restantes do corpus já foram absorvidos pelos fechamentos de estorno, logística ou integrações
- risco editorial:
  - `n/a`
- risco técnico:
  - `n/a`
- risco operacional:
  - `n/a`
- risco de exposição interna:
  - `n/a`
- destino recomendado:
  - `encerrado sem novo cluster`
- Produto necessário:
  - `não`
- Engenharia necessária:
  - `não`
- Suporte/CS necessário:
  - `não`
- pode avançar para reescrita agora:
  - `não`
- justificativa objetiva:
  - não restou trilha independente de troubleshooting fora dos clusters já fechados

## Artigos restantes por cluster

### Primeiros passos
- total restante no cluster: `10`
- candidatos seguros já existentes:
  - `Como revisar os itens de uma solicitação`
  - `Como enviar uma atualização de análise ao cliente`
- manter interno:
  - `Como automatizar a conclusão de uma solicitação`
  - `Como cadastrar os e-mails para notificações automáticas`
  - `Como configurar a cor exibida nos filtros básicos das solicitações`
  - `Operações permitidas durante a criação de sua solicitação`
  - `Posso alterar o status de uma solicitação?`
  - `Posso filtrar as solicitações de reversas?`
  - `Regra para segunda solicitação`
- arquivar como legado:
  - `Como o consumidor solicita uma reversa`

### Operação de trocas e devoluções
- total restante no cluster: `17`
- candidatos seguros já existentes:
  - `Como organizar motivos de troca e devolução na operação`
  - `Como reenviar uma comunicação ao cliente`
- reescrita futura de recorte seguro:
  - `Como orientar o envio de SKU em uma troca`
  - `Como aplicar regras por motivo na operação`
- manter interno:
  - `Configurando a funcionalidade Fique com o Item`
  - `Produtos em Exceção`
  - `Variação do Produto`
- sellers e operação de loja:
  - `Configuração de Sellers Permitidos`
  - `Como cadastrar Lojas Físicas`
  - `Criar Lojas Virtuais`
  - `Regras de Cadastro  e configurações de Sellers( Estorno e Logística)`
- arquivar como legado:
  - `Como configurar o BlockList?`
  - `Como configurar os textos do Front`
  - `Como criar um usuario`
  - `Configurando parametrização geral`
  - `Configurar padrões de segurança`
  - `Criando e atualizando o cadastro`
  - `MODO SAC`

### Integrações gerais fora de estorno e logística
- total restante no cluster: `5`
- bloquear por risco:
  - `Intalação e integração Nuvemshop`
  - `Permissões Shopify`
  - `Permissões TrayCorp`
  - `Permissões Vtex`
- arquivar como legado:
  - `Como atualizar os dados de integrações do e-commerce`

## Matriz final do corpus completo

| Indicador | Total | Observação |
| --- | --- | --- |
| Total de artigos do corpus legado | `58` | base completa do export Octadesk |
| Artigos já mapeados editorialmente | `58` | todo o corpus já está classificado |
| Artigos cobertos pelos fechamentos de estorno e logística | `26` | inclui estorno, logística e troubleshooting correlato |
| Artigos restantes fechados neste lote | `32` | cobre Primeiros passos, Operação e Integrações gerais |
| Candidatos públicos já criados | `8` | cobrem `9` artigos legados de origem |
| Candidatos pendentes de validação humana | `8` | todos seguem com `Produto: pendente`, `Suporte/CS: pendente`, `pode publicar: não` |
| Artigos bloqueados por risco | `6` | integrações sensíveis e setup técnico |
| Artigos a manter internos | `17` | governança operacional, seller, backoffice e configuração interna |
| Artigos para revisão técnica ou reescrita futura | `17` | inclui recortes promissores e temas sensíveis que ainda exigem nova rodada |
| Artigos para arquivar como legado | `9` | naming legado, UI antiga ou escopo administrativo amplo |
| Artigos duplicados ou consolidados | `2` | `Formas de Estorno` consolidadas em 1 canônico candidato |

## Lista final de candidatos seguros já existentes

| Candidato | Documento de referência | Status | Produto | Suporte/CS | Pode publicar | Motivo |
| --- | --- | --- | --- | --- | --- | --- |
| Como revisar os itens de uma solicitação | `docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md` | pendente | pendente | pendente | não | falta evidência humana real |
| Como organizar motivos de troca e devolução na operação | `docs/knowledge/KNOWLEDGE_MOTIVOS_TROCA_DEVOLUCAO_REWRITE.md` | pendente | pendente | pendente | não | falta evidência humana real |
| Como enviar uma atualização de análise ao cliente | `docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md` | pendente | pendente | pendente | não | falta evidência humana real |
| Como reenviar uma comunicação ao cliente | `docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md` | pendente | pendente | pendente | não | falta evidência humana real |
| Formas de estorno disponíveis na operação | `docs/knowledge/KNOWLEDGE_ESTORNO_CANONICAL_REWRITE.md` | pendente | pendente | pendente | não | falta evidência humana real |
| Como o prazo de postagem afeta a operação de troca e devolução | `docs/knowledge/KNOWLEDGE_PRAZO_POSTAGEM_REWRITE.md` | pendente | pendente | pendente | não | falta evidência humana real |
| Como revisar uma pendência de logística reversa na operação | `docs/knowledge/KNOWLEDGE_PENDENCIA_LOGISTICA_REVERSA_REWRITE.md` | pendente | pendente | pendente | não | falta evidência humana real |
| O que revisar quando o CEP ou endereço impede a postagem | `docs/knowledge/KNOWLEDGE_CEP_ENDERECO_POSTAGEM_REWRITE.md` | pendente | pendente | pendente | não | falta evidência humana real |

## Lista final de bloqueados ou internos

### Bloqueados por novo recorte técnico
- Pix e estorno
- Cálculo e limites de estorno
- Integrações e gateway
- Integração Correios
- Contrato, token e autorização técnica
- Troubleshooting técnico com credenciais, logs ou permissões

### Manter internos
- sellers e roteamento operacional sensível
- regras internas que bloqueiam logística reversa
- guias de backoffice, parametrização e administração da conta
- configurações operacionais sem recorte público seguro claro

## Plano único de próximos passos

### A. Validação humana dos candidatos já prontos
- submeter os `8` candidatos existentes para `Produto`
- submeter os `8` candidatos existentes para `Suporte/CS`
- registrar toda evidência no `KNOWLEDGE_HUMAN_APPROVAL_REGISTER.md`

### B. Reescrita futura de recortes seguros
- `Como orientar o envio de SKU em uma troca`
- `Como aplicar regras por motivo na operação`
- eventuais recortes conceituais futuros de vale-compra e troubleshooting por sintomas observáveis

### C. Revisão técnica de temas bloqueados
- Pix e estorno
- cálculo e limites de estorno
- integrações e gateway
- integrações gerais do e-commerce

### D. Conteúdo que deve permanecer interno
- sellers, lojas e roteamento operacional
- parametrização ampla de ambiente
- procedimentos manuais de backoffice
- regras administrativas e de segurança

### E. Publicação futura apenas após evidência humana
- nenhum candidato avança para publicação sem `Produto` + `Suporte/CS`
- temas técnicos sensíveis exigem `Engenharia`
- conteúdo com segredo, credencial, token, contrato ou log segue fora da trilha pública

## Decisão final desta fase

- os clusters restantes do corpus legado foram fechados documentalmente
- o corpus completo agora está organizado em uma única trilha governada
- não há necessidade de abrir novos micro-lotes de curadoria para classificar o que restava
- o próximo passo real é validação humana dos candidatos já prontos
