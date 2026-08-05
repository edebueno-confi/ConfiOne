# Relatório de recomendação do próximo macro-lote — Dashboard e Gênio em ação

> **Documento superado pela decisão do Product Owner de 2026-08-02.**
> Este relatório registra a recomendação anterior apenas para proveniência. Não
> executar o macro-lote combinado descrito abaixo. A ordem vigente e a
> especificação executável estão em
> `docs/reports/2026-08-02_ui-05-specification-delta.md` e
> `docs/specs/UI_05_GENIO_EM_ACAO_V1.md`.

## 1. Resumo executivo

- **Escopo recomendado:** macro-lote controlado de direção visual para o
  Dashboard Gerencial, começando pela Visão Geral/CEO e pelo estado de loading
  do Gênio.
- **Prioridade:** alta para clareza executiva e percepção de qualidade; não
  altera contratos, fontes, RPCs, RLS ou regras de sincronismo.
- **Item novo sugerido:** `UI-05 — Gênio em ação: voo mágico sem borda`.
- **Itens que devem permanecer no mesmo plano:** `DASHBOARD-05` (Visão Gerencial
  HD) e `DASHBOARD-06` (fonte financeira alinhada ao cabeçalho OMIE).
- **Veredito documental:** consistente com ressalvas; a execução depende de
  captura visual real, validação do estado publicado e aprovação do Product
  Owner antes de propagar o padrão para todas as abas.

## 2. Evidência observada

A captura de referência mostra o overlay de atualização do Dashboard com o
Gênio centralizado dentro de um card escuro com borda, cantos arredondados e um
apoio oval sob os pés. A composição comunica “personagem parado dentro de uma
caixa”, enquanto o objetivo desejado é “Gênio voando e fazendo magia”.

O comportamento funcional atual deve ser preservado: a tela continua bloqueada
até confirmar o estado publicado das fontes; timeout, erro e indisponibilidade
não podem virar sucesso visual.

### Copy recomendada para o estado de loading

**O Gênio está tecendo a próxima visão**

Ele está fazendo magia com as fontes conectadas para deixar o painel pronto
para você.

*A tela será liberada quando o estado publicado for confirmado.*

Essa frase substitui o tom técnico de “Atualizando o Dashboard” sem afirmar que
uma fonte respondeu antes da confirmação real. Quando houver uma etapa específica
conhecida, a primeira linha pode receber o contexto de forma discreta, por
exemplo: **O Gênio está alinhando HubSpot e OMIE**.

## 3. Proposta `UI-05`

### Direção visual

Remover a borda visível do card do Gênio e trocar o enquadramento rígido por uma
composição atmosférica:

- manter o scrim/blur do fundo para preservar foco e contexto;
- usar superfície sem contorno rígido, com contraste obtido por luz, sombra e
  halo discreto;
- animar o Gênio com flutuação vertical suave, pequena inclinação e retorno
  elástico, como se estivesse suspenso;
- adicionar partículas, estrelas e um arco de brilho em órbita, sugerindo magia
  sem transformar a tela em um loader genérico;
- remover o apoio oval estático ou convertê-lo em um rastro luminoso que se
  desfaz sob o personagem;
- preservar título, etapa da atualização e mensagem factual em uma hierarquia
  tipográfica limpa, sem aumentar o texto técnico;
- respeitar `prefers-reduced-motion`, deixando uma composição estática com halo
  e indicação textual equivalente.

A animação deve usar somente `transform` e `opacity` quando possível, evitando
reflow e consumo desnecessário durante a sincronização.

### Estados que precisam continuar verdadeiros

| Estado | Tratamento visual | Regra |
| --- | --- | --- |
| sincronizando | Gênio voando e fazendo magia | só permanece enquanto o ciclo estiver ativo |
| aguardando publicação | magia mais contida, texto de espera | não liberar a tela antes do read model publicado |
| sucesso | fechar overlay e atualizar o Dashboard | só após confirmação server-side |
| falha parcial/timeout | substituir animação por estado honesto | não apresentar “dados atualizados” |
| credencial indisponível | mensagem sanitizada e ação permitida | nunca expor segredo ou detalhe interno |

## 4. Próximo macro-lote recomendado

### Fase A — especificação e direção visual

1. Consolidar `DASHBOARD-05`, `DASHBOARD-06` e `UI-05` em uma especificação
   curta, com tokens, estados e critérios de responsividade.
2. Produzir uma direção visual para a Visão Geral/CEO e para o overlay do Gênio;
   não redesenhar as cinco áreas simultaneamente.
3. Confirmar com o Product Owner a composição sem borda antes da implementação.

### Fase B — implementação piloto

1. Aplicar o padrão visual somente à Visão Geral/CEO.
2. Reorganizar cards executivos, fonte/frescor, filtros e hierarquia da tela.
3. Implementar o movimento do Gênio usando o asset existente, sem criar nova
   fonte de dados nem alterar o contrato de sincronização.
4. Alinhar a fonte financeira ao cabeçalho OMIE apenas se o critério de
   `DASHBOARD-06` permanecer aprovado.

### Fase C — validação e decisão

Capturar a superfície real em 390, 768, 1024 e 1440px, nos temas claro e
escuro, cobrindo loading, sucesso, timeout, falha, vazio, teclado, foco,
redução de movimento e overflow. Só depois da aprovação visual propagar o
padrão para Comercial, Customer Success, Suporte & Chat e Financeiro.

## 5. Critérios de aceite

- nenhuma borda rígida visível no contêiner principal do Gênio em ação;
- personagem claramente suspenso, com movimento de voo e elementos mágicos;
- animação não altera layout, não causa overflow e não bloqueia acessibilidade;
- `prefers-reduced-motion` oferece alternativa estática equivalente;
- loading continua amarrado ao estado publicado real;
- falha, timeout e indisponibilidade continuam honestos;
- captura real antes/depois e manifesto QA persistidos no repositório;
- nenhuma alteração de token, RLS, RPC, integração ou banco sem escopo próprio.

## 6. Dependências e limites

- A animação não substitui a correção de sincronismo nem mascara fonte
  indisponível.
- A escolha do denominador de Customer Success permanece pendente conforme o
  discovery HubSpot registrado em
  `docs/reports/2026-08-02_hubspot-cs-metric-catalog.md`.
- A implementação deve usar `frontend-design` e revisão
  `web-design-guidelines`, com QA visual real; este relatório não declara o
  design aprovado.

## 7. Estado Git no momento do relatório

- Checkout canônico: `C:\Projetos\GSO-old`.
- Branch: `codex/dashboard-runtime-stabilization-20260802`.
- HEAD conhecido: `677ea12`.
- Havia alteração documental não commitada pré-existente em
  `docs/UI_REFACTOR_BACKLOG.md`; ela foi preservada e não foi sobrescrita.
- Este relatório não executa sincronização, push, merge, rebase, reset ou
  exclusão.

## 8. Próxima decisão do Product Owner

Autorizar ou ajustar a direção visual “Gênio voando e fazendo magia sem borda”
e confirmar que o piloto deve abranger somente Visão Geral/CEO + overlay de
loading antes de qualquer propagação para as demais áreas.
