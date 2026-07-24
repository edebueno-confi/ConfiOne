# Handoff técnico — Genius Support OS

**Destinatário:** Claude, agente que assumirá a continuidade em colaboração com o Codex/OpenAI  
**Data:** 20/07/2026  
**Checkout canônico:** `C:\Projetos\GSO-old`  
**Branch atual:** `codex/ux-ui-rebuild-v2-discovery`

## Objetivo

Este documento registra o estado técnico do Genius Support OS no encerramento
desta frente: entregas, decisões, contratos, validações, riscos e sequência
recomendada de continuidade. Ele deve ser lido junto com os documentos
canônicos do repositório; não depende do histórico da conversa.

O projeto continuará sendo desenvolvido por dois agentes: Codex/OpenAI e
Claude/Anthropic. O Claude não deve aguardar a renovação dos tokens para
trabalhar. Deve executar os ciclos locais, validar as integrações disponíveis,
registrar cada decisão e deixar documentação suficiente para o Codex retomar
sem perda de contexto. Quando os tokens forem renovados, ele poderá avançar
também nas integrações que dependem de credenciais, respeitando os gates de
segurança.

## Leitura obrigatória

Antes de alterar código, leia:

1. `docs/PROJECT_STATE.md`
2. `docs/README.md`
3. `docs/ROADMAP_BUILDOUT_V3.md`
4. `docs/CODEX_EXECUTION_RULES.md`
5. `docs/VALIDATION_CHECKLIST.md`
6. `docs/ARCHITECTURE_RULES.md`
7. `docs/VIEW_RPC_CONTRACTS.md`
8. `docs/AUTH_CONTEXT_STRATEGY.md`
9. `docs/AI_GOVERNANCE.md`
10. `docs/DOCUMENTATION_LEDGER.md`
11. `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`
12. `docs/plan.md`

Relatórios de continuidade: `CODEX_CONTINUATION_HANDOFF_2026-07-17.md`,
`CODE_QUALITY_REVIEW_2026-07-20.md`, `ANALYTICS_VISUAL_EXPORT_2026-07-20.md`,
`ANALYTICS_FINANCE_READMODEL_2026-07-18.md`,
`ANALYTICS_QUALITY_AND_RECONCILIATION_AUDIT_2026-07-18.md`,
`ANALYTICS_CS_PIPELINES_RECONCILIATION_QUEUE_2026-07-19.md` e
`HUBSPOT_COMPANY_MERGE_FLOW_2026-07-19.md`, todos em `docs/reports/`.

## Estado geral

O checkout correto é `C:\Projetos\GSO-old`. A cópia
`C:\Genius Support OS` não deve ser usada para retomar Analytics.

O dashboard gerencial foi implementado dentro do produto, sem depender do
Looker. A arquitetura vigente é backend-first:

- views, RPCs, read models e Edge Functions são a fonte da verdade;
- o frontend apenas renderiza contratos e dispara comandos autorizados;
- HubSpot é a fonte operacional de CS após reconciliação;
- CS Ops é staging/migração/enriquecimento, não fonte permanente;
- a planilha financeira é fallback temporário até a API OMIE;
- tickets e suporte preservam os pipelines usados pela equipe;
- ações externas, merges, escrita em massa e secrets exigem governança,
  auditoria e validação real.

## Entregas realizadas

### Dashboard gerencial

Rota: `/admin/analytics`.

- abas Executiva, Comercial, CS/Suporte e Financeiro;
- período global compartilhado entre abas;
- presets: semana, mês atual, mês passado, trimestre atual, trimestre passado,
  ano atual, ano passado e todo o período;
- visão executiva com KPIs comerciais, suporte/CS e financeiros;
- visão histórica comparando o período atual com período anterior equivalente;
- hints de origem, fórmula e fonte;
- alertas semânticos para risco financeiro e qualidade de dados;
- clientes com saldo vencido associados a empresa, CSM e ID HubSpot;
- filas de títulos reconciliados, sem correspondência e ambíguos;
- busca por cliente/CNPJ/título e filtro por grupo econômico;
- filtros de pipelines por área, inclusão/exclusão temporária e aliases;
- exibição de área, tipo, ID, nome oficial HubSpot e alias;
- consolidação de status/responsáveis com breakdown por pipeline;
- seções extensas recolhidas por padrão;
- temas claro/escuro e cores semânticas de urgência.

### Exportação visual

O antigo `window.print()` e os controles CSV foram removidos.
`Exportar relatório` agora fica no shell global e:

- permite selecionar Executiva, Comercial, CS/Suporte e Financeiro;
- respeita o período global;
- consulta snapshots reais antes da geração;
- gera PDF dedicado, sem sidebar, header ou menu do sistema;
- gera PNG localmente, sem serviço de terceiros;
- informa bloqueio de popup.

Arquivos: `apps/web/src/features/analytics/AnalyticsShell.tsx`,
`AnalyticsReportExport.tsx` e `analytics-export.ts`.

Limite: a primeira versão é um relatório executivo estruturado com KPIs e
resumos; não replica todos os gráficos interativos com fidelidade pixel a
pixel.

### HubSpot

- integração server-side e cache local de empresas, deals e tickets;
- sincronização auditável, logs e histórico;
- ciclo de snapshot de empresas com proteção contra snapshot vazio;
- remoção de IDs arquivados/ausentes somente após carga bem-sucedida;
- captura de owners;
- configuração multi-pipeline de CS/Suporte;
- nome oficial do pipeline preservado e alias interno editável;
- reconciliação de empresas ambíguas com links e fluxo administrativo de merge;
- correção do caso Gloss para não duplicar registros no frontend;
- paginação e tratamento da busca de tickets.

Não reintroduzir automaticamente o pipeline legado de suporte. O recorte deve
seguir os pipelines ativos configurados na tela de Configurações.

### CS Ops

O importador controlado lê a aba `BD_Clientes` da planilha CS Ops, usando
parser enxuto para evitar o HTTP 546 causado por carregar todas as abas.

- hash e idempotência por fonte/arquivo/versão;
- normalização de CNPJ e HubSpot ID;
- staging, auditoria e rejeições;
- lote validado: 606 linhas aceitas, nenhuma rejeitada;
- fila de matches únicos, ambiguidades e sem correspondência;
- simulação `dry_run` na Configuração;
- prioridade da planilha nos campos autorizados;
- links HubSpot e preparação para unificação administrada.

Não escrever indiscriminadamente no HubSpot. Qualquer novo lote precisa de
ledger, dry-run, mapeamento de propriedades e evidência de retorno.

### Financeiro e OMIE

Read model: `analytics_finance_receivables`. RPC:
`rpc_analytics_finance_snapshot`.

- planilha exportada do OMIE importada localmente;
- lote validado com 3.077 títulos;
- provenance e histórico de importação;
- classificação, saldo, vencimento e situação;
- reconciliação com HubSpot;
- agrupamento matriz/filial/grupo econômico;
- filas de reconciliados, ambíguos e sem correspondência;
- busca, filtros e alertas de saldo vencido;
- adapter OMIE read-only preparado;
- parser decimal robusto, timeout e retry.

A chave OMIE permanece pendente neste checkout. Nenhuma credencial foi criada
ou exposta. Enquanto isso, o Claude deve continuar desenvolvendo o adapter,
fallback, testes, telas de configuração e reconciliação local sem bloquear o
projeto.

### Qualidade e documentação

Foram atualizados `docs/plan.md`, `docs/spec.md`,
`docs/DOCUMENTATION_LEDGER.md` e os relatórios de qualidade, reconciliação,
histórico e exportação. A documentação deve continuar sendo atualizada ao
final de cada lote relevante.

## Mapa técnico

O módulo está em `apps/web/src/features/analytics/`:

- `AnalyticsShell.tsx`: shell, abas, período e exportação;
- `AnalyticsCeoPage.tsx`: visão executiva e risco financeiro;
- `AnalyticsCommercialPage.tsx`: comercial;
- `AnalyticsCsPage.tsx`: tickets, status, responsáveis e pipelines;
- `AnalyticsFinancePage.tsx`: títulos e reconciliação;
- `AnalyticsConfigPage.tsx`: fontes, pipelines, aliases e importações;
- `AnalyticsLogsPage.tsx`: sincronizações e logs;
- `analytics-api.ts`: contratos de leitura/comandos;
- `analytics-model.ts`: modelos e mapeamentos;
- `AnalyticsReportExport.tsx` e `analytics-export.ts`: exportação visual.

As migrations recentes de Analytics estão nos prefixos
`20260719*` e `20260720*`, incluindo reconciliação por grupo econômico,
aliases, breakdowns de CS, controle de acesso, filtros server-side e histórico
executivo. Audite equivalentes antes de criar novas migrations.

Integrações: HubSpot está preparado para sincronização server-side; OMIE está
preparado read-only sem chave; GitHub ainda é backlog; origem operacional
detalhada de canais de tickets depende de dados confiáveis do HubSpot.

## Validações executadas

- `npm run web:typecheck`: aprovado;
- `npm run web:build`: aprovado; permanece aviso conhecido de chunks acima de
  500 kB;
- `npm run supabase:test:db`: aprovado, 62 arquivos e 1.164 testes;
- testes de CS migration e OMIE: 9/9 aprovados;
- `git diff --check`: aprovado nos lotes verificados;
- `npx supabase db lint --local`: executado, com diagnósticos preexistentes
  do pgTAP e avisos antigos; não considerar lint totalmente limpo;
- QA de navegador chegou à tela de login, mas não houve sessão autenticada
  para validar o fluxo completo do dashboard/exportação.

## Próximos passos para Claude

O Claude é o agente executor da próxima fase, não apenas um leitor deste
documento. Ele deve desenvolver, testar e documentar os ciclos seguintes.
Quando uma dependência externa não estiver disponível, implementar o contrato
local, o fallback explícito, os testes e a documentação; não fabricar dados.

### Imediatos

1. Renovar/configurar tokens somente pelo mecanismo seguro de secrets.
2. Criar/validar fixture administrativa e executar QA autenticado.
3. Testar período, abas, configuração e exportação PDF/PNG.
4. Configurar a chave OMIE server-side e fazer sincronização read-only.
5. Comparar títulos OMIE/API com a planilha e registrar divergências.
6. Confirmar pipelines oficiais de CS/Suporte e sincronizar tickets.
7. Revalidar o erro HTTP 400 de tickets com payload sanitizado e correlation ID.

### Alta prioridade

1. Fechar o ledger de escrita CS Ops antes de novo lote HubSpot.
2. Revisar ambiguidades distinguindo duplicidade real de matriz/filial/grupo.
3. Revalidar reconciliação financeira após a API OMIE.
4. Validar permissões do usuário restrito e fixture QA.
5. Confirmar aliases com o time operacional.

### Backlog posterior

- PDF/PNG com gráficos e detalhamento completo;
- compartilhamento governado por e-mail, se autorizado;
- integração GitHub para Produto;
- origem detalhada dos canais de tickets;
- otimização de chunks;
- suíte E2E autenticada de Analytics;
- manuais operacionais para agentes, CSMs e gerente de CS.

## Procedimento de retomada

1. Confirmar `C:\Projetos\GSO-old`, branch e `git status --short`.
2. Ler os documentos canônicos e este handoff.
3. Preservar alterações locais não relacionadas.
4. Subir Supabase local e validar baseline.
5. Executar testes de banco, typecheck e build.
6. Usar `docs/LOCAL_QA_AUTH.md` para sessão local.
7. Fazer QA autenticado antes de mudar contratos.
8. Só então usar credenciais OMIE ou executar escrita externa.
9. Atualizar plano, ledger e relatório de evidência a cada lote.

## Gates de segurança

Não executar sem autorização explícita e evidência: deploy/push remoto, alteração
de secrets, migration remota destrutiva, exclusão permanente, merge automático,
escrita em massa sem dry-run/ledger ou envio externo de mensagens. Esses gates
não bloqueiam o desenvolvimento local, a criação de adapters, testes, mocks
controlados de contrato, documentação ou preparação de configuração.

## Contrato de colaboração entre agentes

- cada agente deve ler `docs/PROJECT_STATE.md`, `docs/plan.md` e este handoff antes de agir;
- cada lote deve terminar com arquivos alterados, decisões, validações,
  pendências e status Git documentados;
- nenhum agente deve apagar ou reverter trabalho do outro sem evidência e
  decisão explícita;
- mudanças externas devem ser registradas com fonte, horário, escopo e retorno
  sanitizado;
- o agente que concluir um ciclo deve atualizar o ledger e deixar o próximo
  passo executável para o outro;
- divergências de domínio devem ser registradas como decisão pendente, nunca
  resolvidas com dado inventado;
- o Codex poderá retomar o trabalho após a próxima documentação do Claude,
  usando este arquivo e os relatórios incrementais como contexto canônico.

## Critério de conclusão da próxima fase

A próxima fase só deve ser considerada concluída quando a API OMIE estiver
configurada e reconciliada, os pipelines de tickets estiverem confirmados, a
exportação estiver validada em sessão autenticada, o ledger CS Ops estiver
fechado e banco/typecheck/build permanecerem verdes.

Continuar incrementalmente, preservar o worktree e nunca declarar integração
externa concluída sem retorno real da fonte e evidência auditável.
