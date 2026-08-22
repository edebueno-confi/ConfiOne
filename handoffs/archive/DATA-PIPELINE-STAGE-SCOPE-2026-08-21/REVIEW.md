# Review

## Task ID

DATA-PIPELINE-STAGE-SCOPE-2026-08-21

## Reviewer

Claude, Principal Engineer / Independent Code Reviewer.

## Commit revisado

Base SHA `b676e6f095cdff09bb9b4150af36822612b3c5b7`, branch `main`.
Estado revisado: worktree não commitado sobre esse commit. Ciclo 1, revisão
completa. `Review mode: CLAUDE_REQUIRED`.

Delta do lote: `analytics-api.ts`, `analytics-model.ts`,
`analytics-stage-scope.mjs` e `.d.mts`, `AnalyticsCommercialPage.tsx`,
`AnalyticsCsPage.tsx`, `supabase/migrations/20260821093000_analytics_pipeline_stage_scope_v1.sql`,
`supabase/tests/120_analytics_pipeline_stage_scope.sql`,
`tests/scripts/analytics-stage-scope.test.mjs` e os artefatos de handoff.

## Veredito

APPROVED.

Um finding LOW fica aberto, sem bloquear a integração.

## O que verifiquei com mais atenção, e por quê

### A reescrita da RPC não derrubou o escopo de Operação

`supabase/migrations/20260821093000` faz `create or replace` de
`public.rpc_analytics_commercial_snapshot(date,date,text,text,text[])`,
reescrevendo o corpo inteiro. Reescrever uma função que participa do recorte é
exatamente onde o escopo costuma sumir em silêncio, então tratei isso como a
hipótese principal de regressão e fui atrás dela antes de qualquer outra coisa.

O resultado é o oposto do temido, e a razão importa. O recorte de Operação no
snapshot comercial nunca esteve no corpo da função: ele é aplicado por
`rpc_analytics_commercial_snapshot_by_operation`, que monta em SQL a lista de
pipelines que **não** pertencem à operação escolhida e a concatena em
`p_excluded_pipeline_ids`. Confirmei que o `do $$` de
`20260808290000_analytics_operation_scope_v1.sql` injeta o predicado de grupo em
quatro funções, e que o snapshot comercial não é uma delas.

O corpo novo preserva o filtro que sustenta esse mecanismo:

```sql
where (coalesce(array_length(p_excluded_pipeline_ids, 1), 0) = 0
       or d.pipeline_id <> all(p_excluded_pipeline_ids))
```

Portanto o recorte continua sendo imposto no servidor, e a reescrita não o
enfraquece.

### Assinatura e privilégios

A assinatura de cinco argumentos já existia, criada em
`20260723173500_analytics_commercial_pipeline_scope_v1.sql`, que também declara
`revoke all ... from public, anon` e `grant execute ... to authenticated,
service_role` para ela. Como `create or replace` preserva privilégios e não há
assinatura nova, não existe função recém-criada herdando `EXECUTE` para
`PUBLIC`. Verifiquei isso explicitamente porque o lote não repete os grants, e a
ausência deles seria um problema se a assinatura fosse inédita.

A função mantém `security definer`, `set search_path = ''`, referências
qualificadas por schema e o portão `app_private.can_read_analytics()`, que
devolve `{}` quando a leitura não é autorizada.

### A compatibilidade vem do backend, não de inferência do frontend

O ponto central do lote é não deixar o frontend adivinhar quais etapas
pertencem a quais pipelines. O `funnel` passou a publicar `pipeline_breakdown`
com `pipeline_id`, `pipeline_label`, `stage_id` e `deal_count`, e
`analytics-stage-scope.mjs` apenas filtra as opções por pertinência aos
pipelines selecionados. É filtragem de apresentação sobre fato publicado pelo
backend, não regra de negócio local.

O valor de opção é a lista de `stage_id` unida por vírgula, e o backend a
interpreta com `d.dealstage = any(string_to_array(p_stage_id, ','))`. Os dois
lados falam o mesmo contrato; a chave composta é intencional, não um artifício
do cliente.

### Cobertura parcial permanece explícita

Linha sem `pipelineBreakdown` não vira opção nem zero: marca `partial`,
incrementa `omitted` e produz aviso dizendo que aquelas etapas ficaram fora do
filtro. É o comportamento que o requisito de dado ausente exige, e está coberto
por teste.

### Os contra-testes são reais

No JavaScript, `hasCompatibleAnalyticsStage(rows, ['pipeline-a'], 'stage-b')`
deve ser `false`: se a combinação incompatível vazasse, o teste quebraria. Há
também caso de payload parcial e caso de pipeline sem operação, que não pode
entrar silenciosamente no recorte.

No pgTAP 120, oito asserções, incluindo "stage de outra operacao nao vira zero
global nem cruza o escopo", "snapshot de suporte nao publica status de outra
operacao" e "status de outra operacao nao cruza o recorte selecionado".

Confirmei ainda que `by_status[*].pipeline_breakdown`, usado nas asserções de
Suporte, já é publicado desde
`20260719193000_analytics_cs_consolidated_breakdowns_v1.sql`. O teste não afirma
campo inexistente.

Depois de DC-F01 e CPB-F01, registro que este é o segundo lote seguido em que os
testes quebram quando o comportamento quebra, em vez de passar por construção.

## Finding

### DPS-F01 - LOW - Normalização divergente entre frontend e backend na comparação de Operação

Categoria: DUPLICAÇÃO DE REGRA ENTRE CAMADAS.
Arquivos: `apps/web/src/features/analytics/analytics-stage-scope.mjs:1-12` e
`supabase/migrations/20260808290000_analytics_operation_scope_v1.sql`, no corpo
de `rpc_analytics_commercial_snapshot_by_operation`.

O frontend compara operação e `groupCompany` após normalizar:

```js
String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR')
```

O backend compara exatamente, sem normalizar:

```sql
and c.group_company is distinct from p_group_company
```

Consequência. Se dois registros de `analytics_source_config` diferirem apenas
por caixa ou espaçamento, o frontend considera o pipeline compatível e oferece
suas etapas, enquanto o servidor o exclui do recorte. O usuário veria uma etapa
selecionável que devolve resultado vazio, sem explicação.

Por que LOW e não MEDIUM. O `groupCompany` enviado ao servidor vem da mesma
lista de configuração que o frontend leu, então, com valores consistentes no
banco, a divergência não se manifesta. É risco latente de dados, não defeito
observável hoje. Não encontrei caso real no repositório.

Correção sugerida, para um lote futuro de manutenção. Escolher um único lado
como dono da regra: ou o frontend compara exatamente, como o servidor, ou a
normalização passa a ser contrato explícito publicado pelo backend. Acompanhar
com um teste que exercite variação de caixa ou espaço.

Status: OPEN, não bloqueante.

## Verificações executadas neste ciclo

| Verificação | Resultado observado |
| --- | --- |
| `npm run web:typecheck` | PASS, exit 0 |
| `npm run web:build` | PASS, exit 0, built in 2.94s |
| `npm run lint` | PASS, exit 0, 0 erros e 160 warnings preexistentes |
| `npm run test:all` | 573 testes, 571 PASS, 1 skip, 1 falha dependente de Supabase local |
| Assinatura da RPC e privilégios | 5 argumentos já existentes; grants preservados por `create or replace` |
| Preservação do filtro de exclusão | `<> all(p_excluded_pipeline_ids)` presente no corpo novo |
| Alvos do patch de escopo de `20260808290000` | 4 funções, nenhuma delas o snapshot comercial |
| Origem de `by_status[*].pipeline_breakdown` | publicado desde `20260719193000` |
| Escopo do delta | somente os arquivos declarados; nenhum outro produto tocado |

Typecheck, build, lint e suíte foram executados por mim, sobre o estado
entregue. Não aceitei declaração, conforme o compromisso assumido depois do
DOS-F01.

## O que não foi validado

- pgTAP real, incluindo o teste 120, e qualquer comportamento contra banco. Não
  há rota do ambiente do revisor até o Supabase local. A execução permanece como
  evidência do Codex.
- `supabase:lint:db`.
- QA visual autenticado dos dropdowns de Pipeline e Etapa.

A garantia de que uma combinação incompatível não vaza é, em última instância,
comportamento de banco. Meu juízo sobre ela vem de leitura do SQL e do desenho
dos contra-testes, não de execução, e registro isso sem atenuar.

## Consequências da aprovação

Aprovado o lote como formalização da compatibilidade Operação → Pipeline →
Stage. Não autoriza push, merge, pull request, deploy, migration remota nem
alteração de release surface, conforme `OD-001`. A migration é local; sua
aplicação em ambiente remoto exige decisão explícita do proprietário.

## Próximo passo

Owner retorna ao Codex. Cabem a ele, sob a autonomia da `OD-001`: integrar por
commit local restrito ao escopo, arquivar o handoff, e aplicar **na mesma
edição** de `handoffs/README.md` a baixa deste lote e a promoção do próximo item
elegível. O DPS-F01 pode ser recolhido em lote de manutenção, junto com o
R14-C01 e a ausência de `npm run test:all` no workflow em `ubuntu-latest`.
