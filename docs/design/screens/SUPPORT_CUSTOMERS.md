# Support Customers Design Spec

## Tela

`/support/customers` e base visual para `/support/customers/:tenantId`

## Objetivo

Centralizar contexto das contas B2B, contatos, saúde operacional, migração e histórico de suporte.

A tela deve parecer CRM operacional de suporte técnico B2B, não cadastro genérico.

## Estrutura obrigatória

### Sidebar

- Navy profunda.
- Item ativo: `Clientes`.
- Mesmos itens do Support Workspace.

### Topbar

- Pills:
  - `DEVELOPMENT`
  - `AGENT WORKSPACE`
- Botão `Encerrar sessão`.

### Cabeçalho

Título: `Clientes`.

Subtítulo:
- Centralizar contas, contatos, saúde e histórico operacional.

### Tabs

Usar tabs:

- Contas, ativo.
- Contatos.
- Migrações.
- Saúde.

### KPIs

Cards compactos:
- Clientes ativos.
- Em migração.
- Risco alto.
- Sem responsável.

## Layout principal

> **Adendo de direção — 2026-07-23:** a especificação abaixo é histórica para o preview lateral. Para a implementação corrente, a operação principal deve usar no máximo duas zonas: filtros/toolbar integrados ao cabeçalho e uma lista/tabela central dominante. A coluna fixa de ferramentas e o rail permanente de preview estão superados pela auditoria `docs/reports/CS_B2B_PORTFOLIO_UX_DATA_AUDIT_2026-07-23.md`. O detalhe deve abrir em rota/workspace ou drawer contextual, preservando filtros e retorno.

Grid em 3 colunas.

### Coluna esquerda: segmentação

Card `Segmentação`.

Conteúdo:
- Listas rápidas:
  - Minha carteira.
  - Em migração.
  - Risco alto.
  - Sem responsável.
- Filtros:
  - Status.
  - Plataforma.
  - Plano.
  - Responsável.
- Botão `Recarregar`.

### Centro: contas prioritárias

Lista/tabela densa de clientes.

Cada linha:
- Nome do cliente.
- ID ou slug.
- Plataforma.
- Produto.
- Responsável.
- Saúde/status.
- Última atividade.
- Menu kebab.

Linha selecionada:
- Fundo azul muito claro.
- Destaque sutil.

### Rail direito: preview do cliente (referência histórica; não usar na nova implementação)

Título: `Preview do cliente`.

Card navy do cliente selecionado:
- Nome.
- Status.
- Risco.
- Plataforma.
- Produto.
- Responsável.
- Última atividade.

CTAs:
- `Abrir cliente`.
- `Ver tickets`.

Cards abaixo:
- Resumo operacional.
- Contato principal.
- Sinais da conta.

## Detalhe do cliente

Quando for tela de detalhe, manter:
- Header compacto do cliente.
- Tabs de contexto.
- Cards de tickets, contatos, migração, saúde e atividade.
- Não transformar em cadastro CRUD frio.

## Proibições

- Tabela burocrática sem contexto.
- Cards altos demais.
- Misturar consumidor final com cliente B2B.
- Linguagem B2C.

## Critérios de aceite

- Tela comunica gestão de contas B2B.
- Preview lateral ajuda suporte/CS.
- Tabs organizam contexto sem trocar de tela.
