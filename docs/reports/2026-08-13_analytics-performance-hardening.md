# Analytics Performance Hardening — 2026-08-13

## Objetivo

Corrigir o timeout em producao do RPC de reconciliacao financeira e conferir
se o frontend, os contratos e as migrations estavam espelhados no Supabase.

## Diagnostico

- Projeto remoto: `jzmmvfcmruasqmrdmbup` (Genius Support OS).
- A funcao afetada era `public.rpc_analytics_finance_reconciliation_v2`.
- O volume observado era de 999 titulos em aberto e 10.410 Companies no cache
  HubSpot.
- O plano anterior repetia buscas de identidade exata e calculos de
  quantidade por titulo, alem de varrer candidatos por nome sem aproveitar o
  operador do indice trigram.
- O historico remoto estava presente. O problema era de plano/latencia, nao de
  migration ausente.

## Implementacao

A migration `supabase/migrations/20260813141618_analytics_finance_reconciliation_perf_v3.sql`:

1. cria indices de apoio nas decisoes de reconciliacao;
2. materializa os conjuntos de clientes, titulos e Companies usados na leitura;
3. calcula candidatos exatos por codigo OMIE/CNPJ uma vez e aceita somente
   identidade unica;
4. usa o indice trigram existente apenas para sugestoes de nome;
5. preserva o contrato JSON, a regra de confirmacao humana e os grants seguros.

A mesma migration foi aplicada ao Supabase remoto com o nome
`analytics_finance_reconciliation_perf_v3`. O Supabase registrou a versao
`20260813141618`.

## Evidencia

- `EXPLAIN (ANALYZE, BUFFERS)` em producao: aproximadamente 402 ms.
- Resultado funcional preservado: saldo vinculado `815535.94`, saldo sem
  vinculo `55805.74`, 35 titulos sem empresa e 16 grupos sem correspondencia.
- Indice `hubspot_companies_reconciliation_name_trgm_idx` com uso observado
  no catalogo de estatisticas.
- Grants verificados: `authenticated`, `service_role` e `postgres`; sem
  EXECUTE para `public` ou `anon`.

## Integracoes externas

O codigo existente de HubSpot/OMIE foi revisado e mantido neste lote porque ja
possui limites de pagina, lotes, checkpoint, lease e retry/backoff. Nao foi
introduzida concorrencia em OMIE, pois a integracao depende de paginacao
sequencial. A telemetria dos ultimos dias continua apontando rate limit em
buscas HubSpot e erros transitorios em Contas a Receber OMIE; isso deve ser
tratado em uma frente de capacidade com janela, concorrencia e idempotencia
explicitamente decididas.

## Validacao local

- 270 testes focados: 270 aprovados.
- `web:typecheck`: aprovado.
- `web:build`: aprovado.
- `security:audit:prod`: nenhuma vulnerabilidade alta ou critica.
- `local:qa:secret-scan`: 2.196 arquivos rastreados, 0 correspondencias.
- quality gate de alteracoes: aprovado, com uma observacao informativa em
  `scripts/recovery/export-codex-context.mjs`.

## Riscos e backlog

Os advisors do Supabase ainda listam avisos genericos de FKs sem indice,
indices sem uso, politicas permissivas e funcoes SECURITY DEFINER. Eles cobrem
centenas de objetos historicos e nao foram alterados em massa, para evitar
quebrar contratos, RLS ou consumidores. A proxima frente deve priorizar os
avisos por query real e por dominio, com migration pequena e validacao de
permissao.
