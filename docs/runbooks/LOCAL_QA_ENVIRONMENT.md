# Ambiente QA local

## Pré-requisitos

- Windows com Docker em execução.
- Dependências do monorepo instaladas.
- Supabase CLI disponível pelo workspace.
- Nenhum projeto remoto linkado para este fluxo.

## Configuração

Copie `.env.local.qa.example` para `.env.local.qa` e preencha as credenciais exclusivamente locais. O arquivo é ignorado pelo Git. Nunca reutilize essas credenciais em staging ou produção.

## Fluxo recomendado

```bash
npm run local:qa:reset
npm run local:qa:hydrate
npm run local:qa:verify
npm run local:qa:smoke
```

`local:qa:reset` exige `ALLOW_LOCAL_QA_RESET=true`, inicia o Supabase local, executa o reset, hidrata e verifica. A hidratação é idempotente. O arquivo local de contas fica em `output/local-qa/accounts.txt` e não é versionado nem incluído no pacote técnico.

## Proteção contra remoto

O guard exige URL local em `localhost` ou `127.0.0.1`, banco local na porta 54322, confirmação explícita e rejeita project ref remoto. Ele falha antes de iniciar qualquer reset ou hidratação.

## Cenários

`npm run local:qa:scenario -- baseline` confirma o baseline hidratado. Os cenários empty, partial, stale, unavailable e zero-real ainda não possuem contrato isolado seguro sem alterar dados de negócio; permanecem backlog e não são simulados por gambiarra.

## Solução de erros

- Docker indisponível: iniciar Docker e repetir `local:qa:reset`.
- Ambiente ambíguo: remover variáveis `SUPABASE_URL`, `SUPABASE_PROJECT_REF` e `PROJECT_REF` remotas.
- Base fora do baseline: repetir `local:qa:reset`.
- Falha de Auth local: confirmar que o Supabase local está pronto e que as variáveis do arquivo ignorado estão preenchidas.

## Limpeza

O reset local recria o schema e os dados. Não execute `supabase db reset` contra projeto remoto. Não aplique migrations remotas, não sincronize HubSpot/OMIE e não use secrets locais fora deste ambiente.
