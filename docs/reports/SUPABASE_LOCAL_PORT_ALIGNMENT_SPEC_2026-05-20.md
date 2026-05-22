# Supabase Local Port Alignment Spec — 2026-05-20

## Objetivo
Eliminar o drift de portas locais entre `supabase/config.toml`, scripts de readiness, documentação e setup do frontend, sem resetar banco local e sem tocar ambiente remoto.

## Evidência-base usada
- `supabase/config.toml`
- `scripts/ci/wait-for-supabase-ready.mjs`
- `apps/web/README.md`
- `docs/PROJECT_STATE.md`
- `.github/workflows/supabase-db.yml`
- `package.json`
- `docs/reports/SUPABASE_OPERATIONAL_MAP.md`
- `docs/reports/VALIDATION_BASELINE_MATRIX_2026-05-20.md`
- `npx supabase status -o env`
- execução isolada de `node scripts/ci/wait-for-supabase-ready.mjs`

## Estado real consolidado
### Runtime local observado agora
`npx supabase status -o env` retornou:
- `API_URL=http://127.0.0.1:54321`
- `DB_URL=postgresql://postgres:***@127.0.0.1:54322/postgres`
- `STUDIO_URL=http://127.0.0.1:54323`
- `INBUCKET_URL=http://127.0.0.1:54324`
- `edge_runtime` parado

### Configuração versionada atual
`supabase/config.toml` define:
- API: `54321`
- DB: `54322`
- Studio: `54323`
- Inbucket: `54324`
- SMTP comentado: `54325`
- POP3 comentado: `54326`
- Analytics: `54327`

### Consumidores desalinhados
- `scripts/ci/wait-for-supabase-ready.mjs` faz probe em `55321` e `55322`
- `apps/web/README.md` orienta `VITE_SUPABASE_URL=http://127.0.0.1:55321`
- `docs/PROJECT_STATE.md` afirma que as portas locais foram remapeadas para `55321-55327`
- `docs/GPT/PROJECT_STATE.md` replica a mesma afirmação histórica de `55321-55327`

### Falha reproduzida
A execução isolada de `node scripts/ci/wait-for-supabase-ready.mjs` falhou após 60s porque tentou:
- `http://127.0.0.1:55321/rest-admin/v1/ready`
- TCP `127.0.0.1:55322`

Enquanto isso, o runtime real saudável está em `54321/54322`.

## Matriz fonte-de-verdade proposta
| Camada | Papel | Fonte oficial proposta | Estado atual | Ação |
| --- | --- | --- | --- | --- |
| Porta local versionada | definição canônica | `supabase/config.toml` | `54321-54327` | manter como autoridade primária |
| Runtime efetivo | prova de que a stack subiu com a configuração vigente | `npx supabase status -o env` | confirma `54321-54324` | manter como verificador operacional |
| Readiness script | consumidor derivado | `scripts/ci/wait-for-supabase-ready.mjs` | hardcoded em `55321/55322` | alinhar ao source of truth |
| Setup frontend local | consumidor derivado | `apps/web/README.md` + `apps/web/.env.local` | README aponta `55321` | alinhar ao source of truth |
| Documentação de estado | narrativa derivada | `docs/PROJECT_STATE.md` e espelho `docs/GPT/PROJECT_STATE.md` | afirmam `55321-55327` | alinhar ao source of truth |
| Pipeline CI | orquestração | `.github/workflows/supabase-db.yml` | já chama o readiness script central | sem porta hardcoded; validar após ajuste do script |

## Decisão técnica recomendada
Decisão padrão recomendada: tratar `supabase/config.toml` + `supabase status -o env` como fonte de verdade e alinhar todos os consumidores para a faixa `54321-54327`.

Justificativa:
- é o estado versionado atual do repositório;
- é o estado realmente observado no runtime local;
- já sustenta `supabase:test:db` e `supabase:lint:db` segundo `docs/reports/VALIDATION_BASELINE_MATRIX_2026-05-20.md`;
- exige menos blast radius do que reintroduzir remapeamento para `55321-55327`.

## Decisão pendente que muda o plano
Há uma hipótese histórica documentada em `docs/PROJECT_STATE.md`: coexistência com outro stack local exigindo `55321-55327`.

Se essa restrição ainda for real e atual, existe um plano alternativo:
- remapear novamente `supabase/config.toml` para `55321-55327`;
- alinhar readiness, README do frontend e documentação para essa nova faixa;
- revalidar `supabase status -o env`, readiness, lint e pgTAP.

Sem evidência atual de conflito de porta, este plano alternativo não é o recomendado.

## Diff lógico proposto
### 1. Infra local/versionamento
Manter sem mudança de conteúdo se a decisão for seguir o runtime atual:
- `supabase/config.toml`

Somente alterar `supabase/config.toml` se houver decisão explícita de voltar ao range `55321-55327`.

### 2. Script
Ajustar `scripts/ci/wait-for-supabase-ready.mjs` para parar de depender de `55321/55322` hardcoded.

Preferência de implementação:
1. ler `SUPABASE_API_URL` e `SUPABASE_DB_PORT` se presentes;
2. caso ausentes, derivar defaults coerentes com `supabase/config.toml` atual (`54321/54322`);
3. manter a lógica existente de pular probe do edge runtime quando `supabase status -o env` reportar serviço parado.

Resultado esperado:
- `npm run supabase:wait:ready` volta a ser compatível com `supabase:start` e com a CI;
- `npm run supabase:verify` deixa de falhar cedo por drift de porta, embora continue destrutivo por reset.

### 3. Frontend local
Alinhar `apps/web/README.md` para exemplo mínimo com:
- `VITE_SUPABASE_URL=http://127.0.0.1:54321`

Nenhuma mudança obrigatória identificada em `scripts/dev/run-web-dev.mjs`, porque ele só exige a presença das variáveis e não fixa porta.

### 4. Documentação
Alinhar textos que hoje narram `55321-55327` como se fossem o estado vigente:
- `docs/PROJECT_STATE.md`
- `docs/GPT/PROJECT_STATE.md`

Não há necessidade de “corrigir” os relatórios de baseline já produzidos:
- `docs/reports/SUPABASE_OPERATIONAL_MAP.md`
- `docs/reports/VALIDATION_BASELINE_MATRIX_2026-05-20.md`

Esses relatórios devem permanecer como evidência histórica do drift encontrado.

## Separação por frente
### Ajuste de infra local
- eventual mudança em `supabase/config.toml` apenas se a decisão explícita for restaurar `55321-55327`

### Ajuste de script
- `scripts/ci/wait-for-supabase-ready.mjs`

### Ajuste de documentação/setup
- `apps/web/README.md`
- `docs/PROJECT_STATE.md`
- `docs/GPT/PROJECT_STATE.md`

## Ordem segura de implementação
1. Confirmar a decisão de faixa oficial:
   - padrão recomendado: manter `54321-54327`
   - exceção: voltar para `55321-55327` apenas se houver conflito real de porta ainda vigente
2. Ajustar `scripts/ci/wait-for-supabase-ready.mjs`
3. Validar isoladamente `node scripts/ci/wait-for-supabase-ready.mjs`
4. Alinhar `apps/web/README.md`
5. Alinhar `docs/PROJECT_STATE.md`
6. Alinhar `docs/GPT/PROJECT_STATE.md`
7. Rodar validação segura final:
   - `npx supabase status -o env`
   - `npm run supabase:wait:ready`
   - `npm run supabase:lint:db`
   - `npm run supabase:test:db`
8. Não rodar `npm run supabase:verify` nesta frente sem decisão explícita, porque o comando continua resetando o banco local

## Riscos
### R1. Regressão silenciosa de automação
Se o script continuar com porta hardcoded divergente, a CI e o fluxo local continuarão falhando mesmo com Supabase saudável.

### R2. Documentação ensinando setup inválido
Se o README do frontend permanecer em `55321`, operadores podem subir o frontend contra URL errada e interpretar falha de conexão como problema de auth ou backend.

### R3. Narrativa histórica virando “estado atual”
`docs/PROJECT_STATE.md` e `docs/GPT/PROJECT_STATE.md` hoje cristalizam uma informação que não bate com o repositório nem com o runtime atual.

### R4. Mudança precipitada em `config.toml`
Trocar a faixa oficial de volta para `55321-55327` sem evidência de conflito local recria custo operacional desnecessário e amplia o número de consumidores a revalidar.

## Checklist de validação
- [ ] `supabase/config.toml` e `npx supabase status -o env` convergem para a mesma faixa oficial
- [ ] `scripts/ci/wait-for-supabase-ready.mjs` não contém mais `55321/55322` incompatíveis com a faixa oficial
- [ ] `node scripts/ci/wait-for-supabase-ready.mjs` passa no ambiente local com a stack ativa
- [ ] `apps/web/README.md` instrui `VITE_SUPABASE_URL` coerente com `API_URL`
- [ ] `docs/PROJECT_STATE.md` descreve o estado vigente, não o histórico divergente
- [ ] `docs/GPT/PROJECT_STATE.md` replica o mesmo estado vigente
- [ ] `npm run supabase:lint:db` continua PASS
- [ ] `npm run supabase:test:db` continua PASS
- [ ] `npm run supabase:verify` permanece explicitamente marcado como destrutivo, mesmo após o alinhamento de portas

## Conclusão executável
O drift atual não está em `supabase/config.toml`; ele está nos consumidores e na narrativa documental. O caminho mais seguro é manter `54321-54327` como faixa oficial, corrigir primeiro o readiness script e depois alinhar frontend/docs. Só faz sentido mexer em `config.toml` se houver confirmação operacional de que a coexistência com outro stack ainda exige retornar para `55321-55327`.
