# Post-Recovery Baseline - 2026-06-09

## Resultado

O ambiente local do Genius Support OS foi restaurado apos a formatacao e voltou
a executar a baseline completa de Supabase. Nenhum deploy, migration remota,
alteracao de secret ou acesso a dados de producao foi realizado.

## Ambiente validado

- Repositorio: `C:\Projetos\Genius-Support-OS`
- Branch: `codex/mvp-operational-completion-goal`
- Docker Desktop: `4.77.0`
- Docker Engine: `29.5.3`
- WSL: `2.7.3`
- Node.js: `22.22.3`
- npm: `10.9.8`
- Supabase CLI: `2.105.0`

## Ajustes necessarios

- O Supabase CLI foi atualizado de `2.95.6` para `2.105.0`.
- Scripts locais passaram a resolver tanto o wrapper JavaScript atual quanto o
  binario legado do CLI, sem depender de caminho fixo no Windows.
- A fixture de suporte passou a reconciliar no banco escritas RPC com resultado
  HTTP ambiguo. A investigacao confirmou um `200` no Kong e o ticket persistido
  apesar de o cliente Node receber `UND_ERR_SOCKET`; a reconciliacao evita
  duplicacao e so repete quando a fonte de verdade confirma ausencia.

## Validacoes

- `npm run supabase:verify`: aprovado.
- Reset local: todas as migrations aplicadas.
- pgTAP: `51` arquivos e `1085` testes aprovados.
- `npm run supabase:lint:db`: aprovado, sem erro de schema.
- Verificador Octadesk space-aware: aprovado.
- Fixture administrativa local: aprovada.
- `npm run supabase:qa:local-functional-fixture`: aprovada em `558` segundos.
- Testes dos helpers locais: `6/6` aprovados.
- Sintaxe dos scripts alterados: aprovada por `node --check`.

## Observacoes

- `supabase_vector` continua reiniciando localmente, sem bloquear banco,
  PostgREST, Auth, Storage, Kong, fixtures ou pgTAP.
- As fixtures imprimem credenciais exclusivamente locais no terminal. Nenhum
  valor foi registrado neste relatorio.
- A baseline confirma o ambiente de desenvolvimento local; nao constitui
  autorizacao para staging ou producao.
