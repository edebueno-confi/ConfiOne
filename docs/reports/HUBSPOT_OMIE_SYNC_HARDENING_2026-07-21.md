# Hardening das sincronizações HubSpot e OMIE — 2026-07-21

## Escopo do lote

Este lote tratou a demora, o timeout do worker e a falta de transparência do
Dashboard Gerencial durante sincronizações. Não houve deploy remoto, alteração
de credenciais ou escrita em conta externa durante a implementação.

## Causa e evidências

- O `hubspot-sync` fazia snapshot completo de empresas, deals e tickets em toda
  execução.
- O log local registrou cancelamento do worker pelo supervisor durante uma
  carga grande, deixando execução com status `running` sem conclusão.
- A descoberta de propriedades do portal HubSpot confirmou
  `hs_lastmodifieddate` para `COMPANY` e `TICKET`, mas não confirmou essa
  propriedade para `DEAL`.
- Aplicar o filtro incremental em Deals sem essa confirmação poderia causar
  erro de propriedade inválida ou omitir atualização de etapa/valor.

## Implementado

### HubSpot

- Empresas e tickets usam atualização incremental desde a última execução bem
  sucedida, com janela de sobreposição de cinco minutos.
- Na janela incremental, tickets consultam diretamente por `hs_lastmodifieddate`
  e só usam a partição histórica por `createdate` como fallback quando a janela
  ainda ultrapassa o limite da Search API.
- Deals continuam com carga completa por pipeline, pois o volume é menor e o
  catálogo atual não confirmou um filtro seguro de última alteração.
- Uma execução recente em andamento retorna conflito controlado, evitando duas
  cargas concorrentes.
- Execuções antigas em `running` são marcadas como interrompidas pelo runtime,
  preservando a trilha no histórico e liberando nova tentativa.
- O botão do Dashboard informa se a carga concluída foi incremental ou completa,
  além dos contadores processados.
- O modo de carga completa continua disponível no contrato interno via
  `full: true`, para manutenção controlada quando necessário.

### OMIE → HubSpot

- A persistência dos títulos OMIE permanece a primeira etapa e a fonte do
  cockpit financeiro.
- Falha ou timeout no enriquecimento posterior das propriedades HubSpot agora
  resulta em status `partial`, com mensagem explicativa, sem mascarar títulos
  OMIE já salvos como erro total.
- O agendamento e a tela de configurações exibem a diferença entre conclusão
  integral e conclusão parcial.

## Validação

- `npm run web:typecheck` — aprovado;
- `npm run web:build` — aprovado;
- `npm run supabase:lint:db` — aprovado com 12 avisos preexistentes de variáveis
  `v_actor` não utilizadas;
- `npm run supabase:test:db` — aprovado: 67 arquivos e 1.192 testes;
- Edge Functions locais `hubspot-sync` e `analytics-integration-run` carregaram
  e responderam `HTTP 403` sem autenticação, confirmando compilação/roteamento;
- `git diff --check` — aprovado nos arquivos do lote.

## Limites e próximo passo

- A primeira carga completa ainda pode ser longa; deve ser executada fora de
  períodos de pico e acompanhada pelo histórico.
- Deals ainda exigem carga completa por execução até existir propriedade de
  última alteração confirmada para esse objeto no portal.
- O scheduler remoto e a publicação de funções/migrations continuam pendentes
  de autorização operacional separada.
- A validação autenticada de uma sincronização real não foi executada neste
  lote para não disparar carga externa sem necessidade.
