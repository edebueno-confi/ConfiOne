# Filtros e posição financeira executiva — 2026-07-18

## Alterações

- Comercial, CS/Suporte, Financeiro e Visão Executiva passam a iniciar no mês
  atual.
- O seletor ganhou o preset `Mês passado`.
- O botão Limpar do Financeiro retorna ao mês atual.
- A posição financeira da Visão Executiva passou a considerar títulos em aberto
  até a data final selecionada, inclusive vencidos em meses anteriores.
- A aba Financeiro mantém seu comportamento transacional por período, situação,
  aging e cliente.

## Motivo

O CEO precisa ver a dívida atual, não somente títulos cujo vencimento ocorreu no
mês selecionado. O filtro mensal anterior excluía títulos antigos ainda em
atraso e fazia a tabela de clientes vencidos aparecer vazia mesmo quando a aba
Financeiro mostrava saldo vencido.

## Segurança e contrato

- A regra foi movida para o RPC do backend; a UI apenas envia o período e exibe
  o resultado.
- A função legada ficou sem permissões públicas após a criação do wrapper novo.
- O pipeline de Suporte não foi alterado.

## Validação

- Migrations aplicadas localmente sem reset.
- `npm run web:typecheck`: aprovado.
- `npx supabase db lint`: aprovado com warnings preexistentes de `v_actor`.
- `git diff --check`: aprovado nos arquivos do lote.
- A inspeção visual via Chrome encontrou a página local sem conteúdo renderizado
  no momento da captura; o servidor web local precisa estar ativo para o QA
  visual autenticado.
