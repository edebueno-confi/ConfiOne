# IMPLEMENTATION

- Task ID: R1-UTF8-ENCODING-INTEGRITY-2026-08-21
- State: READY_FOR_REVIEW
- Owner: Forge
- Role: IMPLEMENTER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Agent coordination: REVIEW_ACTIVE
- Approval: APPROVED
- Base SHA: 5df3259
- Implementation SHA: UNCOMMITTED_WORKTREE

## Resultado

### Reprodução e isolamento

Reprodução determinística local em `tests/scripts/utf8-encoding-integrity.test.mjs`:
`Operação`, `Suporte`, `São Paulo`, `Integrações`, `Atenção`, `Próxima renovação`
e `Café & ação` atravessam `TextEncoder`/`TextDecoder` UTF-8 sem perda, mojibake
ou caractere de substituição. A regressão da exportação CSV existente também foi
executada com `Responsável`, `Média` e nomes contendo caracteres especiais.

Fatos locais encontrados:

- `apps/web/index.html` já declara `<meta charset="UTF-8">`, portanto a origem
  está correta para a página principal.
- HTML e SVG de exportação já declaravam `charset=utf-8`; o CSV já usava BOM
  explícito em `AnalyticsCustomerDebt.tsx`, necessário para o Excel em português.
- A cadeia comum de respostas JSON das Edge Functions em
  `supabase/functions/_shared/ticket-evidence.ts` declarava apenas
  `application/json`, sem charset explícito. Isso é uma hipótese de risco na
  camada de transporte, não uma corrupção reproduzida no consumidor.

Hipóteses descartadas localmente:

- não há necessidade de transliterar, remover acentos ou reescrever o read model;
- não houve evidência local de corrupção na serialização `JSON.stringify`;
- a renderização React e o documento HTML local já usam texto UTF-8 válido;
- não foi feita chamada externa para atribuir a causa a HubSpot, OMIE ou produção.

### Correção

- `jsonResponse` agora responde `application/json; charset=utf-8`.
- `optionsResponse` agora declara `text/plain; charset=utf-8`.
- A alteração é classificada como mitigação defensiva de transporte. O lote não
  declara que um incidente de corrupção foi resolvido, pois não houve execução
  local do runtime Edge/consumidor afetado nem bytes mojibake observados.
- A regressão trava headers JSON/OPTIONS, página HTML, exportações HTML/SVG/CSV
  e o conjunto de caracteres operacionais em português.

### Resposta ao F-UTF8-001

O finding foi aceito. O teste atual não importa nem executa `jsonResponse` ou
`optionsResponse`, e não observa `Response.headers`/`Response.body` em runtime.
Como o runner disponível não possui Deno e o módulo compartilhado depende de
imports `jsr:`/`npm:` e `Deno.env`, não foi criada uma simulação que pudesse ser
confundida com execução do Edge runtime. A ausência de corrupção no consumidor
continua não reproduzida; `charset` fica explicitamente classificado como
mitigação defensiva, não como causa confirmada ou incidente resolvido.

## Arquivos alterados neste lote

- `supabase/functions/_shared/ticket-evidence.ts`
- `tests/scripts/utf8-encoding-integrity.test.mjs`
- `handoffs/current/TASK.md`
- `handoffs/current/IMPLEMENTATION.md`
- `handoffs/current/STATUS.md`

## Gates e limitações

- Testes UTF-8 e dívida/exportação: PASS, 4/4 neste ciclo; o conjunto anterior
  de UTF-8 e dívida/exportação havia passado 14/14.
- `npm run web:typecheck`: PASS.
- `npm run web:build`: PASS, 945 módulos transformados.
- `npm run lint`: PASS, 0 erros e 160 warnings legados.
- `npm run review:gates`: PASS, 0 regressões bloqueantes e 47 itens baseline resolvidos.
- `npm run docs:validate`: PASS, 0 documentos bloqueados; alertas históricos permanecem.
- `git diff --check`: PASS após a remoção mecânica da linha em branco final de
  `handoffs/current/REVIEW.md`. O conteúdo, veredito e findings do review foram
  preservados integralmente.

Não houve secrets, chamadas externas, HubSpot, OMIE, produção, migration remota,
deploy, push, merge ou release. Integração externa e renderização autenticada
não foram declaradas como validadas.
