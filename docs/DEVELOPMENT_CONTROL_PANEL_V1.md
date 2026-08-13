# Painel de Desenvolvimento V1

## Objetivo

Oferecer uma superfície interna simples para registrar o que está sendo feito
no ConfiOne, acompanhar o trabalho em andamento e deixar um resumo auditável do
resultado e da validação.

O painel não substitui o Git, o código, as migrations ou a documentação
versionada. Ele organiza o trabalho e aponta para essas fontes.

## Escopo da V1

Estados visíveis:

- `backlog`: demanda registrada, ainda não iniciada;
- `in_progress`: demanda assumida e em execução;
- `blocked`: demanda parada por decisão, acesso ou dependência;
- `done`: demanda concluída com resultado e validação registrados;
- `cancelled`: demanda encerrada sem execução.

Cada card contém somente o necessário para a operação:

- título;
- descrição;
- prioridade;
- área;
- responsável pela execução;
- resultado;
- como foi validado;
- motivo de bloqueio, quando houver;
- links para documentos oficiais;
- atualizações curtas da execução.

## Fonte de verdade

- Código, migrations, views, RPCs e testes continuam sendo a fonte de verdade
  técnica.
- `docs/PROJECT_STATE.md` continua sendo o checkpoint do estado do produto.
- `docs/DOCUMENTATION_LEDGER.md` continua sendo o histórico documental por
  lote.
- O painel é a fonte de estado do card e da execução operacional, sem duplicar
  o corpo dos documentos.

## Relação com áreas existentes

O `Engineering Workspace` (`/engineering`) continua dedicado a demandas
técnicas originadas de tickets e ao retorno estruturado para o Suporte.

O Painel de Desenvolvimento (`/engineering/control`) é separado e serve para
backlog geral do produto, melhorias, manutenção, documentação, qualidade e
outras demandas de construção que não nasceram de um ticket.

O `Diário de Construção` continua narrativo. O painel pode apontar para o
Diário e para os Documentos do Produto, mas não substitui nenhuma das duas
áreas.

## Interação operacional

O fluxo esperado para uma sessão de execução é:

1. criar ou localizar um card;
2. assumir o card, movendo-o para `in_progress`;
3. executar e validar a mudança no repositório;
4. registrar resultado, validação e, quando útil, uma atualização curta;
5. mover para `done` ou `blocked`.

A ação de assumir é transacional e impede que outro executor assuma o mesmo
card enquanto ele já estiver atribuído.

## Acesso e segurança

O painel é interno e fica disponível a `platform_admin`,
`engineering_member` e `engineering_manager` com perfil ativo. O escopo
operacional explícito da V1 é `confi_one_development`; ele não mistura tarefas
globais de desenvolvimento com dados de tenants clientes.

O frontend lê views e chama RPCs. Não há DML direto do browser nas tabelas do
painel. As mudanças são registradas pelo mecanismo de auditoria append-only
existente.

## Fora de escopo

- sprint, estimativa, story points ou workflow de Jira;
- dependências complexas;
- comentários em tempo real;
- anexos e upload;
- automações que criem ou movam cards sozinhas;
- sincronização automática com GitHub;
- aprovação formal ou múltiplos gates de publicação.

Novos campos só devem ser adicionados quando uma necessidade real aparecer no
uso do painel.
