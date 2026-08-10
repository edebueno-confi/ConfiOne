# Handoff — Configuration PO V2.1: fidelidade visual e estado de release

Data: 09/08/2026
Destinatário: próximo agente (Claude)
Status: **V2 rejeitada visualmente. Não publicar nem mesclar até a V2.1 passar no gate abaixo.**

## 1. Objetivo e fonte de verdade

O objetivo não é reinterpretar nem modernizar o produto. É reproduzir a composição aprovada de Configuration PO mantendo contratos, dados, permissões e comandos reais do runtime.

Fontes obrigatórias:

- Blueprint aprovado: `docs/design/blueprint/Configuration PO/v2/`
- Crítica completa do usuário: `C:\Users\edebu\.codex\attachments\e7ca2317-c99f-4c0d-a975-fba1fa5b3bc1\pasted-text.txt`
- Comparativo consolidado: `C:\Users\edebu\Downloads\comparison_sheet_1366_dark.jpg`
- Pacote V2 rejeitado: `C:\Projetos\GSO-artifacts\configuration-po-v2-final-20260809.zip`

O blueprint vence em composição, hierarquia, regiões, densidade e ordem. O runtime vence em conteúdo factual, dados, permissões e comportamento. Ausência de dados não autoriza remover a região visual: use estado vazio coerente; ausência de capacidade real exige estado indisponível ou omissão do controle, nunca retorno ao layout legado.

## 2. Bloqueios obrigatórios antes de código visual

1. Criar `docs/reports/2026-08-09_configuration-po-v2-1-fidelity-delta.md`.
2. Para cada uma das seis telas, preencher a tabela:

| Região do blueprint | Runtime V2 | Divergência | Correção obrigatória |
| --- | --- | --- | --- |

3. Trabalhar primeiro e somente em `1366×768`, tema escuro.
4. Não iniciar validação em 1440, 1024, 390 ou tema claro antes de passar o gate de 1366.
5. Não substituir o problema por tokens, documentação genérica ou uma tela nova.

## 3. Diagnóstico por tela e correção mandatória

### 01. Integrações

O runtime V2 criou um trilho de quatro KPIs e condensou HubSpot/OMIE, removendo regiões críticas. A composição obrigatória é: cabeçalho; dois painéis amplos e equivalentes (HubSpot e OMIE); permissões e escopos à esquerda + política de segurança à direita; lista de eventos abaixo, mesmo vazia. Não reduzir os conectores a cartões pequenos nem retirar contexto de credenciais, escopos, testes, sincronização e histórico.

### 02. Configurações — visão geral

O blueprint contém faixa executiva, grade densa de oito módulos e atividade recente. O runtime tem três métricas, cinco cartões ampliados e muito vazio. Restaurar a hierarquia e a grade estrutural 4×2, preservando a atividade inferior mesmo quando não houver eventos.

### 03. Usuários e acesso

É a tela mais próxima, mas ainda não fiel. Manter cabeçalho, resumo, toolbar, tabela compacta e trilho contextual persistente à direita em 1366. Ações por linha devem ser menu compacto, não botões grandes de redefinir/suspender. Não eliminar o detail rail por causa de dados vazios.

### 04. Central de ajuda

O blueprint é uma operação editorial: governança, publicação/canais, categorias e permissões. O runtime a substituiu por identidade/contato da central. Reconstituir as quatro regiões do blueprint. Dados de contato podem existir como subpainel/contexto factual, mas não podem ocupar ou substituir a composição editorial.

### 05. Histórico de sincronizações

O runtime vazio não prova fidelidade. Implementar fixture determinística apenas para QA visual com execução de sucesso, parcial, falha sanitizada e run selecionado com etapas. Preservar resumo, filtros, lista/tabela à esquerda e painel de detalhe à direita, inclusive nos estados vazios.

### 06. Fontes do Dashboard

O runtime resumiu a tela a cards e tabela/classificação. Reintroduzir a estrutura do blueprint: resumo, mapa principal de origens e ritmo de atualização, catálogo por domínio e pipelines publicados. Conectar dados reais; quando faltarem, mostrar estado vazio factual dentro dessas regiões.

### Shell e sidebar

Auditar o shell sem reconstruir a arquitetura: sidebar expandida de 240 px, recolhida de 56 px, submenu flutuante em overlay, e visibilidade por permissões reais. Corrigir tamanhos/densidade de ícones, grupos, estados ativos e rail contextual conforme blueprint.

## 4. Métricas de composição

No alvo 1366×768 escuro, usar como referência: corpo 12–13 px; metadata 11–12 px; títulos 22–26 px; títulos de seção 14–17 px; linhas de tabela 34–40 px; inputs 32–36 px; itens de sidebar 36–40 px. Priorizar densidade operacional, evitando whitespace que destrua as regiões aprovadas.

## 5. Gate de aceitação visual

Para cada tela, registrar explicitamente `SIM` ou `NÃO`:

- MACRO COMPOSITION MATCH
- REGION ORDER MATCH
- GRID MATCH
- DENSITY MATCH
- SIDEBAR/SHELL MATCH
- DETAIL PATTERN MATCH

Qualquer `NÃO` estrutural reprova a tela. Um `comparison.html`, screenshot isolado, build verde ou ZIP completo não é aprovação visual por si só.

O pacote V2.1 precisa conter:

- `references/`: seis referências aprovadas;
- `runtime/`: seis capturas baseline;
- `comparisons/`: `comparison-01` a `comparison-06` lado a lado;
- `screenshots/`: demais viewports e tema claro após o baseline;
- `reports/`: fidelity delta, measurement map, component map, visual comparison e QA summary;
- `manifest/`: `evidence-manifest.json` e `SHA256SUMS.txt`.

## 6. Regras negativas do lote

- Não usar ferramenta externa de design ou gerar uma nova linguagem visual.
- Não tratar o layout legado/runtime anterior como precedência contra o blueprint.
- Não ampliar para módulos novos, novas regras de domínio ou redesign do produto.
- Não inventar dados, permissões, comandos ou contratos locais.
- Não alegar aprovação visual antes da comparação factual por tela.

## 7. Estado técnico e de release no momento do handoff

Branch: `codex/admin-configuration-visual-v1`
PR: https://github.com/edebueno-confi/Genius-OS/pull/34
Preview Vercel aprovado: https://vercel.com/edebueno-confis-projects/genius-support-os/6MfQnz9fT6eyTVDLXa6QpGffrQQY

Commits relevantes:

- `bdd2b2c` — lote visual V2 (rejeitado visualmente; não usar como evidência de aprovação);
- `fcfbb41` — correções de sync local/produção, matching e permissão de admin;
- `718b988` — `fix(finance): publicar status exclusivo do Omie`.

O CI havia falhado no contrato financeiro porque `rpc_analytics_finance_source_status()` ainda publicava `spreadsheet`/`fallback`, contrariando o contrato OMIE-only. A migration `supabase/migrations/20260809174221_finance_source_status_omie_only.sql` foi criada, os testes `088_analytics_finance_omie_only_contract.sql` e `089_dashboard_api_only_reconstruction.sql` passaram localmente, e o commit `718b988` já foi enviado para a PR. É necessário aguardar/revalidar o CI remoto; não mesclar nem promover produção enquanto não estiver verde e sem nova ordem explícita do usuário.

## 8. Correções funcionais já incluídas na PR

- Início manual de HubSpot local: a RPC deixava de iniciar com `400` quando o segredo do scheduler não existia. O despacho manual agora usa a autorização do chamador sem reintroduzir o trigger que revertia a transação.
- Omie concorrente: `409` é tratado como sincronização em andamento, com refresh de status, em vez de erro enganoso.
- Administrador da plataforma: o predicado client-side passou a aceitar tanto `is_platform_admin` derivado quanto `roles.includes('platform_admin')`; o erro de “sem acesso” para o administrador deve desaparecer após deploy do frontend.
- Financeiro: a fonte financeira foi corrigida para expor somente o contrato OMIE API.

Validações já executadas:

- testes pgtap 088 e 089: aprovados;
- reset local aplicando a migration: aprovado;
- quality gate staged: aprovado;
- lint, secret scan, security audit de produção, contracts typecheck e web typecheck: aprovados;
- testes focados do start manual HubSpot, orquestração e feedback Omie: aprovados em etapa anterior.

Não há validação visual V2 aprovada. A crítica do usuário é o veredito vigente.

## 9. Ordem segura de continuidade

1. Conferir checks da PR #34 e não ignorar/reexecutar CI sem entender qualquer falha.
2. Produzir o relatório de delta V2.1 e corrigir uma tela por vez contra o blueprint de 1366×768.
3. Capturar referências, runtime e comparativos por tela; preencher o gate factual.
4. Depois do escuro 1366 aprovado, validar 1440, 1024, 390 e tema claro.
5. Só então tratar merge/deploy como decisão separada, com CI verde e confirmação explícita.

## 10. Armadilhas conhecidas

- O comando completo de verificação reseta o banco. Re-hidrate os dados de QA antes de autenticar e capturar UI.
- Testes de banco devem partir de banco limpo; rodar a suíte genérica depois de hidratar fixtures pode introduzir ruído por dados compartilhados.
- O `origin` tem URL de push divergente. Para push aprovado use explicitamente `https://github.com/edebueno-confi/Genius-OS.git`, sem forçar histórico.
- Não registrar tokens, credenciais, JWTs, cookies ou service roles em artefatos, docs ou logs.

## 11. Stop condition deste handoff

Este documento encerra o lote atual por limite de contexto. O próximo agente deve começar pelo relatório de delta e pelo primeiro screenshot 1366×768 de Integrações, não por novas funcionalidades e não por publicação.
