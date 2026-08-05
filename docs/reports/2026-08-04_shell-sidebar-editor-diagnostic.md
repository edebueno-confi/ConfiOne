# Diagnóstico de shell, editor e marca compacta — 2026-08-04

## Decisão visual

O desktop passa a usar a sidebar como estrutura persistente do produto. O menu de tema, a conta do operador e o encerramento da sessão ficam no rodapé da sidebar. O cabeçalho global permanece apenas no mobile, onde a navegação lateral é temporária.

A busca global é acionada na própria sidebar por uma lâmpada mágica compacta e continua disponível pelo atalho `Ctrl+K`. O modal de busca permanece centralizado na tela e preserva navegação por teclado, permissões e fontes reais.

Em escalas pequenas, a marca usa a lâmpada mágica; o avatar do Gênio permanece reservado para estados contextuais e áreas em que exista espaço visual suficiente. O SVG usa azul e rosa como identidade e não expõe conteúdo técnico ao usuário.

## Editor de artigos

O editor mantém as propriedades abertas por padrão, sem o botão redundante de propriedades. A composição usa metadados compactos, barra de ferramentas fixa dentro do cartão, corpo com rolagem interna e painel editorial estreito. O layout evita rolagem global no desktop e mantém os controles editoriais acessíveis durante a leitura.

## Validação desta rodada

- `git diff --check`: aprovado.
- `npm run web:build`: aprovado antes da substituição final da lâmpada; executar novamente após esta alteração.
- Captura visual real: pendente nesta rodada; a evidência precisa ser produzida em 1920×1080 e em modo claro/escuro antes da aprovação final.
- Banco persistente: preservado; nenhum reset destrutivo foi executado.

## Ajustes complementares

- A busca global foi movida para a mesma linha da marca na sidebar, com lupa, lÃ¢mpada mÃ¡gica compacta e atalho `Ctrl+K`.
- A divisÃ³ria horizontal do cabeÃ§alho da sidebar foi removida para preservar a continuidade visual com o conteÃºdo.
- O menu da conta agora concentra tema e encerramento de sessÃ£o; o controle Ã© representado por Ã­cone ao lado da identificaÃ§Ã£o do usuÃ¡rio.
- O cabeÃ§alho do Financeiro deixou de repetir visualmente a data de atualizaÃ§Ã£o; a execuÃ§Ã£o permanece no bloco de rastreabilidade e o estado permanece no componente padrÃ£o.
- AtualizaÃ§Ã£o de validaÃ§Ã£o: `npm run web:build` foi rerodado apÃ³s os ajustes de editor, sidebar, busca, menu da conta e cabeÃ§alho financeiro; aprovado com 833 mÃ³dulos transformados.
