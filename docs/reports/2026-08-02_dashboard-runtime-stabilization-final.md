# Relatório Delta — Dashboard Runtime Stabilization

Data: 02/08/2026
Checkout: `C:\Projetos\GSO-old`
Branch: `codex/dashboard-runtime-stabilization-20260802`
Status: **parcialmente validado**

## 1. Resumo executivo

O runtime do Dashboard foi estabilizado em lifecycle, semântica de frescor,
sanitização de erros, histórico, configurações, Fontes do Dashboard e estados
visuais. No ciclo controlado final, o HubSpot concluiu 38/38 work items e
promoveu 92 registros. O OMIE read-only falhou com HTTP 500/SOAP do provedor;
o ciclo geral foi corretamente publicado como `partial`, preservando o último
snapshot válido de 3.451 registros.

## 2. Estado Git inicial

O trabalho foi preservado na branch dedicada criada a partir do checkout
canônico. Nenhum reset, clean, merge, rebase, cherry-pick, push ou alteração
remota foi executado. O stash existente permaneceu preservado.

## 3. Skills utilizadas

Foram aplicadas as skills `frontend-design`, `gso-operational-design`,
`web-design-guidelines`, `ux-friction-analyzer`, `ui-ux-specialist`,
`data-analytics:design-kpis`, `genius-code-quality` e
`artifact-template-design-report`, conforme registrado no relatório técnico
principal.

## 4. Reprodução dos erros

Foram reproduzidos e tratados: run HubSpot preso em execução, estados
contraditórios de fonte, falhas OMIE não sanitizadas, histórico excessivamente
alongado, ausência de retry seguro e falhas de contrato causadas por referência
à migration errada no teste de lifecycle.

## 5. Runs órfãos encontrados

Foi encontrado um run HubSpot órfão com status operacional inconsistente. Ele
foi reconciliado para `timed_out`, preservando o snapshot válido anterior de
36.315 registros promovidos. O run também mantinha 18 work items em estado
ativo; a migration `20260802235035_dashboard_reconcile_hubspot_leases_v1.sql`
os marcou como `abandoned`, removeu `lease_owner`/`lease_expires_at` e deixou o
read model com `active_items=0`, sem apagar staging ou histórico.

## 6. Lifecycle implementado

O lifecycle agora distingue `queued`, `running`, `succeeded`, `failed`,
`partial`, `timed_out`, `cancelled` e `abandoned`. A migration forward-only
`20260802160000_dashboard_sync_lifecycle_reconciliation_v1.sql` encerra
etapas pendentes ligadas a ciclos ou runs expirados. A migration posterior
`20260802235035_dashboard_reconcile_hubspot_leases_v1.sql` também libera leases
de work items associados a runs `timed_out` ou `abandoned`.

O enfileiramento do HubSpot foi corrigido pela migration
`20260803000635_dashboard_hubspot_start_source_state_v1.sql`: `source_state`
permanece nulo até que o worker produza evidência real, sem misturar estado de
execução com frescor publicado. A reconciliação do catálogo foi corrigida pela
`20260803001447_dashboard_hubspot_catalog_service_identity_v1.sql`, usando
`app_private.is_internal_service_request()` e mantendo o RPC concedido apenas
ao `service_role`.

## 7. Ciclo pai HubSpot → OMIE

O orquestrador cria ciclo pai, correlation ID e etapas separadas. HubSpot é
processado antes do OMIE; uma falha terminal do HubSpot não impede o Financeiro,
mas o resultado do ciclo passa a `partial`. O ciclo real anterior
`c93a5302-39c9-475f-a927-ac90cdf51177` foi concluído em aproximadamente 43,09 s.
Após o preflight e a reconciliação de leases, a única execução adicional
autorizada foi o ciclo `5f5b8516-e4f7-4b29-8773-725c9682a4cd`, concluído em 50 s
com HubSpot falho e OMIE concluído; o Histórico publicou o ciclo e as duas
etapas relacionadas.

Após as duas correções forward-only, o ciclo final
`ef24b317-d7c4-4b2f-a869-871ef162d8a5` publicou HubSpot sucedido no run
`773a0c55-3f5a-4c6a-8356-2c8a40f0c7b4`, com 38/38 work items e 92 registros
promovidos. O OMIE falhou no run `34f67644-ebc0-49cb-bba4-e04482194cd3` com
`provider_transient_error`; o ciclo ficou `partial` e não restaram itens ativos.

## 8. Causa raiz OMIE

O endpoint oficial `financas/contareceber`, método `ListarContasReceber`,
payload paginado e credenciais server-side foram confirmados. A execução final
falhou com HTTP 500 e corpo SOAP `Unexpected response from server`; o código
classificou isso como `provider_transient_error`. Como execuções anteriores
concluíram 3.451/3.451, a evidência delimita uma instabilidade transitória do
provedor, não uma falha de autenticação ou escrita externa. A causa não foi
remediada no provedor e não houve nova tentativa fora da política limitada.

## 9. Correção OMIE

O cliente OMIE classifica falhas por categoria, faz no máximo três tentativas
por chamada para HTTP 429/5xx, timeout ou rede, preserva contexto interno e
publica apenas erro sanitizado. Na execução final, as tentativas foram
esgotadas sem promover dados; o snapshot válido anterior de 3.451 registros
permaneceu preservado.

## 10. Política de retry

Não há retry direto na tela Financeiro. A atualização permanece centralizada em
Fontes do Dashboard e o usuário é encaminhado ao Histórico ou à configuração
do OMIE quando necessário.

## 11. Sanitização

Views, RPCs e UI não retornam SOAP, stack trace, token, segredo ou mensagem
interna. A migration `20260802190000_hubspot_error_sanitization_v1.sql` remove
`run.error_message` do read model de progresso; falhas mostram mensagens
operacionais sanitizadas e preservam o contexto técnico somente no
armazenamento interno autorizado.

## 12. Contrato de status

`rpc_analytics_source_status()` separa `currentRunStatus` do
`publishedSourceStatus`, além de expor tentativa, último sucesso, última falha,
contadores, frescor e existência de snapshot válido.

Após o ciclo final, HubSpot aparece como execução sucedida e fonte `fresh`, com
snapshot válido e 92 registros promovidos. OMIE aparece como execução falha e
fonte `failed`, mas com snapshot válido, último sucesso de 3.451 registros e
erro sanitizado. Não há ciclo ativo; não há combinação de “dados atualizados”
com “sincronização não registrada”.

## 13. Verdade das métricas

Dados ausentes permanecem `Indisponível`. Conversão só é calculada quando há
denominador válido. Customer Success continua indisponível até definição
aprovada da carteira real; o catálogo geral de empresas não é usado como
denominador inventado.

## 14. Visão Geral

A Visão Geral passou a usar estado agregado coerente de HubSpot e OMIE, sem
duplicação de status nem filtro por domínio. A reconstrução visual ampla da
Visão Geral não faz parte deste lote e permanece pendente de aprovação visual.

## 15. Financeiro

Financeiro usa OMIE como fonte exclusiva, não oferece retry direto e passou a
compartilhar o grid editorial de KPIs do piloto Comercial. A ausência de
snapshot e falhas do provedor são exibidas sem fabricar valores.

## 16. Integrações

A superfície foi reduzida a HubSpot e OMIE. HubSpot cobre empresas, Comercial,
Customer Success e Suporte; OMIE cobre Financeiro. O modo permanece fixo como
API, e as credenciais não retornam à interface.

## 17. Fontes do Dashboard

Fontes mantém catálogo configurável, ativação explícita, alias, área e origem.
As ações são autenticadas e rastreáveis; a atualização manual permanece
read-only em relação aos provedores externos.

## 18. Catálogo de pipelines

O catálogo local observado contém 37 itens não arquivados e ativos: 12 deals e
25 tickets. O preflight server-side confirmou 35 pipelines não arquivados no
HubSpot (11 deals e 24 tickets), cobertura local 35/35 e 0 arquivados no
provedor. Os dois itens adicionais são fixtures `qa-local-*`, mantidos para
testes locais; pipelines externos não foram omitidos. Pipelines são
inventariados sem apagar histórico; itens ausentes podem ser arquivados no
catálogo conforme contrato.

## 19. Histórico

O Histórico agora mostra ciclos pai, etapas e execuções diretas sem ciclo. Os
ciclos são recolhíveis para reduzir rolagem e preservar rastreabilidade.

## 20. Hook de commit

O hook `.githooks/pre-commit` executou normalmente em commits reais sem
`--no-verify` e passou pelo `quality:staged`. O teste dedicado cobre arquivo
novo, alterado, removido, renomeado, Markdown, skill, diretório removido,
nenhum staged e falha real do gate.

## 21. Segurança

Não houve alteração de segredo, migração remota, deploy, push ou escrita externa
no HubSpot/OMIE. Secret scan terminou sem correspondências. Tokens e credenciais
não foram incluídos em código, relatório ou evidência.

## 22. Testes

Os contratos focados anteriores terminaram em 11/11, incluindo o preflight. O
pgTAP focado de runtime terminou agora em 55/55 nos arquivos 091–096,
incluindo a liberação das leases órfãs, o enfileiramento correto do HubSpot e a
identidade interna do catálogo. O teste do hook terminou em 1/1 e o
contrato de exportação em 1/1. Na matriz Node selecionada deste fechamento,
105 de 108 testes passaram; os 3 restantes são contratos históricos
incompatíveis com a semântica atual (`analytics-diagnostic-runtime` e dois
casos antigos de estados do Dashboard-02), sem relação com a reconciliação
implementada. Typecheck, build e secret scan passaram. O lint do banco retornou
exit code 0, mas mantém diagnósticos preexistentes da extensão pgTAP e avisos
legados de funções administrativas; nenhum aponta para a migration nova.
Na matriz focada final desta continuação, 63/63 testes Node passaram; o pgTAP
correto dos arquivos 091–096 passou em 55/55.

## 23. Code Quality

`quality:changed`, módulos de Analytics/Settings/Knowledge e `quality:staged`
foram aprovados sem blockers. O lint npm geral não é configurado no projeto.

## 24. Execução real controlada

Foram executadas duas chamadas autenticadas controladas no runtime local
efêmero, sem escrita externa nos provedores. A segunda foi a única chamada
adicional autorizada após o preflight; não houve repetição automática:

- ciclo: `c93a5302-39c9-475f-a927-ac90cdf51177`;
- correlation: `faeadb22-1413-4666-92c5-59c05ab42f60`;
- resultado: `partial`;
- HubSpot: etapa `failed`, sem `run_id`; a evidência original registrou
  `authentication required`, agora classificado internamente como
  `authentication_error` e exposto apenas como mensagem funcional sanitizada;
- OMIE: etapa `succeeded`, run `a528656b-9800-4312-8ab5-a8b3f7304b29`, 3.451
  aceitos e 0 rejeitados;
- snapshot financeiro: promovido;
- duração observada pelo cliente: 43.090 ms.

Na segunda chamada controlada:

- ciclo: `5f5b8516-e4f7-4b29-8773-725c9682a4cd`;
- correlation: `33eace55-16ca-4178-86f2-018e946979b8`;
- resultado: `partial`;
- HubSpot: etapa `failed`, sem novo `run_id`, exposta apenas como
  `Não foi possível concluir a leitura do HubSpot.`;
- OMIE: etapa `succeeded`, run `493a5e9b-6618-48d7-9a7d-d2493bb7dafc`, 3.451
  aceitos e 0 rejeitados;
- snapshot financeiro: `fresh` e promovido;
- duração observada pelo cliente: aproximadamente 50 s;
- após a chamada: 0 ciclos ativos.

Na execução final após as duas migrations:

- ciclo: `ef24b317-d7c4-4b2f-a869-871ef162d8a5`;
- correlation: `3f03ab59-c54f-44cd-8d91-d93a8d30a67d`;
- HubSpot: run `773a0c55-3f5a-4c6a-8356-2c8a40f0c7b4`, `success`, 38/38 work
  items e 92 registros promovidos;
- OMIE: run `34f67644-ebc0-49cb-bba4-e04482194cd3`, `failed`,
  `provider_transient_error`, HTTP 500/SOAP interno, 0/0/0 nesta tentativa;
- ciclo geral: `partial`, sem ciclos ou work items ativos;
- o read model expôs apenas o erro sanitizado e conservou o snapshot OMIE
  anterior de 3.451 registros.

Antes dela, o ciclo órfão `e2e580d9-34be-474a-b359-a671f48440f2` foi
reconciliado como `timed_out`, com suas etapas encerradas. O segredo local
efêmero e o processo de Functions foram removidos após a execução.

## 24.1 Preflight HubSpot somente leitura

Após a execução controlada, foi executado um preflight autenticado em runtime
local efêmero, sem iniciar ciclo, criar `run_id`, promover snapshot ou escrever
no HubSpot. O resultado foi `ready`: credencial server-side configurada,
endpoint alcançável, resposta válida e 35 pipelines não arquivados retornados
(11 de negócios e 24 de tickets; 0 arquivados).
O contrato também informou `writesExternalData=false`. O correlation ID foi
`codex-preflight-20260802`. O processo de Functions e o arquivo temporário de
ambiente foram removidos ao final; nenhum valor de credencial foi exibido ou
versionado.

O preflight confirma que a credencial atualmente acessível pelo runtime local
responde ao endpoint de pipelines. A cobertura do catálogo local foi de 35/35
pipelines vivos, sem ausências; os 2 registros locais adicionais são entradas
`qa-local-*` preservadas para QA e não representam pipelines externos. O
preflight não reclassificou o ciclo anterior, que permanece `partial`; a única
execução adicional autorizada ocorreu depois dele e também terminou `partial`
porque a inicialização do HubSpot falhou antes de criar novo run. Nenhum ciclo
adicional foi repetido.

## 25. QA Preview

O preview empacotado do Dashboard produziu 20 capturas reais. O manifesto
registrou zero erros de console, page errors, request failures, overflow,
respostas inesperadas, cópia proibida, contradições ou retry financeiro direto.

## 26. Screenshots

Artefatos: `output/dashboard-runtime-v3-preview/manifest.json` e os PNGs da
matriz de Visão Geral, Financeiro, Integrações, Fontes e Histórico em claro e
escuro, nos viewports 1440×900 e 390×844. A captura visual autenticada do editor
de artigos permanece pendente por redirecionamento do preview para `/login`.

## 27. Arquivos alterados

Principais arquivos do lote: funções de sincronização HubSpot/OMIE, migrations
forward-only de lifecycle e sanitização do read model, componentes de
Analytics/Settings/Knowledge, CSS, testes focados e documentação em
`docs/reports/`. O endurecimento final deste lote também inclui
`supabase/migrations/20260802235035_dashboard_reconcile_hubspot_leases_v1.sql`,
`supabase/tests/094_dashboard_runtime_reconcile_leases_v1.sql` e
`tests/scripts/pre-commit-hook-contract.test.mjs`.

As duas correções finais também incluem
`supabase/migrations/20260803000635_dashboard_hubspot_start_source_state_v1.sql`,
`supabase/tests/095_dashboard_hubspot_start_source_state_v1.sql`,
`supabase/migrations/20260803001447_dashboard_hubspot_catalog_service_identity_v1.sql`
e `supabase/tests/096_dashboard_hubspot_catalog_service_identity_v1.sql`.

## 28. Commits

Commits locais relevantes:

- `9da38ec` — lifecycle de falhas e abandonos;
- `f25ed42` — reconciliação de etapas;
- `205575c` — delta de estabilização;
- `9d55204` — editor, Histórico e Financeiro;
- `108ae6b` — limite de captura do editor;
- `f9554d3` — contrato da migration de reconciliação atual.
- `f5d4495` — classificação segura dos erros HubSpot e barreira do read model.

Commit adicional deste fechamento: `32af69c` — preflight HubSpot protegido,
somente leitura e sanitizado.

Commit posterior de endurecimento da exportação: `caf7d80` — PNG/PDF ficam
indisponíveis quando as abas selecionadas não possuem snapshot exportável,
com guarda também nos handlers e teste de contrato.

Commits deste lote de estabilização: `078081d` — cobertura do hook real sem
`--no-verify`; `3a748cd` — reconciliação e liberação de leases de runs órfãos.

Commits técnicos finais: `7dadc60` — corrigir o enfileiramento de `source_state`
do HubSpot; `d099d75` — alinhar a identidade interna do catálogo HubSpot.

## 29. Estado Git final

Branch atual: `codex/dashboard-runtime-stabilization-20260802`. HEAD:
o valor final deve ser consultado com `git rev-parse --short HEAD`. O último
HEAD de código antes dos commits documentais foi `d099d75`; o worktree será
limpo após o commit documental. A divergência deve ser consultada com
`git rev-list --left-right --count origin/main...HEAD`.
Não há upstream configurado e nenhum push foi executado. Após os commits
técnicos, o worktree contém apenas a atualização documental deste relatório e
de `docs/PROJECT_STATE.md`, que será registrada separadamente.

## 30. Limitações

O ciclo sequencial mais recente permanece `partial`: o HubSpot concluiu a
leitura com 92 registros promovidos; o OMIE falhou com HTTP 500/SOAP após as
tentativas limitadas. A falha está delimitada como `provider_transient_error` do
provedor externo, com mensagem SOAP protegida e mensagem sanitizada na UI. O
snapshot OMIE anterior de 3.451 registros permanece preservado. Não haverá nova
tentativa automática nem novo ciclo sem autorização; a recuperação do provedor
externo depende de disponibilidade/credencial externa.
O denominador de Customer Success ainda depende de decisão de domínio. O
rebuild completo de Artigos e categorias não foi iniciado neste lote. A
exportação PNG/PDF existente foi apenas endurecida para não oferecer arquivo
quando não há dados exportáveis; a revisão visual profissional continua
pendente.

## 31. Decisões pendentes

1. Acompanhar a disponibilidade do provedor OMIE e executar nova leitura apenas
   em lote autorizado, sem retry automático.
2. Aprovar o denominador operacional de Customer Success.
3. Validar visualmente o editor autenticado.
4. Iniciar, em lote separado, o rebuild da tela de Artigos, categorias e a
   revisão visual da exportação profissional PNG/PDF.

## Critérios de aceite

Os critérios de lifecycle, status, sanitização, Financeiro sem retry, catálogo,
hook e testes focados estão comprovados. O ciclo sequencial real foi
representado e publicado como `partial`, com HubSpot sucedido e OMIE falhando
por HTTP 500 externo; a causa foi delimitada, mas a recuperação do provedor e
a rodada final de QA empacotado continuam pendentes. O lote permanece
`parcialmente validado` e não é declarado concluído.
