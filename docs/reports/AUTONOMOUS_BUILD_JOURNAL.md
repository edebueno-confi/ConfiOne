# Build Journal — Construção Autônoma do Genius Support OS

Trilha auditável de cada ciclo de construção (ver AUTONOMOUS_EXECUTION_CHARTER.md).

## 2026-07-16 — Ciclo 0: Governança e fundação

- Objetivo: estabelecer contrato de execução autônoma e preparar R1.
- Feito nesta e nas sessões anteriores:
  - Fundação de tema light/dark em runtime (tokens, ThemeProvider, toggle, anti-flash).
  - Dark mode aplicado em todo o sistema (381 trocas cor-fixa -> token), 0 regressões de tipo.
  - Redesenho de CS Portfolio e Login.
  - Ambiente local consertado: git index, Edge Runtime, e bug de parsing das fixtures (CLI Supabase >=2.105 retorna array direto). Seed funcional e login admin validados na máquina do usuário.
  - Documentos de estratégia: DIAGNOSTICO-E-PLANO-DE-SIMPLIFICACAO.md e RECONSTRUCAO-DO-PRODUTO.md.
- Validação: web typecheck com apenas erros de baseline (contratos), sem erros novos dos arquivos tocados.
- Próximo passo: R1 item 1 — módulo de Configurações (parametrização): backend-first (tabelas de parâmetros: tipos de conversa, categorias, prioridades, status/fluxos, SLAs, áreas), com RLS + audit + pgTAP, e a tela de Configurações no frontend.

## 2026-07-16 — Ciclo 1: Configurações (superfície do módulo)

- Objetivo: iniciar o R1 pelo "cérebro" (Configurações), de forma segura e sem risco de banco.
- Feito:
  - Nova tela `apps/web/src/features/settings/SettingsPage.tsx` — cockpit de parâmetros (master/detail), com 12 grupos: marcas, áreas/equipes, papéis/permissões, tipos de conversa, categorias, prioridades, status/fluxos, SLAs, respostas rápidas, automações, segmentos/clusters, canais.
  - Cada grupo mostra estado honesto: "Existe hoje" (será centralizado) ou "Em breve" (será configurável), com o que o parâmetro define e onde é usado. Read-only nesta leva; nada de dado ou ação falsa.
  - Rota `/admin/settings` conectada (`router.tsx`) e item "Configurações" como primeiro da Administração (`minimal-navigation.ts`), com rótulo de rota.
- Validação: web typecheck = 129 (baseline dos contratos); 0 erros nos arquivos novos/editados; nenhum arquivo novo na lista de erros. Edições por escrita de arquivo inteiro (sem Edit incremental).
- Pendente / próximo passo: backend-first do primeiro parâmetro real — `tipos de conversa` e `categorias`/`prioridades` (tabela + RLS + auditoria + view + pgTAP, migração LOCAL), depois ligar a tela para leitura e edição via RPC. Em seguida, iniciar o Atendimento (inbox + conversa).

## 2026-07-16 — Ciclo 2: Tipos de conversa (primeiro parâmetro real, ponta a ponta)

- Objetivo: dar vida ao primeiro parâmetro do módulo de Configurações, backend-first.
- Backend: migração local `supabase/migrations/20260716170000_settings_conversation_types_v1.sql` — tabela `public.conversation_types` (key, label, description, default_area_key, sort_order, is_active) com gatilhos `touch_updated_at` + `audit.capture_row_change`, RLS habilitada, política de select para `platform_admin`, checks (formato de key + anti-segredos) e seed de 6 tipos (dúvida, solicitação, incidente/bug, melhoria, projeto, financeiro).
- Aplicação: `supabase migration up --local` na máquina do usuário (não destrutivo, preservou os usuários de teste). Verificado via psql: 6 linhas, RLS = on, política presente, acentos corretos.
- Frontend: `settings-api.ts` (leitura via cliente Supabase, sem depender dos contratos quebrados) e a tela de Configurações passou a mostrar os tipos reais no grupo "Tipos de conversa" (estado "Ativo"), com loading/erro/vazio honestos.
- Validação: web typecheck = 129 (baseline dos contratos); 0 erros em settings; nenhum arquivo novo na lista de erros.
- Observação: pgTAP formal ficou para um ciclo futuro (verificação feita por consulta direta neste ciclo, por estabilidade do ambiente). Edição/CRUD dos tipos pela tela (RPCs) é o próximo passo.
- Próximo passo: (a) RPCs de create/update/archive para tipos de conversa + edição na tela; ou (b) iniciar o Atendimento (inbox + conversa) reaproveitando os tipos como classificação. Recomendo (b) para destravar o núcleo de valor, voltando ao CRUD de parâmetros junto.

## 2026-07-16 — Ciclo 3: Tipos de conversa gerenciáveis pela tela (CRUD)

- Objetivo: entregar de fato "parametrizável sem código" para o primeiro parâmetro.
- Backend: migração `20260716180000_settings_conversation_types_rpcs_v1.sql` com 3 RPCs SECURITY DEFINER + checagem `platform_admin` (`rpc_admin_create_conversation_type`, `rpc_admin_update_conversation_type`, `rpc_admin_archive_conversation_type`), grants de execute para authenticated. Aplicada via `migration up --local`; funções confirmadas no `pg_proc`.
- Frontend: `settings-api.ts` ganhou create/archive (RPC via cliente) e geração de `key` a partir do rótulo; a tela de Configurações passou a ter formulário "Adicionar tipo" e ação "Arquivar" por linha, mostrando só os ativos.
- Validação: web typecheck = 129 (baseline); 0 erros em settings; nenhum arquivo novo com erro.
- Estado: o parâmetro "Tipos de conversa" está completo (backend seguro + CRUD pela UI). Padrão comprovado e replicável para os demais parâmetros.
- Próximo ciclo (4): replicar o padrão para "Prioridades" (tabela + seed + leitura na tela) OU iniciar o Atendimento (inbox) reaproveitando tipos e categorias. Recomendo Atendimento para destravar o núcleo de valor.

## 2026-07-16 — Ciclo 4: Prioridades (segundo parâmetro, ponta a ponta)

- Objetivo: replicar o padrão comprovado para "Prioridades e severidades".
- Backend: migração `20260716190000_settings_priority_levels_v1.sql` — tabela `public.priority_levels` (key, label, weight, color_token, sort_order, is_active) com triggers touch/audit, RLS + política platform_admin, checks (formato de key, color_token válido, anti-segredos) e seed de 4 níveis (Baixa/Normal/Alta/Urgente com pesos e cores semânticas). Aplicada via `migration up --local`; verificado por psql (4 linhas, RLS on).
- Frontend: `settings-api.ts` ganhou `listPriorityLevels`; `SettingsPage.tsx` foi refatorada para estado genérico `LoadState<T>` e ganhou `PriorityLevelsPanel` (leitura) + `ColorPill`. O grupo "Prioridades" agora mostra os níveis reais e está "Ativo".
- Validação: web typecheck = 129 (baseline); 0 erros em settings; nenhum arquivo novo com erro.
- Próximo ciclo (5): CRUD de prioridades pela tela (RPCs, como em tipos de conversa) OU migrar "Categorias" (ticket_categories já existentes) para o módulo. Depois, iniciar o Atendimento (inbox) consumindo tipos + prioridades reais.

## 2026-07-16 — Ciclo 5: Prioridades gerenciáveis pela tela (CRUD)

- Objetivo: completar o segundo parâmetro com edição pela UI, mesmo padrão dos tipos de conversa.
- Backend: migração `20260716200000_settings_priority_levels_rpcs_v1.sql` — RPCs `rpc_admin_create_priority_level`, `rpc_admin_update_priority_level`, `rpc_admin_archive_priority_level` (SECURITY DEFINER + platform_admin), grants para authenticated. Aplicada via `migration up --local` (EXIT=0).
- Frontend: `settings-api.ts` com `createPriorityLevel`/`archivePriorityLevel`; painel de Prioridades ganhou formulário "Adicionar nível" (nome + cor semântica em linguagem humana) e ação "Arquivar" por linha.
- Validação: web typecheck = 129 (baseline); 0 erros em settings; nenhuma regressão.
- Extra do dia: app local verificado no ar (HTTP 200 em 127.0.0.1:4173), navegador aberto para a usuária, credenciais admin reenviadas.
- Estado do módulo Configurações: Tipos de conversa (CRUD ✔) · Prioridades (CRUD ✔) · demais grupos mapeados com estado honesto.
- Próximo ciclo (6): INICIAR O ATENDIMENTO (inbox) — nova superfície consumindo `vw_support_tickets_queue` + tipos/prioridades reais; fatiar em sub-lotes: (6a) lista de conversas com visões salvas, (6b) painel de conversa/timeline, (6c) composer com resposta/nota, (6d) classificação usando parâmetros do módulo de Configurações.

## 2026-07-16 — Ciclo 6-marca: Rebatismo "GêniOS" + identidade Genius

- Objetivo: manter a marca Gênios viva no sistema interno (pedido da dona do produto), aplicar as cores oficiais (rosa #F04AAE + azul #2F6BFF/navy #061B54, já tokenizadas no DS) e criar o mascote.
- Nome novo: **GêniOS** — "Gênios" (a empresa) + "OS" (sistema operacional). O "OS" ganha o rosa da marca na UI.
- Feito:
  - `apps/web/public/brand-assets/genio.svg` — mascote original "Gênio" (SVG flat, rosa/navy/azul, com turbante e estrelas), futuro avatar do assistente de IA.
  - `index.html`: título/og → "GêniOS — atendimento Genius e After Sale".
  - `MinimalAppShell`: marca com Gênio + "GêniOS" (OS em rosa) na sidebar, drawer mobile e topbar.
  - `LoginPage`: bloco de marca com o Gênio + subtítulo "Atendimento Genius e After Sale".
  - `minimal-navigation`: rótulo fallback → GêniOS.
- Validação: web typecheck = 129 (baseline); 0 erros nos arquivos tocados; nenhuma regressão. Fonte das cores: site geniusreturns.com.br + paleta oficial do Design System V3 (seção 6).
- Próximo: retomar Ciclo 6 (Atendimento/inbox) conforme plano — sub-lote 6a (lista de conversas com visões salvas).

## 2026-07-16 — Ciclo 6a: Atendimento (Inbox) — lista de conversas + rail de contexto

- Correção de marca: grafia oficial é "Genius" → nome final **GeniusOS** (aplicado em index.html, shell, login, rótulos). Conceito aprovado pela dona: o Gênio atual é o "mascote embrionário" que evolui com o sistema; no futuro ganhará versão mais tecnológica/IA (registrado para não esquecer).
- Novo módulo `apps/web/src/features/inbox/`:
  - `inbox-api.ts` — leitura enxuta de `vw_support_tickets_queue` (colunas selecionadas, limite 200, tipos locais independentes dos contratos quebrados).
  - `InboxPage.tsx` — Atendimento estilo Intercom/Zendesk: visões salvas com contagens (Todas / Não atribuídas / Aguardando suporte / Aguardando cliente / Urgentes), busca, lista densa (status/prioridade em pills, última atividade), rail de contexto (responsável, categoria, origem, SLA honesto, contadores) e CTA "Abrir tratativa completa" → `/support/tickets/:id`.
- Rota `/support/inbox` (dentro do SupportGate existente) e item "Atendimento" no topo da seção Trabalho.
- Validação: web typecheck = 129 (baseline); 0 erros nos arquivos novos; nenhuma regressão.
- Próximo (6b): conversa integrada na própria Inbox — timeline de mensagens (`vw_support_ticket_timeline_recent`/`rpc_support_get_ticket_timeline`) + composer (resposta pública `rpc_add_ticket_message` / nota interna `rpc_add_internal_ticket_note`), e classificação usando tipos/prioridades do módulo de Configurações.

## 2026-07-16 — Ciclo 6b: Conversa integrada na Inbox (timeline + composer)

- Objetivo: transformar a Inbox em estação de resposta — conversar sem sair da tela.
- `inbox-api.ts` ganhou: `listConversation` (leitura de `vw_support_ticket_timeline_recent` com classificação em 4 tipos: mensagem do cliente / resposta pública / nota interna / atualização do sistema), `sendPublicReply` (`rpc_add_ticket_message`) e `saveInternalNote` (`rpc_add_internal_ticket_note`) — contratos reais existentes, nenhum backend novo.
- `InboxPage.tsx`: o rail de detalhe virou **painel de conversa** — cabeçalho compacto (cliente, responsável, SLA, status/prioridade, "Mais ações" → tratativa completa), thread com bolhas diferenciadas (cliente à esquerda, resposta pública à direita em azul, nota interna em amarelo com aviso "não visível ao cliente", eventos do sistema como chips), auto-scroll para a última mensagem, e **composer fixo** com alternância Resposta pública / Nota interna (composer amarelo no modo nota), estados de envio e erro honesto. Após enviar, a conversa recarrega.
- Validação: web typecheck = 129 (baseline); 0 erros na inbox; nenhuma regressão. Boundary preservado: nota interna nunca vai ao portal (garantido pelo backend existente).
- Próximo (6c): classificação na conversa usando parâmetros do módulo de Configurações (tipos de conversa + prioridades) e ações rápidas (atribuir a mim, mudar status) via RPCs existentes.

## 2026-07-16 — Ciclo 6c: Ações rápidas na Inbox (assumir, status, prioridade)

- `inbox-api.ts`: `assignTicketTo` (`rpc_assign_ticket`), `updateTicketStatus` (`rpc_support_update_ticket_status_v2`), `updateTicketPriority` (`rpc_support_update_ticket_priority_severity`) — RPCs reais existentes, backend continua validando transições.
- `InboxPage.tsx`: barra de ações no painel de conversa — "Assumir conversa" (atribui ao usuário logado), seletor de Status e seletor de Prioridade em linguagem humana. Erro honesto quando o backend nega ("Esta mudança de status não é permitida na etapa atual."). Após qualquer ação, a fila recarrega e a conversa selecionada se mantém.
- Validação: web typecheck = 129 (baseline); 0 erros na inbox; nenhuma regressão.
- Estado do Atendimento (R1): fila com visões salvas ✔ · conversa com bolhas ✔ · composer resposta/nota ✔ · assumir/status/prioridade ✔.
- Próximos sub-lotes do Atendimento: (6d) vincular tipo de conversa do módulo de Configurações ao ticket (exige coluna/migração aditiva + RPC), rail de contexto do cliente, respostas rápidas parametrizadas. Alternativa: pausar o 6d e avançar Portal do cliente (R1 item 3) para fechar o ciclo cliente↔suporte de ponta a ponta.

## 2026-07-16 — Ciclo 7: Início / "Meu dia" (shell contextual)

- Objetivo: a tela que conduz o usuário ao logar — pedido central da visão ("a interface deve conduzir o usuário, chamando atenção para notificações, CTAs e tarefas importantes").
- Novo módulo `apps/web/src/features/home/HomePage.tsx` em `/inicio` (SupportGate + shell), item "Início" no topo da navegação:
  - Saudação por horário com o Gênio e o primeiro nome do usuário.
  - 4 cartões de pendência clicáveis com números reais da fila (Aguardando suporte / Não atribuídas / Urgentes / Aguardando cliente) → levam ao Atendimento.
  - "Merecem sua atenção agora": top 6 conversas abertas ordenadas por urgência.
  - Atalhos (Atendimento, Clientes B2B, Acionamentos, Configurações).
- Reuso de `listInboxItems` da inbox (mesma fonte de verdade, sem contrato novo).
- Validação: web typecheck = 129 (baseline); 0 erros nos arquivos novos; nenhuma regressão.
- Próximo (Ciclo 8): ligar "tipos de conversa" das Configurações ao ticket (migração aditiva `conversation_type_key` + RPC + seletor na Inbox) — fecha o elo parametrização→operação. Depois: portal E2E, respostas rápidas, contexto do cliente no rail.

## 2026-07-16 — Ciclo 8: Respostas rápidas (parâmetro) + parâmetros legíveis pelo suporte

- Backend: migração `20260716210000_settings_quick_replies_v1.sql` — tabela `public.quick_replies` (title, body, sort_order, is_active) com triggers/RLS/checks + seed de 3 respostas; RPCs `rpc_admin_create_quick_reply`/`rpc_admin_archive_quick_reply`. Além disso, adicionadas políticas de SELECT para `support_manager`/`support_agent` em `conversation_types` e `priority_levels` (uso operacional na Inbox). Aplicada e verificada (3 seeds, 2 RPCs, 5 políticas).
- Frontend: `settings-api` + `SettingsPage` ganharam o painel "Respostas rápidas" (criar/arquivar, estado "Ativo"); `inbox-api.listQuickReplyOptions` + seletor "Resposta rápida…" no composer público da Inbox (insere o texto pronto).
- Validação: web typecheck = 129 (baseline); 0 erros; nenhuma regressão.
- Estado Configurações: Tipos de conversa (CRUD) ✔ · Prioridades (CRUD) ✔ · Respostas rápidas (CRUD) ✔.

## 2026-07-16 — Ciclo 9: Rail de contexto do cliente na Inbox + agendamento horário

- Agendamento: `genius-build-cycle` passou de diário para **horário** (`0 * * * *`), por pedido da dona. Nota registrada: execuções agendadas rodam como sessão própria (não reabrem o chat vivo), mas continuam o trabalho lendo este journal + memória.
- `InboxPage.tsx`: terceira coluna (blueprint 4 zonas) — rail "Contexto" visível em telas largas (xl), com cliente, solicitante, responsável, categoria, origem, status/prioridade (pills), SLA honesto, mensagens do cliente, aberto em, e atalho "Ver clientes B2B". Reuso dos dados já carregados (sem backend novo).
- Validação: web typecheck = 129 (baseline); 0 erros; nenhuma regressão.
- MARCO: Atendimento (Inbox) do R1 concluído — fila+visões, conversa, composer resposta/nota, respostas rápidas, assumir/status/prioridade, rail de contexto.
- Próximos ciclos: (10) Portal do cliente E2E — cliente abre/acompanha demanda e conversa (fecha o elo cliente↔suporte); (11) polir /support/customers como cockpit; depois Admin, CS/cluster.

## 2026-07-17 — Ciclo 9: Tipo de conversa ligado ao ticket (parametrização→operação)

- Objetivo: fechar o elo entre o módulo de Configurações e o Atendimento — classificar a conversa com os tipos parametrizados (sub-lote 6d).
- Backend: migração `20260717080000_tickets_conversation_type_link_v1.sql` (preparada em execução anterior, aplicada e verificada neste ciclo): coluna aditiva `tickets.conversation_type_key` (FK opcional para `conversation_types.key`, índice parcial), RPC `rpc_support_set_ticket_conversation_type` (SECURITY DEFINER + `can_manage_ticket`, valida tipo ativo, aceita null para limpar, evento auditável `classification_changed`), e `vw_support_tickets_queue` passou a expor `conversation_type_key` + `conversation_type_label`. Aplicada via `migration up --local` (EXIT=0); verificado por psql: coluna presente, RPC presente, 2 colunas novas na view.
- Frontend: `inbox-api.ts` — fila lê as colunas novas; `listConversationTypeOptions` (tipos ativos; política de SELECT do suporte criada no Ciclo 8) e `setTicketConversationType` (RPC). `InboxPage.tsx` — seletor "Tipo" na barra de ações da conversa (opção "Sem tipo" e fallback visível para tipo arquivado ainda vinculado) e linha "Tipo de conversa" no rail de contexto.
- Validação: web typecheck = 129 (baseline dos contratos); 0 erros em inbox/settings/home; nenhum arquivo novo na lista de erros. Edições por escrita de arquivo inteiro (Python).
- Estado: elo parametrização→operação fechado — o que o admin cria em Configurações aparece na Inbox e classifica o ticket com auditoria. Atendimento (R1): fila ✔ · conversa ✔ · composer ✔ · ações rápidas ✔ · classificação por tipo ✔.
- Próximo (Ciclo 10): Portal do cliente E2E (R1 item 3) para fechar o ciclo cliente↔suporte de ponta a ponta. Alternativas menores: contexto do cliente no rail; migrar "Categorias" para o módulo de Configurações.

## 2026-07-16 — Ciclo 10: Marca GeniusOS nas telas do cliente

- Portal do cliente: cabeçalho da sidebar agora exibe o Gênio + "GeniusOS" (OS em rosa da marca), mantendo o navy customer-facing. Título "Portal do cliente" preservado.
- Central de ajuda pública: títulos/descrição de página migrados de "Genius Support OS" para "GeniusOS".
- Validação: web typecheck = 129 (baseline); 0 erros; nenhuma regressão. Marca consistente em todas as superfícies internas e customer-facing.
- Próximo (Ciclo 11): validar o loop cliente↔suporte de ponta a ponta na base local (resposta pública do suporte aparece no portal; nota interna não) e polir /support/customers como cockpit.

## 2026-07-17 — Ciclo 11: Loop cliente↔suporte validado E2E (pgTAP) + deep-link Inbox→cockpit do cliente

- Objetivo: provar, pelos contratos reais, que o loop cliente↔suporte fecha de ponta a ponta — e que a fronteira interna nunca vaza para o portal (pendência declarada nos Ciclos 10/11).
- Backend/testes: novo teste pgTAP `supabase/tests/049_customer_support_loop_e2e.sql` (10 asserções, fixture própria, transacional com rollback — não persiste nada):
  1. cliente cria chamado pelo portal (`rpc_customer_create_ticket`);
  2. chamado aparece em `vw_customer_portal_ticket_list`;
  3. cliente conversa (`rpc_customer_add_ticket_message`);
  4. cliente NÃO consegue registrar nota interna (`rpc_add_internal_ticket_note` negada);
  5–6. suporte responde público e registra nota interna (RPCs reais; exigiu membership `tenant_viewer` ativa para o agente — regra do `can_manage_ticket` confirmada e documentada pelo próprio teste);
  7. timeline operacional (`vw_support_ticket_timeline_recent`) mostra as 3 entradas;
  8–9. resposta pública e mensagem do cliente aparecem em `vw_customer_portal_ticket_timeline`;
  10. nota interna NUNCA aparece no portal (nem body, nem eventos `internal_note_added`/`engineering_update_added`).
  Executado no banco local (docker exec + psql, sem BOM): **10/10 ok, ROLLBACK limpo**. Primeira execução pegou de verdade uma regra real (agente sem membership → denied), corrigida na fixture — evidência de que o teste morde.
- Frontend (incremento pequeno): fila da Inbox passou a ler `tenant_id` de `vw_support_tickets_queue` (`InboxItem.tenantId`); o CTA do rail de contexto virou deep-link "Abrir cockpit do cliente" → `/support/customers/:tenantId` (fallback "Ver clientes B2B" quando não há tenant). Liga o Atendimento ao cockpit do cliente sem backend novo.
- Validação: typecheck rodado na máquina Windows (node tsc direto, EXIT=1 por baseline): 385 erros, todos em arquivos pré-existentes (contracts 260, SupportWorkspacePage 51, Engineering 46, etc.) — **zero erros em features/inbox, settings e home; nenhum arquivo tocado neste ciclo entrou na lista**. Sem migração nova (nada destrutivo; teste roda em transação).
- Nota de ambiente: na sandbox o tsc não conclui dentro do limite de 45s por chamada (processos em background são reapados entre chamadas); passar a validar typecheck pela máquina do usuário via Desktop Commander (gera arquivo e lê depois).
- Pendências/próximo: (12) polimento do cockpit `/support/customers` (arquivo de 8k linhas — fatiar com cuidado) ou iniciar **Demanda + Acionamento entre áreas** (R1 item 4); considerar promover o padrão do teste 049 para os fluxos de acionamento quando existirem.

## 2026-07-16 — Ciclo 11: Validação do boundary cliente↔suporte

- Verificação no banco local: a view `vw_customer_portal_ticket_timeline` NÃO expõe coluna de visibilidade e não carrega entradas internas — a nota interna é excluída por construção (garantia estrutural, não só de UI). `vw_support_ticket_timeline_recent` e a do portal são escopadas por ator autenticado (RLS), então consultas via `postgres` retornam 0 linhas — esperado; a garantia relevante (portal sem conceito de nota interna) confirma-se.
- Conclusão: o elo cliente↔suporte é seguro por design. Runtime click-through completo (login suporte + cliente) fica como QA manual quando desejado.
- Próximo (Ciclo 12): transformar /support/customers em cockpit de contas B2B (lista + contexto), reusando read models de cliente existentes; depois Admin (tenants/access/system) e CS.

## 2026-07-16 — Ciclo 12: Cockpit de Clientes B2B (/support/clientes)

- Novo módulo `apps/web/src/features/customers/` (rota aditiva `/support/clientes`, sem tocar no workspace legado de 16.7k linhas):
  - `customers-api.ts` — leitura de `vw_support_customer_360` (nome, razão social, status, contatos ativos, tickets abertos/total, contagem por status), tipos locais.
  - `CustomersPage.tsx` — master/detail: busca, lista com nº de tickets abertos, detalhe com KPIs (abertos/histórico/contatos), dados da conta (código, cliente desde), tickets por status e atalho para o Atendimento.
- Navegação "Clientes B2B" repontada para o novo cockpit (rota antiga preservada).
- Validação: web typecheck = 129 (baseline); 0 erros; nenhuma regressão.
- Estado R1: Início ✔ · Atendimento ✔ · Configurações ✔ · Clientes B2B ✔ · marca ✔ · boundary validado ✔.
- Próximo (Ciclo 13): Admin — deixar /admin/system e /admin/access menos "ERP", com foco em governança; depois CS (carteira já existe em /cs/portfolio, evoluir clusterização).

## 2026-07-16 — Ciclo 13: Landing "Início" + checkpoint de validação

- Pós-login: `internal-route-access.ts` agora leva platform_admin e suporte para `/inicio` (Meu dia) como landing, e autoriza `/inicio` para esses papéis. CS/engenharia/área/portal mantêm seus destinos. Mudança pontual em função pura.
- Checkpoint de validação: `contracts:typecheck` OK; `web:typecheck` = 129 (baseline dos contratos), 0 erros novos em nenhum arquivo tocado nos ciclos 1–13; app local respondendo HTTP 200 em 127.0.0.1:4173.
- Estado consolidado (R1 telas novas/limpas): Início · Atendimento (inbox completa) · Configurações (tipos/prioridades/respostas com CRUD) · Clientes B2B · Portal e Help com marca GeniusOS · boundary validado.
- Próximo (Ciclo 14): Admin — /admin/system e /admin/access com foco em governança (menos ERP); depois CS clusterização (segmentos configuráveis) e polimentos de acessibilidade/QA visual por viewport.

## 2026-07-16 — Ciclos 14, 15 e 16 (lote sem confirmação)

### Ciclo 14 — Segmentos de cliente (parâmetro + CRUD)
- Migração `20260716220000_settings_customer_segments_v1.sql`: tabela `customer_segments` (key, label, description, color_token, sort_order, is_active) com triggers/RLS/checks + seed (Enterprise, Médio, Pequeno, Em onboarding, Em risco) + RPCs create/archive. Aplicada (--include-all, pois o ciclo horário já havia inserido migração posterior); 5 segmentos confirmados.
- Frontend: `settings-api` (list/create/archive) + `CustomerSegmentsPanel` na tela de Configurações; grupo "Segmentos" agora "Ativo". Base para clusterização de CS.

### Ciclo 15 — Admin "Visão geral"
- Nova página `features/admin/AdminOverviewPage.tsx` em `/admin/visao-geral` (item "Visão geral" no topo da Administração): KPIs de governança (clientes, clientes ativos, tickets abertos, não atribuídas) reusando customers-api + inbox-api, e cartões de atalho para as áreas administrativas. Menos ERP, mais governança.

### Ciclo 16 — Acessibilidade (pular para o conteúdo)
- `MinimalAppShell`: link "Pular para o conteúdo" (visível ao focar por teclado) + `id="conteudo-principal"` no `<main>`. Melhora navegação por teclado/leitor de tela em todas as telas internas.

- Validação conjunta: web typecheck = 129 (baseline dos contratos); 0 erros novos; nenhuma regressão. (Erros de `CustomerPortalAdminPage` são baseline do módulo de contratos, não relacionados.)
- Observação operacional: houve reordenação de migração porque o ciclo horário autônomo (`genius-build-cycle`) está ativo e pode inserir migrações em paralelo — resolvido com `--include-all`. Convém, num próximo ciclo, checar o que o job horário produziu para evitar divergência.
- Próximo: revisar saída do job horário; evoluir CS (atribuir segmento a cliente); Admin System/Access com foco governança.

## 2026-07-17 — Ciclo 17: Consolidação (fluxo único)

- Contexto: a dona do produto deixou apenas o agente construindo. Encerrada a operação em paralelo (chat interativo + job horário criavam numeração duplicada de "Ciclo 9/10/11").
- Estado verificado e SAUDÁVEL: todas as migrações 20260716* (minhas: conversation_types, priority_levels, quick_replies, customer_segments + RPCs) e 20260717080000_tickets_conversation_type_link_v1 (do job) coexistem; `web:typecheck` = 129 (baseline dos contratos), 0 erros novos combinando o trabalho de ambos.
- Correções de coerência aplicadas no prompt do job `genius-build-cycle`: usar a DATA REAL, numerar ciclos a partir do MAIOR já existente no journal (sem duplicar), aplicar migrações sempre com `--include-all`, e gate de tsc vs baseline. Assim o fluxo único segue sem colisão.
- Numeração canônica daqui em diante: PRÓXIMO = Ciclo 18 (os números até 17 já foram usados).
- Próximo passo (Ciclo 18): evoluir CS — atribuir segmento (customer_segments) a cada cliente (tabela de vínculo tenant↔segmento + RPC + exibição na carteira /cs/portfolio e no cockpit de clientes).

## 2026-07-17 — Ciclo 18: Atribuição de segmento ao cliente (clusterização de CS)
- Backend: `20260717120000_settings_customer_segment_assignments_v1.sql` — tabela `customer_segment_assignments` (1 segmento por tenant), view `vw_customer_segment_assignments` (security_invoker) e RPCs `rpc_admin_set_customer_segment`/`rpc_admin_clear_customer_segment`. RLS admin+suporte read, admin write. Aplicada (--include-all).
- Frontend: cockpit de Clientes B2B (/support/clientes) ganhou seletor de segmento no detalhe (definir/remover) e badge de segmento nas linhas da lista.
- Validação: web typecheck = 129; 0 erros novos.

## 2026-07-17 — Ciclo 19: Marcas gerenciáveis (multi-marca)
- Backend: `20260717130000_settings_brands_v1.sql` — tabela `brands` (key, label, help_center_slug) + RPCs create/archive + seed Genius/After Sale. Aplicada; 2 marcas.
- Frontend: painel "Marcas" nas Configurações (criar/arquivar), grupo agora "Ativo".
- Validação: web typecheck = 129; 0 erros novos.

## 2026-07-17 — Ciclo 20: Segmento visível na carteira de CS
- Frontend: `/cs/portfolio` passou a exibir o segmento de cada cliente (badge na lista e no detalhe), lendo `vw_customer_segment_assignments`. Fecha o ciclo de clusterização: definir no cockpit de clientes → visível na carteira de CS.
- Observação: a leitura de assignments é liberada para platform_admin e suporte; usuários apenas-CS (membership) verão o badge quando a política incluir esse escopo (follow-up).
- Validação: web typecheck = 129 (baseline); 0 erros novos; nenhuma regressão. (cs-model.ts tem 1 erro de baseline dos contratos, não relacionado.)
- Próximo (Ciclo 21): incluir escopo CS na leitura de segmentos; evoluir Admin System/Access (governança); QA visual por viewport (1920/1440/1366/mobile).

## 2026-07-17 — Ciclo 21: Categorias centralizadas em Configurações
- `settings-api.listTicketCategories` (lê `ticket_categories` existente) + `TicketCategoriesPanel` (read-only: categoria, descrição, status). Grupo "Categorias" agora "Ativo" (consulta centralizada; edição em ciclo futuro).
- Validação: web typecheck = 129; 0 erros novos.

## 2026-07-17 — Ciclo 22: "Minhas conversas" no Início
- HomePage ganhou a seção "Minhas conversas (N)" com as conversas abertas atribuídas ao usuário logado (top 5, link para o Atendimento), acima de "Merecem sua atenção". Reuso de listInboxItems; frontend only.
- Validação: web typecheck = 129; 0 erros novos.

## 2026-07-17 — Ciclo 23: CS enxerga segmentos (política de leitura)
- Migração `20260717140000_customer_segments_cs_read_v1.sql`: políticas de SELECT em `customer_segment_assignments` e `customer_segments` usando `app_private.can_access_cs_customer_portfolio(tenant_id)`, para que usuários de CS (por membership) vejam os badges de segmento na carteira — não só platform_admin. Aplicada (--include-all).
- Validação: web typecheck = 129 (baseline); 0 erros novos.
- Próximo (Ciclo 24): CRUD de categorias pela tela; evoluir Admin System/Access (governança); QA visual por viewport.

## 2026-07-17 — Ciclo 24: QA no navegador (Claude in Chrome) — validação visual dos ciclos

- Executado no Chrome LOCAL da usuária (isLocal), sobre http://localhost:4173, logada como platform_admin.
- Validado visualmente e funcionando com dados reais:
  - Início/"Meu dia": saudação com o Gênio, marca GeniusOS, KPIs reais (aguardando suporte/não atribuídas/urgentes/aguardando cliente), seção "Minhas conversas (4)" (Ciclo 22), "Merecem sua atenção". Landing pós-login em /inicio (Ciclo 13). ✔
  - Atendimento (inbox): visões com contadores (Todas 17, Não atribuídas 3, Aguardando suporte 2, Aguardando cliente 3, Urgentes 5), lista com pills, conversa com bolhas (nota interna amarela "não visível ao cliente", resposta pública azul, eventos do sistema), composer Resposta pública/Nota interna + "Resposta rápida", ações Assumir/Status/Prioridade/Tipo, rail de contexto (incl. Tipo de conversa e Categoria — integração do ciclo horário). ✔
  - Configurações: 12 grupos com selos corretos; painel Marcas com Genius/After Sale/V2 e "Adicionar marca". ✔
  - Clientes B2B: lista + detalhe com KPIs, seletor de Segmento (Alterar…), tickets por status. ✔
  - Dark mode: alternância pelo seletor Tema vira o app inteiro para navy legível, marca preservada; restaurado para claro. ✔
  - Shell/navegação: seções Trabalho/Engenharia/Administração, marca + Gênio, seletor de tema. ✔
- Conclusão: todos os ciclos entregues renderizam e funcionam no navegador real. Nenhum erro visual bloqueante observado.
- Próximo (Ciclo 25): CRUD de categorias pela tela; QA por viewport menor (1366/mobile); evoluir Admin System/Access.
