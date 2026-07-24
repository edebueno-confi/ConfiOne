# Tests and Quality

## Controles disponíveis

- Typecheck web.
- Typecheck contracts.
- Build web.
- Testes Node focados em scripts/contratos.
- Testes Supabase/pgTAP.
- Lint de banco.
- Validação documental.
- Smoke Playwright autenticado local.

## Evidências recentes documentadas

Em ciclos imediatamente anteriores, foram registrados:

- Smoke autenticado do Dashboard e Central com screenshots.
- RPCs executivas do dashboard respondendo HTTP 200 localmente.
- Typecheck web e contracts aprovados.
- Build web aprovado.
- Testes Node focados aprovados.
- Validação documental sem bloqueios novos.
- Fila de suporte corrigida localmente contra timeout por migration de passagem única.

## Limites

- A suíte completa `supabase:qa:local-support-fixture` apresentou lentidão/travamento em Knowledge/Public Help e precisa hardening separado.
- Este macro-lote de Context Pack não executou nova suíte completa; ele é documental e baseado em auditoria local + evidências recentes.

## Recomendação

Antes de release:

1. Rodar `npm run web:typecheck`.
2. Rodar `npm run contracts:typecheck`.
3. Rodar `npm run web:build`.
4. Rodar testes Node focados e documentação.
5. Rodar smoke Playwright autenticado do release.
6. Se houver mudança de banco, rodar pgTAP/verify local.

## Validações executadas neste checkout para o Context Pack

- `npm run documentation:validate:internal-docs`: executado, sem bloqueios; manteve alertas históricos de menção a token/service role em docs.
- `git diff --check`: executado, sem erro; manteve avisos CRLF/LF já conhecidos em `PROJECT_STATE.md` e `README.md`.
- Captura Playwright V2: 22 rotas capturadas, 0 falhas de captura, 0 overflow horizontal detectado.
- Instalação permitida pelo Product Owner: `npx playwright install chromium`, concluída sem erro para melhorar eficiência de captura.

## Validações não executadas neste macro-lote

- `npm run web:typecheck`
- `npm run contracts:typecheck`
- `npm run web:build`
- `npm run supabase:test:db`
- `npm run supabase:lint:db`
- `npm run supabase:verify`

Essas validações não foram executadas porque o macro-lote V2 é documental/captura de evidências e não autoriza implementação funcional.
