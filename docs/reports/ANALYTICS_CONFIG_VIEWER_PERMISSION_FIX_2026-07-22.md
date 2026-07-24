# Correcao de permissao da configuracao Analytics - 2026-07-22

## Sintoma

O usuario `dashboard_viewer` conseguia abrir a configuracao do Dashboard Gerencial e via os controles de agendamento OMIE <-> HubSpot. Ao tentar executar a sincronizacao, a Edge Function respondia `403` com `Acesso negado.`

## Causa

O backend ja estava protegido corretamente: `analytics-integration-run` aceita execucao manual somente para `platform_admin` (ou pelo segredo server-side do agendamento). O problema era de UX: a tela renderizava `Salvar` e `Rodar agora` para perfis que nao poderiam executar essas operacoes.

## Decisao e comportamento

- `platform_admin`: continua vendo e usando frequencia, ativacao, `Salvar` e `Rodar agora`.
- `dashboard_viewer`: continua vendo o ultimo status e a mensagem da ultima execucao, mas recebe aviso de somente leitura e nao ve os controles de mutacao.
- A protecao server-side permanece obrigatoria; a alteracao de frontend nao substitui autorizacao no backend.
- A mesma regra foi aplicada ao editor de fontes de dados, aliases e estado dos pipelines, para evitar novos `Acesso negado.` por tentativa de escrita no perfil viewer.

## Validacao

- `node --test tests/scripts/analytics-config-permissions.test.mjs`: 1/1.
- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado; 811 modulos transformados.
- `git diff --check`: aprovado; apenas avisos normais de conversao LF/CRLF do checkout Windows.
- QA visual autenticado do viewer: pendente neste ciclo porque o login local retornou `JWT issued at future`, uma divergencia de relogio do ambiente local anterior a esta mudanca. Nao foi alterado relogio, token ou secret.

## Arquivos

- `apps/web/src/features/analytics/AnalyticsConfigPage.tsx`
- `apps/web/src/features/analytics/analytics-permissions.mjs`
- `apps/web/src/features/analytics/analytics-permissions.d.mts`
- `tests/scripts/analytics-config-permissions.test.mjs`

