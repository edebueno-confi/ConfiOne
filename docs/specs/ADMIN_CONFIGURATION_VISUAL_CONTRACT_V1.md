# Genius Support OS — Admin & Configuration Visual Contract V1

## Configuration PO — Visual Lock V2

Status: aprovado pelo Product Owner em 2026-08-09 para reprodução em runtime.

Este lock substitui, quando houver conflito visual, as referências V1 e qualquer
direção histórica para as seis superfícies abaixo. Segurança, autorização,
contratos reais, capacidades existentes e proteção de dados continuam acima da
referência visual. O frontend adapta somente conteúdo, estados e handlers reais;
não cria backend, provider, dado, ação ou permissão fictícios.

| Ordem | Referência V2 | Superfície | Rota real |
| --- | --- | --- | --- |
| 01 | `docs/design/blueprint/Configuration PO/v2/01-integrations-approved.png` | Integrações | `/admin/settings/integrations` |
| 02 | `docs/design/blueprint/Configuration PO/v2/02-settings-overview-approved.png` | Configurações gerais | rota administrativa de configurações, sem Dashboard Analytics |
| 03 | `docs/design/blueprint/Configuration PO/v2/03-users-access-approved.png` | Usuários e acessos | `/admin/access` |
| 04 | `docs/design/blueprint/Configuration PO/v2/04-help-center-settings-approved.png` | Central de Ajuda — configuração | `/admin/settings/help-center` |
| 05 | `docs/design/blueprint/Configuration PO/v2/05-sync-history-approved.png` | Histórico de sincronizações | `/admin/settings/sync-history` |
| 06 | `docs/design/blueprint/Configuration PO/v2/06-dashboard-sources-approved.png` | Fontes do Dashboard | `/admin/settings/dashboard-sources` |

Regras de fidelidade:

- reproduzir composição, grid, densidade, hierarquia, primeira dobra, tabela e
  detalhe contextual das referências; não redesenhar, reinterpretar ou trocar
  blocos por preferência de implementação;
- manter o shell único: sidebar expandida de aproximadamente 240px, rail
  colapsado de aproximadamente 56px e submenu em overlay já existente;
- preservar navy, superfícies discretas, azul funcional, rosa apenas como
  microacento e iconografia linear de 16–18px;
- não alterar Dashboard Analytics, modelos de dados, integrações, secrets,
  permissões ou sincronizações para acomodar layout;
- validar dark em 1366×768 como baseline, além de 1440×900, 1024×768 e
  390×844; corrigir qualquer divergência P0, P1 ou P2 antes do aceite;
- registrar divergências factuais no relatório visual. Estado vazio, erro ou
  indisponível ocupa a região prevista pelo blueprint sem inventar conteúdo.

Status: direção visual aprovada pelo Product Owner para implementação local.
Data: 2026-08-09.
Precedência: este contrato prevalece, para as cinco superfícies abaixo, sobre orientações visuais anteriores que conflitem com ele. Código, rotas, guards, read models e handlers existentes continuam a ser a verdade para dados, ações e permissões.

## 1. Escopo e limites

Este contrato cobre somente:

1. shell autenticado e sidebar expandida, colapsada e flyout;
2. Usuários e acessos (`/admin/access`);
3. Histórico de sincronizações (`/admin/settings/sync-history`);
4. Fontes do Dashboard (`/admin/settings/dashboard-sources`);
5. Integrações (`/admin/settings/integrations`).

O Dashboard Gerencial analítico, métricas, fórmulas, APIs, views, RPCs, RLS, banco, sincronizações, scheduler, credenciais e providers ficam fora deste lote. Ausência de dado é `Indisponível`, nunca zero, estimativa ou conteúdo de exemplo.

## 2. Referências aprovadas

As referências visuais obrigatórias estão versionadas em `docs/design/blueprint/Configuration PO/`:

| Ordem | Arquivo | Superfície | Dimensão |
| --- | --- | --- | --- |
| 01 | `01-sidebar-navigation-approved.png` | Shell e navegação | 1672×941 |
| 02 | `02-users-access-approved.png` | Usuários e acessos | 1672×941 |
| 03 | `03-sync-history-approved.png` | Histórico de sincronizações | 1672×941 |
| 04 | `04-dashboard-sources-approved.png` | Fontes do Dashboard | 1672×941 |
| 05 | `05-integrations-approved.png` | Integrações | 1672×941 |

As imagens definem composição, proporção, densidade, alinhamento e hierarquia. Não definem dados, permissões, providers, métricas ou ações. Não usar outros blueprints históricos como fonte visual principal destas superfícies.

## 3. Baseline e comportamento responsivo

- baseline desktop: `1366×768`;
- QA complementar: `1440×900`, `1024×768` e `390×844`;
- dark é obrigatório; light mantém a mesma hierarquia quando já existir;
- não usar `transform: scale()`, zoom artificial ou texto menor que 12px em corpo/tabela e 11px em metadado;
- não existe scroll horizontal global;
- scroll vertical é aceitável quando conteúdo real exigir; tabela, lista e detalhe podem usar scroll interno controlado;
- em tablet, reduzir colunas auxiliares e trocar rail persistente por drawer; em mobile, a navegação deixa de ser rail permanente e a tabela adapta para lista ou overflow interno controlado.

## 4. Shell e sidebar

### Expandida

- largura de referência: `240px`;
- fundo navy integrado ao shell, sem grande card arredondado;
- marca no topo, busca global somente quando a capability já existir, grupos discretos por função e perfil do usuário fixo no rodapé;
- itens têm 36–40px, ícones lineares de 16–18px e texto de 12–13px;
- item ativo usa navy elevado, azul funcional e microacento rosa pontual.

### Colapsada

- largura de referência: `56px`;
- mostra somente ícones, estado ativo, tooltip e perfil compacto;
- conserva a preferência local existente quando ela puder ser persistida com segurança.

### Flyout obrigatório

O submenu da sidebar colapsada é um overlay ancorado ao rail, com aproximadamente 260–300px. Ele não empurra, redimensiona nem altera a largura do conteúdo. Usa scrim discreto, fecha por seleção, clique externo e `Esc`, retorna o foco ao gatilho e usa transição específica de 150–220ms. O foco fica no contexto do flyout enquanto aberto; não usar glow, neon, `transition: all` ou animação ornamental.

### Permissões

Menu, flyout e deep link usam a mesma fonte de autorização já usada por guards e catálogo de telas. Não criar matriz paralela nem hardcodar papéis. Itens não autorizados ficam ocultos; URL direta continua protegida pelo gate real.

## 5. Linguagem visual

- navy profundo, nunca preto puro; superfícies elevadas com diferença discreta de luminância; bordas sutis e radius de 6–10px;
- azul para ação, foco, link e seleção; rosa Genius somente como assinatura/microacento; verde, âmbar, vermelho e cinza apenas semânticos;
- não atribuir cor fixa por domínio e não usar caixas coloridas atrás de todos os ícones;
- ícones lineares e majoritariamente monocromáticos; logos de providers reais podem preservar sua identidade;
- título de página 22–28px, seção 14–16px, corpo 12–14px, metadado 11–12px; números usam `font-variant-numeric: tabular-nums`;
- tabelas com linhas de 36–42px e controles entre 34–38px, reduzindo blocos antes de reduzir legibilidade.

## 6. Usuários e acessos

A tabela é a superfície dominante: cabeçalho com ações reais, resumo apenas com totais entregues pelo read model, toolbar de filtros reais, seleção clara e detalhe contextual. No baseline, o detalhe usa drawer sobreposto ou painel redimensionável se um rail persistente tornar a tabela ilegível. Tabs só aparecem quando já há conteúdo real. Acesso por domínio/tela, estado e nível de acesso continuam vindo do contrato de acesso; não criar nomes, cargos, permissões, último acesso ou ações de convite/importação inexistentes.

## 7. Histórico de sincronizações

É uma superfície operacional: faixa de resumo compacta só com métricas existentes, filtros reais em uma faixa, tabela/ciclos como protagonista, linhas expansíveis para etapas e paginação compacta. Status é localizado semanticamente; erro é sanitizado e detalhe técnico só aparece sob expansão quando já vier do contrato. Não criar exportação, timeline decorativa ou métricas de registros não entregues.

## 8. Fontes do Dashboard

Mostra resumo compacto, controles de agendamento somente quando seus handlers já existem, busca/filtros reais e tabela dominante de fontes/pipelines. Colunas, classificação, status e detalhes refletem o read model. Não reativar planilhas, providers legados, GitHub ou fallback de fonte para preencher espaço.

## 9. Integrações

HubSpot e OMIE são as únicas integrações publicadas conhecidas. Cada unidade mostra identidade, finalidade, estado, credencial configurada sem valor, última execução, saúde e apenas ações já suportadas. Nunca renderizar segredo, token, chave ou conteúdo sensível no DOM. Não criar onboarding genérico, teste de conexão ou sincronização sob demanda sem handler real. Uma falha aparece uma vez no contexto do provider; integração saudável permanece neutra com indicador verde pequeno.

## 10. Gênio, dados e ações

O Gênio é avatar operacional contextual, não mascote decorativo: sem voo, magia literal, halo, partículas, glow ou personagem infantil. Pode aparecer somente para busca funcional, orientação, loading, vazio ou insight sustentado por dado. Estas superfícies não devem forçar sua presença. Toda ação de UI precisa de rota/handler e autorização reais; estados loading, vazio, erro, indisponível e sem acesso são honestos e não expõem termos internos ou dados sensíveis.

## 11. Acessibilidade e QA

São obrigatórios landmarks, hierarquia de heading, labels, foco visível, `aria-current`, `aria-expanded`, `aria-selected`, `aria-controls` quando aplicável, teclado completo, `Esc` para flyout/drawer e `prefers-reduced-motion`. O QA registra rota, persona, viewport, tema, erros de console/página, falhas de request/HTTP inesperado, métricas de scroll e screenshot. P0, P1 e P2 são corrigidos antes do aceite.

## 12. Precedência sobre orientações históricas

Para este escopo e a partir de 2026-08-09, estão superadas — sem apagar seu registro histórico — as orientações que tratem `1920×1080` como única composição principal, submenu colapsado como conteúdo que empurra a página, Gênio sobrenatural, cor por domínio, iconografia decorativa multicolorida ou Configurações como analytics decorativo.
