# Blueprint To React Tailwind Rules

## Implementar a partir do que já existe

- Identificar componentes existentes antes de criar novos.
- Reaproveitar primitives, layouts e padrões já aderentes ao Design System V3.
- Criar componente novo apenas quando isso reduzir repetição real ou clarificar a estrutura.

## Preservar design tokens

- Usar tokens, variáveis e classes do design system antes de inventar novas cores, sombras ou espaços.
- Evitar inline styles desnecessários.
- Tratar valores mágicos como exceção, não como regra.

## Usar grid e flex conscientemente

- Escolher `grid` quando a relação entre colunas e áreas for estrutural.
- Escolher `flex` quando o objetivo for alinhamento linear e adaptação simples.
- Não misturar wrappers extras sem motivo.

## Criar componentes pequenos quando isso reduzir repetição

- Extrair blocos repetidos de header, linha de fila, badge operacional, rail item ou estados.
- Manter a composição legível sem quebrar em microcomponentes artificiais.
- Evitar abstração prematura.

## Manter estados tipados

- Tipar props, respostas e estados transitórios.
- Diferenciar `loading`, `empty`, `error`, `unavailable` e `forbidden`.
- Não mascarar ausência de contrato com valores default enganosos.

## Separar transformação de dados da renderização

- Normalizar shape ou mapear campos antes do JSX quando isso reduzir ruído visual.
- Manter o componente focado em apresentação e interação.
- Não inserir regra de negócio no componente.

## Tratar loading, erro e vazio

- Implementar estados honestos e proporcionais.
- Não esconder falha importante atrás de skeleton infinito.
- Não usar mock de conteúdo para preencher ausência de dado real.

## Checklist de implementação

- Blueprint comparado com a tela em zonas equivalentes.
- Hierarquia visual preservada.
- Scroll concentrado no container correto.
- Tags e cores usadas para orientar decisão.
- Copy sem jargão técnico.
- Nenhuma ação fake adicionada.
- Nenhum dado sensível ou coordenada interna exposto.
