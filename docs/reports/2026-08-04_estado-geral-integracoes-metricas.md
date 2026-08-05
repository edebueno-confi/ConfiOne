# Estado geral — integrações, métricas e superfícies operacionais

Data: `2026-08-04`

## Resumo executivo

O checkout canônico continua em `C:\Projetos\GSO-old`, na branch `main`. O
ciclo local controlado comprovou o fluxo HubSpot → OMIE, com o HubSpot em modo
incremental, staging isolado, promoção atômica e telemetria persistida. O OMIE
concluiu a leitura financeira paginada sem rejeições.

A redução de carga deixou de ser apenas uma intenção de código: há watermark,
paginação retomável, work items menores, serialização de chamadas, retry
limitado e métricas de duração, erros, retries e sucesso. Ainda não é uma
validação de produção: Edge Functions, secrets, scheduler e banco remoto não
foram alterados.

## Estado do Git

- Checkout canônico: `C:\Projetos\GSO-old`.
- Branch: `main`.
- Sem push, merge, rebase, reset, clean, deploy ou migration remota.
- O stash preservado não foi removido.
- O trabalho local deste ciclo será separado em commit próprio; branches e
  referências históricas permanecem preservadas.

## HubSpot — fluxo e evidência

O fluxo atual é:

1. iniciar um ciclo protegido e impedir concorrência;
2. criar work items por pipeline/objeto;
3. processar páginas retomáveis com lease, cursor e heartbeat;
4. usar o watermark de `hs_lastmodifieddate` nas entidades incrementais;
5. gravar somente staging durante a coleta;
6. reconciliar catálogo e promover os snapshots apenas na finalização;
7. avançar o watermark somente após cobertura e promoção bem-sucedidas.

O worker compartilhado foi dividido em `shared_companies`, `shared_owners` e
`shared_catalog`. Isso reduz o tempo de cada unidade e evita que uma coleta
global de empresas, owners e pipelines fique presa em uma única execução.
O catálogo de pipelines continua sendo lido integralmente por ser um catálogo
pequeno e necessário para descobrir/arquivar pipelines; empresas, deals e
tickets usam o recorte incremental quando há watermark.

Último ciclo local validado:

| Indicador | Resultado |
|---|---:|
| Run HubSpot | `163091cb-4ba8-4507-90d2-5911affed8e7` |
| Modo | incremental |
| Pipelines/páginas concluídos | 40 / 40 |
| Registros recebidos | 66 |
| Normalizados/aceitos/rejeitados | 66 / 66 / 0 |
| Registros promovidos | 279 |
| Paginação completa | sim |
| Watermark avançado | sim |
| Requisições | 41 |
| Retries adicionais / erros | 0 / 0 |
| Duração média por requisição | 427 ms |
| Taxa de sucesso | 100,0% |

Distribuição do último ciclo: 12 work items de deals, 25 de tickets, um de
catálogo, um de empresas e um de owners. A reconciliação do catálogo ocorre na
RPC de finalização, preservando a atomicidade do staging.

## OMIE — fluxo e evidência

O OMIE usa paginação serial, timeout, retry limitado, backoff e cache de
clientes com TTL. A coleta financeira é promovida por operação idempotente e
mantém o resultado anterior quando a execução falha.

| Indicador | Resultado |
|---|---:|
| Run OMIE | `7ef89a7b-9c1f-4ea4-9a57-7216848488b7` |
| Registros aceitos/rejeitados | 3.761 / 0 |
| Requisições | 42 |
| Retries adicionais / erros | 0 / 0 |
| Duração média por requisição | 769 ms |
| Taxa de sucesso | 100,0% |

Os últimos três ciclos locais terminaram em aproximadamente 56,5 s, 57,3 s e
63,0 s. O último excedeu 60 s; por isso o motion agora permanece aberto até a
confirmação e só depois oferece continuidade em segundo plano. Enquanto houver
execução ativa, uma segunda solicitação é bloqueada.

## Idempotência, integridade e limites conhecidos

Validado:

- chaves estáveis do provedor são usadas na promoção;
- staging é isolado por execução;
- retries não contam a primeira tentativa como retry;
- watermark não avança em falha;
- telemetria não contém payload, URL completa, token ou credencial;
- o banco local confirmou a migração e a transação de enfileiramento sem chave
  duplicada.

Ainda pendente:

- tombstones/arquivamentos explícitos para entidades removidas no HubSpot;
- regra final de deduplicação e elegibilidade da carteira de Customer Success;
- validação do ciclo com credencial remota autorizada;
- limites e alertas operacionais definidos com dados históricos maiores.

## Métricas e áreas

As métricas de qualidade foram adicionadas ao read model de telemetria:
requests, retries, rate limits, erros do provedor, falhas, duração média e
taxa de sucesso. Os campos são consumidos pelo estado do Dashboard e pelo
histórico do OMIE, sem expor detalhes técnicos ao usuário final.

Produto e Desenvolvimento permanecem fundidos na aba `Produto e
Desenvolvimento`. A estrutura está publicada e os aliases legados continuam
normalizados, mas a área permanece em espera honesta por contrato GitHub. Não
foram inventados KPIs a partir de HubSpot ou OMIE.

## Superfícies corrigidas neste ciclo

- Motion do Gênio: bloqueio durante o ciclo, opção após 60 s e aviso para não
  iniciar outra sincronização em paralelo.
- Fontes do Dashboard: ações manuais mais compactas, bloqueio durante execução
  ativa e menor consumo vertical.
- Configurações: redução de bordas pesadas, espaçamento mais compacto e ações
  agrupadas sem duplicar fluxos.
- Modo escuro: controles nativos `select`, `option` e `optgroup` receberam
  tokens coerentes, eliminando menu branco com texto claro ilegível.
- Knowledge: a ação Gerenciar categorias agora abre uma superfície real de
  criação/listagem; a grade principal usa `min-w-0` e tabela com largura
  controlada para não cobrir o botão Editar.
- Analytics: contexto de fonte/log foi alinhado por área e a aba Produto e
  Desenvolvimento foi consolidada.
- Rolagem: não foi adicionada rolagem artificial. Ela permanece somente em
  tabelas/listas intrinsicamente longas; o layout usa compactação e largura
  disponível para evitar scroll desnecessário.

O cockpit completo de Configurações, a revisão integral do copy e a
refatoração visual final da lista de Conhecimento ainda não devem ser tratados
como concluídos apenas por esta correção estrutural.

## Rotas e QA visual

Rotas publicadas auditadas estruturalmente:

- `/admin/analytics`;
- `/admin/knowledge` e editor/novo artigo;
- `/admin/settings`, `/admin/settings/integrations`,
  `/admin/settings/dashboard-sources` e `/admin/settings/sync-history`;
- abas `ceo`, `commercial`, `customer_success`, `support`, `finance` e
  `product-development`.

Evidência Playwright local:

- smoke autenticado: 10 combinações de persona/viewport, sem erros de
  console, página, request ou resposta inesperada;
- matriz do Dashboard: 100 capturas em 10 superfícies e 5 viewports, sem
  console error, request failure, resposta inesperada ou overflow horizontal;
- preview de Configurações: 18 capturas, 24 checks, sem erro de console,
  request, overflow horizontal ou copy técnico indevido;
- Knowledge: ação Gerenciar categorias abriu a superfície real, com captura
  dedicada e sem overflow horizontal;
- artefatos: `output/local-qa/` e
  `output/settings-control-plane-v2-preview/manifest.json`, além de
  `output/dashboard-runtime-v3-preview/manifest.json`.

Captura dedicada do Knowledge: `output/local-qa/closing-knowledge-category-manager.png`.
O smoke acionou Gerenciar categorias, confirmou a abertura da superfície Nova
categoria e não encontrou overflow horizontal. A captura foi feita no
servidor local já ativo; o ruído de HMR do dev server não foi usado como
evidência de produto.

## Validações executadas

Aprovados:

- 106 testes Node focados de sync, telemetria, rotas, Analytics, Knowledge e
  Configurações;
- `npm run contracts:typecheck`;
- `npm run web:typecheck`;
- `npm run web:build`;
- `npm run supabase:lint:db`;
- `npm run local:qa:secret-scan` — zero correspondências;
- `npm run quality:changed` — aprovado, zero findings;
- `npm run local:qa:smoke` em porta isolada 4176;
- `node scripts/local-qa/settings-control-plane-v2-preview.mjs`;
- `npx supabase db push --local --yes` — banco local atualizado;
- pgTAP focado das migrations 097–101 — aprovado no ciclo completo executado.

Parcial/não aprovado:

- `npm run supabase:test:db` completo não é um sinal confiável enquanto o banco
  local preserva os dados manuais: fixtures antigas usam IDs fixos e falham
  por colisão, além de expectativas históricas de quantidade de pipelines e
  agendamento. O banco não foi resetado para mascarar essas colisões.
- Lint de JavaScript não está configurado no `package.json`.
- Execução remota, deploy e scheduler não foram validados.

## Backlog recomendado

### Lote imediato — segurança do dado

1. Definir e implementar tombstones/arquivamentos HubSpot com teste de
   reconciliação e preservação histórica.
2. Fechar regra de carteira Customer Success: elegibilidade, deduplicação,
   denominador e critérios de cliente ativo.
3. Adicionar alertas de qualidade para 429, aumento de duração, retry e
   divergência de watermark.

### Lote seguinte — produto e superfícies

1. Capturar e revisar visualmente o Knowledge refatorado, incluindo gerenciar
   categorias, Ver todas, tabela e editor limpo.
2. Finalizar cockpit de Configurações sem bordas pesadas e sem rolagem evitável.
3. Executar revisão de copy de todas as telas, removendo linguagem técnica e
   preservando estados honestos de indisponível, falha e atualização.
4. Formalizar contrato GitHub e então substituir a espera de Produto e
   Desenvolvimento por KPIs reais.

### Gate externo

- aplicar migrations nas instâncias autorizadas;
- publicar Edge Functions;
- configurar secrets sem expô-los;
- executar um ciclo remoto read-only controlado;
- só depois habilitar scheduler e preparar publicação editorial dos artigos
  Octadesk já revisados.

## Classificação final

- HubSpot: **validado localmente no fluxo incremental e na telemetria; remoto
  não validado; tombstones pendentes**.
- OMIE: **validado localmente na coleta/promocão e telemetria; remoto não
  validado**.
- Idempotência e carga: **parcialmente validadas**, com evidência real de três
  ciclos e sem erros/retries no último; histórico de dados maiores ainda exige
  monitoramento.
- Rotas e shell: **validado estruturalmente e em smoke autenticado local**.
- Knowledge/Configurações: **parcialmente validados**, com capturas reais,
  smoke da ação de categorias e testes de contrato; aprovação visual final do
  design completo ainda pendente.
- Produto e Desenvolvimento: **validado estruturalmente, KPI não validado**.
- Deploy/scheduler remoto: **não validado; depende de credencial e
  autorização externa**.
