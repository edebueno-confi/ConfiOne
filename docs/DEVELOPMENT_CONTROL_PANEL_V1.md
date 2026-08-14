# Painel de Desenvolvimento V1

## Estado atual do produto e memória de construção — 2026-08-13

O ConfiOne começou com uma ambição mais ampla de plataforma interna. A primeira
entrega publicada, porém, tomou uma rota mais pragmática: Central de Ajuda
externa e Dashboard gerencial interno. O SaaS interno completo continua como
direção futura, não como capacidade já publicada.

O cockpit documenta essa jornada sem virar um processo pesado. O Diário conta
o caminho; a biblioteca técnica abre as fontes oficiais; os cards registram
decisões, mudanças de rota, handoffs, erros, acertos, stack e próximos passos.
Resumo operacional não substitui código, contratos ou documento canônico.

Quando acessados por `surface=development`, Diário e Documentos usam a
identidade escura e densa do subsistema, com leitura adequada para telas HD e
sem alterar a experiência normal do ConfiOne. O estado vigente deve sempre ser
conferido no código, contratos e `PROJECT_STATE.md`; documentos históricos são
contexto, não plano corrente.

O mínimo esperado para uma passagem é simples: o que mudou, por que mudou,
qual foi o resultado e como foi validado. Isso mantém a memória útil sem criar
barreiras de compliance para a equipe.

### Reconstrução das superfícies documentais — V2

A superfície `surface=development` não reutiliza a composição editorial antiga
do Diário nem o master-detail genérico do Admin Console.

- O Diário é uma tela de decisão: rail de fases, fase em foco, decisão,
  evidência e próximo movimento. Linha do tempo, decisões e mapa técnico são
  modos de leitura da mesma memória, não blocos empilhados na mesma página.
- Documentos é uma biblioteca de consulta: índice pesquisável, leitor central
  e contexto do catálogo. O estado vazio diferencia catálogo sem publicação de
  erro de leitura e oferece a próxima ação.
- As duas telas mantêm o contexto do cockpit, mas não dependem da hierarquia,
  dos cards ou do hero do ConfiOne. A identidade é estrutural; CSS apenas
  expressa a estrutura.

## Objetivo

Oferecer uma superfície interna simples para registrar o que está sendo feito
no ConfiOne, acompanhar o trabalho em andamento e deixar um resumo auditável do
resultado e da validação.

O painel não substitui o Git, o código, as migrations ou a documentação
versionada. Ele organiza o trabalho e aponta para essas fontes.

## Escopo da V1

Estados visíveis:

- `backlog`: demanda registrada, ainda não iniciada;
- `awaiting_agent`: demanda explicitamente entregue para execução pelo agente;
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

Quando aberto, o painel funciona como um subsistema restrito: depois da
confirmação de entrada, o shell principal fica recolhido e bloqueado
visualmente, e o cockpit assume uma linguagem própria de operação. Isso é um
sinal de contexto e risco de mudança; não substitui autenticação nem as
permissões do backend. A toolbar do cockpit fica limitada ao próprio contexto
da sessão — Quadro, Diário de Construção e Documentos — para não reabrir a navegação operacional
enquanto o subsistema estiver ativo.

Quando Diário e Documentos são abertos com `surface=development`, eles assumem
uma superfície visual própria do subsistema: canvas escuro, grade técnica,
contraste vermelho/ciano, densidade maior e margens compactas. A rota normal do
Admin Console permanece preservada; o parâmetro apenas mantém o contexto do
cockpit durante a leitura.

O shell do cockpit também redefine seus próprios tokens de canvas, superfícies,
texto, bordas e foco. Assim, a troca de tema white/dark do ConfiOne não altera
o ambiente de desenvolvimento; o cockpit é um contexto visual independente.

O detalhe da tarefa abre em um inspetor lateral temporário, com largura própria
de contexto. O mesmo inspetor é reutilizado para criar e editar cards; o quadro
permanece como superfície primária e não perde nenhuma coluna para a execução.

O `Diário de Construção` continua narrativo. O painel pode apontar para o
Diário e para os Documentos do Produto, mas não substitui nenhuma das duas
áreas.

Cards que relacionam documentos exibem agora resumo, seleção entre fontes e
leitura sanitizada dentro do cockpit, mantendo o documento oficial como fonte de
verdade. O acesso ao
catálogo é governado pela capacidade `product_docs.view`, concedida ao papel
`platform_admin` neste corte.

As mensagens mojibake encontradas em funções ativas do Analytics foram
corrigidas pela migration forward-only
`20260813195500_utf8_runtime_copy_repair_v1`. Migrations históricas não são
reescritas; o contrato executado e os comentários publicados foram corrigidos
na nova versão.

A auditoria de dados também identificou cinco revisões históricas do artigo de
integração com caractere de substituição no resumo. A versão vigente está limpa;
as revisões antigas permanecem preservadas porque `knowledge_article_revisions`
é append-only. A correção não sobrescreve evidência histórica nem cria uma
migração heurística.

## Interação operacional

O fluxo esperado para uma sessão de execução é:

1. criar ou localizar um card;
2. mover o card para `awaiting_agent` quando ele estiver pronto para ser executado;
3. assumir o card, movendo-o para `in_progress`;
4. executar e validar a mudança no repositório;
5. registrar resultado, validação e, quando útil, uma atualização curta;
6. mover para `done` ou `blocked`. Um card desbloqueado volta para
   `awaiting_agent` antes de ser assumido novamente.

A ação de assumir só está disponível para cards em `awaiting_agent`. Ela é
transacional e impede que outro executor assuma o mesmo card enquanto ele já
estiver atribuído.

## Acesso e segurança

O painel é interno e fica disponível a `platform_admin`,
`engineering_member` e `engineering_manager` com perfil ativo. O escopo
operacional explícito da V1 é `confi_one_development`; ele não mistura tarefas
globais de desenvolvimento com dados de tenants clientes.

O perfil `platform_admin` do administrador da plataforma tem acesso integral ao
subsistema interno. Esse acesso não se estende automaticamente a dados de
clientes, tenants ou superfícies customer-facing.

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
