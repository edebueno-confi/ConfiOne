# UI-05 — Gênio em ação v1

**Status:** aprovado conceitualmente pelo Product Owner; especificação pronta,
sem implementação autorizada neste ciclo.

## 1. Objetivo

Definir o componente de feedback visual usado durante a atualização das fontes
do Dashboard, fazendo o Gênio parecer suspenso, voando e realizando magia sem
criar uma caixa rígida ou mascarar a verdade do sincronismo.

## 2. Problema atual

O estado atual apresenta o Gênio dentro de um card com borda, cantos marcados e
apoio oval estático. A composição comunica um bloqueio administrativo e não
expressa o comportamento desejado. Além disso, a regra de overlay não pode
bloquear o Dashboard quando já existe um snapshot válido.

## 3. Princípios

- A animação comunica atividade; não inventa progresso, contagem ou sucesso.
- O backend, o ciclo de sincronismo e o estado publicado são a fonte da verdade.
- O último snapshot válido permanece visível durante uma atualização.
- O overlay é exceção para ausência de snapshot válido, não comportamento padrão.
- A magia deve estar no movimento e na composição, não em linguagem figurativa
  excessiva.
- O asset atual do Gênio deve ser reutilizado.

## 4. Estados

| Estado | Título | Descrição | Movimento |
| --- | --- | --- | --- |
| `preparing` | O Gênio está organizando os dados do painel | A atualização está em andamento. Os novos dados aparecerão quando as fontes concluírem o processamento. | flutuação suave |
| `syncing_hubspot` | O Gênio está atualizando os dados do HubSpot | Clientes, negócios e atendimentos estão sendo organizados para o Dashboard. | voo discreto + partículas moderadas |
| `syncing_omie` | O Gênio está organizando os dados financeiros do OMIE | As informações financeiras estão sendo processadas para publicação. | voo discreto + halo controlado |
| `publishing` | O Gênio está finalizando a atualização | As fontes foram processadas e o painel está preparando a nova versão dos dados. | movimento reduzido |
| `succeeded` | — | O Dashboard pode exibir a nova versão publicada. | transição curta, sem celebração longa |
| `partial` | Atualização parcial | Parte das fontes concluiu; o Dashboard deve informar quais dados permanecem disponíveis. | sem loader contínuo |
| `failed` | A atualização não foi concluída | Manter o snapshot válido anterior e informar a data dos dados disponíveis. | encerrada |
| `timed_out` | A atualização está demorando mais que o esperado | Orientar acompanhamento pelo Histórico sem declarar conclusão. | encerrada |
| `abandoned` | A atualização foi interrompida | Manter dados anteriores ou informar indisponibilidade, conforme snapshot. | encerrada |
| `unavailable` | Dados ainda indisponíveis | Oferecer ação autorizada ou navegação para Configurações/Histórico. | estática |

O texto deve mudar somente quando a etapa mudar. Não anunciar cada frame ou
partícula para leitores de tela.

## 5. Regras de bloqueio

### Cenário A — sem snapshot válido

Pode usar overlay bloqueante na primeira carga ou enquanto dados indispensáveis
não estiverem disponíveis. O overlay permanece enquanto o ciclo estiver ativo ou
o read model estiver aguardando publicação. Deve ser encerrado diante de erro,
timeout ou abandono.

### Cenário B — com snapshot válido

Não bloquear o Dashboard. Manter os dados anteriores visíveis, permitir
navegação e leitura, mostrar status compacto, indicar a data do snapshot e
substituir os dados somente após publicação confirmada. O Gênio pode aparecer
compacto no status, sem overlay de tela cheia.

### Cenário C — falha com snapshot válido

Manter os dados anteriores, informar que a atualização não foi concluída,
mostrar a data disponível e oferecer link para Histórico. Não voltar ao loader e
não manter animação contínua.

### Cenário D — falha sem snapshot válido

Encerrar a animação, apresentar indisponibilidade honesta e oferecer ação
autorizada ou navegação para Configurações/Histórico. Não simular progresso.

## 6. Comportamento com snapshot

O snapshot anterior é preservado durante todo o ciclo. Nenhum componente visual
deve limpar os dados anteriores apenas porque uma execução entrou em `queued`,
`running` ou `publishing`.

## 7. Comportamento sem snapshot

O estado vazio deve diferenciar “aguardando uma primeira publicação” de “falha
sem dados”. O overlay bloqueante só é permitido no caminho de primeira carga
quando o ciclo estiver ativo ou aguardando publicação.

## 8. Copy aprovada

### Estado geral

**O Gênio está organizando os dados do painel**
A atualização está em andamento. Os novos dados aparecerão quando as fontes
concluírem o processamento.

### HubSpot

**O Gênio está atualizando os dados do HubSpot**
Clientes, negócios e atendimentos estão sendo organizados para o Dashboard.

### OMIE

**O Gênio está organizando os dados financeiros do OMIE**
As informações financeiras estão sendo processadas para publicação.

### Aguardando publicação

**O Gênio está finalizando a atualização**
As fontes foram processadas e o painel está preparando a nova versão dos dados.

Não usar “tecendo a próxima visão” ou “fazendo magia com as fontes” como
explicação principal. A magia deve ser visual.

## 9. Motion

- flutuação vertical suave, com amplitude pequena;
- pequena inclinação e retorno natural;
- easing confortável, sem aceleração brusca;
- halo controlado, partículas e estrelas moderadas;
- rastro luminoso discreto no lugar do apoio oval estático;
- nenhuma rotação exagerada ou movimento cobrindo o texto;
- animar preferencialmente `transform` e `opacity`;
- não introduzir biblioteca de animação sem necessidade comprovada.

## 10. Reduced motion

Com `prefers-reduced-motion`, remover voo contínuo, órbita e partículas em
deslocamento. Manter composição estática, halo discreto e indicador textual de
progresso com a mesma informação funcional.

## 11. Acessibilidade

- usar `role="status"` para o estado não bloqueante e `aria-live="polite"`;
- usar `aria-busy="true"` somente enquanto houver trabalho ativo;
- atualizar o anúncio apenas na mudança de etapa;
- não anunciar frames, partículas ou contagem fictícia;
- definir foco conforme o cenário: manter foco do usuário no modo não bloqueante
  e levar foco para o estado de erro/indisponibilidade quando necessário;
- garantir contraste e leitura em claro e escuro;
- preservar navegação por teclado quando não houver snapshot válido apenas se a
  ação apresentada for segura e autorizada.

## 12. Performance

- não animar `width`, `height`, `top` ou `left`;
- evitar reflow repetitivo e trabalho na thread principal;
- pausar a animação quando a aba não estiver visível, quando aplicável;
- limitar partículas e nós renderizados;
- não adicionar dependência pesada;
- não causar overflow horizontal ou degradação em dispositivos de baixa capacidade.

## 13. Temas

O halo e os elementos mágicos devem manter contraste suficiente em claro e
escuro, sem parecer sombra de card ou formar uma nova caixa visual. Texto,
scrim, foco e estados de erro devem usar tokens semânticos existentes.

## 14. Responsividade

Validar em 390, 768, 1024 e 1440px. O Gênio e o texto devem permanecer
centralizados e legíveis; partículas não podem escapar da área visual nem
encobrir títulos, ações ou mensagens.

## 15. Critérios de aceite

- ausência de borda visível no contêiner principal;
- ausência do apoio oval estático;
- personagem visualmente suspenso, com voo discreto, halo e magia moderada;
- nenhuma mudança de layout durante o movimento;
- snapshot válido nunca é ocultado por overlay de tela cheia;
- erro, timeout, abandono e indisponibilidade encerram a animação;
- copy aprovada usada por etapa, sem promessa de conclusão;
- reduced motion, teclado, foco e contraste validados;
- capturas reais nos quatro breakpoints e dois temas persistidas no lote de
  implementação;
- sem alteração de contratos, RLS, integrações ou asset neste micro-lote.

## 16. Limites

Esta especificação não redesenha a Visão Geral, não define métricas, não altera
o fluxo de sincronismo, não modifica o asset e não autoriza nova biblioteca.

## 17. Relação com DASHBOARD-05

`DASHBOARD-05` é uma frente posterior de arquitetura visual e hierarquia
executiva. Não deve ser implementado no mesmo micro-lote de `UI-05`.

## 18. Relação com DASHBOARD-06

`DASHBOARD-06` pertence ao backlog técnico de runtime e dados. Trata de
consistência entre OMIE, status, snapshot e read model; não é item de design
deste micro-lote.

## 19. Dependências

- conclusão do discovery HubSpot;
- decisão do denominador de Customer Success;
- aprovação do catálogo de métricas executivas;
- contratos atuais de status/frescor e snapshot;
- direção visual aprovada antes da implementação piloto;
- `frontend-design`, `gso-operational-design` e `web-design-guidelines` usados
  somente no lote de especificação/implementação autorizado.

## 20. Condição de implementação

Não implementar antes da conclusão das dependências acima e de nova autorização
do Product Owner. Quando autorizado, executar como micro-lote isolado, validar
visualmente e parar para aprovação antes de iniciar `DASHBOARD-05`.
