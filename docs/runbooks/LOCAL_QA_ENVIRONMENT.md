# Ambiente QA local

## Configuração

Copie `.env.local.qa.example` para `.env.local.qa` e preencha credenciais exclusivamente locais. O arquivo é ignorado pelo Git. Nunca reutilize essas credenciais em staging ou produção.

## Fluxo

```bash
npm run local:qa:reset
npm run local:qa:hydrate
npm run local:qa:verify
npm run local:qa:smoke
```

`local:qa:reset` é destrutivo e exige `ALLOW_LOCAL_DB_RESET=true` como confirmação separada. Ele inicia o Supabase local, executa o reset, hidrata e verifica. Não use esse comando para QA manual ou para preservar alterações. O arquivo de contas fica em `output/local-qa/accounts.txt` e não é versionado nem incluído no pacote técnico.

QA local, smoke e testes de leitura não exigem variável de autorização para reset. O banco em execução é preservado e as alterações feitas pelos testes manuais permanecem disponíveis para inspeção.

## Proteção contra remoto

O guard exige URL local em `localhost` ou `127.0.0.1` e banco local na porta 54322; rejeita project ref remoto antes de qualquer leitura, hidratação ou reset. Apenas o comando explicitamente destrutivo exige a confirmação `ALLOW_LOCAL_DB_RESET=true`.

## Cenários

```bash
npm run local:qa:scenario -- baseline
npm run local:qa:scenario -- empty
npm run local:qa:scenario -- partial
npm run local:qa:scenario -- stale
npm run local:qa:scenario -- unavailable
npm run local:qa:scenario -- zero-real
```

Todos alteram somente registros `local_qa`, não simulam sincronização externa e são revertidos com `npm run local:qa:hydrate`.

## Limites

Não executar `supabase db reset` contra projeto remoto. Não aplicar migrations remotas, não sincronizar HubSpot/OMIE e não usar secrets locais fora deste ambiente.
