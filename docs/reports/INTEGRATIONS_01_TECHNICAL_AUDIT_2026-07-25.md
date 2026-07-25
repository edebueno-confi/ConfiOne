# INTEGRATIONS-01 — Auditoria técnica HubSpot e OMIE

Data: 2026-07-25  
Branch auditada: `codex/integrations-hubspot-omie-audit`  
Base: `main` após o merge do PR #3  
HEAD: `64d7f82b17519d0219167dd4cfca7ca2b741da18`

## Resultado executivo

A arquitetura possui separação reconhecível entre frontend, RPCs/read models, Edge Functions, persistência local e APIs externas. As credenciais não chegam ao frontend e as funções de execução exigem `platform_admin` ou segredo server-side de agendamento.

O lote não está pronto para ser considerado operacionalmente confiável sem um próximo ciclo de hardening. Os principais riscos são:

1. coexistência de `omie-sync` e `analytics-integration-run` como dois caminhos para a mesma carga financeira;
2. correlação incompleta no scheduler e no runner combinado;
3. reconciliação incompleta de exclusões/arquivamentos HubSpot;
4. identificador posicional usado quando a API OMIE não fornece identificador;
5. ausência de transação única para atualização do snapshot financeiro;
6. ausência de testes de contrato para limites críticos do HubSpot;
7. documentação técnica desatualizada em relação ao código vigente.

Nenhuma correção produtiva foi implementada neste lote.

## Estado Git e regras respeitadas

- Working tree inicial e final: limpo.
- Branch documental criada a partir de `main` sincronizada.
- Stash editorial preservado e não aplicado, alterado ou removido.
- Nenhum commit funcional criado.
- Nenhum deploy, merge adicional, migration remota, alteração de secret ou write externo executado.
- Nenhuma chamada real ao HubSpot, OMIE ou serviço remoto foi realizada.

## Estado observado no Supabase local

O banco local está disponível e foi consultado somente para diagnóstico. Não há credenciais gerenciadas nem dados operacionais sincronizados:

| Recurso | Quantidade/estado |
| --- | ---: |
| Integrações gerenciadas | 4 |
| HubSpot | habilitado, sem credencial |
| OMIE | desabilitado, sem credencial |
| Empresas HubSpot | 0 |
| Deals HubSpot | 0 |
| Tickets HubSpot | 0 |
| Runs HubSpot | 0 |
| Recebíveis financeiros | 0 |
| Runs financeiros | 0 |
| Agenda OMIE | desabilitada, frequência diária configurada |
| Agenda HubSpot | desabilitada, frequência `off` |

Esses zeros representam ausência de carga no ambiente local; não foram tratados como dados produtivos nem preenchidos artificialmente.

## Mapa arquitetural

```text
Frontend Analytics
  ├─ views/read models e RPCs de leitura
  ├─ RPC administrativa de agenda e fontes
  └─ Edge Functions autenticadas
       ├─ hubspot-sync
       │    └─ HubSpot API → tabelas HubSpot → views/RPCs → Dashboard
       ├─ omie-sync
       │    └─ OMIE API → recebíveis → read model financeiro → Dashboard
       ├─ analytics-integration-run
       │    └─ OMIE → read model → rollup → propriedades HubSpot
       └─ analytics-scheduled-run
            ├─ chama hubspot-sync
            └─ chama analytics-integration-run
```

Fontes principais:

- `supabase/functions/_shared/hubspot.ts`
- `supabase/functions/_shared/omie.ts`
- `supabase/functions/hubspot-sync/index.ts`
- `supabase/functions/omie-sync/index.ts`
- `supabase/functions/analytics-integration-run/index.ts`
- `supabase/functions/analytics-scheduled-run/index.ts`
- `apps/web/src/features/analytics/analytics-api.ts`
- `apps/web/src/features/analytics/AnalyticsConfigPage.tsx`

## HubSpot

### APIs e autenticação

O cliente centralizado usa `https://api.hubapi.com`, token server-side e os seguintes recursos:

- pipelines e estágios;
- owners;
- deals via Search API;
- tickets via Search API;
- empresas via listagem ou Search API;
- atualização individual e em lote de empresas;
- criação e merge de empresas;
- propriedades e grupos de propriedades.

O frontend não recebe o token. A credencial é lida pelo RPC server-only do Vault, com fallback apenas para variável de ambiente server-side nas funções legadas/compatíveis.

### Paginação, full e incremental

- Owners, empresas, deals e tickets usam cursor `after`.
- A Search API usa páginas de até 100 no código.
- Tickets possuem particionamento por `createdate` quando a busca excede 10.000 resultados.
- Empresas possuem carga completa e incremental por `hs_lastmodifieddate`.
- Deals permanecem em carga completa porque o catálogo atual não inclui `hs_lastmodifieddate`.
- O watermark incremental é derivado do último run global bem-sucedido, não de uma fronteira por objeto, pipeline ou escopo.

Referência oficial: [HubSpot CRM Search API](https://developers.hubspot.com/docs/api-reference/latest/crm/search-the-crm). A documentação confirma paginação por `after`, máximo de 200 objetos por página, limite de cinco requisições por segundo para Search API e limite de 10.000 resultados por consulta.

### Retry e timeout

O cliente HubSpot tem timeout de 20 segundos e retry para `429` e `5xx`, respeitando `Retry-After` e usando backoff progressivo. Permanecem lacunas:

- não há jitter;
- não há deadline global por execução;
- não há proteção contra cursor repetido;
- falhas de transporte ambíguas em operações de escrita podem repetir a operação;
- não há chave de idempotência externa para criação, merge ou configuração de propriedades.

### Persistência e reconciliação

Upserts locais usam identificadores naturais para empresas, deals, tickets, owners e estágios. Empresas possuem remoção de registros ausentes somente em carga completa não vazia. Não há tombstone/reconciliação equivalente claramente implementado para deals, tickets, owners e estágios arquivados ou removidos no HubSpot.

### Escritas externas

Foram identificadas operações potencialmente mutáveis fora da sincronização read-only:

- criação de empresa;
- merge de empresas;
- criação de propriedades;
- migração CS para empresas;
- atualização de propriedades OMIE → HubSpot.

Essas operações possuem gates administrativos e/ou dry-run em partes do fluxo, mas ainda precisam de testes de concorrência, idempotência e resposta ambígua antes de serem tratadas como plenamente seguras.

## OMIE

### APIs e autenticação

O cliente usa:

- `https://app.omie.com.br/api/v1/financas/contareceber/` com `ListarContasReceber`;
- `https://app.omie.com.br/api/v1/geral/clientes/` com `ListarClientesResumido`.

A configuração usa `app_key` e `app_secret` armazenados no Vault. A UI serializa os dois valores em JSON e não os reexibe.

Referências oficiais: [Portal do Desenvolvedor Omie](https://developer.omie.com.br/), [lista oficial de APIs](https://developer.omie.com.br/service-list/) e [exemplo oficial de ListarContasReceber](https://ajuda.omie.com.br/pt-BR/articles/6594227-exemplos-de-query-no-power-bi).

### Paginação, retry e concorrência

- Recebíveis: 500 registros por página, paginação serializada, máximo de 100 páginas.
- Clientes: 500 registros por página, limite padrão de 60 páginas e máximo de 200.
- Retry de rede e dos status `429`, `502`, `503` e `504`.
- Timeout padrão de 15 segundos.
- Backoff linear de 800 ms por tentativa, sem jitter.
- Índice único parcial impede mais de um run financeiro `processing` simultâneo.
- Runs antigos, acima de 15 minutos, são encerrados como falhos.

### Identidade e consistência

Quando a API não fornece identificador de origem, o normalizador usa `omie-row:<posição>`. Esse valor depende da ordem da resposta e pode causar atualização incorreta, duplicação ou falsa substituição se a API alterar a ordenação.

A persistência realiza upsert, expiração de linhas antigas e marcação de linhas atuais em comandos separados. Não existe transação única envolvendo run, upserts, expiração e conclusão; uma falha intermediária pode deixar o read model parcialmente atualizado.

Registros omitidos são convertidos para `is_current = false`, saldo zero e faixa `recebido`. Essa representação pode confundir ausência no snapshot com recebimento real, especialmente em métricas que usam `coalesce(..., 0)`.

### Incrementalidade

Não existe delta real na API OMIE. A frequência horária/diária apenas controla quando uma carga completa pode iniciar. O runner combinado também executa carga completa.

O enriquecimento por clientes é best-effort no `omie-sync`; no runner combinado ele é deliberadamente excluído para evitar limite de worker. Portanto, os dois caminhos não produzem o mesmo nível de completude.

## Fluxo combinado e agendamento

Há duas arquiteturas simultâneas para OMIE:

1. `omie-sync`, dedicado ao read model financeiro;
2. `analytics-integration-run`, que também atualiza propriedades financeiras no HubSpot.

O scheduler chama `hubspot-sync` e `analytics-integration-run`, não `omie-sync`. Isso cria contratos diferentes para:

- correlação;
- enriquecimento;
- mensagens de status;
- tratamento de concorrência;
- finalização do run;
- observabilidade.

O `analytics-integration-run` cria o run financeiro sem preencher `correlation_id`. O scheduler não gera nem propaga um `x-analytics-correlation-id` comum aos workers.

Recomendação: escolher um fluxo canônico e transformar o outro em compatibilidade controlada em lote próprio, após definir o contrato de produto e de dados.

## Segurança e permissões

Proteções confirmadas:

- credenciais somente server-side/Vault;
- `rpc_service_get_managed_integration_secret` executável somente por `service_role`;
- RPC administrativa de integração exige `platform_admin` na migration de hardening vigente;
- RPC de agenda exige `platform_admin`;
- tabelas brutas principais não possuem `SELECT` para `authenticated`;
- RLS está habilitado nas tabelas relevantes;
- `dashboard_viewer` usa views/read models controlados e não possui escrita direta.

Ponto de atenção de defesa em profundidade:

- as sobrecargas públicas de `rpc_analytics_cs_snapshot` são `SECURITY DEFINER` e executáveis por `authenticated`; o corpo delega ao legado, que aplica `app_private.can_read_analytics()`. O gate efetivo existe, mas não está declarado no wrapper, o que torna o contrato mais frágil e merece teste explícito.
- algumas views dependem de `security_barrier` e predicados de autorização; a uniformização de `security_invoker`, ownership e grants deve ser avaliada em lote de hardening próprio.

Não foram encontrados valores de secret, token, cookie, service role ou payload real no relatório.

## Reconciliação HubSpot × OMIE

O vínculo financeiro ocorre por dados normalizados, principalmente CNPJ e rollup por empresa. O sistema registra filas/ledgers para alguns fluxos de matching e atualização, mas a auditoria encontrou:

- risco de identificação posicional no OMIE quando falta ID;
- ausência de transação única no snapshot financeiro;
- níveis de enriquecimento diferentes entre runners;
- ausência de tombstones completos para objetos HubSpot;
- possível confusão entre zero real, fonte vazia, fonte atrasada e registro expirado;
- watermark global no HubSpot, sem fronteira por objeto/pipeline.

Esses pontos impedem afirmar reconciliação plena sem uma execução com credenciais válidas e dados reais, o que foi deliberadamente não executado.

## Observabilidade e tratamento de erros

Existem runs, estados, contadores, mensagens, `run_id`, `correlation_id` parcial e ledgers específicos para algumas escritas. As lacunas são:

- correlação incompleta no caminho combinado/scheduler;
- mensagens internas parcialmente retornadas por `502`;
- corpo de erro HubSpot truncado, mas ainda potencialmente interno;
- falhas de labels/catalogação tratadas silenciosamente em alguns caminhos;
- ausência de métricas explícitas de páginas, cobertura, descartes e tombstones;
- falhas ao finalizar runs nem sempre são verificadas com o mesmo rigor da falha principal.

## Testes e validações executados

### Testes focados

Comando executado:

```text
node --test tests/scripts/analytics-config-permissions.test.mjs tests/scripts/analytics-export-security.test.mjs tests/scripts/analytics-runtime-contract.test.mjs tests/scripts/analytics-sync-error.test.mjs tests/scripts/analytics-sync-run-grouping.test.mjs tests/scripts/analytics-sync-schedule-schema-cache.test.mjs tests/scripts/hubspot-company-batch.test.mjs tests/scripts/hubspot-sync-scope.test.mjs tests/scripts/omie-client.test.mjs tests/scripts/omie-receivables-normalizer.test.mjs tests/scripts/reconciled-mutation.test.mjs
```

Resultado: 29 testes aprovados, 0 falhas.

### Controles gerais

- `npm run contracts:typecheck`: aprovado.
- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado.
- `npm run supabase:test:db`: aprovado — 79 arquivos, 1.288 testes.
- `npm run supabase:lint:db`: aprovado com avisos preexistentes de variáveis `v_actor` não utilizadas em RPCs não relacionadas.
- `npm run repository:check-root`: aprovado.
- `git diff --check`: aprovado.

### Lacunas de teste

Não existem testes suficientes para:

- retry HubSpot `429/5xx`, `Retry-After`, timeout e falha de rede;
- cursor repetido e paginação crítica;
- particionamento de tickets acima de 10.000;
- exclusão/arquivamento/merge remoto;
- idempotência concorrente de criação, merge e property setup;
- resposta ambígua de escrita externa;
- correlação única scheduler → workers;
- consistência após falha entre upsert e expiração;
- distinção automatizada entre zero real, vazio, parcial e indisponível.

## Classificação dos riscos

### P0 — bloqueio operacional

- Não há credenciais nem dados reais no ambiente auditado; não é possível comprovar sincronização real sem um gate separado para secrets e execução controlada.

### P1 — correção recomendada antes de produção ampla

- Consolidar os dois runners OMIE.
- Corrigir correlação no scheduler/runner combinado.
- Definir identidade estável para recebíveis sem ID.
- Garantir reconciliação/tombstones para objetos HubSpot.
- Endurecer idempotência das escritas externas.
- Cobrir Search API e limites de paginação com testes determinísticos.

### P2 — backlog técnico

- Uniformizar `security_invoker`, ownership e grants das views.
- Sanitizar mensagens externas sem perder diagnóstico interno.
- Corrigir mojibake em código/documentação.
- Atualizar documentação de endpoints, permissões e snapshots RPC.
- Instrumentar cobertura, páginas, cursores, descartes e latência.

## Documentação desatualizada identificada

- `docs/ANALYTICS_HUBSPOT.md` ainda descreve acesso antigo e tickets como List API, enquanto o código usa Search API.
- `docs/ANALYTICS_METRIC_CATALOG_V1.md` afirma que filtros temporais não existem, mas os RPCs atuais recebem `p_from` e `p_to`.
- A documentação mistura consumo por views com snapshots consumidos por RPCs.
- Há referências históricas a commits anteriores ao HEAD auditado.

Essas correções devem ser feitas em lote documental separado, sem misturar com hardening funcional.

## Próximos lotes recomendados

1. `INTEGRATIONS-02` — consolidar runner OMIE e contrato de correlação.
2. `INTEGRATIONS-03` — idempotência, tombstones e reconciliação HubSpot/OMIE.
3. `INTEGRATIONS-04` — testes de limites, falhas, retries e cobertura de fonte.
4. `INTEGRATIONS-05` — atualização documental e correção de mensagens/codificação.
5. Gate separado para credenciais, sincronização controlada e validação com dados reais.

## Referências auditadas

- [HubSpot CRM Search API](https://developers.hubspot.com/docs/api-reference/latest/crm/search-the-crm)
- [HubSpot usage guidelines](https://developers.hubspot.com/docs/developer-tooling/platform/usage-guidelines)
- [Portal do Desenvolvedor Omie](https://developer.omie.com.br/)
- [Lista de APIs Omie](https://developer.omie.com.br/service-list/)
- [Exemplo oficial Omie — ListarContasReceber](https://ajuda.omie.com.br/pt-BR/articles/6594227-exemplos-de-query-no-power-bi)

