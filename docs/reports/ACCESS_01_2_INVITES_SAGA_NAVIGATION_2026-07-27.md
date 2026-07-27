# ACCESS-01.2 — Convites oficiais, saga de aceite e navegação contextual

## Escopo

Este lote conclui a camada operacional do control plane interno e a navegação contextual da Visão Executiva. Não altera HubSpot, OMIE, Knowledge, Taxonomia nem dados operacionais.

## Convites

- `internal-access-invite` é a única superfície de entrega.
- O navegador envia somente os metadados do convite; o hash efêmero é gerado no backend e apenas o hash é persistido.
- A entrega usa `auth.admin.inviteUserByEmail` com service role exclusivamente dentro da Edge Function.
- A resposta não devolve token, action link, credencial ou payload de Auth.
- Criação, reenvio, revogação e aceite são auditáveis e falham com mensagens sanitizadas.
- O limite local é de três tentativas por e-mail/IP em dez minutos; a entrega registra apenas estado e erro sanitizado.

## Saga de aceite

`rpc_accept_internal_invitation_by_id` valida a sessão Auth, e-mail, status, validade e contexto. Com lock da linha, materializa tenant interno, contexto de ator e membership de área de forma idempotente. Em falha após um usuário novo criado pela entrega, a Edge Function só compensa quando o `auth_user_id` pertence ao convite e não há contexto ou membership; usuários preexistentes nunca são removidos ou alterados.

## Último administrador

O advisory lock `gso:last-platform-admin`, triggers de perfil/papel e o comando de status impedem que a operação termine sem administrador de plataforma ativo. Alterações de status privilegiadas exigem justificativa não vazia e são aplicadas na mesma transação.

## Navegação do Dashboard

O estado canônico de URL aceita somente `tab`, `pipeline`, `from`, `to`, `status` e `owner`. Tabs válidas são `ceo`, `commercial`, `cs-support` e `finance`; o alias legado `cs` é normalizado. Datas inválidas, invertidas e identificadores fora do formato são normalizados/descartados. Links de domínio e pipelines preservam o período atual e permitem reload, histórico e compartilhamento sem SessionStorage como fonte de verdade.

## Validação local

- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:db:reset`
- `npm run supabase:test:db` — 86 arquivos / 1.390 testes
- `npm run supabase:lint:db` — sem erro; somente avisos históricos não relacionados
- testes Node de acesso, rotas CS e navegação — 23 casos, todos aprovados
- `npm run repository:check-root`
- `npm run local:qa:secret-scan` — zero ocorrências
- `git diff --check`

## Limitações conhecidas

Não foi enviado convite real porque nenhum e-mail operacional foi fornecido. O smoke autenticado local depende da estabilidade do PostgREST/Inbucket; não há evidência fabricada de entrega externa.
