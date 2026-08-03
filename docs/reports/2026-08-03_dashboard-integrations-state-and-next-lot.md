# Relatório de estado — integrações, métricas e áreas Produto/Desenvolvimento

**Data:** 03/08/2026
**Checkout canônico:** `C:\Projetos\GSO-old`
**Branch:** `codex/high-density-ui-rebuild-20260803`
**Escopo:** diagnóstico do Dashboard Gerencial e preparação do próximo lote controlado.

## 1. Resumo executivo

O pipeline local está operacional e o último ciclo publicado terminou com estado `fresh` nas duas fontes. Isso não significa que o fluxo esteja otimizado: a última execução levou aproximadamente **191 s**, com HubSpot processando **5.858 registros em 93 páginas** e OMIE processando **3.463 registros em 35 páginas seriais**.

As principais conclusões são:

- HubSpot possui incrementalidade real para negócios e tickets, com watermark e retomada por itens.
- O item compartilhado de empresas ainda é consultado sem `updatedAfterMs`; owners e definições de pipeline também são relidos integralmente.
- OMIE opera corretamente como snapshot completo e serial, mas sempre percorre todos os recebíveis e ainda faz uma leitura completa do índice de clientes para enriquecimento.
- A publicação OMIE tem proteção transacional, lock, identidade única e repetição segura após conclusão; o staging é idempotente dentro do `sync_run_id`, mas não há telemetria suficiente para provar eficiência de chamadas.
- O read model de fonte separa ciclo em execução de snapshot publicado, mas a métrica chamada `retries` soma tentativas totais, incluindo a primeira. Isso distorce a leitura operacional e será corrigido em migration forward-only.
- Customer Success ainda não pode publicar métricas de carteira: o denominador atual é o catálogo geral de empresas do HubSpot, não uma carteira aprovada.
- Produto e Desenvolvimento não têm fonte publicada nem contrato de leitura. É seguro unificar as duas áreas em uma aba de espera, desde que nenhuma métrica seja inventada e os links antigos continuem funcionando.

## 2. Estado Git e evidências locais

### Validado

- Worktree limpo no início do lote.
- HEAD: `899b0af70880476040009ecdde51ae40a186f488`.
- A branch está 156 commits à frente de `origin/main` e sem upstream configurado.
- Nenhuma sincronização externa foi disparada neste lote.
- Nenhuma credencial, token ou segredo foi lido ou exposto.

### Limitação conhecida

`npm run local:qa:verify` não passou por divergência de fixture: o verificador esperava `schedules_off=1`, mas a base local retornou `schedules_off=0`. O comando não alterou o banco. Essa falha deve ser tratada como **não validada**, não como falha do pipeline de integração.

## 3. HubSpot — qualidade da integração

### O que existe

- Cliente oficial REST com credencial mantida no servidor.
- Timeout de 20 s.
- Retry para 429 e respostas 5xx, respeitando `Retry-After` quando presente e com backoff limitado.
- Paginação de 100 registros e pequenas pausas entre páginas.
- Negócios e tickets aceitam filtro `hs_lastmodifieddate` e usam cursor/checkpoint.
- Tickets particionam consultas grandes para respeitar o limite do Search API e usam intervalos semiabertos para não duplicar fronteiras.
- Run assíncrono com lease, retomada, até cinco tentativas por item e promoção somente após conclusão do conjunto.
- Watermark só avança depois que todos os itens completam.

### Gargalos encontrados

1. `hubspot-orchestrator-worker` chama `fetchCompanies([...], token)` sem repassar `source_updated_after_ms`; empresas compartilhadas são relidas integralmente.
2. Owners e definições de pipeline são consultados integralmente em cada ciclo.
3. A granularidade atual de observabilidade é run/item/página/registro. Não há chamada por endpoint, latência, quantidade de 429/5xx, `Retry-After`, bytes ou custo por objeto.
4. O watermark é global por execução, com janela de sobreposição de cinco minutos. É seguro contra perda por borda, mas menos eficiente do que watermarks por objeto/fonte.
5. Não foi encontrada reconciliação explícita de tombstones para objetos removidos/arquivados do HubSpot. O catálogo de pipelines arquiva ausentes, mas o comportamento dos objetos deve ser comprovado antes de ser considerado completo.

### Conclusão

O HubSpot é **funcional e parcialmente incremental**, mas não pode ser classificado como otimizado. A primeira correção técnica recomendada é propagar o watermark para empresas e medir o efeito antes de alterar a estratégia de owners/pipelines.

## 4. OMIE — qualidade da integração

### O que existe

- Credencial `app_key`/`app_secret` lida somente no backend/Vault.
- API `contareceber`, páginas de até 500 registros, no máximo 100 páginas.
- Paginação serial obrigatória para evitar erro de chamadas redundantes do provedor.
- Timeout de 15 s, até dois retries adicionais para respostas transitórias.
- Validação de progresso, total autorizado, contagem de registros e rejeição de lote vazio/inconsistente.
- Snapshot anterior é preservado quando o lote novo é vazio, parcial ou inválido.
- Promoção com lock transacional, validação de identidade, `on conflict` por `(source_key, source_record_id)` e retorno persistido para repetição segura após conclusão.

### Gargalos encontrados

1. A leitura de recebíveis é full snapshot em todas as execuções; não há filtro incremental visível no contrato usado.
2. Cada sincronização faz uma leitura completa do índice de clientes para enriquecimento.
3. O staging usa `insert` em lotes por execução. A constraint impede identidade duplicada dentro do mesmo run, mas não existe telemetria para distinguir chamada repetida de página, retry do provedor e repetição de execução.
4. O tempo de 33 s para 3.463 registros/35 páginas é compatível com paginação serial, mas a qualidade real só pode ser medida com contagem e latência por chamada.

### Conclusão

O OMIE tem boas barreiras de integridade e isolamento, mas a carga é previsivelmente full + serial. A otimização deve começar por verificar se o contrato OMIE permite filtro por alteração/data; se não permitir, o caminho seguro é cachear o índice de clientes por watermark próprio e instrumentar a paginação, sem paralelizar chamadas.

## 5. Idempotência e integridade

### Veredicto

**HubSpot:** idempotência forte na promoção por identificador externo e retomada por item; incrementalidade parcial; falta reconciliação de remoções e telemetria de request.

**OMIE:** idempotência forte na publicação do snapshot e repetição segura da RPC já concluída; staging protegido por identidade única dentro do run; não há prova suficiente de idempotência de chamadas externas porque não existe request ledger/telemetria por página.

### Riscos que permanecem

- atraso ou erro do provedor pode deixar snapshot anterior correto, porém antigo;
- uma execução longa ainda pode consumir recursos relevantes antes de falhar;
- o campo `retries` do progresso superestima retries ao contar a primeira tentativa;
- ausência de tombstone pode manter registros que deixaram de existir na origem;
- Customer Success pode induzir interpretação errada se catálogo for apresentado como carteira.

## 6. Estado atual das métricas

### Publicadas com fonte identificada

- Comercial: negócios totais/abertos/ganhos/perdidos, receita ganha, conversão, ticket médio, funil, pipeline, responsável e tendência.
- Suporte: tickets totais/abertos/encerrados, taxa de encerramento, status, pipeline, responsável, fonte e tendência.
- Financeiro: títulos, valor líquido, saldo, vencido, aging, recebido, projeção, inadimplência e reconciliação.
- Executivo: ciclo médio e negócios sem responsável, altas prioridades, SLAs acompanhados, cobertura de fonte e qualidade da reconciliação.

### Métricas que podem ser ampliadas sem inventar dados

- Comercial: negócios sem responsável e ciclo médio expostos também no detalhe comercial, desde que o read model da página já os forneça.
- Suporte: cobertura de SLA e abertas de alta prioridade, sempre com estado de disponibilidade explícito.
- Financeiro: taxa de correspondência, títulos ambíguos e cobertura de reconciliação.
- Integração: duração, registros, páginas, tentativas adicionais e estado do snapshot.

### Métricas bloqueadas por contrato de negócio

- “Clientes ativos” ou carteira de CS: o catálogo HubSpot atual não define esse denominador.
- Produto e Desenvolvimento: não há fonte GitHub conectada, contrato, escopo ou KPI publicado.

Regra: enquanto o denominador ou a fonte não forem aprovados, a interface deve exibir `Indisponível`/`não consolidado`, nunca percentual ou número estimado.

## 7. Rotas e navegação

Rotas de Analytics verificadas estaticamente:

- `/admin/analytics?tab=ceo`
- `/admin/analytics?tab=commercial`
- `/admin/analytics?tab=customer-success`
- `/admin/analytics?tab=support`
- `/admin/analytics?tab=finance`
- `/admin/analytics?tab=product`
- `/admin/analytics?tab=development`

Não há evidência atual de smoke visual completo de todas as rotas neste lote. O próximo QA deve cobrir desktop e viewport estreito, guards de permissão, loading, erro, vazio e overflow.

### Pendência visual herdada: header da Visão Geral

O shell externo é compartilhado, mas a composição interna da Visão Geral ainda diverge das demais abas. O estado agregado das fontes permanece no lado direito do contexto executivo e não existe log de execução HubSpot junto à operação Comercial nem log OMIE junto ao Financeiro. Essa adequação visual continua pendente e não foi declarada como corrigida neste lote.

## 8. Fusão Produto + Desenvolvimento

Decisão técnica: **aprovada para execução UI-only neste lote**.

- nova aba: `Produto e Desenvolvimento`;
- estado: espera por integração;
- fonte declarada: GitHub, não conectado;
- sem chamadas externas e sem KPIs ilustrativos;
- aliases `product` e `development` continuam aceitos e normalizam para a aba combinada, preservando links existentes;
- métricas reais ficam pendentes de fonte, escopo e contrato aprovados.

Isso reduz a fragmentação da navegação sem mascarar a ausência de dados.

## 9. Próximo lote macro recomendado

### Lote A — qualidade do sincronismo

1. Propagar watermark para empresas compartilhadas.
2. Corrigir retries para contar apenas tentativas adicionais.
3. Criar telemetria sanitizada por provedor/endpoint: chamadas, páginas, duração, retries adicionais, 429/5xx, registros e resultado.
4. Definir retenção e read model de telemetria sem exposição de payload ou credencial.
5. Verificar tombstones/arquivamentos de objetos HubSpot.
6. Verificar se o OMIE suporta consulta incremental; se não, otimizar apenas cache/enriquecimento seguro.

### Lote B — métricas

1. Publicar somente métricas já presentes nos contratos.
2. Aprovar denominador de Customer Success.
3. Validar reconciliação financeira com contagens e valores de origem.
4. Definir contrato GitHub antes de qualquer KPI de Produto/Desenvolvimento.

### Lote C — QA e visual

1. Executar smoke de todas as rotas Analytics em 1440 e 390 px.
2. Capturar evidência real das superfícies alteradas.
3. Revalidar estados `syncing`, `fresh`, `partial`, `failed`, `stale` e `never_synced`.
4. Corrigir a fixture `schedules_off` sem reset destrutivo e repetir o verificador.

## 10. Status do relatório

- **Validado:** estado Git, leitura dos contratos, auditoria estática dos workers, read models e RPCs, contagens locais do último ciclo e evidência de estado `fresh`.
- **Parcialmente validado:** idempotência externa e carga de API; faltam request telemetry e prova de tombstones.
- **Não validado:** nova execução real neste lote, smoke visual completo de todas as rotas, consulta incremental OMIE e aprovação do denominador de CS.
- **Dependente de credencial externa:** qualquer sincronização real futura depende de credenciais válidas e autorização explícita para executar chamadas de provider.

## 11. Implementação realizada neste lote

- Produto e Desenvolvimento foram unificados na aba canônica `product-development`.
- Os aliases de URL `product` e `development` continuam aceitos e são normalizados sem quebrar links existentes.
- A tela combinada permanece em modo de espera por integração GitHub e não publica KPIs inventados.
- O read model de progresso HubSpot passou a contar retries adicionais com `greatest(attempts - 1, 0)`.
- O worker HubSpot passou a repassar o watermark incremental para a leitura de empresas compartilhadas.
- Foram atualizados os testes estáticos do contrato de navegação e do read model.

### Validação desta implementação

- 40 testes estáticos focados: aprovados.
- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado.
- QA visual e execução real de sincronização: não executados neste lote.
