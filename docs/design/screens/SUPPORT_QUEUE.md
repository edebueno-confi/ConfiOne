# Support Queue Design Spec

## Tela

`/support/queue`

## Blueprint de referência

Fonte visual obrigatória:

`docs/design/blueprint/suporte/fila operacional.png`

Se houver divergência entre implementação atual, spec antigo e blueprint aprovado, o blueprint vence.

## Objetivo

Transformar `/support/queue` em uma bancada operacional B2B para triagem, priorização e entrada rápida em tickets.

Esta tela não é dashboard executivo, relatório administrativo ou empilhamento de cards genéricos.

Ela deve parecer uma superfície de trabalho diária de suporte técnico.

## Hierarquia de decisão

Para esta tela, seguir nesta ordem:

1. Blueprint PNG aprovado da fila operacional.
2. Este screen spec.
3. Primitive operacional do domínio Support.
4. `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`
5. Tokens globais aprovados.
6. Primitive genérica/fallback.
7. Implementação atual.

A implementação antiga não justifica:
- topbar técnica;
- cardização excessiva;
- distribuição genérica de dashboard;
- rail fraco;
- lista central secundária;
- reaproveitamento visual sem aderência ao blueprint.

## Responsabilidades globais versus locais

### Shell global

São responsabilidades globais do shell interno:
- sidebar;
- sessão do usuário;
- colapso da navegação;
- logout;
- regras macro de viewport e scroll do cockpit.

Esta tela não deve exigir topbar técnica própria.

Proibido nesta superfície:
- `DEVELOPMENT`;
- `AGENT WORKSPACE`;
- faixa branca superior apenas para sessão;
- header duplicando elementos do shell.

### Responsabilidade da tela

São responsabilidades específicas da tela:
- contexto operacional da fila;
- busca;
- tabs/contextos rápidos;
- filtros rápidos;
- visão salva;
- ordenação;
- lista dominante de tickets;
- contexto do ticket selecionado no rail direito.

## Estrutura obrigatória

### Composição geral

A composição deve usar três zonas operacionais:

1. coluna esquerda compacta e utilitária;
2. superfície central dominante da fila;
3. rail direito de contexto do ticket.

Regras:
- a área central deve ser a maior área útil;
- a coluna esquerda deve apoiar a triagem, não competir com a lista;
- o rail direito deve apoiar decisão imediata;
- a tela deve parecer cockpit operacional B2B, não dashboard de cards.

## Coluna esquerda: contexto rápido da fila

A coluna esquerda substitui a antiga ideia de “triagem da fila” como card narrativo.

Ela deve funcionar como coluna compacta e utilitária.

Conteúdo esperado:
- resumo curto do recorte atual;
- busca rápida, quando estiver posicionada nesta coluna;
- tabs ou recortes rápidos;
- filtros rápidos;
- atalhos de escopo;
- ação de recarregar, se útil ao fluxo.

Diretriz:
- menos texto explicativo;
- mais controles operacionais diretos;
- zero bloco pesado de narrativa.

Proibido:
- painel grande com explicação longa;
- card inflado apenas para “explicar a fila”;
- checklist ou contexto técnico aberto por padrão;
- coluna larga demais que roube espaço da lista principal.

## Topo da experiência

O topo da superfície deve priorizar:
- título `Fila operacional`;
- subtítulo curto;
- indicadores compactos;
- tabs/contextos rápidos;
- busca;
- filtros rápidos;
- visão salva;
- ordenação;
- ação primária de abrir ticket, quando o contrato da tela permitir.

Regras:
- essa camada deve parecer parte da bancada operacional;
- não deve virar hero, dashboard ou painel de marketing;
- indicadores devem ser compactos e informativos, sem inflar a altura útil.

## Tabs e contexto

Os recortes principais devem existir como troca real de contexto.

Exemplos compatíveis com o blueprint:
- Todos;
- Meus tickets;
- Não atribuídos;
- Urgentes;
- Aguardando cliente;
- Aguardando engenharia.

Regras:
- tab ativa com destaque discreto e claro;
- tabs precisam alterar o recorte real da fila;
- contagens podem aparecer como apoio;
- tabs não podem ser decoração.

## Busca, filtros, visão salva e ordenação

Essa é uma camada obrigatória da tela.

Ela deve priorizar:
- busca por ticket, assunto ou cliente;
- filtros rápidos;
- visão salva;
- ordenação.

Regras:
- controles devem ser compactos;
- filtros não devem esmagar a lista central;
- visão salva e ordenação devem parecer ferramentas da operação diária;
- a distribuição deve seguir o blueprint, não um layout genérico de formulário.

## Superfície central dominante

A lista central deve ser tratada como a superfície operacional dominante da fila.

Não deve ser descrita nem reconstruída como “card principal genérico”.

Ela deve funcionar como uma lista ou tabela densa de tickets em operação.

Cada item deve privilegiar:
- estado/status;
- prioridade;
- título do ticket;
- cliente;
- responsável;
- SLA;
- atividade recente;
- sinais suficientes para decidir rapidamente.

Regras:
- densidade operacional;
- leitura rápida;
- item selecionado com destaque sutil;
- nada de muito espaço vazio entre linhas;
- sem aparência de relatório burocrático.

Proibido:
- lista frouxa;
- cardização linha a linha sem necessidade;
- excesso de painéis secundários competindo com a fila;
- centro da tela perder prioridade para KPIs ou filtros.

## Rail direito: contexto do ticket

O rail direito deve ser tratado como `Contexto do ticket`.

Não é apenas preview visual.

É um painel operacional para decidir se o ticket deve ser aberto, assumido ou encaminhado.

Conteúdo obrigatório esperado:
- resumo do ticket;
- contato do cliente;
- status;
- responsável;
- SLA;
- ações rápidas.

Conteúdo compatível com o blueprint:
- identificador curto do ticket;
- título curto ou resumo;
- cliente;
- categoria;
- responsável;
- status atual;
- leitura de SLA;
- resumo do caso;
- contato do cliente;
- ações rápidas.

Regras:
- o rail deve ser forte e útil;
- o contexto crítico precisa estar visível;
- ações rápidas devem ficar acessíveis;
- o rail não pode parecer um card fraco ou puramente decorativo.

Proibido:
- chamar de “preview” se o papel real for de decisão operacional;
- esconder contexto crítico em accordions por padrão;
- rail estreito ou comprimido;
- conteúdo irrelevante ocupando o topo do rail.

## Linguagem visual obrigatória

Esta tela deve comunicar:
- cockpit operacional;
- triagem diária;
- contexto B2B;
- velocidade de decisão;
- leitura técnica sem jargão de backend.

Ela não deve comunicar:
- dashboard administrativo genérico;
- CRM comercial;
- relatório executivo;
- coleção de cards independentes.

## Scroll e viewport

Regras:
- a página do cockpit não deve rolar verticalmente;
- a lista central rola internamente;
- o rail direito rola internamente apenas quando necessário;
- não pode haver scroll horizontal;
- a coluna esquerda não deve virar a solução principal para falta de espaço;
- a superfície deve funcionar em viewport real de desktop operacional.

## Proibições

- topbar técnica;
- duplicação de elementos do shell;
- “triagem da fila” como card pesado e narrativo;
- lista central tratada como card genérico;
- rail reduzido a preview superficial;
- excesso de cards empilhados;
- linguagem de dashboard;
- componente reaproveitado sem aderência ao blueprint.

## Critérios de aceite

A tela só pode ser considerada pronta se:

- lembrar claramente o blueprint `fila operacional.png`;
- a sidebar e a sessão forem tratadas pelo shell global;
- não houver topbar técnica na superfície final;
- a coluna esquerda for compacta e utilitária;
- o topo priorizar busca, tabs, filtros rápidos, visão salva e ordenação;
- a lista central dominar a área útil;
- o rail direito operar como contexto do ticket, não preview decorativo;
- o conjunto parecer cockpit operacional B2B;
- a implementação não cair em dashboard genérico ou cardização excessiva.
