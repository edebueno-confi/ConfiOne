# Continuidade OMIE, CS Ops e acesso restrito — 2026-07-20

## Contexto

O Claude concluiu a integração OMIE-HubSpot nos commits locais até `438f302`
e parou antes de remover a importação CS Ops da tela, investigar o timeout e
concluir a conta autenticada do usuário restrito.

## Decisões

### CS Ops

O HubSpot passa a ser a fonte operacional de CS. A planilha CS Ops não é mais
exibida como fonte de atualização na Configuração. O backend e o histórico de
staging permanecem preservados para auditoria e para a migração estrutural da
carteira, clusters e grupos econômicos, que continua como ciclo separado.

### Timeout

O fluxo de orquestração fazia atualizações de empresas no HubSpot de forma
sequencial. Cada chamada ainda podia executar retry/backoff; com 196 empresas,
isso podia exceder o limite do upstream da Edge Function.

Correção aplicada:

- timeout individual de 20 segundos em chamadas REST ao HubSpot;
- seis atualizações concorrentes por lote;
- `Promise.allSettled` para manter a contagem de sucessos e falhas;
- preservação do retry existente para 429/5xx;
- aplicação do mesmo limite no sincronizador direto de propriedades OMIE.

Nenhuma nova sincronização externa foi disparada durante esta correção.

### Usuário restrito

O contrato `dashboard_viewer` já restringe a navegação ao Dashboard, área do
cliente e central de ajuda. A concessão por e-mail de
`mauricio.baum@confi.com.vc` já está preparada no banco. A conta Auth real e a
senha não foram criadas neste ciclo, para não gravar credenciais nem bypassar
o fluxo seguro de convite.

## Validação

- typecheck e build devem ser executados após este lote;
- não houve escrita OMIE/HubSpot adicional;
- QA autenticado do usuário restrito permanece pendente;
- ativação do cron de produção continua dependente de `ANALYTICS_SYNC_SECRET`
  e infraestrutura autorizada.

## Próximos ciclos

1. Executar nova sincronização controlada OMIE-HubSpot e medir tempo total;
2. validar o fluxo do usuário restrito em sessão autenticada;
3. confirmar se o timeout desapareceu e registrar evidência;
4. retomar a replicação da estrutura CS Ops no HubSpot, sem reativar a planilha
   como fonte operacional;
5. só depois avaliar cron de produção sob os gates de secret/deploy.
