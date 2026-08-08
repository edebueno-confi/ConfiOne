# Padrão de cor do Genius Support OS — V1 — 2026-08-07

Origem da decisão: o operador apontou que o Dashboard marca a aba selecionada com
um traço magenta e o blueprint marca com azul, e pediu um padrão único, com as
cores adaptadas às da marca.

## 1. A paleta da marca já estava no repositório

Não foi preciso extrair as cores do site institucional: elas já estavam
declaradas em `apps/web/src/index.css`, nos dois temas.

| Token | Claro | Escuro | Papel |
| --- | --- | --- | --- |
| `--genius-site-blue` | `#1c326f` | `#22326e` | azul institucional profundo |
| `--color-brand-magenta` | `#e10098` | `#ff6cbe` | magenta da marca |
| `--genius-site-cyan` | `#6ad1e7` | `#6ad1e7` | ciano de apoio |
| `--genius-site-soft` | `#ebeffb` | `#172445` | superfície suave |
| `--genius-site-peach` | `#ffbc7d` | `#ffbc7d` | pêssego de apoio |

Tentei buscar o CSS do site para conferir, mas as folhas do WordPress não
retornam como texto pelas ferramentas disponíveis. Como a paleta versionada é
evidência melhor do que leitura de página, ela foi mantida como fonte.

## 2. A regra: azul age, magenta localiza

O problema não era ter duas cores. Era as duas significarem a mesma coisa em
lugares diferentes, e o azul acumular dois papéis — botão e seleção.

**Azul (`--ui-primary`, `#2563EB`) é cor de ação.** Botão primário, link, anel de
foco, preenchimento de item ativo na barra lateral.

**Magenta (`--selection-accent`, derivado de `--color-brand-magenta`) é
indicador de posição.** Diz "você está aqui" e nada mais.

Onde o magenta se aplica, agora em regra única:

- traço da aba selecionada, no Dashboard e em Configurações;
- trilho do item ativo da barra lateral, nos dois temas;
- marcador de linha selecionada, quando houver.

Onde o magenta **não** se aplica: botão, link, estado de sucesso, erro, aviso ou
qualquer sinal de dado. Posição não é estado.

## 3. O que mudou nesta entrega

| Superfície | Antes | Agora |
| --- | --- | --- |
| Abas do Dashboard | gradiente ciano → magenta | `--selection-accent` liso |
| Abas do Dashboard (casco visual V1) | `--hd-pink` com recuo para `--accent-500` | `--selection-accent` |
| Abas de Configurações | azul `--ui-primary` | `--selection-accent` |
| Trilho do item ativo da barra lateral | `#f472b6` no escuro, ausente no claro | `--selection-accent` nos dois |

O gradiente saiu de propósito: dois tons num traço de 2 px não são legíveis como
gradiente, só sujam a borda.

## 4. Relação com o blueprint

O blueprint marca a aba ativa em azul. **Não seguimos essa cor**, por instrução
do operador: o desenho vem do blueprint, as cores vêm da marca. A estrutura
permanece idêntica — traço de 2 px sob o rótulo, apenas na aba ativa, com o
rótulo em peso 600.

## 5. Contraste

`#e10098` sobre branco dá cerca de 4,6:1, suficiente para o rótulo em peso 600 do
tamanho usado. No escuro o token já resolve para `#ff6cbe`, bem acima do mínimo
sobre a superfície navy.

## 6. Garantia automatizada

`tests/scripts/selection-accent-contract.test.mjs` exige que todo indicador de
posição use `--selection-accent` e que nenhum volte a usar o azul de ação ou um
literal rosa.
