# Correção do mascote Gênio — braço desprendido

## Contexto

Durante a tela de sincronização do OMIE, o mascote apresentava o braço direito
flutuando acima do corpo. O defeito era visual e também afetava a leitura do
estado de carregamento.

## Diagnóstico

O braço é um grupo interno do SVG do mascote. Uma regra CSS aplicava animação
diretamente nesse grupo usando `transform-origin` em coordenadas do `viewBox`.
Como o navegador resolvia essa origem de forma diferente para o grupo SVG, o
braço era deslocado para fora do conjunto durante a animação.

## Correção

- removida a transformação/animação exclusiva do grupo do braço;
- preservados os movimentos seguros no SVG completo, corpo, cabeça, lâmpada,
  partículas e efeito mágico de carregamento;
- mantida a pose de carregamento com olhos direcionados para baixo;
- a superfície `success` agora usa a expressão `wink`;
- a expressão é sincronizada quando a superfície ou a propriedade de expressão
  muda, evitando estado visual antigo em componentes reutilizados;
- corrigido o caractere visual das partículas do mascote.

## Validação

- `npm run web:typecheck` — aprovado;
- `npm run web:build` — aprovado;
- busca estática confirmou que não restam regras CSS de transformação para o
  braço;
- QA visual local do app executado após a compilação. A tela de login carregou
  sem erro; a tela autenticada de sincronização exige sessão válida para uma
  confirmação visual end-to-end do overlay.

## Atenção

Não houve alteração em credenciais, banco remoto, migrations ou sincronizações
externas. O mascote continua sendo um componente inline, sem dependência do
runtime do arquivo `.dc.html`.
