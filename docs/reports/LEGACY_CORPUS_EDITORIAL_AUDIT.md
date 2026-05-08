# LEGACY_CORPUS_EDITORIAL_AUDIT.md

## Resumo executivo
O corpus legado candidato da Knowledge Base foi auditado diretamente a partir do export preservado em `raw_knowledge/octadesk_export/latest/`, sem materializacao em banco, sem publicacao automatica e sem mutacao do dado-fonte. O lote atual e estritamente documental.

O inventario real contem `58` artigos candidatos, concentrados em quatro grupos editoriais herdados:
- `Configurações / Configuração de ambiente`: `41`
- `Configurações / Sellers e Loja Fisica`: `4`
- `Cadastros / Integração e atualização`: `8`
- `Erros comuns e soluções / Erros e pendências`: `5`

O principal problema editorial nao e volume. E qualidade de origem:
- naming legado tecnico demais
- mistura de instrucoes internas com orientacao potencialmente publica
- forte concentracao em estorno, integracoes e logistica reversa
- erros ortograficos e ruidos de importacao no titulo
- pelo menos uma duplicidade confirmada no backlog atual

Conclusao operacional desta fase:
- o corpus pode orientar curadoria humana
- o corpus nao deve seguir para publicacao publica em lote
- deduplicacao continua manual
- reescrita humana continua obrigatoria antes de qualquer nova promocao para a camada publica

## Origem do corpus auditado

### Fonte principal
- `raw_knowledge/octadesk_export/latest/articles/`
- `raw_knowledge/octadesk_export/latest/categories/`
- `raw_knowledge/octadesk_export/latest/sections/`

### Artefatos auxiliares usados como evidencia documental
- `docs/reports/KNOWLEDGE_LEGACY_INVENTORY_REPORT.md`
- `docs/reports/KNOWLEDGE_LEGACY_CURATION_BACKLOG.md`

### Observacoes de metodo
- a auditoria leu `article.json`, `content.txt` e a estrutura de categorias/secoes do export
- nao houve import no banco para esta fase
- nao houve alteracao em backend, Supabase, migrations, RPCs, contracts, fixtures, RLS ou permissoes
- classificacoes abaixo sao recomendacoes editoriais, nao decisao automatica de produto

## Diagnostico editorial resumido

### Volume e distribuicao atual
- total aproximado de artigos candidatos: `58`
- categorias-raiz atuais:
  - `Configurações`: `45`
  - `Cadastros`: `8`
  - `Erros comuns e soluções`: `5`
- secoes atuais:
  - `Configuração de ambiente`: `41`
  - `Integração e atualização`: `8`
  - `Erros e pendências`: `5`
  - `Sellers e Loja Fisica`: `4`

### Sinais recorrentes encontrados
- excesso de linguagem operacional legada: `MODO SAC`, `Front`, `BlockList`, `Vale-Compras(Retenção)`
- mistura entre instrucoes de configuracao interna e orientacao de uso
- forte dependencia de termos sensiveis:
  - integracoes
  - credenciais
  - permissoes
  - Correios
  - PIX
  - estorno
- varios titulos ainda refletem UI ou naming antigo
- parte do corpus aparenta ter sido escrita para contexto proximo de SAC/B2C, nao para uma base de ajuda B2B tecnica e governada

## Exemplos de titulos tecnicos demais ou inadequados para publico B2B
- `Permissões Shopify`
- `Permissões TrayCorp`
- `Permissões Vtex`
- `Habilitar a API de Logística Reversa do Correios`
- `Erro de autorização ao acessar pedidos na Vtex`
- `Como configurar o BlockList?`
- `MODO SAC`
- `Como configurar os textos do Front`
- `Valor Manual para Estorno Automático`
- `Regras de Cadastro e configurações de Sellers( Estorno e Logística)`

## Exemplos de categorias e rotulos inconsistentes
- raiz `Configurações` concentra desde onboarding ate politicas de estorno, sellers e UX legada
- `Cadastros / Integração e atualização` mistura setup, troubleshooting, permissoes e possivel manutencao sensivel
- `Erros comuns e soluções / Erros e pendências` mistura erro de uso, erro tecnico e incidente logistico
- `Sellers e Loja Fisica` usa naming hibrido e pouco editorial para superficie publica

## Conteudos que parecem internos ou restritos

### Internal por natureza de operacao
- `Como cadastrar os e-mails para notificações automáticas`
- `Como configurar os textos do Front`
- `Como criar um usuario`
- `Configurar padrões de segurança`
- `Criando e atualizando o cadastro`

### Restricted por risco operacional
- `Como automatizar o pagamento de Estorno e Vale-Compra`
- `Como configurar o estorno automatico via pix`
- `Erros na integração do contrato do Correios`
- `Habilitar a API de Logística Reversa do Correios`
- `Permissões Shopify`
- `Permissões TrayCorp`
- `Permissões Vtex`
- `Erro "Não Autorizado" ao Gerar Código de postagem`

## Conteudos que parecem candidatos a publico apos reescrita humana
- `Como alterar ou aprovar os produtos de uma solicitação?`
- `Como cadastrar motivos para troca ou devolução`
- `Como informar a SKU durantge a troca`
- `Posso enviar uma notificação de análise ao cliente?`
- `Reenviar um e-mail ao consumidor`
- `Regra por motivo`

Observacao:
- nenhum desses artigos deve ser promovido automaticamente
- todos ainda exigem reescrita humana em linguagem B2B, revisao de contexto e validacao de taxonomia publica

## Conteudos obsoletos, arriscados ou com alta chance de retrabalho
- `Como atualizar os dados de integrações do e-commerce`
- `Configurando parametrização geral`
- `Intalação e integração Nuvemshop`
- `MODO SAC`
- `Como o consumidor solicita uma reversa`
- `Posso alterar a forma de reembolso do meu consumidor?`

Motivos recorrentes:
- naming legado
- foco em consumidor final
- instrucoes dependentes de UI antiga
- mistura de processo interno com orientacao publica

## Duplicidades candidatas

### Duplicidade confirmada no backlog atual
- `Como configurar as formas de Estorno`
- `Configurando as Formas de Estorno`
- situacao: o backlog atual ja registra o mesmo grupo com `source_hash` compartilhado
- destino recomendado: consolidar em um unico artigo canonico e arquivar o duplicado como legado

### Clusters tematicos candidatos a consolidacao manual

#### Cluster: estorno e reembolso
- `Como configurar as formas de Estorno`
- `Configurando as Formas de Estorno`
- `Como configurar o cálculo do estorno`
- `Formas de estorno por motivo`
- `Limitando o Valor Máximo de um Estorno`
- `Política para estorno do frete`
- `Valor Manual para Estorno Automático`

Recomendacao:
- separar o que e politica operacional do que e configuracao
- escolher um artigo canonico por assunto
- bloquear publicacao enquanto houver sobreposicao sem consolidacao humana

#### Cluster: integracoes e correios
- `Como atualizar os dados de integrações do e-commerce`
- `Erros na integração do contrato do Correios`
- `Habilitar a API de Logística Reversa do Correios`
- `Integração e configuração com os Correios`

Recomendacao:
- tratar como trilha tecnica restrita
- quebrar entre setup, permissoes e troubleshooting
- manter fora da camada publica ate revisao tecnica e operacional

#### Cluster: sellers e operacao de loja
- `Como cadastrar Lojas Físicas`
- `Configuração de Sellers Permitidos`
- `Regras de Cadastro e configurações de Sellers( Estorno e Logística)`
- `Sellers Permitidos para Criar Vale-Compras`

Recomendacao:
- revisar naming
- separar governanca de sellers de regras financeiras
- decidir o que vira base publica B2B e o que permanece interno

## Taxonomia editorial publica proposta
Esta taxonomia e proposta de curadoria. Ela nao altera contrato, banco nem categorias materializadas hoje.

### 1. Primeiros passos
Destinacao sugerida:
- visao geral da operacao
- regras basicas de abertura e acompanhamento
- orientacoes iniciais sem depender de menu interno

Exemplos candidatos:
- `Como alterar ou aprovar os produtos de uma solicitação?`
- `Posso enviar uma notificação de análise ao cliente?`

### 2. Operacao de trocas e devolucoes
Destinacao sugerida:
- regras operacionais de trocas
- motivos
- excecoes de fluxo
- comunicacao com o cliente

Exemplos candidatos:
- `Como cadastrar motivos para troca ou devolução`
- `Como informar a SKU durantge a troca`
- `Regra por motivo`

### 3. Logistica reversa e postagem
Destinacao sugerida:
- orientacao operacional de reversa
- prazos e excecoes
- somente quando o texto puder ser reescrito sem dependencia de setup interno

Exemplos candidatos:
- `Como Configurar o Prazo Logístico por Estado?`
- `Pendência de Logística Reversa`

### 4. Integracoes
Destinacao sugerida:
- apenas artigos claramente seguros, reescritos e sem credenciais/permissoes sensiveis
- maior parte do corpus atual ainda nao esta pronta para esta camada

Exemplos candidatos para revisao forte:
- `Intalação e integração Nuvemshop`

### 5. Estornos e reembolsos
Destinacao sugerida:
- separar politica operacional publica de configuracao financeira interna
- grande parte do corpus atual ainda deve permanecer interna ou restrita

Exemplos candidatos para consolidacao:
- `Formas de estorno por motivo`

### 6. Erros conhecidos e troubleshooting
Destinacao sugerida:
- somente incidentes que possam ser descritos sem segredos, credenciais ou troubleshooting interno profundo

Exemplos candidatos:
- `Erro no CEP ou Endereço Incorreto`

## Matriz de decisao editorial

| Tipo de conteudo | Destino recomendado | Criterio |
| --- | --- | --- |
| setup com credencial, permissao, API ou contrato externo | manter interno ou restrito | risco operacional alto |
| artigo sobre estorno automatico, PIX ou regra financeira | exigir revisao tecnica | risco financeiro e de compliance |
| troubleshooting de integracao | bloquear por risco ou manter restrito | pode expor detalhe tecnico sensivel |
| artigo orientativo de operacao sem segredo | reescrever para publico | exige linguagem B2B e contexto atual |
| artigos com tema duplicado | consolidar com outro artigo | escolher canonico e arquivar duplicado |
| artigo com naming legado ou UI antiga | arquivar como legado ou reescrever | depende de aderencia ao produto atual |
| artigo com tom B2C/consumidor final | exigir revisao CS/suporte | precisa migrar para voz B2B |
| artigo sobre sellers/loja fisica | exigir revisao operacional | pode mesclar regra de conta com governanca interna |

## Exemplos de reescrita humana recomendada

### Exemplo 1
- titulo legado: `Como o consumidor solicita uma reversa`
- problema: linguagem B2C, centrada no consumidor final
- direcao recomendada: `Como orientar a solicitacao de logistica reversa na sua operacao`

### Exemplo 2
- titulo legado: `Permissões Vtex`
- problema: tecnico, incompleto e possivelmente sensivel
- direcao recomendada: manter restrito; se houver versao publica futura, reescrever como guia de preparacao de integracao sem expor permissoes nem credenciais

### Exemplo 3
- titulo legado: `Configurando parametrização geral`
- problema: amplo demais, genérico e dependente de UI antiga
- direcao recomendada: quebrar em artigos menores por tarefa operacional concreta

### Exemplo 4
- titulo legado: `Reenviar um e-mail ao consumidor`
- problema: naming B2C
- direcao recomendada: `Reenviar uma comunicacao operacional ao cliente`

## Criterios de publicacao publica
Um artigo legado candidato so deve seguir para camada publica quando atender simultaneamente aos pontos abaixo:
- reescrita humana concluida
- revisao editorial concluida
- revisao tecnica concluida quando houver impacto funcional
- taxonomia publica definida
- ausencia de credenciais, permissoes, endpoints ou detalhes internos sensiveis
- ausencia de dependencia explicita de naming/UI legada
- alinhamento com a proposta B2B da Central de Ajuda
- aprovacao humana explicita no cockpit editorial

## Backlog sugerido de curadoria

### Fase A - triagem e seguranca
- separar imediatamente os artigos de integracoes, credenciais, permissoes e estorno automatico
- marcar clusters de duplicidade e sobreposicao por tema
- criar lista de artigos bloqueados por risco

### Fase B - normalizacao editorial
- corrigir ortografia e naming legado
- remover termos B2C ou dependencia de UI antiga
- remapear cada artigo para a taxonomia publica proposta

### Fase C - consolidacao
- escolher artigo canonico por tema
- fundir ou arquivar duplicados
- abrir fila de reescrita humana dos candidatos a publico

### Fase D - aprovacao
- revisar tecnicamente integracoes e politicas financeiras
- revisar com CS/suporte o tom operacional B2B
- promover apenas o que estiver pronto para revisao e publicacao formal

## Proximos passos por fase
- curto prazo: validar a proposta de taxonomia com produto, operacao e suporte
- curto prazo: transformar os clusters de duplicidade em fila manual de consolidacao
- medio prazo: abrir sprint editorial de reescrita humana para os artigos candidatos a publico
- medio prazo: revisar a trilha de integracoes e estornos como corpus interno/restrito governado
- longo prazo: so depois da curadoria manual retomar novos lotes de publicacao publica

## Decisao desta fase
- o lote atual fecha como auditoria e saneamento documental do corpus legado
- nao houve publicacao
- nao houve alteracao de runtime
- nao houve alteracao de contratos
- deduplicacao real continua manual e operacional nesta fase

## Desdobramento operacional
O plano humano de saneamento deste backlog foi desdobrado em:
- `docs/knowledge/LEGACY_CORPUS_HUMAN_CURATION_SPRINT.md`
- `docs/knowledge/LEGACY_CORPUS_FULL_CURATION_PACK.md`
- `docs/knowledge/KNOWLEDGE_FULL_CORPUS_APPROVAL_INTAKE.md`
- `docs/knowledge/KNOWLEDGE_FULL_CORPUS_APPROVAL_COLLECTION_PLAYBOOK.md`
