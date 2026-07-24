# Integração do handoff do mascote Genius — 2026-07-21

## Decisão

O bundle `Recreação do mascote Genius-handoff/` é material de referência do
handoff visual. Ele não entra no runtime nem no build. O asset SVG extraído é
byte-a-byte igual ao asset já versionado em
`apps/web/assets/brand/genius-mascot.svg` (SHA-256:
`4154A5252ED6B18AA73091E9DC09313420C45BBFF709AFA50DF987391BE16BF5`).

## Implementação consolidada

`apps/web/src/components/GeniusMascot.tsx` continua sendo a fonte de runtime
para o mascote. As superfícies operacionais agora refletem as poses definidas
no handoff:

| Superfície | Pose | Uso |
| --- | --- | --- |
| `loading` | `magic` | carregamento e sincronização |
| `empty` | `shrug` | ausência honesta de dados |
| `success` | `celebrate` | conclusão positiva |
| `avatar` | `welcome` | avatar e identidade do produto |
| `default` | `welcome` | uso geral |

A propriedade opcional `pose` permite sobrescrever a pose por necessidade
visual sem duplicar o SVG. Expressões (`happy`, `wink`, `wow`) continuam
independentes da pose.

## Limites preservados

- O protótipo HTML/DC não é carregado pelo navegador da aplicação.
- O runtime do handoff (`support.js`) não é dependência de produção.
- Não há segredo, credencial, chamada externa ou alteração de banco neste
  lote.
- O bundle local permanece disponível para consulta, mas é ignorado pelo Git
  para não contaminar o produto com artefatos de design/exportação.

## Validação

- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `node --test tests/scripts/cs-migration.test.mjs` (7 testes)
- `npm run documentation:validate:internal-docs`
- `npm run supabase:lint:db`
- `npm run supabase:test:db` (67 arquivos, 1.192 testes)
- smoke visual Playwright em `/login`, sem erros de console
- `git diff --check`

O lint do Supabase manteve apenas os avisos preexistentes de variáveis
`v_actor` não lidas. O build passou sem alerta de chunks acima de 500 kB após
o carregamento lazy das áreas do Analytics e a divisão explícita dos vendors.
