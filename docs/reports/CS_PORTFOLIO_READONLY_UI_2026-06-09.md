# CS Portfolio Read-only UI

Data: `2026-06-09`

Branch: `codex/mvp-operational-completion-goal`

## Resumo

Foi entregue o primeiro workspace de Customer Success em `/cs/portfolio`, consumindo exclusivamente `vw_cs_customer_portfolio`. A interface oferece busca, lista selecionável e detalhe operacional de cliente, sem criar regra de negócio, mutation ou indicador calculado no frontend.

## Escopo entregue

- gate dedicado `CsGate`, com loading, erro recuperável, sessão ausente, acesso negado e carteira vazia;
- redirect pós-login para `/cs/portfolio` quando o usuário possui carteira CS;
- shell interno e item `Carteira CS` na navegação unificada;
- busca por cliente, owner, produto e plano;
- detalhe com owner, membros, produtos, planos, subscriptions, tickets e última atualização;
- health exibido como `Indisponível`, com a justificativa materializada pelo backend;
- fixture local com usuário `customer_success` tenant-aware;
- testes puros para mapeamento, busca, autorização de rota e landing;
- endurecimento do pgTAP de CS para não depender de banco local vazio.

## Contratos e limites

- leitura: `vw_cs_customer_portfolio`;
- autorização: `platform_admin` global ou membership ativa `customer_success` por tenant;
- sem escrita direta, RPC de mutation ou ação operacional;
- sem billing, financeiro, preço, invoice, payment ou revenue;
- sem health score inventado;
- sem follow-ups, tarefas, projetos ou plano de ação;
- backend e RLS permanecem como fonte de verdade do isolamento tenant.

## QA autenticado

- `platform_admin`: acesso global confirmado com quatro clientes locais;
- membro `customer_success`: landing automática em `/cs/portfolio` e somente um tenant autorizado;
- usuário interno sem membership CS: redirecionado para `/access-denied`;
- busca sem resultado e limpeza da busca confirmadas;
- ausência de controles de mutation confirmada;
- desktop `1280x720` e viewport estreito `390x844` sem overflow horizontal.

## Validações

- testes Node focados: `4/4`;
- contracts typecheck: aprovado;
- web typecheck: aprovado;
- web build: aprovado;
- pgTAP focado CS: `12/12`;
- suíte pgTAP global: `51` arquivos e `1085` testes;
- lint de banco: sem erros;
- fixture funcional local com usuário CS: aprovada;
- `npm audit`: zero vulnerabilidades.

## Risco residual

- health permanece indisponível até existir contrato backend canônico;
- a carteira ainda não possui comandos operacionais, por decisão de escopo;
- o container local `supabase_vector` continua sendo ruído de infraestrutura conhecido, sem bloquear os gates deste lote.
