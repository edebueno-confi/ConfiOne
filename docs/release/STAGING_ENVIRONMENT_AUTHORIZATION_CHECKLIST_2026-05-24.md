# Staging Environment Authorization Checklist - 2026-05-24

## Objetivo

Registrar a autorizacao humana minima antes de qualquer dry run remoto em staging do MVP. Este documento nao autoriza producao, cliente real, `db push`, migration remota, secrets, seed remoto ou deploy remoto por si so.

## Decisao humana

| Campo | Valor |
| --- | --- |
| Nome do ambiente | Pendente |
| URL da aplicacao staging | Pendente |
| Supabase project ref staging | Pendente |
| Confirmacao de que NAO e producao | Pendente |
| Responsavel pela autorizacao | Pendente |
| Data/hora | Pendente |
| Comandos autorizados | Pendente |
| Comandos proibidos | Ver lista padrao abaixo |
| Uso de dados reais | Proibido |
| Uso de dados sinteticos | Permitido somente se massa QA staging for propria do ambiente |
| Rollback aprovado | Pendente |
| Observabilidade disponivel | Pendente |
| Decisao | Bloqueado ate preenchimento e aprovacao |

## Comandos proibidos por padrao

- `supabase db reset` contra remoto.
- `drop` remoto.
- `truncate` remoto.
- `delete` em massa.
- seed remoto com dados reais.
- `supabase db push --linked` sem autorizacao explicita para essa janela.
- migration remota sem checklist humano.
- criacao ou alteracao de secrets.
- deploy de producao.
- criacao de provider externo.
- ativacao de IA real.

## Comandos que podem ser autorizados em staging

Somente apos preenchimento da tabela de decisao humana:

- build local;
- smoke HTTP de URL staging;
- health check nao destrutivo;
- leitura de rotas publicas;
- login com usuarios QA proprios de staging;
- validacao nao destrutiva de rotas privadas.

## Evidencia exigida antes de executar remoto

- URL staging registrada.
- Supabase project ref staging registrado.
- Confirmacao explicita de que o project ref nao e producao.
- Credenciais QA staging proprias do ambiente.
- Lista de comandos permitidos para a janela.
- Plano de rollback lido e aceito.
- Observabilidade minima conhecida.
- Responsavel humano nomeado.

## Status P4-E

Bloqueado para execucao remota. O repositorio nao contem ambiente staging explicitamente configurado nem autorizacao humana preenchida.
