# Ambiente QA local

## ConfiguraÃ§Ã£o

Copie `.env.local.qa.example` para `.env.local.qa` e preencha credenciais exclusivamente locais. O arquivo Ã© ignorado pelo Git. Nunca reutilize essas credenciais em staging ou produÃ§Ã£o.

## Fluxo

```bash
npm run local:qa:reset
npm run local:qa:hydrate
npm run local:qa:verify
npm run local:qa:smoke
```

`local:qa:reset` exige `ALLOW_LOCAL_QA_RESET=true`, inicia o Supabase local, executa o reset, hidrata e verifica. A hidrataÃ§Ã£o Ã© idempotente e os dados de negÃ³cio sÃ£o aplicados em uma transaÃ§Ã£o PostgreSQL Ãºnica. O arquivo de contas fica em `output/local-qa/accounts.txt` e nÃ£o Ã© versionado nem incluÃ­do no pacote tÃ©cnico.

## ProteÃ§Ã£o contra remoto

O guard exige URL local em `localhost` ou `127.0.0.1`, banco local na porta 54322 e confirmaÃ§Ã£o explÃ­cita; rejeita project ref remoto antes de qualquer reset ou hidrataÃ§Ã£o.

## CenÃ¡rios

```bash
npm run local:qa:scenario -- baseline
npm run local:qa:scenario -- empty
npm run local:qa:scenario -- partial
npm run local:qa:scenario -- stale
npm run local:qa:scenario -- unavailable
npm run local:qa:scenario -- zero-real
```

Todos alteram somente registros `local_qa`, nÃ£o simulam sincronizaÃ§Ã£o externa e sÃ£o revertidos com `npm run local:qa:hydrate`.

## Limites

NÃ£o executar `supabase db reset` contra projeto remoto. NÃ£o aplicar migrations remotas, nÃ£o sincronizar HubSpot/OMIE e nÃ£o usar secrets locais fora deste ambiente.