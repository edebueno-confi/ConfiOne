# Relatório de estado — integrações, métricas e áreas Produto/Desenvolvimento

**Data:** 03/08/2026
**Checkout canônico:** `C:\Projetos\GSO-old`
**Branch:** `codex/high-density-ui-rebuild-20260803`
**Escopo:** diagnóstico do Dashboard Gerencial e preparação do próximo lote controlado.

## Adendo de verificação posterior — 03/08/2026

Este adendo prevalece sobre as pendências visuais descritas abaixo:

- A revisão confirmou que o header interno da Visão Geral ainda estava divergente, apesar de o shell externo já ser compartilhado.
- A Visão Geral foi ajustada para uma composição de três zonas: estado das fontes à esquerda, título/contexto no centro e ação de sincronização à direita, preservando a altura compacta das demais áreas.
- O cabeçalho Comercial passou a exibir a última execução real do HubSpot.
- O cabeçalho Financeiro passou a exibir a última execução real do OMIE, ao lado da origem financeira.
- A auditoria de métricas confirmou que SLA existe no read model executivo, mas não no RPC de detalhe da aba Suporte; portanto, não foi publicado nessa tela sem ampliar o contrato SQL.
- O watermark de empresas compartilhadas e a correção de retries já estão implementados nos commits `38ec906` e `1473f89`; não são mais itens de implementação futura.

### Integridade ainda não concluída

O worker HubSpot agora lê empresas pelo watermark, mas ainda faz `upsert` direto em `hubspot_companies`, `hubspot_owners` e `hubspot_pipeline_stages` antes da promoção do run. Portanto, deals/tickets têm publicação staged/promovida, enquanto o bloco compartilhado não é atômico com o snapshot executivo. Também não há reconciliação comprovada de tombstones para empresas arquivadas/removidas.

No OMIE, a promoção do snapshot é protegida e idempotente, mas a leitura de recebíveis e o índice de clientes continuam full + serial. Não existe ainda telemetria por request/endpoint suficiente para medir retries, 429/5xx e latência individual.

### Estado de validação do adendo

- **Validado:** teste estático de layout (4 casos), `npm run web:typecheck` e captura real das oito rotas Analytics em desktop/mobile no servidor isolado 4175.
- **Parcialmente validado:** catálogo de métricas; SLA permanece disponível apenas no consolidado executivo e depende de extensão contratual para aparecer no detalhe de Suporte.
- **Não validado:** execução externa HubSpot/OMIE, tombstones e telemetria por request. O login automatizado foi limitado por `JWT issued at future` no Supabase local; a leitura visual foi feita com o estado local que o app conseguiu carregar, sem expor credenciais.

## 1. Resumo executivo

O pipeline local está operacional e o último ciclo publicado terminou com estado `fresh` nas duas fontes. Isso não significa que o fluxo esteja otimizado: a última execução levou aproximadamente **191 s**, com HubSpot processando **5.858 registros em 93 páginas** e OMIE processando **3.463 registros em 35 páginas seriais**.

As principais conclusões são:

- HubSpot possui incrementalidade real para negócios e tickets, com watermark e retomada por itens.
- O item compartilhado de empresas já recebe `updatedAfterMs`; owners e definições de pipeline ainda são relidos integralmente.
- OMIE opera corretamente como snapshot completo e serial, mas sempre percorre todos os recebíveis e ainda faz uma leitura completa do índice de clientes para enriquecimento.
- A publicação OMIE tem proteção transacional, lock, identidade única e repetição segura após conclusão; o staging é idempotente dentro do `sync_run_id`, mas não há telemetria suficiente para provar eficiência de chamadas.
- O read model de fonte separa ciclo em execução de snapshot publicado; a contagem de `retries` já foi corrigida para contar apenas tentativas adicionais.
- Customer Success ainda não pode publicar métricas de carteira: o denominador atual é o catálogo geral de empresas do HubSpot, não uma carteira aprovada.
- Produto e Desenvolvimento não têm fonte publicada nem contrato de leitura. É seguro unificar as duas áreas em uma aba de espera, desde que nenhuma métrica seja inventada e os links antigos continuem funcionando.

## 2. Estado Git e evidências locais

### Validado

- Worktree limpo no início do lote.
- HEAD no início da correção visual: `1473f89`.
- A branch está 161 commits à frente de `origin/main` e sem upstream configurado.
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

1. Owners e definições de pipeline são consultados integralmente em cada ciclo.
2. A granularidade atual de observabilidade é run/item/página/registro. Não há chamada por endpoint, latência, quantidade de 429/5xx, `Retry-After`, bytes ou custo por objeto.
3. O watermark é global por execução, com janela de sobreposição de cinco minutos. É seguro contra perda por borda, mas menos eficiente do que watermarks por objeto/fonte.
4. Não foi encontrada reconciliação explícita de tombstones para objetos removidos/arquivados do HubSpot. O catálogo de pipelines arquiva ausentes, mas o comportamento dos objetos deve ser comprovado antes de ser considerado completo.

### Conclusão

O HubSpot é **funcional e parcialmente incremental**, mas não pode ser classificado como otimizado. A propagação do watermark para empresas já foi aplicada; o próximo ganho seguro é medir chamadas por endpoint e avaliar owners/pipelines antes de alterar sua estratégia de carga.

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
- Suporte: abertas de alta prioridade já estão no consolidado executivo; cobertura de SLA no detalhe depende de extensão do RPC, sempre com estado de disponibilidade explícito.
- Financeiro: taxa de correspondência, títulos ambíguos e cobertura de reconciliação.
- Integração: duração, registros, páginas, tentativas adicionais e estado do snapshot.

### Métricas bloqueadas por contrato de negócio

- “Clientes ativos” ou carteira de CS: o catálogo HubSpot atual não define esse denominador.
- Produto e Desenvolvimento: não há fonte GitHub conectada, contrato, escopo ou KPI publicado.

Regra: enquanto o denominador ou a fonte não forem aprovados, a interface deve exibir `Indisponível`/`não consolidado`, nunca percentual ou número estimado.

## 7. Rotas e navegação

Rotas de Analytics verificadas estaticamente e por captura real no servidor isolado 4175:

- `/admin/analytics?tab=ceo`
- `/admin/analytics?tab=commercial`
- `/admin/analytics?tab=customer-success`
- `/admin/analytics?tab=support`
- `/admin/analytics?tab=finance`
- `/admin/analytics?tab=product-development`
- aliases legados `/admin/analytics?tab=product` e `/admin/analytics?tab=development`, normalizados para a aba combinada.

Foram capturadas as oito rotas Analytics e as quatro superfícies de Configurações/integração (`Integrações`, `Fontes do Dashboard`, `Histórico de sincronizações` e o alias `section=analytics`) em 1440×1000 e 390×844. Todas exibiram o título esperado, sem overflow horizontal, erros de console, falhas de requisição ou respostas 4xx/5xx durante a leitura. As capturas estão em `output/playwright/analytics-route-*.png` e `output/playwright/settings-*.png` (24 arquivos). O login automatizado pleno ficou limitado por `JWT issued at future` no Supabase local; portanto, guards/permissões e uma sincronização real continuam não validados.

### Adequação visual do header da Visão Geral

Corrigida e capturada: o estado das fontes fica à esquerda, o título/contexto no centro e a ação de sincronização à direita. Comercial exibe o último log HubSpot e Financeiro exibe o último log OMIE junto à origem financeira. A captura desktop comprova a altura compacta e a captura mobile comprova a quebra sem overflow.

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

1. Instrumentar telemetria sanitizada por provedor/endpoint: chamadas, páginas, duração, retries adicionais, 429/5xx, registros e resultado.
2. Definir retenção e read model de telemetria sem exposição de payload ou credencial.
3. Verificar tombstones/arquivamentos de objetos HubSpot e tornar a promoção do bloco compartilhado atômica com o snapshot.
4. Verificar se o OMIE suporta consulta incremental; se não, otimizar apenas cache/enriquecimento seguro.
5. Reproduzir o atraso observado com dados controlados e medir o tempo por endpoint antes de paralelizar qualquer chamada.

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

- **Validado:** estado Git, leitura dos contratos, auditoria estática dos workers, read models e RPCs, contagens locais do último ciclo, evidência de estado `fresh`, captura das oito rotas em desktop/mobile e correção do header da Visão Geral.
- **Parcialmente validado:** idempotência externa e carga de API; faltam request telemetry e prova de tombstones.
- **Não validado:** nova execução real neste lote, consulta incremental OMIE, tombstones, telemetria por request, guards de permissão em sessão autenticada e aprovação do denominador de CS.
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
- QA visual real das rotas: capturado em 1440×1000 e 390×844 no servidor isolado 4175; autenticação plena ficou limitada por `JWT issued at future` no Supabase local.
- Execução real de sincronização: não executada neste lote.
