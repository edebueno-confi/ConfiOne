# Refinamento visual da Visao Executiva - 2026-07-18

## Objetivo

Reduzir a rolagem da lista de inadimplencia e aumentar a utilidade da leitura
para o CEO e para a gestao de CS, preservando a leitura contratual do backend.

## Alteracoes

- A tabela passou a usar linhas compactas, cabecalho persistente visualmente e
  seis colunas de decisao: cliente, CSM/vinculo, contrato, saldo, vencimento
  mais antigo e atraso.
- Abaixo do cliente sao exibidos o ID HubSpot ou a origem financeira; abaixo do
  CSM permanecem o metodo de reconciliacao e o indicador de ambiguidade.
- O status do cliente e o contrato aparecem juntos, evitando colunas vazias e
  reduzindo a largura necessaria.
- O risco de atraso recebe a classificacao textual Recente, Atencao ou Critico;
  a informacao nao depende apenas de cor.
- Foram adicionados busca por cliente/CSM, faixa de atraso e ordenacao por saldo,
  dias em atraso ou vencimento mais antigo.
- Os filtros sao client-side sobre o snapshot ja autorizado pelo backend; nao
  criam uma segunda regra financeira nem alteram a fonte de dados.
- Filtros, cards, tooltips e tabela receberam ritmo de espacamento consistente,
  estados de foco e alvos de informacao maiores para teclado e toque.

## Limite conhecido

O filtro reduz o volume visivel e a rolagem, mas nao implementa paginação no
backend. Se a quantidade de alertas crescer significativamente, o proximo lote
deve criar paginação no read model/RPC, mantendo os mesmos filtros no servidor.

## Validacao

- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado.
- `git diff --check`: aprovado.
- QA visual no Chrome: pendente, pois o servidor local nao permaneceu disponivel
  durante a captura; nao foi declarado sucesso visual sem evidencia.
