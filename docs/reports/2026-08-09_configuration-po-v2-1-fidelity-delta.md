# Configuration PO V2.1 — Fidelity delta (1366×768, tema escuro)

Data: 2026-08-09
Branch: `codex/admin-configuration-visual-v1`
Autor do ciclo: Claude (agente principal)
Status: **relatório de diagnóstico. Nenhuma tela aprovada. Nenhuma correção visual implementada neste lote.**

## 1. Objetivo e método

Este documento cumpre o bloqueio obrigatório definido em
`docs/reports/2026-08-09_handoff-claude-configuration-po-v2-1.md`, seção 2: antes de
qualquer código visual da V2.1, registrar região a região a divergência entre o
blueprint aprovado e o runtime V2 rejeitado, no alvo único **1366×768, tema escuro**.

### Fontes usadas

| Papel | Caminho | Observação |
| --- | --- | --- |
| Referência aprovada | `docs/design/blueprint/Configuration PO/v2/` (cópia íntegra em `output/playwright/2026-08-09-configuration-po-v2-final/references/`) | vence em composição, hierarquia, regiões, densidade e ordem |
| Runtime V2 (baseline) | `output/playwright/2026-08-09-configuration-po-v2-final/screenshots/1366x768/*-dark-1366x768.png` | capturas autenticadas do lote `bdd2b2c`, fixture QA local |
| Código do runtime | `apps/web/src/features/settings/**`, `apps/web/src/features/access/InternalControlPlanePage.tsx`, `apps/web/src/features/navigation/**` | leitura estática para nomear o ponto de correção |

Nenhuma captura nova foi produzida neste lote: o baseline 1366×768 escuro das seis
telas já existia no pacote V2 e é suficiente e mais eficiente para o diagnóstico. As
capturas de 1440, 1024, 390 e tema claro existem no mesmo pacote e permanecem fora de
escopo até o gate de 1366 escuro passar.

### Convenção de leitura

- **Divergência estrutural**: região ausente, região substituída por outra, ordem
  trocada, grid diferente ou densidade que muda a dobra. Reprova a tela.
- **Divergência de conteúdo**: o dado real do ambiente difere do dado ilustrativo do
  blueprint. **Não** é divergência de fidelidade e **não** autoriza remover a região —
  exige estado vazio factual dentro da região aprovada.
- As referências foram exportadas em 1672×941 (proporção ~16:9); a comparação é de
  composição e proporção, não de pixel absoluto.

### Aviso sobre a fixture do baseline

O baseline foi capturado com o usuário `QA Local Administrador` em ambiente local sem
execuções, credenciais nem dados operacionais. Em várias telas o runtime exibe
"Indisponível" e vazio legítimos. Isso é correto pela regra de dados, e por isso o
delta abaixo separa explicitamente o que é composição (obrigatório corrigir) do que é
apenas ausência de dado (não corrigir inventando dado).

---

## 2. Tela 01 — Integrações

Referência: `01-integrations-approved.png` · Runtime: `integrations-dark-1366x768.png`

| Região do blueprint | Runtime V2 | Divergência | Correção obrigatória |
| --- | --- | --- | --- |
| Cabeçalho: título 22–26px, subtítulo "Conexões, credenciais e status das fontes operacionais.", ações `Atualizar status` (secundária) + `Nova conexão` (primária com split) | Título e subtítulo presentes; ação única `Atualizar estado`; carimbo "Última alteração registrada em …" no topo direito | Estrutural (ações) + conteúdo (carimbo) | Manter a dupla de ações do blueprint. `Nova conexão` só pode existir se houver capacidade real de criar conexão; se não houver, omitir o controle — nunca substituir a região de ações por um carimbo de texto |
| — (o blueprint **não** tem trilho de KPIs nesta tela) | Trilho de 4 KPIs ocupando ~150px da primeira dobra ("1 de 2 integrações ativas", "0 de 2 credenciais gravadas", "Indisponível — Estado geral", "Credencial pendente") | **Estrutural: região inventada** | Remover o trilho de KPIs. O estado por conector pertence ao painel do conector, como no blueprint |
| Dois painéis amplos e equivalentes (HubSpot e OMIE), cada um com: cabeçalho com ícone/marca + badge de estado + menu `⋮`; grade de 3 métricas (Último sucesso / Última falha / Saúde das credenciais) com linha de apoio; divisor; bloco "Escopo / Perfis sincronizados" com resumo textual e contagem; 3 botões de ação (Gerenciar credenciais / Ver histórico / Testar conexão) | Dois cartões estreitos, com 2 linhas empilhadas (Credencial atualizada em / Última execução), sem grade de 3 métricas, sem menu `⋮`, sem bloco de escopo, sem `Testar conexão`; `Gerenciar credenciais` virou disclosure `▸` e `Ver histórico` virou link | **Estrutural: painéis reduzidos a cartão; duas sub-regiões removidas (métricas em grade e escopo); padrão de ação trocado** | Reconstituir os dois painéis amplos com a grade de 3 métricas, o divisor, o bloco de escopo e a barra de 3 botões. Métricas sem dado exibem "Indisponível"; escopo sem leitura exibe estado vazio factual dentro do bloco. `Testar conexão` só é omitido se não houver comando real no runtime, e a omissão precisa ser registrada |
| Região 3 esquerda: **"Permissões e escopos"** — resumo do que está habilitado por integração, com linha por provedor e chips de objetos (+N) | **"Conexões e execuções"** — texto explicativo + lista de provedores com "Indisponível · Sem execução registrada" | **Estrutural: região substituída por outra** | Restaurar "Permissões e escopos" com linha por provedor e chips de escopo reais. Sem leitura de escopo, manter a região com estado vazio factual |
| Região 3 direita: **"Política de segurança"** — 4 itens com ícone de verificação, frases curtas sobre criptografia, mascaramento, não vazamento em logs e revogação | **"Proteção das credenciais"** — 3+ bullets longos e prolixos sobre cofre, campo em branco e função de gravação | Estrutural (padrão do item: check-list curta vs. bullets longos) e de rótulo | Restaurar título, padrão de check-list de 4 itens e densidade curta do blueprint. Nenhuma frase pode revelar mecanismo interno além do que o blueprint aprova |
| Região 4: **"Eventos recentes"** — tabela com Data e hora / Integração / Evento / Detalhes / Status / Executado por, 5 linhas, rodapé "Mostrando 1 a 5 de 5 eventos" + "Ver histórico completo →" | Ausente da dobra; o que existe abaixo é o rodapé de benefícios (`SettingsBenefitsFooter`) | **Estrutural: região crítica ausente** | Implementar a região de eventos, mesmo vazia, com o mesmo cabeçalho de colunas e o link "Ver histórico completo". Vazio legítimo → estado vazio dentro da tabela, não remoção |
| Densidade: as 4 regiões cabem na dobra da referência | Só 2 regiões visíveis em 768px; painéis com padding e altura de linha inflados | **Estrutural: densidade** | Aplicar a faixa de composição do handoff (corpo 12–13px, títulos de seção 14–17px, padding interno ~16px) |

Ponto de correção no código: `features/settings/SettingsIntegrationsPanel.tsx`,
`integrations/IntegrationsSummary.tsx` (remover), `integrations/IntegrationProviderCard.tsx`
(reconstituir painel amplo), `integrations/IntegrationHealthRail.tsx` e
`integrations/IntegrationSecuritySummary.tsx` (substituir por Permissões e escopos +
Política de segurança), nova região de eventos recentes.

### Gate de aceitação — tela 01

| Critério | Resultado |
| --- | --- |
| MACRO COMPOSITION MATCH | NÃO |
| REGION ORDER MATCH | NÃO |
| GRID MATCH | NÃO |
| DENSITY MATCH | NÃO |
| SIDEBAR/SHELL MATCH | NÃO (ver seção 8) |
| DETAIL PATTERN MATCH | NÃO |

**Veredito: reprovada.**

---

## 3. Tela 02 — Configurações (visão geral)

Referência: `02-settings-overview-approved.png` · Runtime: `settings-overview-dark-1366x768.png`

| Região do blueprint | Runtime V2 | Divergência | Correção obrigatória |
| --- | --- | --- | --- |
| Faixa executiva de **5 métricas** em uma linha (Integrações ativas, Usuários internos, Perfis de acesso, Fontes conectadas, Alertas de auditoria), cada uma com ícone, valor grande e delta "vs. mês anterior" | Faixa de **3 blocos** (Módulos ativos, Configurações acessíveis, Acesso = "Governado"), sem delta, com um bloco de valor textual gigante | **Estrutural: contagem, natureza e grade da faixa** | Restaurar a faixa de 5 métricas de governança. Métrica sem série histórica omite o delta ou exibe "Indisponível"; não substituir a métrica por rótulo textual |
| Grade densa de **8 módulos em 4×2**, cada card com ícone, título, badge `Ativo`, descrição de 1–2 linhas, **linha de 3 sub-métricas** e link `Gerenciar … →` | **5 cards em 4+1**, ampliados, sem sub-métricas, com badge e link; quarta coluna da segunda linha vazia | **Estrutural: grade 4×2 quebrada, sub-métricas removidas, densidade inflada** | Reconstituir a grade estrutural 4×2 e a linha de 3 sub-métricas por card. Módulo sem permissão real → omitir o card; módulo publicado sem dado → sub-métricas em "Indisponível". Não preencher a grade com módulo inexistente |
| Título de seção "Módulos de configuração" | Presente, com subtítulo | Sem divergência estrutural | Preservar |
| **"Atividades recentes"** — tabela com Ação realizada / Detalhes / Executado por / Módulo / Data e hora / Status, 6 linhas, link "Ver histórico completo →" e rodapé "Mostrando 1 a 6 de 6 atividades" | **"Atividade recente"** — painel com uma frase: "Os eventos consolidados de governança não estão disponíveis nesta leitura." | **Estrutural: tabela substituída por parágrafo** | Manter a tabela com cabeçalho de colunas e rodapé; o vazio vira estado vazio dentro da tabela, preservando colunas e o link de histórico |
| Densidade: tudo na dobra, com a tabela iniciando ainda na primeira tela | Tela termina em ~730px com muito vazio à direita e abaixo | **Estrutural: densidade** | Aplicar as métricas de composição da seção 4 do handoff |

Ponto de correção no código: `features/settings/SettingsPage.tsx`.

### Gate de aceitação — tela 02

| Critério | Resultado |
| --- | --- |
| MACRO COMPOSITION MATCH | NÃO |
| REGION ORDER MATCH | PARCIAL → conta como NÃO (ordem preservada, mas com regiões de natureza trocada) |
| GRID MATCH | NÃO |
| DENSITY MATCH | NÃO |
| SIDEBAR/SHELL MATCH | NÃO |
| DETAIL PATTERN MATCH | NÃO |

**Veredito: reprovada.**

---

## 4. Tela 03 — Usuários e acesso

Referência: `03-users-access-approved.png` · Runtime: `access-users-dark-1366x768.png`

É a tela mais próxima do blueprint, e ainda assim reprova por três motivos estruturais.

| Região do blueprint | Runtime V2 | Divergência | Correção obrigatória |
| --- | --- | --- | --- |
| Cabeçalho com título, subtítulo, carimbo "Atualizado em …" + botão de refresh e ação primária `+ Novo usuário` | Cabeçalho com título, subtítulo mais longo e ação primária `+ Criar usuário`; sem carimbo/refresh | Menor (rótulo e carimbo) | Alinhar rótulo e reinserir o carimbo de atualização; se não houver timestamp real, exibir "Indisponível" |
| Resumo de **5 blocos** (Usuários ativos, Administradores, Gestores, Convidados/externos, Acessos pendentes) com delta "este mês" | Resumo de **5 blocos** com outra taxonomia (Usuários ativos, Áreas ativas, Sem área atribuída, Usuários suspensos, Convites pendentes), sem delta, com descrições de 2–3 linhas que inflam a altura para ~130px | Estrutural (altura/densidade) + semântico (taxonomia) | Manter 5 blocos compactos de uma linha de apoio. A taxonomia do runtime pode prevalecer **se** for a real do backend, mas a densidade tem de voltar ao padrão do blueprint |
| — (o blueprint **não** tem barra de abas) | Barra de abas `Usuários / Estrutura / Perfis / Convites (histórico)` inserida entre o resumo e a toolbar | **Estrutural: região inventada, empurra a tabela para fora da dobra** | Remover a barra de abas da composição de 1366 ou reposicioná-la conforme o blueprint. Se as quatro superfícies forem reais e necessárias, isso é uma decisão de produto que precisa de blueprint — não pode ser resolvida no lote de fidelidade |
| Toolbar: busca + 3 selects rotulados (Papel, Status, Equipe) + `Limpar filtros`, altura ~34–38px | Busca + 4 botões-filtro sem rótulo externo ("Todas as áreas", "Todas as funções", "Todos os perfis", "Todos os status"), sem `Limpar filtros`, altura ~40px+ | Estrutural (padrão de controle e ausência do limpar) | Restaurar select rotulado e a ação `Limpar filtros`; ajustar altura para 32–36px |
| Tabela compacta: linhas de ~34–40px com avatar + nome + e-mail em duas linhas de 12/11px, colunas Nome/Papel/Escopo/Equipe/Último acesso/Status/Ações, **ações como menu `…`**, rodapé com paginação e "10 por página" | Linhas de **~100px**, sem avatar, colunas Usuário/Área/Função/Perfil/Status/Contexto atualizado/Ações, **ações como dois botões grandes empilhados** (`Redefinir senha`, `Suspender`), sem rodapé visível na dobra | **Estrutural: densidade (2,5× a altura de linha) e padrão de ação** | Voltar à linha compacta com avatar e ao menu `…` por linha; paginação e "N por página" no rodapé |
| **Detail rail** persistente à direita (360–390px) com identidade, módulos com acesso, áreas restritas e ações rápidas | Ausente no baseline de listagem; existe em captura separada (`access-users-detail-dark-1366x768.png`) | **Estrutural: rail não persistente em 1366** | Tornar o trilho contextual persistente em 1366, conforme o handoff. Sem usuário selecionado, exibir o rail em estado vazio, não removê-lo |

Ponto de correção no código: `features/access/InternalControlPlanePage.tsx` (montado como
`AccessPage` em `app/router.tsx:194`; as quatro abas estão declaradas nas linhas 74–77) e os primitivos
`features/settings/ui/UiTable.tsx`, `UiRowActions.tsx`, `UiToolbar.tsx`.

### Gate de aceitação — tela 03

| Critério | Resultado |
| --- | --- |
| MACRO COMPOSITION MATCH | NÃO |
| REGION ORDER MATCH | NÃO (abas inseridas) |
| GRID MATCH | NÃO (sem detail rail) |
| DENSITY MATCH | NÃO |
| SIDEBAR/SHELL MATCH | NÃO |
| DETAIL PATTERN MATCH | NÃO |

**Veredito: reprovada.**

---

## 5. Tela 04 — Central de ajuda

Referência: `04-help-center-settings-approved.png` · Runtime: `help-center-dark-1366x768.png`

É a divergência mais severa do lote: o runtime não é uma versão menos densa do
blueprint, é **outra tela**.

| Região do blueprint | Runtime V2 | Divergência | Correção obrigatória |
| --- | --- | --- | --- |
| Cabeçalho "Central de Ajuda / Configuração editorial, publicação e governança do conhecimento." + ação `Visualizar Central de Ajuda ↗` | "Central de ajuda / Como cada marca se apresenta na central pública e por onde o cliente fala com o time." + `Abrir central pública` + carimbo "1 central de ajuda" | Estrutural (a promessa da tela mudou) | Restaurar título e subtítulo editoriais |
| Faixa de **5 métricas editoriais**: Artigos publicados, Rascunhos, Categorias, Autores ativos, Tempo médio de atualização — com deltas | Faixa de 5 blocos de **identidade/catálogo**: Centrais vinculadas, Contatos publicados, Perfis consultados, Artigos publicados, Categorias — com descrições de 3 linhas | Estrutural (natureza da faixa e densidade) | Restaurar a faixa editorial. Métrica inexistente no backend → "Indisponível" dentro do bloco |
| **"Configuração editorial"** — 6 linhas de política (Publicação, Revisão, Visibilidade, Comentários, Versionamento, SLAs editoriais), cada uma com ícone, título, descrição e **controle à direita** | Ausente | **Estrutural: região crítica ausente** | Implementar a região com as 6 linhas. Política sem capacidade real no runtime → controle em estado indisponível ou linha omitida com registro, nunca a região inteira suprimida |
| **"Publicação e canais"** — 6 linhas (Portal público, Área logada, Marcas vinculadas, Idioma, SEO básico, Status de publicação) com controle e badge | Substituída por "Identidade desta central" (nome, endereço, idioma, domínio) + "Canais de contato" (e-mail, WhatsApp, site, página de status) | **Estrutural: região substituída** | Reconstituir "Publicação e canais". Os dados de contato podem existir como subpainel factual **dentro** da composição editorial, nunca no lugar dela |
| **"Categorias e coleções"** — tabela ordenável (handle de arraste, Categoria/Coleção, Descrição, Artigos, Visibilidade, Atualização, Status, `…`), ação `+ Nova categoria`, menu `⋮`, paginação | Ausente | **Estrutural: região crítica ausente** | Implementar a região, mesmo vazia, com cabeçalho de colunas e paginação |
| **"Permissões editoriais"** — 4 linhas (Criar, Revisar, Publicar, Arquivar) com "Quem pode executar" e contagem de usuários + link `Gerenciar permissões editoriais →` | Ausente | **Estrutural: região crítica ausente** | Implementar a região com as 4 ações editoriais; contagem sem leitura → "Indisponível" |
| Grade: 2 colunas equivalentes na 2ª faixa e 2/3 + 1/3 na 3ª faixa | Coluna única, com um formulário de contato ocupando a dobra | **Estrutural: grid** | Restaurar a grade de duas colunas do blueprint |

Ponto de correção no código: `features/settings/HelpCenterSettingsPage.tsx` (300 linhas
hoje; a composição aprovada exige quatro regiões, então este arquivo será reescrito, não
ajustado).

### Gate de aceitação — tela 04

| Critério | Resultado |
| --- | --- |
| MACRO COMPOSITION MATCH | NÃO |
| REGION ORDER MATCH | NÃO |
| GRID MATCH | NÃO |
| DENSITY MATCH | NÃO |
| SIDEBAR/SHELL MATCH | NÃO |
| DETAIL PATTERN MATCH | NÃO |

**Veredito: reprovada. Maior esforço do lote.**

---

## 6. Tela 05 — Histórico de sincronizações

Referência: `05-sync-history-approved.png` · Runtime: `sync-history-dark-1366x768.png`

O runtime está vazio (0 execuções no ambiente local). Conforme a seção 3 do handoff,
**o vazio não prova fidelidade**: a composição precisa ser verificável com fixture
determinística de QA visual.

| Região do blueprint | Runtime V2 | Divergência | Correção obrigatória |
| --- | --- | --- | --- |
| Faixa de **5 métricas** (Execuções hoje, Concluídas, Parciais, Falhas, Tempo médio) com percentual de apoio, **acima** da toolbar | 5 métricas (No recorte, Concluídas, Parciais, Com falha, Em andamento), todas em 0, posicionadas **abaixo** da toolbar | **Estrutural: ordem das regiões invertida** | Mover a faixa de métricas para acima da toolbar; incluir "Tempo médio" |
| Toolbar de filtros: Período, Origem, Resultado, Execução (auto/manual) + `Limpar filtros`, em faixa compacta de ~34–38px | Filtros: Período, Fonte, Resultado, Gatilho + `Limpar filtros` — corretos em conteúdo, mas em cartão próprio com altura ~48px e rótulos externos altos | Estrutural (densidade e encapsulamento) | Compactar a toolbar para uma faixa única, sem cartão dedicado |
| **Lista/tabela de execuções à esquerda** (~2/3): linhas expansíveis com ID + tipo (Automática/Manual), Iniciada em, Duração, Registros processados, Resultado, Etapa atual; linha expandida mostra sub-linhas por fonte e a régua "Passos executados (6/6)"; rodapé "Exibindo 1–5 de 28" + paginação | Painel único de largura total com estado vazio "Nenhuma atualização registrada neste ambiente." | **Estrutural: layout de 2 colunas colapsado em 1; tabela ausente** | Reconstituir a coluna esquerda com o cabeçalho de colunas, o padrão expansível e o rodapé de paginação, **inclusive vazia** |
| **Painel de detalhe à direita** (~1/3, 360–390px): "Detalhes da execução selecionada" com banner de resultado, ficha (ID, tipo, iniciada, finalizada, duração, origem, usuário, ambiente), "Resumo" (fontes, processados, inseridos, atualizados, ignorados, com erro), "Etapas do ciclo" e aviso de sanitização | Ausente | **Estrutural: região crítica ausente** | Implementar o painel persistente; sem run selecionado, estado vazio dentro do painel |
| Estados verificáveis: sucesso, parcial, falha sanitizada e run selecionado com etapas | Nenhum estado verificável | Bloqueio de evidência | Criar fixture determinística **exclusiva para QA visual**, isolada do caminho de produção e claramente marcada, cobrindo os quatro estados. Não gravar dados operacionais |

Ponto de correção no código: `features/settings/SyncHistorySettingsPage.tsx` e
`features/settings/history/sync-history-view.mjs`.

### Gate de aceitação — tela 05

| Critério | Resultado |
| --- | --- |
| MACRO COMPOSITION MATCH | NÃO |
| REGION ORDER MATCH | NÃO |
| GRID MATCH | NÃO |
| DENSITY MATCH | NÃO |
| SIDEBAR/SHELL MATCH | NÃO |
| DETAIL PATTERN MATCH | NÃO |

**Veredito: reprovada. Depende de fixture de QA antes de ser verificável.**

---

## 7. Tela 06 — Fontes do Dashboard

Referência: `06-dashboard-sources-approved.png` · Runtime: `dashboard-sources-dark-1366x768.png`

| Região do blueprint | Runtime V2 | Divergência | Correção obrigatória |
| --- | --- | --- | --- |
| Cabeçalho + **card "Como funciona"** no topo direito (regra de domínio + `Saiba mais →`) | Cabeçalho com 2 ações empilhadas (`Reler estado`, `Atualizar painel completo`) e carimbo "19 pipelines no catálogo"; sem card explicativo | Estrutural (região ausente; ações empilhadas verticalmente ocupam 2 linhas) | Reintroduzir o card "Como funciona"; colocar as ações em linha única |
| Faixa de **4 métricas** (Fontes ativas "3 de 5 configuradas", Domínios cobertos, Pendências de mapeamento, Última atualização) | Faixa de 4 blocos (Fontes ativas 17, Aguardando classificação 2, Atualização automática "Desativada", Última carga "Indisponível") | Conteúdo, não estrutura — mas a densidade dos blocos é maior | Preservar a faixa de 4; compactar para a altura do blueprint. A taxonomia real do backend prevalece |
| **"Mapa de origem"** (esquerda, ~2/3): tabela Fonte / Status / Domínios cobertos (chips coloridos) / Observação, com link `Gerenciar integrações →` | "Fontes ativas": tabela Fonte / Domínios atendidos / Estado publicado / Última atualização / Volume da última carga / Ações, com 2 botões por linha e linhas de ~90px | **Estrutural: perde os chips de domínio, ganha coluna de ações, densidade 2× e sem link de gerenciar** | Restaurar a tabela do blueprint com chips de domínio, linhas de 34–40px, ação por menu e o link `Gerenciar integrações →` |
| **"Ritmo de atualização"** (direita, ~1/3): dois blocos — "Cadência configurada" (select + Próxima execução, Frequência, Janela, Fuso) e "Atualização manual" (`Atualizar agora`, última execução manual, status, `Ver histórico de atualizações →`) | **Ausente** — a tela é de coluna única | **Estrutural: região crítica ausente e grid colapsado** | Reconstituir a coluna direita com as duas sub-regiões. Campos sem leitura → "Indisponível" |
| **"Catálogo de fontes por domínio"**: tabela Domínio / Fonte / Entidade / Leitura / Status / Última atualização / Observação, 8 linhas densas | Substituída por "Aguardando classificação" (pipelines sem área) | **Estrutural: região substituída** | Implementar o catálogo por domínio. "Aguardando classificação" pode ser um recorte/estado **dentro** do catálogo, não a região inteira |
| **"Pipelines e coleções publicadas"**: 3 cards por domínio, cada um com badge `Pipeline ativo`, selects de Pipeline e Coleção, carimbo de última publicação e `Gerenciar pipelines →`, + card informativo lateral | Ausente da dobra | **Estrutural: região crítica não verificável** | Implementar a região; domínio sem pipeline publicado não aparece, conforme a própria regra do blueprint |

Ponto de correção no código: `features/settings/DashboardSourcesSettingsPage.tsx`.

### Gate de aceitação — tela 06

| Critério | Resultado |
| --- | --- |
| MACRO COMPOSITION MATCH | NÃO |
| REGION ORDER MATCH | NÃO |
| GRID MATCH | NÃO |
| DENSITY MATCH | NÃO |
| SIDEBAR/SHELL MATCH | NÃO |
| DETAIL PATTERN MATCH | NÃO |

**Veredito: reprovada.**

---

## 8. Shell e sidebar (transversal às seis telas)

| Região do blueprint | Runtime V2 | Divergência | Correção obrigatória |
| --- | --- | --- | --- |
| Largura expandida ~240px / recolhida 56px | `--shell-sidebar-width: 240px`, `--shell-sidebar-collapsed: 56px` (`apps/web/src/index.css:156-157`) | **Sem divergência** | Preservar |
| Grupos: INTELIGÊNCIA, CONTEÚDO, OPERAÇÃO CX, GOVERNANÇA, ADMINISTRAÇÃO, com chevron por grupo e submenus | Grupos: PAINEL, CENTRAL DE AJUDA, CONFIGURAÇÕES — itens planos, sem submenu | **A verificar antes de classificar.** `features/navigation/minimal-navigation.ts` define **as duas** taxonomias; a variante depende das permissões efetivas. O baseline foi capturado com a fixture `QA Local Administrador` | Reautenticar o baseline com um perfil que resolva a taxonomia do blueprint **antes** de tratar isto como bug de layout. Se a taxonomia do blueprint não for alcançável por nenhuma permissão real, registrar como divergência de contrato de navegação, não corrigir no frontend |
| Topbar dedicada (~50px) com seta de voltar, breadcrumb `GeniusOS / Configurações / …`, controle de tema (sol/lua/monitor) e identidade do usuário à direita | **Não há topbar.** O breadcrumb está dentro da área de conteúdo, sem seta de voltar; não há controle de tema nem identidade no topo | **Estrutural: região ausente em todas as seis telas** | Implementar a topbar do blueprint no shell. O controle de tema já existe via `ThemeProvider`; a identidade já existe no rodapé da sidebar e precisa ser espelhada conforme o blueprint |
| Campo de busca global na sidebar | Presente ("Pergunte ao G… `Ctrl K`") | **O blueprint não mostra este campo** | Decisão pendente: é capacidade real e útil. Não remover sem ordem; registrar como divergência conhecida e aceita, ou pedir extensão do blueprint |
| Rodapé da sidebar: card de usuário + ação `Recolher menu` na base | Card de usuário na base; o controle de recolher está no **topo direito** da sidebar (`‹`) | Estrutural (posição do controle) | Mover o controle de recolher para o rodapé, conforme o blueprint |
| Submenu flutuante em overlay no estado recolhido | Não verificado neste lote (baseline capturado apenas expandido) | Não verificado | Capturar o estado recolhido em 1366 antes de declarar o shell |

---

## 9. Consolidado

| Tela | Regiões do blueprint | Ausentes | Substituídas | Inventadas | Veredito |
| --- | --- | --- | --- | --- | --- |
| 01 Integrações | 4 | 1 (Eventos recentes) | 2 (Permissões e escopos; Política de segurança) | 1 (trilho de KPIs) | Reprovada |
| 02 Configurações | 3 | 0 | 2 (faixa executiva; atividades) | 0 | Reprovada |
| 03 Usuários e acesso | 5 | 1 (detail rail persistente) | 0 | 1 (barra de abas) | Reprovada |
| 04 Central de ajuda | 5 | 3 (Config. editorial; Categorias; Permissões editoriais) | 2 (faixa; Publicação e canais) | 0 | Reprovada |
| 05 Histórico | 4 | 2 (tabela de execuções; painel de detalhe) | 0 | 0 | Reprovada |
| 06 Fontes do Dashboard | 6 | 3 (Como funciona; Ritmo de atualização; Pipelines publicados) | 1 (Catálogo por domínio) | 0 | Reprovada |
| Shell | — | 1 (topbar) | 0 | 1 (busca global, a decidir) | Reprovado |

**Seis de seis telas reprovadas.** Nenhuma tela pode ser declarada aprovada, publicada
ou mesclada com base neste documento.

### Esforço relativo estimado (para sequenciamento, não é compromisso de prazo)

1. **04 Central de ajuda** — reescrita da tela (4 regiões, 3 ausentes).
2. **06 Fontes do Dashboard** — 3 regiões ausentes + grid de 2 colunas.
3. **01 Integrações** — 1 região ausente + 2 substituídas + remoção de região inventada.
4. **05 Histórico** — 2 regiões + fixture de QA visual.
5. **02 Configurações** — faixa + grade 4×2 + tabela.
6. **03 Usuários e acesso** — densidade, ação por linha, rail persistente, abas.
7. **Shell/topbar** — atravessa todas; convém resolver junto com a tela 01.

## 10. Ordem de execução proposta para a V2.1

O handoff manda corrigir uma tela por vez contra o blueprint de 1366×768. Proponho
começar por **01 Integrações + shell/topbar** — não por ser a mais divergente, mas
porque a topbar é transversal e a tela 01 é a primeira do gate. As demais seguem na
ordem 04, 06, 05, 02, 03.

Antes da tela 01, é preciso resolver o item de navegação da seção 8: reautenticar o
baseline com o perfil correto e determinar se a taxonomia da sidebar do blueprint é
alcançável por permissão real. Isso muda o que é bug de layout e o que é contrato.

## 11. Limitações deste relatório

- Diagnóstico feito sobre o baseline 1366×768 escuro **já existente** do lote V2
  (`bdd2b2c`). Não foram geradas capturas novas neste ciclo.
- Medidas citadas (alturas de linha, larguras de trilho) são estimativas de leitura das
  imagens, não medições instrumentadas. O `measurement map` da V2.1 deve instrumentar.
- O estado recolhido da sidebar, os viewports 1440/1024/390 e o tema claro não foram
  avaliados, por decisão explícita do handoff.
- Nenhuma alteração de código, banco, migration, secret, deploy ou push foi feita.
- Os checks remotos da PR #34 (commit `718b988`) **não** foram consultados neste ciclo.

## 12. Encerramento do lote

- **Arquivos alterados:** apenas este relatório (`docs/reports/2026-08-09_configuration-po-v2-1-fidelity-delta.md`).
- **Implementado:** o bloqueio obrigatório da seção 2 do handoff — delta região a região das seis telas + shell, com o gate factual preenchido.
- **Decisões:** (a) reutilizar o baseline 1366 escuro existente em vez de reiniciar o ambiente, por eficiência e para não perturbar as instâncias locais; (b) classificar a taxonomia da sidebar como *a verificar* em vez de divergência, porque o código admite as duas variantes por permissão; (c) tratar vazio de dados como estado vazio dentro da região, nunca como justificativa para remover região.
- **Validações executadas:** nenhuma suíte foi rodada — o lote não toca código executável.
- **Resultado:** 6/6 telas reprovadas no gate visual; shell reprovado.
- **Pendências:** correção tela a tela; fixture de QA para a tela 05; captura do estado recolhido; viewports e tema claro após o gate de 1366.
- **Riscos/dependências:** CI da PR #34 não verificado; fixture de QA precisa ser isolada do caminho de produção.
- **Status Git:** branch `codex/admin-configuration-visual-v1` em `718b988`, árvore limpa exceto por este relatório e pelo handoff, ambos não versionados. Nenhum commit, push ou merge realizado.
- **Próximo ciclo recomendado:** resolver o item de navegação da seção 8 e então executar a correção da tela 01 (Integrações) + topbar, com captura e gate factual.
