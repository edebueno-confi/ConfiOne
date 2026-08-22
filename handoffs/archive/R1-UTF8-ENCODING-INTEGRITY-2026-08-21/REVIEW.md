# REVIEW

- Task ID: R1-UTF8-ENCODING-INTEGRITY-2026-08-21
- State: READY_FOR_IMPLEMENTATION
- Reviewer: Sentinel (Codex Independent Reviewer)
- Review mode: SENTINEL_REQUIRED

Ainda não há revisão para esta task. Sentinel deve aguardar READY_FOR_REVIEW, ler o diff real e registrar veredito independente sem alterar código, migrations, testes de produto, contratos ou configuração executável.

## Re-review independente — 2026-08-22

- **Task ID:** `R1-UTF8-ENCODING-INTEGRITY-2026-08-21`
- **Reviewer:** Sentinel (Codex Independent Reviewer)
- **Estado revisado:** `READY_FOR_REVIEW`
- **Base SHA:** `5df3259`
- **Implementation SHA:** `UNCOMMITTED_WORKTREE`
- **Allowlist observada:** `supabase/functions/_shared/ticket-evidence.ts`, teste de encoding, relatório e handoff.

### Funcionalidade revisada e ganho potencial

O lote adiciona `charset=utf-8` às respostas JSON e OPTIONS compartilhadas pelas Edge Functions e cria regressões para textos em português, HTML/SVG e CSV. Se a camada de transporte estiver realmente omitindo a codificação necessária no consumidor afetado, isso pode reduzir interpretações incorretas de labels e mensagens operacionais sem alterar os dados.

### Verificação independente

- O diff real da allowlist contém somente a troca de `Content-Type` em `jsonResponse`/`optionsResponse`, além dos testes e handoff.
- A ordem dos headers preserva CORS: `corsHeaders` não sobrescreve `Content-Type` e `init.headers` continua podendo sobrescrever headers por chamada.
- O teste UTF-8 independente passou 4/4 e verifica os exemplos em português, os padrões de headers, HTML/SVG, BOM CSV e meta charset HTML.
- Os gates reportados no handoff passaram: focused 14/14, web:typecheck, web:build 945 módulos, lint 0 erros/160 warnings, review:gates, docs:validate, governance e git diff --check.
- Não houve chamada externa, leitura de secret, escrita em HubSpot/OMIE/produção, migration remota, deploy, push ou merge.

### Finding

#### F-UTF8-001 — MEDIUM — causa de transporte não está demonstrada pela regressão

- **Requisito:** reproduzir a corrupção, isolar a camada responsável e não tratar dependência externa como resolvida sem evidência.
- **Evidência:** `docs/reports/R1_UTF8_ENCODING_INTEGRITY_2026-08-21.md` classifica `application/json` sem charset como “causa corrigida”, mas também registra “sem falha reproduzida” em origem, serialização, HTML e renderização. O teste `tests/scripts/utf8-encoding-integrity.test.mjs` executa apenas `TextEncoder`/`TextDecoder` em memória e faz asserções estáticas sobre o texto-fonte dos headers; não invoca `jsonResponse`, não verifica `Response.headers` em runtime e não demonstra que o header anterior produzia mojibake no cliente.
- **Impacto:** o patch pode ser uma melhoria defensiva válida, porém o handoff não permite concluir que corrigiu a causa do incidente. A aceitação de diagnóstico causal e de prevenção de regressão permanece sem evidência executável.
- **Correção esperada:** adicionar uma reprodução determinística que execute a resposta compartilhada e valide corpo/headers no caminho real, incluindo o comportamento do consumidor afetado, ou reclassificar explicitamente a ausência de charset como hipótese/mitigação defensiva e registrar que a causa da corrupção continua não confirmada. Não declarar o incidente resolvido nem integração externa validada sem essa evidência.

### Veredito formal

`CHANGES_REQUESTED`.

A correção proposta é pequena, preserva o conteúdo e não apresenta regressão de CORS aparente, mas a evidência causal exigida pela TASK ainda não está fechada. `Owner = Forge` deve responder apenas F-UTF8-001 dentro da allowlist, preservar este REVIEW.md e devolver `STATUS.md` como `READY_FOR_REVIEW` para re-review.

## Re-review incremental — resposta a F-UTF8-001 — 2026-08-22

- **Reviewer:** Sentinel (Codex Independent Reviewer)
- **Estado revisado:** `READY_FOR_REVIEW`
- **Base SHA:** `5df3259`
- **Implementation SHA:** `UNCOMMITTED_WORKTREE`

F-UTF8-001 está resolvido. O relatório e `IMPLEMENTATION.md` agora classificam
explicitamente `charset=utf-8` como mitigação defensiva e hipótese de risco,
sem declarar causa confirmada ou incidente resolvido. Também registram que o
runner local não possui Deno e que o módulo depende de imports `jsr:`/`npm:` e
`Deno.env`; por isso não foi inventada uma simulação de `Response`, consumidor
ou runtime Edge. A limitação está coerente com a evidência disponível.

Validação independente: `node --test tests/scripts/utf8-encoding-integrity.test.mjs`
PASS, 4/4, e `git diff --check` PASS. Os gates anteriores de focused 14/14,
typecheck, build 945 módulos, lint, review:gates, docs:validate e governance
permanecem registrados no handoff, sem nova regressão observada. Não houve
chamadas externas, secrets, produção, HubSpot/OMIE, deploy, push ou merge.

### Veredito formal

`APPROVED`.

O lote entrega uma mitigação de transporte UTF-8 mínima, preserva caracteres
válidos e documenta honestamente que a causa do incidente permanece não
confirmada. `Owner = Forge` para finalização local autorizada, sem promoção,
arquivamento ou ações remotas por este reviewer.
