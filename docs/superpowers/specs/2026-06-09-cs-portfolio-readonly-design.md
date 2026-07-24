# CS Portfolio Read-only Design

## Objetivo

Criar `/cs/portfolio` como primeira superficie operacional de Customer Success,
somente leitura, consumindo exclusivamente `vw_cs_customer_portfolio`.

## Escopo funcional

A tela apresenta a carteira de clientes B2B autorizada para o usuario atual.
Cada registro mostra:

- cliente e status do tenant;
- owner CS, quando materializado;
- produtos, planos e status das subscriptions;
- quantidade de produtos e subscriptions ativas;
- tickets abertos, total de tickets e distribuicao por status;
- quantidade de membros ativos de Customer Success;
- ultima atualizacao operacional;
- health explicitamente `Indisponivel`, usando a justificativa do backend.

## Fora de escopo

- health score, semaforo ou classificacao inferida;
- follow-up, tarefa, reuniao, projeto ou plano de acao;
- mutation CS;
- billing, preco, invoice, payment, revenue ou financeiro;
- leitura direta de tabelas base;
- reutilizacao de views de Support ou Admin;
- rota de detalhe que dependa de contrato inexistente.

## Acesso

- `platform_admin` acessa a carteira global.
- Usuario com membership ativa em `customer_success` acessa apenas tenants
  retornados por `vw_cs_customer_portfolio`.
- Usuario autenticado nao-admin com retorno vazio e sem carteira CS e
  redirecionado para `/access-denied`.
- `platform_admin` com retorno vazio recebe empty state legitimo.
- Usuario anonimo retorna ao login com `redirectTo`.
- Sessao expirada e erro de configuracao seguem os estados comuns do produto.

O frontend nao reproduz a regra tenant-aware. A view filtra cada tenant por
`app_private.can_access_cs_customer_portfolio`.

## Arquitetura frontend

### `cs-api.ts`

Responsavel por consultar a view e converter snake_case do Supabase para
`CsCustomerPortfolio`. Exporta:

- `listCsCustomerPortfolio()`;
- `filterCsCustomerPortfolio()`, funcao pura usada pela busca;
- mapeadores de produto e contagem de tickets.

### `CsGate.tsx`

Responsavel apenas por auth e boundary de acesso:

- trata boot, configuracao, sessao expirada e anonimo;
- consulta a carteira uma vez;
- entrega o resultado por contexto para a pagina;
- diferencia acesso negado de empty state global pelo papel `platform_admin`;
- oferece retry em falha contratual.

### `CsWorkspaceShell.tsx`

Reaproveita `UnifiedInternalSidebar` e `UnifiedInternalTopbar`. O dominio
`Operacao CX` recebe o item `Carteira CS`, visivel quando o usuario e
`platform_admin`, possui carteira CS ou esta na propria rota durante o bootstrap.

### `CsPortfolioPage.tsx`

Layout de cockpit:

- cabecalho compacto com titulo, escopo e ultima atualizacao;
- busca textual;
- coluna de carteira selecionavel, densa e com scroll interno;
- painel principal do cliente selecionado;
- secoes sem cards aninhados para ownership, produtos e operacao de tickets;
- health como estado indisponivel, sem cor de risco;
- sem botoes de escrita.

## Interacao

- O primeiro cliente filtrado fica selecionado automaticamente.
- A busca considera nome, razao social, slug, owner, produto e plano.
- Alterar a busca remove selecao que saiu do resultado e seleciona o primeiro
  item restante.
- Zero resultados de busca mostra estado local e permite limpar o termo.
- Zero clientes autorizados para `platform_admin` mostra empty state da
  carteira, mantendo o shell.

## Responsividade

- Desktop: lista e detalhe lado a lado, sem scroll global.
- Tablet/mobile: lista acima do detalhe, com navegacao interna horizontal e
  scroll natural apenas na area de conteudo.
- Nenhum overflow horizontal.

## Copy

- Titulo: `Carteira de clientes`.
- Contexto: `Customer Success`.
- Health: `Indisponivel`.
- Motivo: texto recebido em `health_summary_reason`.
- Owner ausente: `Owner CS nao definido`.
- Produtos ausentes: `Nenhum produto ativo ou suspenso nesta conta`.

## Testes

- mapeamento completo da view para o contrato TypeScript;
- busca por cliente, owner, produto e plano;
- gate de redirect `/cs/portfolio` no fluxo pos-login;
- navegacao interna habilitada apenas com permissao CS;
- typecheck, build, pgTAP e documentacao;
- QA autenticado para `platform_admin`, membro CS e usuario sem acesso;
- verificacao visual de loading, portfolio, busca vazia e viewport responsivo.

## Criterios de aceite

1. `/cs/portfolio` nao consulta tabela base nem view de outro dominio.
2. O backend continua decidindo quais tenants aparecem.
3. Nao existe mutation ou acao visual falsa.
4. Health permanece indisponivel e nao e inferido.
5. Usuario sem carteira nao entra na superficie.
6. `platform_admin` e membro CS visualizam apenas o escopo previsto.
7. Loading, erro, vazio, busca vazia e sessao expirada sao honestos.
8. Typecheck, build, pgTAP, documentacao e QA browser passam.
