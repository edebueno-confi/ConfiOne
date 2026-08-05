# Adendo de verificação visual, QA autenticado e acesso inicial

Data: `2026-08-03`

## Conclusão objetiva

Os apontamentos do Product Owner sobre o cabeçalho da Visão Geral não foram
ignorados no código atual, mas o fechamento anterior confundiu validação
estrutural com aprovação estética e deixou capturas históricas misturadas às
evidências recentes.

As capturas atuais de `03/08/2026` comprovam:

- estado das fontes no lado esquerdo do cabeçalho executivo;
- título e contexto no centro;
- ação `Sincronizar bases` à direita;
- ausência da faixa global redundante sobre os filtros;
- log de execução do HubSpot no cabeçalho de Comercial;
- origem e log de execução do OMIE no cabeçalho de Financeiro;
- título da Visão Geral dentro da escala high-density, sem o tamanho
  maximalista do baseline anterior.

Evidências recentes:

- `output/local-qa/browser-platform_admin-desktop.png`;
- `output/local-qa/browser-platform_admin-mobile.png`;
- `output/playwright/analytics-route-overview-desktop.png`;
- `output/playwright/analytics-route-commercial-desktop.png`;
- `output/playwright/analytics-route-finance-desktop.png`.

As imagens em `docs/reports/visual-audit/screenshots/` devem ser tratadas como
baseline/histórico do lote anterior, não como captura atual da implementação.

## Correção encontrada fora do design

O fluxo pós-login tratava `/inicio` como rota publicada, embora o manifesto de
release defina `/inicio -> /admin/analytics` como redirecionamento técnico. Por
isso, um administrador válido podia cair em `/access-denied` ao usar esse
entrypoint.

Correção aplicada em `post-login-redirect.ts`: o alvo técnico é normalizado
antes da verificação de permissão, preservando query string. O smoke test foi
alinhado ao release vigente: administrador e viewer entram no Dashboard;
Suporte e Portal continuam `access-denied` esperado enquanto não publicados.

## QA autenticado executado

`npm run local:qa:smoke` passou com 10/10 combinações de persona/viewport:

- platform admin: Dashboard desktop/mobile;
- dashboard viewer: Dashboard desktop/mobile;
- support manager/agent: acesso negado esperado desktop/mobile;
- customer user: acesso negado esperado desktop/mobile.

Todos os casos reportaram zero erros de console, zero page errors, zero falhas
de requisição e zero respostas inesperadas.

## Estado real do ciclo HubSpot → OMIE

Leitura read-only do Supabase local:

- último ciclo: `succeeded`, resultado `success`, concluído em cerca de 191 s;
- HubSpot: execução incremental, 5.858 registros normalizados/promovidos,
  93 páginas, 38 pipelines, watermark avançado;
- OMIE: 3.463 recebíveis aceitos/promovidos, 35 páginas, zero rejeições;
- nenhum ciclo ativo ficou pendurado após a execução mais recente;
- agendamento local está `enabled=true`, `frequency=hourly`, mas os campos
  específicos de HubSpot estão desligados no fixture atual.

Limitações que permanecem:

- a execução observada usa o ambiente local com credenciais já configuradas no
  runtime; não é prova de uma nova execução externa autorizada nesta sessão;
- `analytics_sync_request_attempts` está sem linhas no banco local, portanto a
  telemetria de chamadas/retries ainda não foi comprovada no runtime atual,
  apesar de o buffer e os handlers existirem no código;
- o script `local:qa:verify` permanece incompatível com o estado persistido,
  pois espera `schedules_off=1` e encontra `0`; não foi feito reset nem escrita
  para forçar o fixture.

## Arquivos alterados neste adendo

- `apps/web/src/features/auth/post-login-redirect.ts`;
- `scripts/local-qa/browser-smoke.mjs`;
- `tests/scripts/release-surface.test.mjs`;
- este relatório.

Nenhuma credencial, migration, RPC, view, RLS, dado do banco ou integração
externa foi alterado.
