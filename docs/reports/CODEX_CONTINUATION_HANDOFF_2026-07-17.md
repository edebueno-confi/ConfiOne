# Handoff de continuidade para o Claude — 2026-07-17

## Objetivo

Este documento registra a retomada do Genius Support OS pelo Codex para leitura
do Claude. Ele concentra fatos observados, decisões, ações, validações, riscos
e próximos ciclos; será atualizado a cada lote relevante.

## Contexto assumido

O produto é um SaaS interno B2B multi-marca para Genius e After Sale. O núcleo é
o fluxo cliente → suporte → áreas internas, com central de ajuda, portal,
inbox, clientes B2B, configurações, CS e administração. Backend, views/read
models, RPCs, RLS, permissões e auditoria são a fonte da verdade.

O foco foi explicitamente direcionado para um painel gerencial construído dentro
da ferramenta, integrado ao HubSpot e também alimentado por planilhas. O painel
não deve depender do Looker nem virar dashboard decorativo: precisa permitir
leitura, comparação e ação com fonte, frescor e limitações visíveis.

## Documentação lida e classificação

Foram inventariados 326 arquivos documentais: 88 na raiz de `docs/`, 98
relatórios, 35 documentos de Knowledge, 14 documentos de design/telas e 13
documentos do pacote `docs/mvp-reset-2026-07-06/`.

Fontes vivas e documentos aplicáveis lidos:

- `README.md`, `AGENTS.md`, `LEIA-PRIMEIRO.md`, `PRODUCT.md`, `DESIGN.md`;
- `docs/PROJECT_STATE.md`, `docs/README.md`, o charter e o journal autônomo;
- `DIAGNOSTICO-E-PLANO-DE-SIMPLIFICACAO.md` e
  `RECONSTRUCAO-DO-PRODUTO.md`;
- os documentos 01–12 do pacote `docs/mvp-reset-2026-07-06/`;
- `ROADMAP_BUILDOUT_V3.md`, regras de execução, checklist de validação,
  arquitetura, contratos de views/RPC, estratégia de auth, governança de IA,
  política e runbook de documentação, ledger e Design System V3;
- `docs/ANALYTICS_HUBSPOT.md`, migrations Analytics, Edge Function HubSpot e
  todos os arquivos atuais de `apps/web/src/features/analytics/`.

Os demais documentos foram inventariados e tratados como histórico ou material
de domínio, conforme `LEIA-PRIMEIRO.md` e `docs/README.md`. Em conflito,
prevalecem as fontes vivas e as evidências do checkout.

## Fatos observados

### Produto e roadmap

1. O MVP vigente prioriza fluxo real antes de dashboard amplo.
2. A visão de produto mais recente prevê painel gerencial em R2 com dados
   internos, HubSpot e planilhas.
3. O responsável do produto priorizou agora o painel. Isso muda a ordem do
   próximo trabalho, sem apagar o que já foi entregue.

### Analytics/HubSpot existente

- Rota `/admin/analytics`, protegida para `platform_admin`.
- Frontend com `AnalyticsShell`, abas Comercial e CS/Suporte, KPIs, funil,
  tendências, responsáveis e status.
- Tabelas: `analytics_source_config`, `hubspot_deals`, `hubspot_tickets`,
  `hubspot_owners`, `hubspot_pipeline_stages` e `hubspot_sync_runs`.
- Read models: `vw_analytics_commercial_*` e `vw_analytics_cs_*`.
- Sync server-side em `supabase/functions/hubspot-sync`.
- Token HubSpot previsto somente em `HUBSPOT_PRIVATE_APP_TOKEN`.
- IDs de pipeline são configuração no banco, não hardcode da UI.
- Métricas são calculadas no Postgres, não inventadas no frontend.

### Lacuna de planilhas

Não existe adapter, arquivo de dados, import run, mapeamento de colunas,
contrato de frescor, provenance ou read model para planilhas. Também não foram
encontrados CSV/XLS/XLSX no checkout fora das áreas ignoradas pelo inventário.

A primeira implementação recomendada é importação controlada de CSV/XLSX por
operador autorizado, com staging e registro de origem. Google Sheets deve ser
uma extensão posterior, pois exigiria conector, credencial e governança de
acesso próprios.

### Ambiente e Git

- Checkout: `C:\Projetos\GSO-old`.
- Branch: `codex/ux-ui-rebuild-v2-discovery`.
- O worktree possui muitas mudanças locais pré-existentes; nenhuma foi limpa,
  revertida ou misturada nesta retomada.
- O Supabase local está inconsistente: a fixture funcional falha porque
  `public.profiles.is_active` não existe no schema servido. Reset local não foi
  executado por ser destrutivo.
- A correção anterior do React Fast Refresh está em `apps/web/index.html`;
  typecheck, build e smoke não autenticado passaram. A rota autenticada do
  Analytics ainda depende da reidratação segura do banco local.

## Decisões desta retomada

1. Continuar no checkout atual, preservando arquitetura e alterações locais.
2. Construir o painel dentro do Genius Support OS, sem criar um Looker paralelo.
3. Tratar HubSpot e planilhas como adapters de ingestão; o dashboard lê
   contratos locais normalizados.
4. Começar por contrato, qualidade, frescor e provenance antes de ampliar
   gráficos ou adicionar fontes.
5. Implementar primeiro importação controlada de CSV/XLSX; deixar Google Sheets
   para uma fase posterior, sem credenciais ou plugin inventado.
6. Manter métricas e regras no backend/read models; o frontend apenas renderiza
   contratos e filtros autorizados.
7. Toda métrica deve declarar fonte, grão, período, timezone, denominador,
   cobertura e data da última atualização.

## Plano de ação por ciclos

### Ciclo A0 — Baseline e contrato do Analytics

- Catalogar métricas existentes, origem HubSpot e lacunas.
- Definir público, perguntas de decisão, filtros, timezone e janela padrão.
- Criar matriz de métricas: definição, grão, fonte, fórmula, cobertura,
  fallback e status disponível/indisponível.
- Revalidar banco local e separar bloqueio de ambiente do desenvolvimento.

### Ciclo A1 — Contrato de ingestão de planilha

- Criar registro de importação com hash, nome, versão, timestamp, operador,
  status e erro sanitizado.
- Definir schema canônico para dados comerciais/operacionais da planilha.
- Implementar staging, validação de cabeçalho/tipos, duplicidade, datas,
  moeda, rejeições e reconciliação.
- Definir mapeamento versionado de colunas e precedência com HubSpot.
- Cobrir RLS, grants e auditoria para `platform_admin`.

### Ciclo A2 — Read models unificados

- Criar views/RPCs que combinem somente fontes compatíveis e preservem
  `source_system`, `source_record_id`, `as_of` e `quality_status`.
- Evitar joins many-to-many sem chave de negócio aprovada.
- Reconciliar totais entre fonte bruta, staging e view final.
- Expor estados de fonte ausente, parcial, desatualizada ou sem correspondência.

### Ciclo A3 — Painel gerencial V1

- Evoluir `/admin/analytics` para summary-first: KPIs de decisão, tendência,
  drivers, filtros de período/fonte/domínio e detalhe acionável.
- Mostrar frescor, cobertura e limitações próximas dos números.
- Validar desktop 1440x900, 1366 e viewport estreito, sem overflow horizontal.

### Ciclo A4 — QA e operação segura

- Criar fixture determinística de HubSpot e planilha sem dados reais.
- Testar RLS, grants, métricas, duplicidade, datas, moeda e import idempotente.
- Fazer smoke autenticado da rota em loading, vazio, erro, indisponível,
  sucesso e fonte parcial.
- Documentar operação e rollback lógico de uma importação.

### Ciclo A5 — Conector externo, somente se necessário

- Avaliar Google Sheets/Drive ou outro conector aprovado.
- Definir credenciais, ownership, frequência, consentimento e escopo.
- Não executar sem fonte, autorização e contrato de acesso definidos.

## Gates

- `npm run contracts:typecheck` quando contratos forem afetados.
- `npm run web:typecheck` e `npm run web:build` quando frontend for afetado.
- `npm run supabase:lint:db` e `npm run supabase:test:db` para backend/migrations,
  depois de reidratar o banco local de forma autorizada.
- Reconcilição independente das métricas de maior impacto.
- QA browser real para mudanças da rota e `git diff --check`.
- Atualização deste handoff, `PROJECT_STATE`, `DOCUMENTATION_LEDGER` e docs de
  Analytics quando o estado real mudar.

## Ações executadas nesta retomada

- Inventário do conjunto documental do checkout.
- Leitura das fontes vivas, pacote MVP Reset, journal recente, regras de
  arquitetura/documentação e módulo Analytics/HubSpot.
- Auditoria do frontend Analytics, migrations, Edge Function e adapter HubSpot.
- Verificação da ausência de implementação/arquivo de planilha.
- Verificação do Git, preservando mudanças locais existentes.
- Identificação e registro do bloqueio do banco local inconsistente.
- Criação deste handoff para o Claude.

## Atualização de fontes externas — 2026-07-18

- A planilha de CS foi lida em modo somente leitura. Há um conjunto consolidado
  utilizável (`BD_Clientes`, `Dashboard_CS`, `Clusters`, `Dash_Data`) e 593
  clientes ativos na amostra observada.
- A planilha Comercial possui 44 abas diárias, com variação de datas, espaços
  nos nomes e quantidade de colunas. O parser deverá descobrir abas e normalizar
  linhas de métrica/valor, sem assumir uma aba fixa.
- As fontes e campos candidatos estão catalogados em
  `docs/ANALYTICS_METRIC_CATALOG_V1.md`.
- O servidor web local está acessível em `http://127.0.0.1:4173/`.
- A fixture administrativa não foi aplicada porque o banco local não possui a
  coluna esperada `public.profiles.email`; não houve reset destrutivo.

## Atualização do Ciclo A1 — parser comercial — 2026-07-18

- Criado `scripts/analytics/commercial-daily-sheet-parser.mjs` para normalizar
  abas diárias do Comercial sem depender de aba fixa ou posição fixa de coluna.
- O parser reconhece aliases de métricas, datas com dois/quatro dígitos,
  observações, responsável, valores numéricos e rejeições honestas.
- Criado `tests/scripts/commercial-daily-sheet-parser.test.mjs` com dois testes;
  ambos passaram após o ciclo RED/GREEN.
- Próximo passo: criar o adaptador de extração para o contrato de Google Sheets
  e o parser das abas consolidadas de CS, sem escrever nas planilhas originais.
- A tentativa não destrutiva de `supabase migration up --local --yes` foi bloqueada
  por divergência de histórico: o banco local registra migrations remotas que não
  estão presentes no checkout. Nenhum `migration repair`, `db reset` ou operação
  remota foi executado.

## Condições de parada humana

Continuam exigindo confirmação: reset destrutivo do banco, migração remota,
deploy/push de produção, uso ou alteração de secrets, conectores externos com
credenciais, dados reais sensíveis, envio externo ou operação com custo.

## Próximo lote recomendado

Continuar o Ciclo A1 com parser/validação de CSV/XLSX e fixture sintética
controlada. Não ampliar gráficos nem configurar HubSpot real antes de fonte,
qualidade e frescor serem verificáveis.

## Atualização do Ciclo A0 — 2026-07-17

- Criado `docs/ANALYTICS_METRIC_CATALOG_V1.md`.
- Consolidado o brief do painel, as métricas reais das views atuais, grãos,
  fórmulas, caveats de período/moeda/status e o contrato futuro de provenance.
- Confirmado que nenhuma métrica de planilha está disponível ainda.
- A documentação passou a registrar o Claude como destinatário do handoff.

## Atualização do Ciclo A1 — 2026-07-17

- Criada a migration `supabase/migrations/20260718014903_analytics_spreadsheet_ingestion_foundation_v1.sql`.
- Criadas as tabelas de fonte, execução de importação e linhas brutas, com hash,
  versão de mapeamento, status de qualidade, provenance, idempotência, RLS,
  grants mínimos e auditoria.
- Criado o teste `supabase/tests/050_analytics_spreadsheet_ingestion_foundation.sql`.
- A migration ainda não foi aplicada no banco local: o runtime está inconsistente
  (`public.profiles.is_active` ausente). Não foi executado reset destrutivo nem
  migration remota.

## Correção do ambiente local — 2026-07-18

- `C:\Genius Support OS` foi identificado como uma cópia separada e não como o checkout usado pelo trabalho do Claude.
- Essa cópia foi encerrada e não deve ser usada para continuidade.
- O ambiente correto é `C:\Projetos\GSO-old`, servido em `http://127.0.0.1:4173/`.
- O erro de validação da área inicial pertence ao GSO Old autenticado e é consequência do banco local divergente.
- Restaurar o shell autenticado com seed exige reidratar/resetar o banco local; essa ação permanece pendente de confirmação explícita.
- Próximo passo: implementar o parser controlado CSV/XLSX e uma fixture sintética,
  depois aplicar os gates de banco em ambiente local reidratado com autorização.

## Correção do ambiente autenticado — 2026-07-18

- A autorização para resolver o bloqueio foi recebida no pedido `resolva`.
- Foi executado `npm run supabase:db:reset` somente no banco local do GSO Old.
  O reset reaplicou as migrations do checkout, incluindo a migration de
  ingestão de planilhas e `phase3_1_admin_auth_context`.
- A view `public.vw_admin_auth_context` passou a existir novamente; a consulta
  local confirmou também `public.profiles` e 14 usuários Auth.
- As contas administrativas locais observadas estão ativas e possuem a role
  `platform_admin`.
- O erro posterior `JWT issued at future` era uma sessão antiga armazenada no
  navegador após o reset. A sessão foi encerrada e uma autenticação nova foi
  validada no shell.
- Validação funcional: `/admin` redireciona ao login quando não autenticado;
  após login, `/admin/tenants` abriu com dados seed e `/admin/analytics` abriu
  com o dashboard gerencial. O dashboard mostra zero deals e “sem histórico”,
  pois nenhuma sincronização HubSpot foi executada.
- `npm run supabase:wait:ready` passou. Nenhum banco remoto, deploy, push,
  secret ou dado externo foi alterado.
- A próxima ação continua sendo o adaptador controlado das planilhas e a
  ingestão sintética validada; a integração HubSpot real permanece deliberada
  e explicitamente não executada.

## Auditoria gerencial ampliada — HubSpot e Omie — 2026-07-18

- A integração HubSpot conectada foi consultada em modo somente leitura.
  A conta disponível é a conta `20108050`; leitura de Deals e Tickets está
  disponível.
- O HubSpot possui 2.015 Deals no total. Distribuição dos pipes atuais:
  `Pipe de Vendas` 866, `Piloto Aftersale` 1.148 e `Renovação Contratual` 1.
  Os demais pipes conhecidos na configuração existem, mas retornaram zero.
- O pipe atualmente semeado no GSO Old (`892833861`) é `Piloto Aftersale`.
  Ele não deve ser tratado automaticamente como “pipeline comercial atual”
  sem uma decisão de negócio, pois o HubSpot também possui `Pipe de Vendas` com
  866 Deals.
- O HubSpot possui 22 pipes de Tickets. Os maiores recortes observados são
  `Criadouro de Tíquetes | Aftersale` (27.530), `Suporte B2C | Confi` (7.854),
  `Tarefas manuais | Aftersale` (2.973), `Fale conosco | Confi` (2.646),
  `Service Desk` (2.541), `Suporte B2B | Confi` (859) e `CS | Neotrust` (739).
  O contrato atual do dashboard precisa permitir selecionar pipes por domínio,
  em vez de assumir um único pipe de suporte.
- Foi auditado o arquivo Omie `financas_554753004352157 (1).xlsx`: 3.077
  linhas de Contas a Receber, R$ 3.997.092,79 em valor líquido e R$
  2.546.340,20 recebidos. O detalhamento está em
  `docs/reports/OMIE_FINANCE_SOURCE_AUDIT_2026-07-18.md`.
- Não existe integração Omie no checkout. A API oficial oferece Contas a
  Receber, Contas a Pagar, Extrato, Fluxo de Caixa, Resumo e Pesquisa de
  Títulos. A implementação depende de App Key/App Secret de administrador e
  permanece bloqueada até autorização/fornecimento seguro dessas credenciais.
- Nenhuma chamada autenticada ao Omie, alteração externa ou envio de dado
  financeiro foi realizado.
