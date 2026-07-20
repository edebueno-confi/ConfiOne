# Hardening da importação de planilha OMIE — 2026-07-18

## Objetivo

Corrigir o caminho local de importação de Contas a Receber exportadas do OMIE
sem alterar a planilha original, sem enviar dados de volta ao OMIE e sem
gravar credenciais.

## Alterações

- O endpoint aceita somente arquivos `.xlsx` e `.csv` dentro do limite de 15 MB.
- Arquivos sem linhas de dados são rejeitados antes da criação do lote.
- Uma linha só entra no read model financeiro quando possui cliente, situação e
  valor líquido válido.
- Todas as linhas continuam preservadas no staging com `quality_status` e
  `rejection_reason`.
- O lote passa a terminar como `completed`, `partial` ou `failed`.
- Falhas após a criação do lote atualizam `error_message` e não deixam o lote
  preso indefinidamente em `processing`.
- A interface passou a identificar corretamente o sistema como OMIE.

## Segurança e integridade

- Idempotência por SHA-256, fonte e versão do mapeamento foi preservada.
- Nenhuma exclusão ou sobrescrita da planilha original ocorre.
- Linhas inválidas não são convertidas em zeros ou métricas financeiras.
- Segredos permanecem server-side; nenhum token foi lido ou gravado neste lote.

## Validação

- `node --test tests/scripts/omie-client.test.mjs tests/scripts/omie-receivables-normalizer.test.mjs tests/scripts/commercial-daily-sheet-parser.test.mjs`: 7 testes aprovados.
- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado; permanece apenas o warning conhecido de chunk grande do Analytics.
- `deno check`/`supabase functions serve`: não executado porque Deno e Supabase CLI não estão disponíveis neste shell.

## Próximo passo seguro

Executar um upload real com o fixture `platform_admin`, verificar o lote
criado, a contagem de linhas aceitas/rejeitadas e a repetição do mesmo hash.
Só depois disso liberar mapeamentos operacionais de CS e Comercial.
