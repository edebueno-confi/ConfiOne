# Relatório Delta — Dashboard Runtime Stabilization

Data: 02/08/2026
Checkout: `C:\Projetos\GSO-old`
Branch: `codex/dashboard-runtime-stabilization-20260802`
Status: **parcialmente validado**

## 1. Resumo executivo

O runtime do Dashboard foi estabilizado em lifecycle, semântica de frescor,
sanitização de erros, histórico, configurações, Fontes do Dashboard e estados
visuais. Uma execução controlada local criou o ciclo pai e concluiu o OMIE
read-only com 3.451 registros aceitos; o resultado geral foi `partial` porque
o HubSpot recusou a autenticação. O tratamento de erro foi endurecido para
classificar autenticação, evitar retry indevido e impedir mensagem bruta no
read model.

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
36.315 registros promovidos.

## 6. Lifecycle implementado

O lifecycle agora distingue `queued`, `running`, `succeeded`, `failed`,
`partial`, `timed_out`, `cancelled` e `abandoned`. A migration forward-only
`20260802160000_dashboard_sync_lifecycle_reconciliation_v1.sql` também encerra
etapas pendentes ligadas a ciclos ou runs expirados.

## 7. Ciclo pai HubSpot → OMIE

O orquestrador cria ciclo pai, correlation ID e etapas separadas. HubSpot é
processado antes do OMIE; uma falha terminal do HubSpot não impede o Financeiro,
mas o resultado do ciclo passa a `partial`. O ciclo real `c93a5302-39c9-475f-a927-ac90cdf51177`
foi concluído em aproximadamente 43,09 s com correlation ID
`faeadb22-1413-4666-92c5-59c05ab42f60`.

## 8. Causa raiz OMIE

As falhas observadas foram delimitadas como respostas HTTP 429/5xx, timeout,
rede, autenticação, payload inválido e concorrência do provedor (`8020`/
`REDUNDANT`). O erro SOAP legado não é causa publicada na interface e não é
mais exposto ao usuário.

## 9. Correção OMIE

O cliente OMIE classifica falhas por categoria, preserva contexto interno e
publica apenas erro sanitizado. A execução read-only concluída registrou 3.451
aceitos e zero rejeitados.

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
25 tickets. Pipelines são inventariados sem apagar histórico; itens ausentes
podem ser arquivados no catálogo conforme contrato.

## 19. Histórico

O Histórico agora mostra ciclos pai, etapas e execuções diretas sem ciclo. Os
ciclos são recolhíveis para reduzir rolagem e preservar rastreabilidade.

## 20. Hook de commit

O hook `.githooks/pre-commit` executou normalmente. O commit final de teste foi
criado sem `--no-verify` e passou pelo `quality:staged`.

## 21. Segurança

Não houve alteração de segredo, migração remota, deploy, push ou escrita externa
no HubSpot/OMIE. Secret scan terminou sem correspondências. Tokens e credenciais
não foram incluídos em código, relatório ou evidência.

## 22. Testes

Os contratos focados terminaram em 11/11, incluindo o contrato do preflight. O pgTAP focado de runtime terminou em
40/40 incluindo a barreira do read model sanitizado. Typechecks, build, secret
scan e testes de contratos anteriores permanecem aprovados.

## 23. Code Quality

`quality:changed`, módulos de Analytics/Settings/Knowledge e `quality:staged`
foram aprovados sem blockers. O lint npm geral não é configurado no projeto.

## 24. Execução real controlada

Foi executada uma única chamada autenticada no runtime local efêmero, sem escrita
externa nos provedores:

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

Antes dela, o ciclo órfão `e2e580d9-34be-474a-b359-a671f48440f2` foi
reconciliado como `timed_out`, com suas etapas encerradas. O segredo local
efêmero e o processo de Functions foram removidos após a execução.

## 24.1 Preflight HubSpot somente leitura

Após a execução controlada, foi executado um preflight autenticado em runtime
local efêmero, sem iniciar ciclo, criar `run_id`, promover snapshot ou escrever
no HubSpot. O resultado foi `ready`: credencial server-side configurada,
endpoint alcançável, resposta válida e 11 definições de pipeline retornadas.
O contrato também informou `writesExternalData=false`. O correlation ID foi
`codex-preflight-20260802`. O processo de Functions e o arquivo temporário de
ambiente foram removidos ao final; nenhum valor de credencial foi exibido ou
versionado.

O preflight confirma que a credencial atualmente acessível pelo runtime local
responde ao endpoint de pipelines. Ele não reclassifica o ciclo anterior, que
permanece `partial`, e não substitui uma nova execução sequencial autorizada.

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
`docs/reports/`.

## 28. Commits

Commits locais relevantes:

- `9da38ec` — lifecycle de falhas e abandonos;
- `f25ed42` — reconciliação de etapas;
- `205575c` — delta de estabilização;
- `9d55204` — editor, Histórico e Financeiro;
- `108ae6b` — limite de captura do editor;
- `f9554d3` — contrato da migration de reconciliação atual.
- `f5d4495` — classificação segura dos erros HubSpot e barreira do read model.

Commit adicional deste fechamento: `18e1222` — preflight HubSpot protegido,
somente leitura e sanitizado.

## 29. Estado Git final

Branch atual: `codex/dashboard-runtime-stabilization-20260802`. HEAD:
`18e1222`. Worktree será limpo após o commit documental. A divergência deve ser
consultada com `git rev-list --left-right --count origin/main...HEAD`.
Não há upstream configurado e nenhum push foi executado.

## 30. Limitações

O ciclo sequencial já executado permanece com falha de autenticação histórica,
embora o preflight posterior tenha confirmado credencial server-side presente,
endpoint alcançável e resposta válida. Uma nova execução completa não foi
repetida neste lote. O código classifica esse cenário como
`authentication_error`, não faz retry automático e não repete o ciclo sem
autorização.
O denominador de Customer Success ainda depende de decisão de domínio. O
rebuild completo de Artigos, categorias e exportação PNG/PDF profissional não
foi iniciado neste lote.

## 31. Decisões pendentes

1. Autorizar um novo ciclo completo HubSpot → OMIE em lote separado, usando o
   preflight como gate e sem repetir automaticamente.
2. Aprovar o denominador operacional de Customer Success.
3. Validar visualmente o editor autenticado.
4. Iniciar, em lote separado, o rebuild da tela de Artigos, categorias e
   exportação profissional PNG/PDF.

## Critérios de aceite

Os critérios de lifecycle, status, sanitização, Financeiro sem retry, catálogo,
hook, testes focados, QA empacotado e Git limpo estão comprovados. O critério
de execução sequencial real permanece pendente por dependência server-side; por
isso o lote não é declarado concluído.
