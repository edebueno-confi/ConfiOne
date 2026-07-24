# Visual Density And Scroll Rules

## Arquitetura de scroll

- Evitar scroll global em cockpit operacional.
- Definir um container principal de altura controlada.
- Concentrar scroll onde a leitura realmente acontece: fila, timeline, rail ou tabela.
- Manter header, composer e CTA principal visíveis quando a tarefa exigir ação contínua.

## Compactar sem perder legibilidade

- Reduzir blocos verticais antes de reduzir fonte.
- Agrupar metadados em linhas compactas.
- Trocar cards altos por seções enxutas.
- Remover bordas redundantes e títulos repetidos.

## Limites de fonte

- Evitar reduzir abaixo do que compromete leitura operacional.
- Usar variação de peso, cor e espaçamento antes de multiplicar tamanhos.
- Reservar títulos grandes para blocos realmente prioritários.

## Truncamento

- Truncar listas, badges, cabeçalhos longos e metadados secundários.
- Preservar a informação decisiva na parte visível.
- Usar `title`, tooltip ou detalhe secundário só quando necessário.

## Line clamp

- Aplicar `line-clamp` em descrições, resumos e notas longas.
- Evitar linhas abertas que empurrem CTA importante para fora da viewport.
- Não usar clamp em conteúdo cuja leitura integral seja a ação principal.

## Overflow

- Testar textos longos, nomes de cliente, categoria, tags e nomes de arquivo.
- Impedir overflow horizontal em tabela, drawer, thread e rail.
- Verificar sticky headers e footers dentro de containers com scroll.

## Cards baixos

- Preferir cards compactos com poucas linhas.
- Colocar destaque na primeira linha e contexto secundário abaixo.
- Eliminar áreas vazias grandes e separadores desnecessários.

## Drawers sem rolagem

- Limitar o conteúdo do drawer ao necessário para a ação.
- Fixar CTA no rodapé ou na área visível.
- Mover leitura longa para a superfície principal quando o drawer não comportar bem.

## Validação de viewport

- Medir sempre:
  - `window.innerWidth`
  - `window.innerHeight`
  - `document.scrollingElement.scrollHeight`
  - `document.scrollingElement.clientHeight`
- Confirmar se existe scroll global.
- Confirmar quais containers scrollam internamente.
- Confirmar se existe scroll horizontal.
- Confirmar se drawer cabe sem rolagem vertical.
