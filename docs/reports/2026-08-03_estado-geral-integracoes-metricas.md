# Estado geral do sistema, integrações e métricas

Data da auditoria: `2026-08-03`

## Executive Summary

- **O ciclo local HubSpot → OMIE concluiu com sucesso**, com processamento sequencial, promoção atômica e preservação do snapshot anterior em falhas.
- **A redução de carga já está parcialmente implementada**: HubSpot usa watermark incremental e OMIE pagina em série, com cache de clientes de 15 minutos. A operação, porém, ainda não tem telemetria persistida no banco local para comprovar custo, duração e limites por chamada.
- **A integridade de identidade está boa no snapshot financeiro atual**, mas o catálogo HubSpot contém duplicidades relevantes e o cruzamento financeiro ainda deixa 18,3% dos títulos sem correspondência.
- **Produto e Desenvolvimento já estão fundidos em uma única aba**, porém a tela permanece em espera porque não existe contrato de leitura GitHub nem fonte autorizada de KPIs. Publicar números agora violaria a regra de não inventar dados.
- **O sistema está localmente validado, não pronto para declarar integração externa produtiva**: scheduler local está desativado para HubSpot, não houve nova execução externa autorizada nesta auditoria e o deploy remoto permanece pendente.

## Estado Git e superfície atual

- Checkout canônico: `C:\Projetos\GSO-old`.
- Branch: `main`.
- HEAD: `25c04cb` — correção do acesso inicial e adendo de auditoria.
- Divergência: `origin/main...HEAD = 0 168`.
- Worktree: limpo; apenas o checkout canônico está ativo.
- Stash: preservado (`stash@{0}`), sem descarte.
- Nenhum reset, clean, merge, rebase, cherry-pick, push, deploy ou migration remota foi executado nesta auditoria.

## O que foi verificado

Foram revisados o fluxo sequencial, as funções Edge, os read models, migrations de staging/telemetria, testes de contrato, rotas do release, estado local do banco e duplicidade dos dados publicados.

### Rotas

O release atual publica `/admin/analytics`, `/admin/knowledge` e `/admin/settings`. Dentro do Dashboard, a allowlist inclui Visão Geral, Comercial, Customer Success, Suporte, Financeiro e a aba única `product-development`; os aliases legados `product` e `development` normalizam para essa mesma aba.

A matriz autenticada foi reexecutada nesta auditoria em servidor temporário na porta `4176` e passou com 10/10 combinações de persona e viewport, sem erros de console, erro de página, falha de requisição ou resposta inesperada. Uma primeira tentativa isolada retornou dois `401` transitórios durante a inicialização da sessão; a repetição passou integralmente e a validação direta da aplicação já ativa em `4173` também passou sem erro. O bug de `/inicio` que levava administrador para `/access-denied` foi corrigido no commit `25c04cb`.

### HubSpot

O fluxo atual é serial:

1. inicia um ciclo protegido;
2. cria work items por pipeline e objeto;
3. usa lease/heartbeat para evitar concorrência duplicada;
4. busca páginas de 100 registros;
5. usa `hs_lastmodifieddate >= watermark` nas execuções incrementais;
6. grava staging por execução;
7. só promove quando todos os work items e a paginação terminam;
8. avança o watermark somente após sucesso completo.

Evidência local do último sucesso (`03/08/2026`):

| Indicador | Resultado |
|---|---:|
| Modo | Incremental |
| Pipelines concluídos | 38/38 |
| Páginas | 93 |
| Registros recebidos/normalizados/promovidos | 5.858 |
| Rejeitados | 0 |
| Paginação | Completa |
| Watermark avançado | Sim |
| Duração observada | aproximadamente 146 s |
| Retries adicionais no read model de progresso | 55 |

O histórico também mostra execuções full com 36.315 registros e execuções interrompidas por timeout. Isso confirma que o modo incremental reduz o volume, mas não elimina o risco operacional de ciclos longos quando há muitos pipelines ou retries.

### OMIE

O fluxo atual consulta Contas a Receber com páginas de 500 registros, serializa as chamadas para evitar o erro de concorrência do provedor, aplica timeout, retry limitado e backoff, normaliza identidades versionadas, grava staging e promove por RPC idempotente. O índice de clientes usa cache com TTL de 15 minutos e só publica cache completo.

Evidência local do último sucesso (`03/08/2026`):

| Indicador | Resultado |
|---|---:|
| Status | Concluído |
| Registros recebidos/aceitos/promovidos | 3.463 |
| Rejeitados | 0 |
| Páginas | 35 |
| Lotes de staging | 7 |
| Enriquecimento | Completo |
| Clientes correspondidos | 3.463 |
| Campos atualizados no enriquecimento | 10.389 |
| Registros sem correspondência | 0 |

## Idempotência e integridade

### Resultado positivo

- OMIE: o snapshot atual possui 3.469 linhas correntes, 3.469 identidades distintas e zero duplicidade de `(source_key, source_record_id)`.
- HubSpot: os 38.257 tickets locais possuem IDs distintos e nenhum duplicado.
- Staging é isolado por execução e a promoção é feita apenas após validação de completude.
- Falhas não avançam watermark nem substituem snapshot válido.
- Credenciais e payloads sensíveis não fazem parte da telemetria nem dos read models públicos.

### Riscos de dados encontrados

O catálogo de empresas HubSpot contém 10.328 empresas, com:

| Problema | Evidência |
|---|---:|
| Grupos duplicados por identificador fiscal | 107 grupos / 274 empresas |
| Grupos duplicados por nome normalizado | 398 grupos / 827 empresas |
| Títulos financeiros auditados | 3.469 |
| Títulos com correspondência HubSpot | 2.835 (81,7%) |
| Títulos sem correspondência | 634 (18,3%) |
| Títulos ambíguos | 121 (3,5%) |
| Títulos vencidos ambíguos | 8 |
| Saldo vencido ambíguo | R$ 4.556,40 |

Esses números não significam que a carga esteja corrompida. Eles significam que o denominador de Customer Success e os alertas financeiros não podem ser tratados como carteira consolidada sem uma regra de deduplicação, elegibilidade de cliente e resolução de identidade.

### Lacuna de atualização

As tabelas canônicas atuais não possuem coluna explícita de arquivamento/tombstone para empresas, deals ou tickets HubSpot. O fluxo incremental captura registros alterados, mas a auditoria não encontrou evidência suficiente de remoção lógica de registros que deixem de existir na origem. Esse é um risco de frescor histórico: um registro excluído ou arquivado no HubSpot pode permanecer no snapshot local até existir uma reconciliação completa governada.

## Qualidade das chamadas e consumo de API

### Implementado no código

- chamadas HubSpot serializadas por worker;
- paginação limitada e persistência de cursor;
- retries para 429/5xx com respeito a `Retry-After`;
- timeout por chamada;
- particionamento de tickets que ultrapassam o limite da Search API;
- watermark incremental para empresas, deals e tickets;
- OMIE serializado, com limite de retries e backoff;
- cache de clientes OMIE para evitar nova varredura em toda execução.

### Não comprovado no runtime

A tabela `analytics_sync_request_attempts` está vazia no banco local. Consequentemente, os campos de custo retornados pelos read models — quantidade de chamadas, retries, 429, erros do provedor, duração e última chamada — aparecem nulos para as execuções observadas.

Isso é um bloqueio de observabilidade, não uma prova de que nenhuma chamada ocorreu. O código possui buffer, observers, flush e views agregadas, mas a persistência do runtime ainda precisa ser diagnosticada e comprovada com uma execução controlada.

O scheduler local também está configurado como fixture: `enabled=true`, mas `hubspot_enabled=false` e frequência específica `off`. Não houve execução automática externa nessa configuração.

## Métricas atuais e métricas que faltam

### Disponíveis e consumíveis

- Comercial: negócios totais, abertos, ganhos, perdidos, receita ganha, conversão e ticket médio.
- Suporte: tickets totais, abertos, encerrados e taxa de encerramento.
- Financeiro: títulos, saldo, vencidos, saldo vencido, correspondência e aging.
- Customer Success: clientes ativos, responsáveis, clientes sem responsável, saúde disponível e risco.
- Sync: registros recebidos, aceitos, rejeitados, promovidos, páginas, pipelines, watermark e estado de publicação.

### Ainda não devem ser publicados como KPI

- carteira real de Customer Success, porque o critério de cliente elegível ainda não está fechado;
- Produto e Desenvolvimento, porque não há fonte GitHub nem contrato de read model;
- custo real por chamada, porque a telemetria persistida está vazia;
- remoções/arquivamentos HubSpot, porque não existe evidência de tombstone ou reconciliação de exclusões.

## Produto e Desenvolvimento

A fusão estrutural já está feita: há uma única aba `Produto e Desenvolvimento`, e os aliases `product`/`development` apontam para ela. A página está corretamente em **modo de espera por integração**, mostra as categorias previstas e exibe `Indisponível` em vez de inventar KPIs.

Não é seguro implementar números agregados nesta aba usando dados de outras áreas. O próximo passo correto é definir uma fonte e um contrato GitHub com pelo menos:

- issues abertas e bloqueadas;
- pull requests abertas e tempo de ciclo;
- releases/deploys recentes;
- incidentes e bugs;
- throughput e lead time;
- cobertura por repositório e ambiente.

Até esse contrato existir, a tela unificada deve permanecer sem métricas numéricas fabricadas.

## Pendências e bloqueios

### Alta prioridade

1. Diagnosticar por que `analytics_sync_request_attempts` não recebe eventos no runtime local e validar os agregados por provedor.
2. Adicionar estratégia de tombstone/reconciliação para registros HubSpot removidos ou arquivados.
3. Definir regra de elegibilidade e deduplicação de clientes para Customer Success.
4. Executar um ciclo controlado HubSpot → OMIE com credenciais autorizadas e comprovar o log de chamadas.

### Média prioridade

1. Automatizar a auditoria de duplicidades e cobertura de correspondência.
2. Expor no histórico a contagem de requests, retries, 429, duração e cache de enriquecimento quando a telemetria estiver confirmada.
3. Formalizar o contrato GitHub para Produto e Desenvolvimento.
4. Atualizar `docs/PROJECT_STATE.md`, que ainda contém blocos históricos apontando branches antigas e não representa sozinho o estado atual de `main`.

### Externos

- deploy remoto das Edge Functions;
- configuração/validação de secrets no ambiente alvo;
- scheduler remoto;
- execução externa autorizada;
- publicação posterior dos artigos Octadesk somente a partir do corpus editado.

## Próximo lote recomendado

1. Corrigir e provar a persistência da telemetria com uma execução controlada e sem expor segredos.
2. Adicionar teste de integridade para duplicidade, tombstone e avanço de watermark.
3. Reexecutar a auditoria de denominadores de Customer Success após definir carteira elegível.
4. Manter Produto e Desenvolvimento unidos e preparar o contrato GitHub antes de publicar KPIs.
5. Só depois avaliar deploy/scheduler e a publicação dos artigos editados da Octadesk.

## Fontes e evidências

- `supabase/functions/analytics-sequential-sync/index.ts`
- `supabase/functions/hubspot-orchestrator-worker/index.ts`
- `supabase/functions/_shared/hubspot.ts`
- `supabase/functions/_shared/omie.ts`
- `supabase/functions/_shared/omie-sync-service.ts`
- `supabase/functions/_shared/sync-request-telemetry.ts`
- `supabase/migrations/20260803140000_dashboard_sync_request_telemetry_v1.sql`
- `supabase/migrations/20260803145000_dashboard_sync_request_metrics_contract_v1.sql`
- `supabase/migrations/20260803172000_dashboard_omie_client_index_metrics_v1.sql`
- `scripts/analytics/hubspot-duplicate-summary.sql`
- `scripts/analytics/ambiguity-audit.sql`
- read-only queries executadas no Supabase local em `2026-08-03`.

## Classificação final

- Integração HubSpot: **parcialmente validada** — ciclo incremental bem-sucedido e integridade de staging comprovada; telemetria e tombstones ainda não comprovados.
- Integração OMIE: **parcialmente validada** — ciclo completo, promoção e enriquecimento comprovados; telemetria persistida ainda não comprovada.
- Rotas publicadas: **validado localmente** — release surface e smoke autenticado aprovados.
- Produto e Desenvolvimento: **validado estruturalmente, não validado como KPI** — fusão de abas feita, fonte GitHub pendente.
- Deploy/scheduler externo: **não validado** — depende de credenciais, secrets e autorização externa.
