# MVP Rollback Plan - 2026-05-24

## Objetivo

Definir como interromper ou reverter um piloto controlado do Genius Support OS MVP sem perder dados, sem destruir ambiente remoto e sem mascarar falha real.

Este plano e documental. Nenhum rollback foi executado nesta fase.

## Principios

- Preservar dados primeiro.
- Nunca apagar audit logs para "limpar" falha.
- Nunca resetar banco remoto.
- Nunca dropar schema sem backup e aprovacao explicita.
- Preferir rollback de frontend quando backend continuar compativel.
- Para migration irreversivel, interromper piloto e aplicar correção forward-only.

## Rollback de frontend

Use quando:

- erro e visual/comportamental;
- backend continua integro;
- contratos permanecem compativeis.

Passos:

1. Fechar acesso do piloto ou avisar janela de manutencao.
2. Reverter para o build anterior aprovado.
3. Validar login Admin, Support e Portal.
4. Validar `/help/genius`.
5. Validar que nenhum dado customer-facing vazou.
6. Registrar incidente e causa provavel.

## Rollback de migration

Use somente quando:

- migration foi aplicada em ambiente alvo;
- falha esta claramente associada a schema/contract;
- ha backup anterior e plano aprovado.

Passos seguros:

1. Congelar novas operacoes do piloto.
2. Gerar backup antes de qualquer acao.
3. Identificar migration exata e impacto.
4. Checar se a migration e reversivel sem perda de dados.
5. Se reversivel, aplicar migration de reversao revisada.
6. Se nao reversivel, aplicar fix forward.
7. Rodar testes e smoke critico.
8. Documentar incidente e decisao.

## Migration irreversivel

Se a migration removeu coluna/tabela, mudou tipo destrutivo ou transformou dados:

- nao tentar reconstruir manualmente sem backup;
- nao rodar `reset`;
- nao usar `drop` adicional;
- nao apagar usuarios/Auth;
- parar piloto;
- preservar snapshot atual;
- restaurar backup em ambiente separado para diagnostico;
- decidir entre restore completo ou migration forward-only.

## Como parar o piloto

1. Comunicar usuarios internos do piloto.
2. Suspender entrada de novos tickets pelo canal do piloto, se necessario.
3. Manter leitura do historico para suporte responsavel.
4. Registrar tickets afetados.
5. Manter audit logs e ticket events intactos.
6. Fechar loop com suporte/CS antes de reabrir.

## Preservacao de dados

Nunca apagar:

- `auth.users`;
- `profiles`;
- `tenant_memberships`;
- tickets;
- mensagens;
- notas internas;
- ticket events;
- audit logs;
- anexos/storage;
- delivery ledger;
- AI usage audit;
- internal actions;
- engineering work items.

## O que nunca fazer

- `supabase db reset` em remoto.
- `drop schema public cascade` em remoto.
- Apagar Auth/users para recuperar login.
- Remover bucket/storage sem backup.
- Limpar audit log.
- Alterar RLS em emergencia sem teste.
- Commitar secrets ou dumps para investigar.
- Fazer rollback por `git reset --hard` em branch compartilhada.

## Comunicacao de falha

Mensagem minima:

```text
Piloto pausado por instabilidade tecnica em validacao. Dados e historico foram preservados. O time esta analisando logs, eventos e audit trail. Avisaremos quando o fluxo estiver liberado novamente.
```

## Criterio para reabrir

- causa raiz identificada ou mitigada;
- gates tecnicos verdes;
- smoke critico verde;
- boundaries customer-facing revalidados;
- registro documental atualizado;
- aprovacao humana do responsavel de release.
