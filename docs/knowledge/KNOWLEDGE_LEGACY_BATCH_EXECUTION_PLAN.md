# Knowledge Legacy Batch Execution Plan

## Objetivo

Transformar o fechamento documental do corpus legado da Knowledge Base em um plano operacional por lotes, com gates humanos explícitos, ordem de execução segura e critérios claros para materialização controlada do legado.

Este plano não publica conteúdo, não executa sync e não aplica side effects no banco. Ele organiza a próxima etapa operacional a partir do estado já consolidado em:

- `docs/reports/KNOWLEDGE_LEGACY_INVENTORY_REPORT.md`
- `docs/reports/KNOWLEDGE_LEGACY_CURATION_BACKLOG.md`
- `docs/KNOWLEDGE_CONTENT_CURATION_PLAN.md`
- `docs/PUBLIC_HELP_CENTER_PUBLISH_RUNBOOK.md`
- `docs/CONTENT_OPERATIONS_GOVERNANCE.md`
- `docs/knowledge/KNOWLEDGE_REMAINING_CORPUS_CLOSURE.md`
- `docs/knowledge/KNOWLEDGE_LEGACY_CORPUS_FINAL_READINESS_PACK.md`
- `docs/knowledge/KNOWLEDGE_HUMAN_APPROVAL_REGISTER.md`

## Premissas que governam a execução

- O corpus legado total continua em `58` artigos.
- O legado segue preservado em `raw_knowledge/octadesk_export/latest/articles/`.
- Nenhum artigo nasce publicado; `draft` continua sendo o estado de entrada.
- `knowledge_space` alvo deve ser explícito; hoje o espaço operacional documentado é `genius`.
- Advisory editorial é apoio persistente, não decisão automática.
- Publicação pública exige gate humano explícito e não pode ser inferida por heurística.
- Temas sensíveis continuam fora da trilha pública até novo recorte governado.

## Estado consolidado que este plano assume como baseline

| Faixa | Total | Base documental |
| --- | --- | --- |
| candidatos públicos já preparados | `8` | `KNOWLEDGE_LEGACY_CORPUS_FINAL_READINESS_PACK.md` |
| artigos a manter internos | `17` | `KNOWLEDGE_REMAINING_CORPUS_CLOSURE.md` |
| artigos para revisão técnica ou reescrita futura | `17` | `KNOWLEDGE_REMAINING_CORPUS_CLOSURE.md` |
| itens para arquivar como legado | `9` | `KNOWLEDGE_REMAINING_CORPUS_CLOSURE.md` |
| itens duplicados ou consolidados | `2` | `KNOWLEDGE_REMAINING_CORPUS_CLOSURE.md` |
| temas bloqueados por risco | `6` | `KNOWLEDGE_LEGACY_CORPUS_FINAL_READINESS_PACK.md` |

Observação operacional:
- a contagem de `restricted` no backlog original (`16`) evoluiu, na trilha de fechamento final, para uma combinação de `temas bloqueados por risco`, `artigos para revisão técnica ou reescrita futura` e `conteúdos que devem permanecer internos`, dependendo do cluster;
- para execução por lotes, a fila deve seguir o fechamento final mais recente, não a heurística bruta inicial.

## Gate global antes de qualquer lote

### Gate G0 · readiness do lote

Nenhuma wave começa sem os cinco pré-requisitos abaixo:

1. `source_path` e `source_hash` preservados para todos os itens do lote.
2. documento canônico do lote apontado no handoff ou no pacote de prontidão.
3. classificação operacional explícita do lote (`public`, `internal`, `restricted`, `obsolete`, `duplicate`).
4. dono humano do gate identificado antes da movimentação (`Produto`, `Suporte/CS`, `Engenharia` ou `platform_admin`).
5. ambiente local apto para dry-run futuro, caso o lote avance para materialização com side effect.

### Dependências mínimas de ambiente local

Quando a execução sair do plano e entrar em materialização controlada, o ambiente precisa estar pronto para:

- `npm run supabase:start`
- `npm run supabase:wait:ready`
- `npm run supabase:db:reset`
- `npm run supabase:qa:local-admin-fixture`
- `npm run knowledge:curation:backlog`
- `npm run knowledge:import:octadesk:local -- --space-slug genius`
- `npm run knowledge:review:advisories:local -- --space-slug genius`
- `npm run supabase:verify`

Se qualquer um desses blocos falhar, o lote não deve avançar de status; ele volta para `blocked` com causa explícita.

## Priorização recomendada das waves

A ordem operacional recomendada é:

1. `duplicate`
2. `obsolete`
3. `public`
4. `internal`
5. `restricted`

Racional:
- limpar duplicidade cedo evita review humano duplicado e métricas infladas;
- arquivar legado óbvio reduz ruído antes de pedir validação humana cara;
- os `8` candidatos públicos já têm melhor prontidão documental e maior retorno operacional;
- a faixa `internal` pode ser organizada sem pressão de exposição externa;
- a faixa `restricted` é a mais dependente de Produto + Engenharia e a mais sujeita a novo recorte técnico.

## Wave 1 · duplicate

### Escopo

- `2` itens duplicados ou consolidados.
- caso documental principal: grupo `Formas de Estorno`, já apontado para consolidação canônica.

### Objetivo

Eliminar duplicidade operacional antes de abrir novas rodadas de validação humana.

### Entrada

- grupo de duplicidade confirmado por `source_hash`;
- artigo canônico explicitamente definido;
- trilha documental do canônico pronta para ser usada como referência.

### Saída

- 1 canônico preservado como referência do tema;
- duplicado marcado para arquivamento controlado ou exclusão da fila ativa;
- registro explícito de qual `source_hash` foi absorvido por qual canônico.

### Gate humano

- obrigatório: `platform_admin`
- obrigatório: dono editorial do cluster
- obrigatório quando o tema for financeiro/técnico sensível: `Produto`

### Dependências

- `docs/knowledge/KNOWLEDGE_ESTORNO_CONSOLIDATION_PREP.md`
- `docs/knowledge/KNOWLEDGE_ESTORNO_CANONICAL_REWRITE.md`
- `docs/reports/KNOWLEDGE_LEGACY_CURATION_BACKLOG.md`

### Throughput mínimo proposto

- `1` grupo de duplicidade por sessão operacional

### Risco editorial dominante

- consolidar no canônico errado e contaminar o lote público futuro

## Wave 2 · obsolete

### Escopo

- `9` itens para arquivar como legado
- mais qualquer item explicitamente `obsolete` no backlog que continue sem recorte seguro

### Objetivo

Retirar da fila ativa o legado preso a UI antiga, naming antigo, setup administrativo amplo ou procedimento já sem trajetória segura.

### Entrada

- motivo de obsolescência explícito;
- ausência de dependência de publicação futura;
- confirmação de que o item não é candidato real a recorte seguro no curto prazo.

### Saída

- item marcado como arquivado no plano operacional;
- justificativa curta registrada por item ou subcluster;
- fila ativa reduzida sem perda de rastreabilidade.

### Gate humano

- obrigatório: `platform_admin`
- obrigatório: `Suporte/CS`
- `Produto` apenas quando houver dúvida entre `obsolete` e `internal`

### Dependências

- `docs/knowledge/KNOWLEDGE_REMAINING_CORPUS_CLOSURE.md`
- `docs/knowledge/KNOWLEDGE_LEGACY_CORPUS_FINAL_READINESS_PACK.md`

### Throughput mínimo proposto

- `8` a `10` itens por sessão de arquivamento documental

### Risco editorial dominante

- arquivar cedo um item que deveria virar recorte interno ou público depois

## Wave 3 · public

### Escopo

- `8` candidatos documentais já preparados e ainda pendentes de validação humana

Lista-base:
- `Como revisar os itens de uma solicitação`
- `Como organizar motivos de troca e devolução na operação`
- `Como enviar uma atualização de análise ao cliente`
- `Como reenviar uma comunicação ao cliente`
- `Formas de estorno disponíveis na operação`
- `Como o prazo de postagem afeta a operação de troca e devolução`
- `Como revisar uma pendência de logística reversa na operação`
- `O que revisar quando o CEP ou endereço impede a postagem`

### Objetivo

Consumir primeiro a parte do legado que já tem rewrite canônico e depende principalmente de evidência humana real.

### Entrada

- artigo listado no pacote final de prontidão;
- texto candidato já consolidado em documento de referência;
- `Produto = pendente`, `Suporte/CS = pendente`, `pode publicar = não` claramente registrados;
- ausência de bloqueador técnico novo.

### Saída

- decisão humana por artigo registrada em `KNOWLEDGE_HUMAN_APPROVAL_REGISTER.md`;
- artigo classificado como:
  - `aprovado`
  - `aprovado com ajuste`
  - `bloqueado`
- apenas os `aprovados` ou `aprovados com ajuste` saneados podem entrar em futura materialização controlada.

### Gate humano

- obrigatório: `Produto`
- obrigatório: `Suporte/CS`
- `Engenharia` só entra se o artigo abrir detalhe técnico sensível além do recorte atual

### Dependências

- `docs/knowledge/KNOWLEDGE_LEGACY_CORPUS_FINAL_READINESS_PACK.md`
- `docs/knowledge/KNOWLEDGE_HUMAN_REVIEW_READING_PACK.md`
- `docs/knowledge/KNOWLEDGE_HUMAN_REVIEW_DISTRIBUTION_PACK.md`
- `docs/knowledge/KNOWLEDGE_HUMAN_APPROVAL_REGISTER.md`
- `docs/PUBLIC_HELP_CENTER_PUBLISH_RUNBOOK.md`

### Dependências de assets

Para cada artigo público, o lote só fica `ready-for-materialization` quando houver:

- título final
- resumo final
- `body_md` final
- categoria pública definida
- decisão humana nominal de `Produto`
- decisão humana nominal de `Suporte/CS`
- indicação explícita se precisa ou não de screenshot/asset auxiliar

### Throughput mínimo proposto

- revisão humana: `4` artigos por rodada de leitura
- materialização futura com side effect: no máximo `2` artigos por lote, alinhado ao histórico conservador do runbook

### Risco editorial dominante

- publicar texto tecnicamente plausível, mas ainda sem validação formal das áreas

## Wave 4 · internal

### Escopo

Dois subgrupos, executados em sequência sem misturar gate:

1. `17` artigos a manter internos
2. `17` artigos para revisão técnica ou reescrita futura, que continuam fora da trilha pública

### Objetivo

Organizar o legado útil para operação interna sem pressionar promoção indevida para público.

### Entrada

Subgrupo A · manter internos
- tema útil para operação
- sem recorte público seguro claro
- sem exigência de publicação externa

Subgrupo B · revisão técnica ou reescrita futura
- há potencial de reaproveitamento, mas o texto atual não está pronto
- o tema ainda exige decisão funcional, recorte ou rewrite adicional

### Saída

Subgrupo A
- item permanece explicitamente na trilha `internal`
- owner de manutenção futura definido
- justificativa de não promoção para público preservada

Subgrupo B
- item fica apontado para backlog de rewrite futuro
- bloqueador técnico/editorial nominalizado
- não entra em lote público por inércia

### Gate humano

Subgrupo A
- obrigatório: `Suporte/CS`
- obrigatório: `platform_admin`
- `Produto` quando o item tocar regra funcional ou nomenclatura ambígua

Subgrupo B
- obrigatório: `Produto`
- `Suporte/CS` para avaliar clareza operacional
- `Engenharia` quando houver dependência de comportamento técnico

### Dependências

- `docs/knowledge/KNOWLEDGE_REMAINING_CORPUS_CLOSURE.md`
- `docs/KNOWLEDGE_CONTENT_CURATION_PLAN.md`
- docs específicos de cluster já preparados

### Throughput mínimo proposto

- subgrupo A: `5` a `8` itens por sessão
- subgrupo B: `3` a `5` itens por sessão, por exigir mais leitura e decisão

### Risco editorial dominante

- tratar playbook interno como candidato público apenas porque a linguagem parece segura

## Wave 5 · restricted

### Escopo

Fila de alta sensibilidade derivada de:

- `6` temas explicitamente bloqueados por risco no pacote final
- demais artigos sensíveis que, no fechamento do corpus, continuam dependentes de novo recorte técnico

Temas-base bloqueados:
- Pix e estorno
- cálculo e limites de estorno
- integrações e gateway
- integração Correios
- contrato, token e autorização técnica
- troubleshooting técnico com credenciais, logs ou permissões

### Objetivo

Manter fora da trilha pública e impedir materialização automática de conteúdo sensível até existir recorte técnico aprovado.

### Entrada

- item ou cluster com risco alto técnico/operacional/editorial;
- presença de credenciais, permissões, endpoints, integrações, troubleshooting sensível ou regra financeira/logística crítica;
- ausência de recorte público seguro aprovado.

### Saída

- item permanece `blocked-by-design` ou `restricted`;
- owner técnico nomeado para futura revisão;
- condição explícita de desbloqueio registrada.

### Gate humano

- obrigatório: `Produto`
- obrigatório: `Engenharia`
- obrigatório: `platform_admin`
- `Suporte/CS` participa para validar se existe necessidade real de documentação consumível

### Dependências

- `docs/knowledge/KNOWLEDGE_ESTORNO_SENSITIVE_CLUSTERS_CLOSURE.md`
- `docs/knowledge/KNOWLEDGE_LOGISTICA_POSTAGEM_CLUSTER_CLOSURE.md`
- `docs/knowledge/KNOWLEDGE_REMAINING_CORPUS_CLOSURE.md`
- `docs/CONTENT_OPERATIONS_GOVERNANCE.md`

### Throughput mínimo proposto

- `2` a `3` itens ou subclusters por sessão de revisão técnica

### Risco editorial dominante

- vazamento de detalhe interno ou financeiro sob aparência de documentação de ajuda

## Critérios padrão de entrada e saída por lote

### Entrada padrão

Todo lote precisa declarar explicitamente:

- classe operacional do lote
- lista de artigos incluídos
- documento canônico de referência
- dono do gate humano
- motivo de prioridade
- condição de bloqueio

### Saída padrão

Todo lote precisa sair com um dos estados abaixo:

- `ready-for-human-gate`
- `approved-for-local-materialization`
- `blocked-with-owner`
- `archived-as-legacy`
- `consolidated-into-canonical`

Evitar o estado vago `em revisão` sem dono, sem data e sem evidência.

## Métricas mínimas de throughput e controle

### Métricas de throughput

1. cobertura de fila
- `%` de itens da wave com dono humano definido
- `%` de itens com documento canônico apontado

2. cadência operacional
- artigos revisados por sessão
- artigos bloqueados por sessão
- artigos concluídos por sessão

3. prontidão para materialização
- `%` de itens com gate humano completo
- `%` de itens com assets mínimos completos

### Metas mínimas propostas

| Wave | Meta mínima de throughput | Meta mínima de qualidade |
| --- | --- | --- |
| duplicate | `1` grupo/sessão | `100%` com canônico explícito |
| obsolete | `8-10` itens/sessão | `100%` com motivo de arquivamento registrado |
| public | `4` artigos/rodada de review; `2` por lote de materialização | `100%` com `Produto + Suporte/CS` registrados |
| internal | `5-8` itens/sessão | `100%` com justificativa de permanência interna ou rewrite futuro |
| restricted | `2-3` itens/sessão | `100%` com `Produto + Engenharia` e condição de desbloqueio |

## Métricas mínimas de risco editorial

### Tolerância zero

- `0` artigos públicos sem dupla aprovação (`Produto` + `Suporte/CS`)
- `0` itens sensíveis promovidos para trilha pública sem gate técnico
- `0` perdas de rastreabilidade de `source_path` ou `source_hash`
- `0` uso de aprovação ambígua como evidência válida

### Sinais de alerta

- taxa alta de `aprovado com ajuste` sem nova rodada de saneamento
- artigos mudando de classe no meio da wave sem justificativa documental
- lote travado por falta de owner humano antes de qualquer revisão de conteúdo
- mistura de `public` com `restricted` na mesma sessão operacional

## Readiness operacional por wave

### Ready agora

- `duplicate`
- `obsolete`
- `public` para coleta de evidência humana

### Ready com owner interno definido

- `internal`

### Not ready para materialização; manter bloqueado

- `restricted`

## Regra de handoff entre waves

Um item só troca de wave quando houver evidência documental explícita.

Exemplos válidos:
- `public -> restricted` porque a revisão humana detectou detalhe sensível
- `internal -> public` porque Produto definiu recorte seguro e rewrite novo foi concluído
- `restricted -> internal` porque Engenharia removeu dependência sensível do recorte

Exemplos inválidos:
- mudar classe para “destravar a fila”
- promover para público por ausência de resposta humana
- tratar `pendente` como aprovação tácita

## Próxima execução recomendada

1. fechar `Wave 1 · duplicate`
2. fechar `Wave 2 · obsolete`
3. disparar coleta formal de evidência humana para os `8` itens da `Wave 3 · public`
4. consolidar owner e backlog da `Wave 4 · internal`
5. manter `Wave 5 · restricted` em hold até agenda conjunta de `Produto + Engenharia`

## Decisão operacional deste plano

- o legado não deve voltar a ser tratado como fila única de `58` itens
- a execução controlada deve seguir por waves pequenas e homogêneas
- `public` é a única wave com valor imediato e prontidão documental relevante
- `restricted` continua fora da trilha de materialização até novo recorte técnico governado
- qualquer execução futura com side effect precisa respeitar o gate global, o runbook de publish e o registro de evidência humana
