# Genius Support OS Backlog Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task with validation checkpoints.

**Goal:** concluir o backlog gerencial de integrações, migração CS, analytics, exportação e governança sem criar dados fictícios, sem alterar o suporte existente e com evidência auditável de cada lote.

**Architecture:** HubSpot, OMIE e planilhas permanecem adapters de ingestão; o Dashboard Gerencial consome read models e RPCs server-side. A planilha CS Ops continua staging temporário até o corte formal para HubSpot. Escritas externas serão feitas apenas por funções server-side idempotentes, com ledger, retry, auditoria e bloqueio de ambiguidades.

**Tech Stack:** React/TypeScript, Supabase/Postgres/RLS, Edge Functions Deno, HubSpot CRM API, OMIE API, XLSX/CSV, Vitest/pgTAP, Vite e QA local no navegador.

---

## Regras de execução

- Executar ciclos locais e reversíveis sem pedir confirmação.
- Não expor, salvar em texto ou transportar credenciais no frontend.
- Não publicar Edge Functions, alterar banco remoto, criar/alterar secrets ou executar escrita externa sem o respectivo gate de segurança.
- Não alterar tickets, pipelines ou dados operacionais de Suporte.
- Toda migração CS deve registrar origem, hash, resolução, payload, resultado e erro no ledger.
- Falhas de validação interrompem apenas o lote atual e não liberam o próximo.

## Mapa de arquivos por responsabilidade

- `apps/web/src/features/analytics/`: shell, filtros, páginas executiva, comercial, CS, financeiro, configuração, logs e contratos de apresentação.
- `supabase/migrations/`: read models, RPCs, RLS, ledger de migração, configurações e auditoria.
- `supabase/functions/analytics-spreadsheet-import/index.ts`: staging de planilhas e provenance.
- `supabase/functions/omie-sync/index.ts`: sincronização read-only de Contas a Receber com fallback de planilha.
- `supabase/functions/hubspot-cs-migration/index.ts` e `supabase/functions/_shared/cs-migration.ts`: resolução e escrita idempotente da migração CS.
- `supabase/functions/hubspot-sync/index.ts`: sincronização do cache HubSpot e histórico de execução.
- `docs/plan.md`: estado operacional corrente.
- `docs/reports/`: evidências de auditoria por ciclo.

## Ciclo 0 — baseline e proteção do worktree

**Objetivo:** confirmar checkout, dependências, banco local, processos e alterações preexistentes antes de qualquer lote.

- [x] Ler `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/ROADMAP_BUILDOUT_V3.md`, `docs/CODEX_EXECUTION_RULES.md`, `docs/VALIDATION_CHECKLIST.md`, `docs/ARCHITECTURE_RULES.md`, `docs/VIEW_RPC_CONTRACTS.md`, `docs/AUTH_CONTEXT_STRATEGY.md` e `docs/AI_GOVERNANCE.md`.
- [x] Registrar `git status --short`, branch, manifests e versões sem limpar ou reverter arquivos.
- [x] Executar `npm run web:typecheck`, `npm run web:build`, `npm run supabase:test:db` e `npx supabase db lint --local`.
- [x] Corrigir ACL ausente da função trigger `app_private.apply_dashboard_viewer_email_grant` em `supabase/migrations/20260720015816_fix_dashboard_viewer_trigger_acl.sql` e aplicar no banco local.
- [x] Criar `docs/reports/BACKLOG_EXECUTION_BASELINE_2026-07-19.md` com resultados, warnings preexistentes e arquivos já modificados.

**Resultado do baseline atual:** typecheck e build passaram. A suíte DB executou 60 arquivos/1.151 testes, mas falhou em duas expectativas antigas de ACL, no teste de configuração que ainda assume um único pipeline CS e em duas asserções de presença do cache de empresas; a função trigger sem ACL já foi corrigida. Os testes 052 e 056 serão atualizados apenas após isolar a causa do comportamento do runner, sem reduzir a cobertura.

## Ciclo 1 — OMIE API e fallback financeiro

**Objetivo:** deixar o adapter pronto para alternar de planilha para API sem mudar o contrato do dashboard.

- [ ] Auditar `supabase/functions/omie-sync/index.ts`, `analytics_finance_receivables`, `rpc_analytics_finance_snapshot` e `AnalyticsFinancePage.tsx`.
- [x] Completar validação de payload, paginação, timeout, retry limitado, idempotência por título e classificação de fonte.
- [ ] Exibir no Financeiro: fonte atual, último sucesso, atraso da fonte, quantidade recebida, saldo, vencido, a vencer, recebido, inadimplência, aging, concentração por cliente e títulos sem reconciliação.
- [ ] Manter planilha como fallback explícito quando a API estiver ausente, inválida ou indisponível; nunca misturar o mesmo título duas vezes.
- [x] Criar testes unitários para payload OMIE, normalização de datas/moedas, duplicidade, erro de autenticação e fallback.
- [ ] Validar localmente com a exportação financeira real e registrar comparação API/planilha sem credencial real.
- [ ] Gate externo: somente após a credencial server-side ser configurada, executar uma leitura autenticada e reconciliar contagem, saldo e títulos.

## Ciclo 2 — Migração completa CS Ops para HubSpot

**Objetivo:** migrar os campos de CS da planilha para empresas HubSpot, preservando suporte e mantendo auditoria.

- [x] Auditar o contrato do ledger em `20260719154632_analytics_hubspot_cs_migration_ledger_v1.sql` e completar estados `planned`, `processing`, `succeeded`, `skipped`, `failed` e `blocked`.
- [ ] Importar a aba `BD_Clientes` completa pelo importador staging, com hash de arquivo, nome de aba, linha de origem e versão de mapeamento.
- [ ] Gerar resolução por HubSpot ID, CNPJ único, nome único e grupo econômico resolvido; bloquear nome duplicado, ID inválido e conflito de campos.
- [ ] Criar empresas apenas quando não existir correspondência HubSpot segura; gravar o novo ID no ledger antes de qualquer enriquecimento.
- [ ] Atualizar somente propriedades CS mapeadas: carteira, CSM, MRR, cluster, health, prioridade, contrato e migração V1/V2. Não alterar tickets de suporte.
- [ ] Processar em lotes idempotentes pequenos, com retry seguro e leitura posterior de amostra.
- [x] Disponibilizar na Configuração a leitura do último lote CS Ops e o comando de simulação (`dry_run`), mantendo a escrita externa separada do staging.
- [ ] Produzir relatórios separados para matches seguros, criados, conflitos, ambiguidades e sem correspondência.
- [ ] Gate externo: escrita em massa no HubSpot só pode iniciar depois de o ledger local estar completo e validado; a aprovação de domínio já existe, mas o sistema ainda deve impedir alvos ambíguos.

## Ciclo 3 — Carteira local de CS

**Objetivo:** substituir o seed fictício por carteira baseada nas empresas efetivas do HubSpot.

- [ ] Auditar `apps/web/src/features/cs`, `vw_cs_customer_portfolio`, assinaturas, produtos e memberships.
- [ ] Definir o read model mínimo sem inventar health score, follow-up ou contrato ausente.
- [ ] Criar seed somente para empresas com correspondência e campos mínimos, com `source_system`, `source_record_id`, frescor e status de qualidade.
- [ ] Associar CSMs existentes de forma determinística; deixar `Sem CSM` explícito quando o HubSpot não tiver responsável.
- [ ] Validar RLS, tenant scope e leitura por papel `dashboard_viewer`.
- [ ] Registrar contagens antes/depois e divergências com o HubSpot.

## Ciclo 4 — Sincronização recorrente e observabilidade

**Objetivo:** eliminar dependência de execução manual sem perder controle.

- [x] Melhorar `AnalyticsLogsPage.tsx` com atualização manual e filtro por status, preservando erro sanitizado e contadores da execução.
- [ ] Adicionar correlação por `run_id` e retenção de histórico sem payload sensível.
- [ ] Preparar comando agendável por scheduler externo ou `pg_cron`, mantendo execução manual disponível.
- [ ] Implementar idempotência para reprocessar o mesmo arquivo ou janela temporal sem duplicar registros.
- [ ] Testar falha de worker, timeout, resposta 4xx/5xx, retomada e snapshot vazio.

## Ciclo 5 — Visão executiva e evolução histórica

**Objetivo:** entregar ao CEO evolução, risco e explicação de origem, não apenas valores do período.

- [ ] Implementar read model histórico server-side para receita, pipeline aberto, conversão, ticket médio, ciclo de vendas, tickets abertos/fechados, SLA, saldo vencido e cobertura de dados.
- [ ] Comparar período atual com período anterior equivalente e indicar crescimento, queda ou estabilidade com cores semânticas.
- [ ] Preservar o filtro global entre Visão Executiva, Comercial, CS/Suporte e Financeiro.
- [ ] Melhorar alertas financeiros com cliente, CNPJ, saldo, vencimento, CSM, contrato e link HubSpot.
- [ ] Validar estados sem dados, fonte indisponível, período sem registros e timeout.

## Ciclo 6 — Qualidade de dados e grupos econômicos

**Objetivo:** tornar reconciliação navegável e escalável.

- [ ] Manter a fila agrupada por cliente e título expansível.
- [x] Mover o filtro de grupo econômico para uma assinatura server-side do RPC, antes da paginação da resposta.
- [ ] Exibir matriz, filial, grupo, método de resolução, candidatos e motivo de bloqueio de unificação.
- [ ] Cadastrar novos grupos somente por decisão humana registrada ou associação confirmada no HubSpot.
- [ ] Validar que merges removidos do HubSpot não reaparecem no frontend por cache antigo.

## Ciclo 7 — CS Support e origem operacional

**Objetivo:** preservar o suporte atual e melhorar a explicação dos canais.

- [ ] Sincronizar novamente todos os pipelines de suporte ativos, incluindo o pipeline de Rodolfo Turra.
- [ ] Confirmar volume por pipeline, status e responsável sem duplicação.
- [ ] Mapear propriedades reais de canal, formulário, inbox, widget e WhatsApp; se não existirem, mostrar `Origem indisponível`.
- [ ] Manter aliases internos opcionais, sempre exibindo também nome oficial e ID HubSpot.
- [ ] Não criar nem mover tickets durante este ciclo.

## Ciclo 8 — Exportação e compartilhamento

**Objetivo:** permitir que uma análise filtrada seja levada para reunião sem perder contexto.

- [x] Disponibilizar exportação CSV do recorte de clientes vencidos e impressão/PDF pelo diálogo nativo do navegador, respeitando o recorte atual.
- [ ] Criar exportação PNG e PDF renderizados com período, filtros, fontes, atualização e aviso de dados indisponíveis.
- [ ] Usar renderização local segura, sem enviar dados a terceiros.
- [ ] Criar snapshot auditável para compartilhamento por link seguro; e-mail só depois de definir provider autorizado e política de dados.
- [ ] Testar tema claro/escuro, tabelas longas, quebra de página e acessibilidade.

## Ciclo 9 — Produto/GitHub

**Objetivo:** incluir desenvolvimento de produto com fonte real.

- [ ] Confirmar organização e repositórios GitHub autorizados.
- [ ] Criar adapter read-only para issues, pull requests, releases, cycle time e atividade.
- [ ] Persistir read model com provenance e janela de atualização.
- [ ] Exibir apenas métricas confirmadas; ausências permanecem indisponíveis.

## Ciclo 10 — Governança, usuários e documentação

**Objetivo:** preparar operação para uso diário por agentes, CSMs, gerente e CEO.

- [ ] Finalizar guia operacional `docs/CS_HUBSPOT_OPERATING_GUIDE.md` com rotina pós-corte.
- [ ] Documentar nomenclatura de pipelines, aliases, fontes, filtros, grupos econômicos e fila de exceções.
- [ ] Validar contrato `dashboard_viewer` e fluxo seguro de convite sem senha hardcoded.
- [ ] Criar/validar visões por equipe apenas com capacidade administrativa confirmada.
- [ ] Executar QA visual e comportamental completo nas rotas do Dashboard Gerencial.

## Critérios de conclusão

- [ ] `npm run web:typecheck` sem erros.
- [ ] `npm run web:build` sem erros.
- [ ] `npm run supabase:test:db` sem falhas.
- [ ] `npx supabase db lint --local` sem novos warnings.
- [ ] Testes de Edge Functions para OMIE, CS Ops e HubSpot verdes.
- [ ] QA no navegador para login, settings, sync, logs, visão executiva, comercial, CS, financeiro, qualidade e exportação.
- [ ] Relatório final com contagens, fontes, limitações, gates externos e status do Git.

## Ordem de execução autônoma

1. Ciclos 0, 1, 2 e 4 em paralelo quando os arquivos não se sobrepuserem.
2. Ciclo 3 após o ledger CS Ops validado.
3. Ciclos 5, 6 e 7 em paralelo sobre contratos estabilizados.
4. Ciclo 8 após o contrato final de filtros e histórico.
5. Ciclo 9 após confirmação do repositório GitHub.
6. Ciclo 10 e validação final.

O trabalho local começa pelo Ciclo 0 e pelo endurecimento dos contratos dos Ciclos 1, 2 e 4. Os gates externos ficam registrados como pendências bloqueadas, sem interromper o restante da execução local.
- Registro de execucao 2026-07-20: implementado `rpc_analytics_ceo_history` para comparacao server-side do periodo atual com o anterior de mesma duracao. A Visao Executiva exibe variacao de receita ganha, conversao e saldo vencido, com cor semantica e valor comparativo. Validacao local: 62 arquivos e 1.164 testes de banco; typecheck e build web aprovados.
