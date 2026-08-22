# Revisão independente pós-fato — R-14

- **Task:** R-14, deny-all intencional para tabelas RLS sem policy
- **Reviewer:** Claude, Principal Engineer / Independent Code Reviewer
- **Data:** 2026-08-21
- **Estado do lote na análise:** já integrado em `6eec6d7` e arquivado em
  `handoffs/archive/R-14-2026-08-21/`, aprovado por auto-revisão do Codex sob
  `OWNER_AUTHORIZED_SELF_REVIEW`
- **Natureza deste documento:** evidência técnica independente, registrada
  depois da integração. Não altera o estado do lote nem reabre a fila.

## Por que existe

Eu estava conduzindo a revisão independente do R-14 quando a ponte de arquivos
com a máquina do proprietário caiu. O lote foi finalizado por auto-revisão
durante essa janela. A autonomia operacional que cobre esse tipo de finalização
está ratificada em [OD-001](../../docs/engineering/OWNER_DECISIONS.md).

Como a revisão já estava quase completa e a matéria é de segurança, registro
aqui o resultado independente. Serve para que o histórico do R-14 não dependa
somente da auto-revisão de quem implementou.

## Veredito técnico

O conteúdo do R-14 se sustenta. Se eu tivesse concluído o ciclo antes da queda,
o resultado seria `APPROVED` com um finding de severidade baixa, descrito
abaixo, que não bloquearia a integração.

## Verificações executadas por mim

| Verificação | Resultado observado |
| --- | --- |
| `node --test tests/scripts/r14-rls-deny-all-allowlist.test.mjs` | PASS, 2/2 |
| `npm run review:gates` | `RLS_WITHOUT_POLICY` total 0, baseline 19, resolvidos 19, 0 regressões bloqueantes |
| `.review/baseline.json` | sem modificação |
| Allowlist | 19 tabelas, sem duplicidade, com motivo individual |
| Probe independente sobre `supabase/migrations` | nenhum `grant` a `anon` ou `authenticated` para as 19 tabelas |
| Fallback do gate | arquivo ausente resulta em `new Set()`, ou seja, todas as tabelas voltam a ser reportadas |

### O ponto central: a allowlist não concede acesso

Auditei as 19 tabelas diretamente nas migrations, sem confiar na tabela de
evidências do implementador. Para cada uma, todo `grant` posterior ao `revoke`
tem como destino `service_role`. Não existe nenhum `grant` a `anon` ou a
`authenticated`, com ou sem prefixo de schema. A afirmação de deny-all
interativo é verdadeira no estado atual do repositório.

O teste do lote também não é decorativo: exige igualdade exata entre a allowlist
e o conjunto de tabelas com RLS sem policy detectado nas migrations, o que faz
entrada sobrando ou faltando quebrar a suíte, e exige revogação explícita de
`public`, `anon` e `authenticated` para cada entrada declarada.

O comportamento do gate na ausência do arquivo é seguro: `existsSync` falso
produz conjunto vazio, e o resultado é que todas as tabelas voltam a ser
reportadas como blocker. Falha fechando, não abrindo.

## Finding

### R14-C01 - LOW - O teste não trava um `grant` interativo futuro

Arquivo: `tests/scripts/r14-rls-deny-all-allowlist.test.mjs:26-34`.

A asserção exige que exista, em algum lugar das migrations, um `revoke all` de
`public`, `anon` e `authenticated` para cada tabela declarada. Ela não verifica
ordem nem ausência de concessão posterior. Uma migration futura que execute
`grant select on public.<tabela> to authenticated` deixaria o teste verde, o
gate verde e a allowlist ainda afirmando deny-all interativo.

Hoje é latente: o probe confirma que nenhuma concessão desse tipo existe. O
risco é de regressão futura, e é exatamente o cenário que a allowlist se propõe
a cobrir, já que ela transforma um blocker em declaração aceita.

Correção sugerida, barata: acrescentar ao mesmo teste uma asserção de ausência
de `grant ... to (anon|authenticated|public)` para as tabelas declaradas. Fica
verde imediatamente e passa a proteger o invariante.

Classificação LOW e não MEDIUM porque não há exposição atual, o gate continua
fechando na ausência do arquivo e a correção não depende de nenhuma decisão de
arquitetura.

## O que não foi validado

- `npm run test:all` sobre o estado pós-integração. O espelho de validação em
  nuvem está desatualizado em relação a estes commits.
- Comportamento em banco real. O shell disponível na máquina do proprietário é
  uma VM isolada, sem rota para o Supabase local, então nenhuma verificação foi
  feita contra o banco. A análise é estática sobre as migrations.
- `lint`, `web:typecheck` e `web:build` neste lote. O delta não toca `apps/web`
  nem `packages/`.

## Recomendação

Tratar o R14-C01 em um lote futuro de manutenção, junto com a recomendação já
registrada no review do R-11: acrescentar `npm run test:all` ao workflow que
roda em `ubuntu-latest`, hoje ausente. As duas são pequenas e protegem
invariantes que hoje dependem de disciplina em vez de automação.
