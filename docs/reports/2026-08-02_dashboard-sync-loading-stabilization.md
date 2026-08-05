# Estabilização do carregamento e sincronismo do Dashboard — 2026-08-02

## Objetivo

Manter o Gênio animado durante a atualização das bases e liberar a interface
somente depois de confirmar o estado publicado das fontes. O lote também registra
as pendências visuais adicionadas à fila, sem implementá-las neste ciclo.

## Diagnóstico

As ações de sincronização já estavam concentradas em Configurações e chamavam o
orquestrador real. O problema era de ciclo de vida da interface: depois de
enfileirar uma execução, a tela consultava o status uma única vez e encerrava o
estado ocupado antes de o ciclo e o read model publicado terminarem. Isso permitia
que o Dashboard parecesse pronto enquanto o processamento ainda estava `queued` ou
`running`.

O contrato atual continua sendo a fonte da verdade: HubSpot alimenta Comercial,
Customer Success e Suporte; OMIE alimenta Financeiro. Não foi criado polling de
provedor no frontend, não foram inventadas métricas e não foi executada nova
sincronização externa neste lote.

## Implementação

- `waitForAnalyticsSyncCompletion` consulta o RPC de estado das fontes e aguarda
  somente os estados ativos da origem solicitada (`queued`/`running`), com polling
  mínimo de 250 ms e timeout honesto de cinco minutos.
- `DashboardSourcesSettingsPage` mostra uma superfície bloqueante com o Gênio
  animado, texto de progresso, `role="status"`, `aria-live` e `aria-busy` durante
  toda a confirmação.
- Ao concluir, a UI recarrega catálogo, agenda e estado publicado antes de exibir
  a mensagem de sucesso. Se o limite de espera for atingido, informa que a
  atualização continua no servidor e orienta o acompanhamento pelo Histórico;
  não declara conclusão falsa.
- O estado visual é encerrado no bloco `finally`, inclusive em erro.
- Testes focados cobrem estados ativos, escopo por fonte, timeout e presença do
  overlay animado.

## Fila adicionada neste ciclo

- `DASHBOARD-05`: reconstrução HD da visão gerencial em
  `/admin/analytics?tab=ceo`, com cards padronizados e hierarquia executiva.
- `DASHBOARD-06`: mover a informação `Fonte financeira · Fonte: API OMIE` para o
  mesmo nível visual do cabeçalho `OMIE · Contas a Receber` na aba Financeiro.

Detalhamento persistido em `docs/UI_REFACTOR_BACKLOG.md` e `docs/plan.md`.

## Validação

### Validado

- 32 testes Node focados: aprovados.
- `npm run web:typecheck`: aprovado.
- `npm run contracts:typecheck`: aprovado.
- `npm run web:build`: aprovado; 830 módulos transformados.
- `git diff --check`: aprovado; apenas aviso de normalização CRLF/LF no backlog.
- `npm run local:qa:secret-scan`: 1.809 arquivos rastreados, zero correspondências.
- `npm run quality:changed`: aprovado, zero findings; lint não é configurado no
  `package.json`.
- QA visual empacotado em `http://127.0.0.1:4183`: 20 capturas em claro/escuro,
  desktop/mobile, sem erros de console, falhas de request, respostas inesperadas,
  overflow horizontal, contradições de status ou duplicidade de fonte.
- Manifesto: `output/dashboard-runtime-v3-preview/manifest.json`.

### Parcialmente validado

- O overlay foi validado por teste de contrato/estrutura, mas não foi ativado em
  navegador real nesta rodada. Ativá-lo executaria uma sincronização real; isso
  foi evitado porque o discovery autorizado exige investigação read-only antes de
  nova execução externa.

### Não validado / dependente de credencial externa

- Não houve nova execução HubSpot → OMIE neste lote.
- A disponibilidade do provedor OMIE continua uma dependência externa; o último
  ciclo persistido permanece parcial conforme o estado documentado anteriormente.
- Não houve migration remota, deploy, push, alteração de segredo ou reset do banco.

## Git

- Checkout canônico: `C:\Projetos\GSO-old`.
- Branch: `codex/dashboard-runtime-stabilization-20260802`.
- Antes do fechamento: `origin/main...HEAD = 0 115`.
- Ref de preservação do início do lote: `refs/archive/dashboard-discovery-start-20260803`.
- Stash existente preservado.

## Próximo lote recomendado

Executar o discovery HubSpot read-only autorizado, produzir as matrizes de
capacidade, propriedades, pipelines, cobertura e denominadores de Customer
Success, e só então decidir uma nova sincronização real. O redesign `DASHBOARD-05`
e o alinhamento `DASHBOARD-06` aguardam aprovação visual e devem ser executados em
lote separado.
