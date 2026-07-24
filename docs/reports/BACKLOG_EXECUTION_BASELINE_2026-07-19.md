# Baseline de execução do backlog — 2026-07-19

## Resultado

- `npm run web:typecheck`: passou.
- `npm run web:build`: passou; permanece apenas o warning conhecido de chunks
  acima de 500 kB.
- `npm run supabase:test:db`: passou após as correções deste ciclo; 60 arquivos,
  1.154 testes.
- Teste dedicado OMIE: 5 testes passaram.
- A migration `20260720015816_fix_dashboard_viewer_trigger_acl.sql` foi aplicada
  no banco local.

## Causas corrigidas

1. A função trigger `app_private.apply_dashboard_viewer_email_grant` não tinha
   ACL explícita. Foi revogado o acesso de papéis públicos e concedida execução
   apenas ao `service_role`.
2. O teste de pipelines ainda esperava uma única fonte CS e rejeitava o pipeline
   Aftersale. O contrato atual é multi-pipeline; o teste agora verifica os seis
   pipelines ativos e a presença das fontes operacional e Aftersale.
3. O teste de risco usava helpers `has_table`/`has_column` de forma incompatível
   com o ambiente pgTAP atual. As asserções foram substituídas por consultas de
   catálogo equivalentes, preservando o comportamento verificado.
4. O parser OMIE tratava ponto decimal como separador de milhar e a consulta não
   tinha timeout/retry. A normalização e a resiliência foram corrigidas com testes
   de regressão.

## Limites

- Nenhuma credencial OMIE foi criada, lida ou armazenada.
- Nenhuma migration remota, deploy ou escrita externa foi executada.
- O próximo passo do ciclo OMIE depende apenas da configuração segura da chave;
  o contrato local já está preparado para validação autenticada.
