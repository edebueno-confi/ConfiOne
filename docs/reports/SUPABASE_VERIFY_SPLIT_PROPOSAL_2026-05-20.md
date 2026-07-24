# Supabase Verify Split Proposal — 2026-05-20

## Objetivo
Definir o desenho operacional para separar verificações seguras/repetíveis do fluxo destrutivo hoje concentrado em `npm run supabase:verify`, preservando aderência explícita à baseline auditada em `docs/reports/VALIDATION_BASELINE_MATRIX_2026-05-20.md` e ao mapa operacional em `docs/reports/SUPABASE_OPERATIONAL_MAP.md`.

## Âncoras obrigatórias

### 1. Baseline auditada já validada
`docs/reports/VALIDATION_BASELINE_MATRIX_2026-05-20.md` já separa o terreno em três blocos reais:
- rotina segura sem tocar no banco:
  - `npm run contracts:typecheck`
  - `npm run web:typecheck`
  - `npm run documentation:validate:internal-docs`
  - `npm run web:build`
- rotina segura dependente de Supabase local já ativo:
  - `npm run supabase:lint:db`
  - `npm run supabase:test:db`
- rotina fora da baseline segura:
  - `npm run supabase:verify`, porque faz reset local e reidrata fixture administrativa fora de CI

### 2. Mapa operacional Supabase já auditado
`docs/reports/SUPABASE_OPERATIONAL_MAP.md` confirma que:
- `supabase:verify` não é smoke test leve;
- o primeiro passo do fluxo é `supabase:db:reset`;
- fora de CI, o comando ainda roda `wait-for-supabase-ready` e `supabase:qa:local-admin-fixture --with-denied-user`;
- há drift real entre o readiness script (`55321/55322`) e o `supabase/config.toml` observado na auditoria (`54321/54322`), o que quebra a repetibilidade mesmo antes do reset.

## Leitura do problema atual
O nome `supabase:verify` mistura três intenções operacionais incompatíveis dentro do mesmo entrypoint:
1. checagem segura de disponibilidade local;
2. validação funcional de banco/contratos em stack local já pronta;
3. rebuild destrutivo do banco local seguido de reidratação.

Isso produz quatro riscos:
- falso senso de segurança: o nome parece smoke check, mas reseta estado local;
- baixa repetibilidade: falha de readiness pode mascarar o restante do pipeline;
- baixa ergonomia de QA: o operador não consegue escolher entre “só validar” e “recriar ambiente”;
- acoplamento excessivo: smoke, reset, pgTAP, knowledge verify, lint e fixture ficam presos a uma única decisão binária.

## Classificação operacional proposta

### Faixa A · Safe smoke
Objetivo: checar rapidamente se o ambiente do repositório continua íntegro sem resetar banco nem mutar fixture.

Critérios:
- não pode chamar `supabase db reset`;
- não pode criar/alterar usuário ou fixture;
- deve ser repetível várias vezes por dia;
- deve falhar cedo em drift de portas/readiness;
- deve ser compatível com uso local antes de QA manual e antes de tocar no banco.

Comandos alvo na proposta:
1. `npm run contracts:typecheck`
2. `npm run web:typecheck`
3. `npm run documentation:validate:internal-docs`
4. `npm run web:build`
5. `npm run supabase:wait:ready` somente quando o objetivo for provar disponibilidade da stack local sem reset
6. `npm run supabase:lint:db` opcional quando a stack local já estiver ativa

Leitura operacional:
- este bloco é o candidato natural para um futuro comando como `supabase:verify:safe` ou `supabase:smoke`;
- não deve depender de fixture administrativa;
- deve ser o entrypoint padrão para QA rotineiro e pré-checagem local.

### Faixa B · Integration local
Objetivo: validar o contrato real do banco local já inicializado, sem destruir estado por padrão.

Critérios:
- ainda não pode chamar reset;
- pressupõe stack local pronta;
- pode depender das migrations atuais já aplicadas no banco local;
- pode rodar em sequência após o smoke seguro.

Comandos alvo na proposta:
1. `npm run supabase:wait:ready`
2. `npm run supabase:lint:db`
3. `npm run supabase:test:db`
4. `npm run knowledge:verify:octadesk:space-aware` somente se o objetivo incluir boundary de conhecimento

Leitura operacional:
- este bloco cobre a regressão funcional principal do backend local sem recriar ambiente;
- ele deve ser explícito como “integration/local” e não como smoke;
- `knowledge:verify:octadesk:space-aware` deve ficar aqui ou em etapa acoplável, não no smoke mínimo.

### Faixa C · Destructive reset
Objetivo: recriar o banco local de forma controlada e então executar a bateria dependente de ambiente limpo.

Critérios:
- destrói estado local;
- requer janela consciente do operador;
- precisa de guardrails claros no nome e no runbook;
- deve ser usado em CI ou em troubleshooting controlado, não como hábito de QA manual.

Comandos alvo na proposta:
1. `npm run supabase:db:reset`
2. `npm run supabase:test:db`
3. `npm run knowledge:verify:octadesk:space-aware`
4. `npm run supabase:lint:db`
5. `npm run supabase:wait:ready` pós-reset, se o fluxo realmente exigir confirmação adicional de disponibilidade
6. `npm run supabase:qa:local-admin-fixture -- --with-denied-user` apenas em contexto local fora de CI, quando a reidratação for parte explícita do aceite

Leitura operacional:
- este é o verdadeiro herdeiro do `supabase:verify` atual;
- o nome futuro precisa denunciar a destrutividade (`supabase:verify:destructive`, `supabase:verify:reset`, `supabase:verify:full-reset` ou equivalente);
- reidratação de fixture não deve ficar implícita sob um nome genérico de verify.

## Matriz proposta safe vs destructive

| Faixa | Mutação de banco | Depende de Supabase local | Repetível em rotina | Indicado para CI | Gate humano | Comandos principais |
| --- | --- | --- | --- | --- | --- | --- |
| Safe smoke | Não | Opcional | Sim | Sim | Não | `contracts:typecheck`, `web:typecheck`, `documentation:validate:internal-docs`, `web:build`, `supabase:wait:ready` |
| Integration local | Não por padrão | Sim | Sim, se a stack já estiver pronta | Sim | Não | `supabase:wait:ready`, `supabase:lint:db`, `supabase:test:db`, `knowledge:verify:octadesk:space-aware` |
| Destructive reset | Sim | Sim | Não | Sim, em ambiente efêmero | Sim em máquina local compartilhada | `supabase:db:reset`, `supabase:test:db`, `knowledge:verify:octadesk:space-aware`, `supabase:lint:db`, fixture local |

## Naming proposto
A proposta não exige decidir já o nome final, mas o padrão deve distinguir segurança operacional de destrutividade no próprio comando.

Opção preferida de família:
- `npm run supabase:verify:safe`
- `npm run supabase:verify:local`
- `npm run supabase:verify:destructive`

Alternativa equivalente:
- `npm run supabase:smoke`
- `npm run supabase:integration:local`
- `npm run supabase:verify:reset`

Critérios para escolher naming:
- o nome destrutivo deve conter `destructive` ou `reset`;
- o nome seguro deve poder ser recomendado sem nota de rodapé;
- o nome intermediário deve comunicar dependência de stack local, não de reset.

## Ordem de execução recomendada

### 1. Rotina rápida de desenvolvimento
1. `npm run contracts:typecheck`
2. `npm run web:typecheck`
3. `npm run documentation:validate:internal-docs`
4. `npm run web:build`
5. se houver Supabase local ativo: `npm run supabase:wait:ready`

Uso:
- pré-commit local;
- sanity check antes de QA visual;
- detecção precoce de drift de docs, TypeScript, build e readiness.

### 2. Rotina local completa não destrutiva
1. executar a rotina rápida;
2. `npm run supabase:wait:ready`
3. `npm run supabase:lint:db`
4. `npm run supabase:test:db`
5. `npm run knowledge:verify:octadesk:space-aware` quando a mudança tocar importação/knowledge boundary

Uso:
- validação de lote backend/frontend com Supabase local já em pé;
- regressão antes de pedir review;
- QA técnica repetível sem apagar estado local.

### 3. Rotina destrutiva controlada
1. confirmar que o banco local pode ser descartado;
2. rodar readiness consistente com as portas oficiais;
3. `npm run supabase:db:reset`
4. `npm run supabase:test:db`
5. `npm run knowledge:verify:octadesk:space-aware`
6. `npm run supabase:lint:db`
7. reidratar fixture local somente quando necessário para QA pós-reset

Uso:
- CI efêmera;
- troubleshooting de drift local irrecuperável;
- validação de fluxo pós-migration que realmente precisa de banco recriado.

## Gates humanos propostos

### Gate obrigatório
Exigir decisão humana explícita antes de qualquer comando da faixa destrutiva quando:
- a máquina local contém estado útil de trabalho;
- o operador não está em ambiente efêmero;
- a reidratação de fixture pode mascarar problema de setup;
- o objetivo da task não pede rebuild do banco.

### Gate opcional, mas recomendado
Pedir decisão antes de acoplar `knowledge:verify:octadesk:space-aware` à rotina padrão quando:
- a mudança não toca Knowledge Base;
- o custo de execução estiver alto demais para ciclo curto;
- o operador quiser smoke mínimo mais barato.

## Pré-requisitos por comando

| Comando | Tipo | Pré-requisitos reais | Observações |
| --- | --- | --- | --- |
| `contracts:typecheck` | safe | `node_modules` instalados | independe de Supabase |
| `web:typecheck` | safe | `node_modules` instalados | independe de Supabase |
| `documentation:validate:internal-docs` | safe | `node_modules`, whitelist documental | dry-run sem escrita |
| `web:build` | safe | `node_modules` instalados | detecta regressões reais de bundling |
| `supabase:wait:ready` | safe/integration | stack local iniciada; portas oficiais coerentes entre config/script/docs | hoje há drift documentado |
| `supabase:lint:db` | integration | banco local acessível | não exige reset |
| `supabase:test:db` | integration | banco local acessível; pgTAP disponível | não exige reset por si só |
| `knowledge:verify:octadesk:space-aware` | integration | contexto de knowledge coerente com banco local | manter fora do smoke mínimo |
| `supabase:db:reset` | destructive | permissão para destruir banco local | não usar em rotina segura |
| `supabase:qa:local-admin-fixture` | destructive/post-reset | URLs/chaves locais válidas; ambiente explicitamente local | mutação de fixture, não smoke |

## Conversa com a baseline de validação já auditada
A proposta preserva e formaliza o que a baseline já mostrou empiricamente:
- a rotina segura já existe de fato, mas hoje está implícita em comandos soltos;
- a rotina integration local já existe de fato, mas hoje fica misturada com o reset no imaginário de `supabase:verify`;
- a rotina destrutiva já existe de fato, mas está mal nomeada e operacionalmente acoplada.

Em outras palavras: o split não inventa novos ritos; ele transforma em contrato operacional explícito aquilo que a auditoria já comprovou no repositório.

## Backlog de implementação recomendado

### P0 · corrigir readiness antes de qualquer split executável
- alinhar `scripts/ci/wait-for-supabase-ready.mjs` com a faixa oficial de portas realmente adotada pelo repositório;
- alinhar `supabase/config.toml`, `docs/PROJECT_STATE.md`, `apps/web/README.md` e demais docs de setup à mesma faixa;
- aceite: readiness, config, docs e setup frontend apontam para uma única convenção de portas.

### P1 · extrair entrypoint seguro explícito
- criar comando seguro dedicado para smoke sem reset e sem fixture;
- incluir `contracts:typecheck`, `web:typecheck`, `documentation:validate:internal-docs`, `web:build` e, quando aplicável, `supabase:wait:ready`;
- aceite: existe um comando recomendável para rotina local sem nota de risco destrutivo.

### P1 · extrair entrypoint integration local explícito
- criar comando dedicado para validação local com Supabase ativo e sem reset;
- decidir se `knowledge:verify:octadesk:space-aware` entra por padrão ou por variante;
- aceite: existe comando intermediário que valida backend local sem apagar estado.

### P1 · renomear o fluxo destrutivo atual
- migrar o `supabase:verify` atual para nome que explicite reset/destrutividade;
- evitar que o alias antigo continue sendo divulgado como rotina segura;
- aceite: documentação e scripts deixam inequívoco que o fluxo destrói banco local.

### P1 · atualizar runbooks e baseline
- atualizar `docs/VALIDATION_CHECKLIST.md`, `docs/README.md`, `docs/reports/VALIDATION_BASELINE_MATRIX_2026-05-20.md` ou sucessor e `docs/reports/SUPABASE_OPERATIONAL_MAP.md` para refletir os três níveis;
- aceite: qualquer operador consegue escolher o comando certo sem inferência tácita.

### P2 · decidir política de fixture pós-reset
- separar semanticamente “reset do banco” de “reidratação de fixture admin/local support”;
- avaliar se fixtures viram passo opt-in por domínio (`admin`, `support`, `portal`) em vez de efeito colateral de verify;
- aceite: reidratação deixa de ser surpresa acoplada a verify genérico.

## Decisão operacional recomendada
Adotar formalmente três níveis de verificação:
- `safe smoke` como padrão diário;
- `integration local` como regressão não destrutiva com Supabase ativo;
- `destructive reset` como fluxo controlado e explicitamente perigoso.

Enquanto o split não for implementado, a orientação operacional deve ser:
- tratar `npm run supabase:verify` como destrutivo;
- não recomendá-lo como smoke local;
- usar a baseline segura documentada como padrão de QA repetível.

## Validação desta proposta
- leitura direta de `package.json`
- leitura direta de `scripts/ci/run-supabase-verify.mjs`
- leitura direta de `scripts/ci/wait-for-supabase-ready.mjs`
- leitura direta de `.github/workflows/supabase-db.yml`
- ancoragem explícita em `docs/reports/VALIDATION_BASELINE_MATRIX_2026-05-20.md`
- ancoragem explícita em `docs/reports/SUPABASE_OPERATIONAL_MAP.md`
- nenhuma mutation de banco, nenhum reset destrutivo e nenhuma alteração de script executadas nesta task
