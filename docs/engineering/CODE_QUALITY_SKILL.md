# Skill de qualidade de código

`genius-code-quality` é o workflow read-only de auditoria técnica do Genius Support OS. Ele combina Git, padrões contextuais, typechecks, lint configurado quando existir e o secret scan seguro já presente no repositório.

## Invocação

```text
$genius-code-quality fast
$genius-code-quality changed
$genius-code-quality module apps/web/src/features/analytics
$genius-code-quality full
```

O modo `full` não é executado automaticamente. Correções, banco, navegador, sync, push e deploy ficam fora dos pilotos.

## Modelo de findings

Cada finding informa:

- regra e versão do detector;
- camada (`frontend`, `shared-contracts`, `backend/edge-function`, `sql-migration`, `sql-test`, scripts, fixtures ou testes);
- aplicabilidade da regra;
- status (`candidate`, `probable`, `confirmed`, `dismissed`, `historical-fixed` ou `requires-runtime-validation`);
- evidência, impacto, recomendação, confiança e falso positivo possível;
- proveniência com detector, modo, commit, timestamp, base de comparação e tipo de análise.

Heurística textual não é confirmação. O risco usa apenas estados contextuais; candidatos repetitivos são agrupados no Markdown e preservados integralmente no JSON.

## Regras refinadas

- `SECURITY DEFINER` é analisado por bloco de função. `search_path = ''` não gera finding; `public`/`pg_temp`, grants amplos e SQL dinâmico exigem contexto. Migrations históricas corrigidas posteriormente são classificadas como `historical-fixed` e não viram backlog de edição.
- `SELECT *` em pgTAP, fixtures, inspeções e scripts de auditoria é ignorado. Views, RPCs e read models persistentes geram candidato contextual.
- `.from()` em frontend só é candidato quando acessa tabela sem view/RPC aprovada. Backend, Edge Functions, scripts e testes são avaliados pela finalidade e evidência de autorização.

## Gate e module

`fast` executa Git, padrões, lint quando configurado, typechecks e `npm run local:qa:secret-scan`. O package.json atual não possui script `lint`; isso é reportado como `not-configured`, sem instalação de dependência.

`module` inventaria escopo direto, imports, contratos, consumidores, testes, documentação, rotas e estados `loading`, `empty`, `error` e `unavailable`. Não acessa banco ou navegador por padrão e declara itens não analisados.

## Testes

Os testes dedicados vivem em `.agents/skills/genius-code-quality/tests/` e usam fixtures artificiais para cobrir:

- `SECURITY DEFINER` seguro, inseguro, comentário, teste e migration histórica corrigida;
- `SELECT *` em pgTAP, `exists`, view persistente e auditoria;
- acesso direto frontend, view aprovada, Edge Function staging, service role sensível e teste;
- camadas, status, proveniência, risco, veredito e truncamento.

Executar:

```text
node --test .agents/skills/genius-code-quality/tests/detectors.test.mjs
```

## Limitações

O gate continua sendo uma triagem contextual. Confirmação de RLS, grants, tenant scope, contrato final de banco, comportamento visual, runtime, performance e integrações depende de análise adicional autorizada. Nenhum finding do produto é corrigido automaticamente.
