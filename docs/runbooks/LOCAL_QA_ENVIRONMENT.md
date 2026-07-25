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

`local:qa:reset` exige `ALLOW_LOCAL_QA_RESET=true`, inicia o Supabase local, executa o reset, hidrata e verifica. A hidratação é idempotente e os dados de negócio são aplicados em uma transação PostgreSQL única. O arquivo de contas fica em `output/local-qa/accounts.txt` e não é versionado nem incluído no pacote técnico.

## Proteção contra remoto

O guard exige URL local em `localhost` ou `127.0.0.1`, banco local na porta 54322 e confirmação explícita; rejeita project ref remoto antes de qualquer reset ou hidratação.

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