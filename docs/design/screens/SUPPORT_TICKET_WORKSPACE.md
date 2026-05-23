# Support Tickets and Conversations Design Spec

## Tela

`/support/tickets/:ticketId`

## Blueprint de referência

Fonte visual obrigatória:

`docs/design/blueprint/suporte/tickets e conversas omni.png`

Este é o blueprint vigente para a reconstrução visual da superfície.

Se houver divergência entre implementação atual, spec anterior e blueprint aprovado, o blueprint vence.

## Natureza do contrato visual

O contrato vigente não é chat-only.

Ele é um workspace conversacional operacional com leitura **omnichannel**.

Isso significa que a tela deve suportar visualmente, no mesmo fluxo:
- mensagem pública;
- nota interna;
- evento de sistema;
- contexto de canal;
- tratativa operacional do ticket.

Não é feed social, não é inbox B2C e não é dashboard de cards.

## Objetivo

Transformar a tratativa do ticket em uma estação operacional B2B de conversas, contexto, decisão e resposta.

A tela deve parecer uma ferramenta diária de atendimento técnico.

## Hierarquia de decisão

Para esta superfície, seguir nesta ordem:

1. Blueprint PNG aprovado de tickets e conversas omni.
2. Este screen spec.
3. Primitive operacional do domínio Support.
4. `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`
5. Tokens globais aprovados.
6. Primitive genérica/fallback.
7. Implementação atual.

A implementação antiga não justifica:
- header administrativo;
- reconstrução por cards genéricos;
- topbar técnica;
- composer solto;
- rail fraco;
- timeline sem linguagem conversacional operacional.

## Responsabilidades globais versus locais

### Shell global

São responsabilidades globais:
- sidebar;
- sessão do usuário;
- logout;
- colapso da navegação;
- viewport macro do cockpit;
- regras macro de scroll do shell.

A superfície do ticket não deve depender de topbar técnica própria.

### Responsabilidade da tela

São responsabilidades desta superfície:
- header operacional do ticket;
- thread conversacional;
- composer dockado;
- contexto omnichannel;
- rail direito com resumo, cliente, SLA e ações rápidas.

## Estrutura obrigatória

### Composição geral

A superfície deve usar três zonas claras:

1. coluna esquerda com caixa ativa/fila curta;
2. coluna central dominante com header, thread e composer;
3. rail direito com resumo contextual.

Regras:
- a conversa é o eixo central;
- o composer pertence ao fluxo da conversa;
- o rail apoia a tratativa;
- a tela não pode ser reconstruída como grade de cards administrativos.

## Coluna esquerda

A coluna esquerda funciona como caixa ativa contextual.

Ela não é o foco principal da tela.

Conteúdo esperado:
- busca rápida;
- recortes rápidos;
- lista de conversas/tickets relevantes;
- indicação visual clara do item selecionado.

Regras:
- compacta;
- útil;
- sem roubar protagonismo da thread;
- alinhada ao idioma visual do workspace.

## Header operacional do ticket

O header deve ser compacto, horizontal e claramente operacional.

Conteúdo esperado:
- identificador curto;
- título do ticket;
- cliente;
- categoria;
- prioridade;
- status;
- canais vinculados, quando houver;
- metadados operacionais compactos.

Regras:
- o header pertence à coluna central;
- não deve invadir o rail;
- não deve parecer card administrativo inflado;
- precisa caber bem antes da thread;
- deve comunicar rapidamente o estado da tratativa.

## Thread conversacional operacional

A thread é o eixo principal da superfície.

Ela deve ser tratada como timeline conversacional operacional.

### Tipos de item obrigatórios

#### Mensagem pública

Representa comunicação visível ao cliente.

Regras:
- deve parecer parte da conversa real;
- precisa comunicar origem/canal quando isso for relevante;
- cliente e equipe devem ser distinguíveis;
- timestamps e metadados devem ser discretos.

#### Nota interna

Representa comunicação interna da equipe.

Regras:
- visualmente distinta da mensagem pública;
- fundo amarelo/âmbar claro;
- label explícita de nota interna;
- integrada ao fluxo, não como card administrativo isolado.

#### Evento de sistema

Representa transições ou registros operacionais.

Exemplos:
- ticket criado;
- status alterado;
- responsável atualizado;
- vínculo técnico registrado.

Regras:
- visualmente mais discreto que mensagens;
- deve parecer evento operacional do ticket;
- não pode competir com a conversa humana;
- não deve ser renderizado como erro técnico cru.

## Composer dockado

O composer deve ficar dockado ao rodapé da coluna central.

Ele é parte estrutural da superfície.

Não deve ser tratado como widget solto ou card separado.

Conteúdo esperado:
- alternância entre `Resposta pública` e `Nota interna`;
- área de texto dominante;
- ações auxiliares reais;
- botão primário contextual;
- contexto de canal, quando aplicável ao contrato vigente.

Regras:
- a área de texto precisa dominar o composer;
- o composer deve permanecer encaixado à conversa;
- a mudança entre resposta pública e nota interna precisa ser evidente;
- a toolbar inferior só pode existir quando tiver função real;
- nada de controles decorativos.

## Rail direito

O rail direito deve ser forte e útil.

Ele não é painel decorativo nem acúmulo de cards soltos.

### Blocos obrigatórios do rail

O rail deve priorizar:

1. resumo do ticket;
2. ações rápidas;
3. SLA e contexto operacional;
4. cliente.

Dependendo da composição final, cliente e SLA podem trocar de ordem se o blueprint exigir, mas o rail precisa manter leitura operacional clara.

### Resumo do ticket

Deve oferecer leitura rápida de:
- cliente;
- categoria;
- prioridade;
- status;
- responsável;
- visão curta do caso.

### Ações rápidas

Devem existir como ações compactas e reais do fluxo.

Exemplos compatíveis com o blueprint:
- classificar;
- alterar status;
- evidências;
- acionamentos;
- relacionados;
- mais ações.

### SLA e contexto operacional

Devem ficar visíveis como parte da tratativa.

Conteúdo esperado:
- política/referência;
- prazo;
- restante;
- leitura de progresso, se existir no contrato visual.

### Cliente

O contexto do cliente precisa aparecer como apoio da tratativa.

Pode incluir:
- nome do cliente;
- canais/participantes;
- contato;
- vínculos úteis à resposta.

Regras:
- o rail não pode virar CRM genérico;
- o contexto do cliente apoia a conversa, não domina a tela.

## Linguagem visual obrigatória

Esta superfície deve comunicar:
- cockpit operacional B2B;
- atendimento técnico diário;
- conversa real com contexto;
- omnichannel operacional;
- decisão rápida com contexto lateral.

Ela não deve comunicar:
- dashboard de cards;
- admin console genérico;
- chat casual;
- feed social;
- coleção de painéis independentes.

## Scroll e viewport

Regras:
- a página do cockpit não deve rolar verticalmente;
- a thread rola internamente;
- o composer permanece dockado;
- o rail rola internamente apenas quando necessário;
- não pode haver scroll horizontal;
- não pode haver dupla rolagem descontrolada;
- a visão principal de conversar deve caber em viewport desktop operacional.

## Proibições

- topbar técnica;
- header técnico ou administrativo;
- reconstrução da conversa como dashboard de cards;
- composer solto;
- rail fraco ou meramente decorativo;
- nota interna sem diferenciação clara;
- evento de sistema com aparência de erro bruto;
- uso de primitive genérica como gramática principal quando houver primitive operacional própria.

## Critérios de aceite

A tela só pode ser considerada pronta se:

- lembrar claramente o blueprint `tickets e conversas omni.png`;
- o contrato visual ficar explícito como omnichannel operacional, não chat-only simples;
- a thread distinguir mensagem pública, nota interna e evento de sistema;
- o composer estiver dockado ao fluxo da conversa;
- o rail direito concentrar resumo do ticket, ações rápidas, SLA/contexto e cliente;
- a conversa dominar a área útil;
- a tela não cair em linguagem de dashboard de cards;
- a implementação seguir o blueprint antes da herança legada.
