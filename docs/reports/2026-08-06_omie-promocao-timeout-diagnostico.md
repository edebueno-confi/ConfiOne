# Sincronismo OMIE e HubSpot — diagnóstico remoto — 2026-08-06

Auditoria feita direto no projeto Supabase remoto `jzmmvfcmruasqmrdmbup`
("Genius Support OS", `ACTIVE_HEALTHY`, Postgres 17.6.1.111). Nenhuma escrita,
migration, deploy ou alteração de segredo foi executada.

## 1. A premissa anterior estava errada

O relatório de estado registrava que as funções de sincronização não estariam
publicadas no remoto. **Estão.** Todas em `ACTIVE`:

| Função | Versão | Situação observada |
| --- | --- | --- |
| `hubspot-sync` | 37 | ACTIVE |
| `omie-sync` | 31 | ACTIVE, mas devolvendo **502** |
| `analytics-sequential-sync` | 2 | ACTIVE, HTTP **200** |
| `hubspot-orchestrator-start/worker/dispatcher` | 31/35/31 | ACTIVE, HTTP 200/202 |

O HubSpot está funcionando: `orchestrator-start` responde 202 e dezenas de
chamadas de `orchestrator-worker` e `orchestrator-dispatcher` terminaram em 200.
`analytics-sequential-sync` também conclui em 200, embora lento — 117.985 ms e
79.331 ms nas duas últimas execuções.

## 2. Causa raiz do defeito do OMIE

`omie-sync` não é 503 e não é falta de publicação. É **502 após ~48 segundos**,
de forma reprodutível: 48.663 ms, 47.131 ms e 48.798 ms nas três últimas
chamadas.

O motivo está gravado no próprio read model. As três últimas execuções em
`analytics_finance_sync_runs`:

| Início (UTC) | Situação | Linhas aceitas | Erro |
| --- | --- | --- | --- |
| 2026-08-06 23:54:04 | failed | 3768 | Falha ao promover snapshot Omie: canceling statement due to statement timeout |
| 2026-08-06 04:16:41 | failed | 3761 | idem |
| 2026-08-06 04:13:33 | failed | 3761 | idem |
| 2026-08-06 00:35:53 | completed | 3761 | — |

A coleta funciona: 3.761 a 3.768 linhas chegam ao staging toda vez. O que falha é
a **promoção do snapshot**, que estoura o `statement_timeout` e derruba a função.

A causa está na versão em produção de `rpc_service_promote_omie_snapshot`, que
desativa todo o snapshot anterior com um `UPDATE` e em seguida o reativa com
outro `UPDATE`/`INSERT`. Como a tabela tem auditoria por linha, o trabalho é
feito em dobro e ultrapassa o tempo permitido.

## 3. A correção existe e não está aplicada

A migration `20260806150000_omie_promotion_timeout_hardening.sql` reescreve essa
RPC exatamente para esse problema: elimina o `UPDATE` duplo, define
`statement_timeout = 120s` no escopo da transação e serializa a promoção com
`pg_advisory_xact_lock`.

**Ela não está aplicada no remoto.** A última migration registrada em
`supabase_migrations.schema_migrations` é `20260806120000_profile_avatars_self_service_v1`.

A migration usa `create or replace function`, preserva os grants restritos ao
`service_role` e não contém DDL destrutiva. O único `delete` é o das linhas de
staging da própria execução, comportamento que já existia.

## 4. O vazamento técnico na interface já foi corrigido

A mensagem que exibia "Edge Function" e "HTTP 503" ao usuário não existe mais.
O commit `18237ac` traduziu as falhas: 502, 503 e `BOOT_ERROR` passaram a produzir
linguagem de produto, sem código de status, sem nome de função e sem instrução de
infraestrutura. Coberto por `tests/scripts/analytics-sync-error.test.mjs`, 7/7.

O texto do print original é anterior a esse commit.

## 5. Achado secundário

`analytics-scheduled-run` (versão 34) está publicada a partir de
`file:///Projetos/GSO-integrations-04/...`, ou seja, foi implantada de um checkout
diferente do canônico. Não afeta o defeito atual, mas significa que o código em
produção dessa função pode não corresponder ao que está em `C:\Projetos\GSO-old`.

## 6. Pendência que exige autorização

Aplicar `20260806150000` no Supabase remoto é migration remota e não foi
executada. Sem ela, toda atualização do OMIE vai continuar coletando os dados e
falhando na promoção.

Critério de sucesso após a aplicação: `omie-sync` em HTTP 200, execução com
`status = 'completed'`, `promotion_result` preenchido e ausência de
`statement timeout` no erro.
