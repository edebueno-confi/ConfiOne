# Backlog Executavel

Este backlog usa tarefas pequenas, auditaveis e orientadas a agente.

## Padrao de tarefa

Cada tarefa deve ter:

- objetivo;
- arquivos provaveis;
- criterio de aceite;
- validacao minima;
- condicao de parada.

## EPIC A: fundacao

### A1. Criar projeto base

Objetivo:

Criar workspace limpo para o novo MVP.

Arquivos provaveis:

- `README.md`
- `AGENTS.md`
- `package.json`
- `apps/web/*`
- `supabase/*`
- `docs/PROJECT_STATE.md`

Aceite:

- app inicial renderiza;
- scripts existem;
- docs iniciais existem.

Validacao:

- `npm install`
- `npm run web:typecheck`
- `npm run web:build`

Parar se:

- exigir secret real ou deploy.

### A2. Criar identidade e tenancy

Objetivo:

Criar base segura de usuario, cliente e audit.

Arquivos provaveis:

- `supabase/migrations/*identity_tenancy*.sql`
- `supabase/tests/*identity_tenancy*.sql`
- `packages/contracts/src/*`

Aceite:

- RLS ativa;
- cliente isolado;
- audit log criado.

Validacao:

- `npm run supabase:db:reset`
- `npm run supabase:test:db`
- `npm run contracts:typecheck`

Parar se:

- precisar migracao remota.

### A3. Criar redirect por papel

Objetivo:

Levar cada usuario ao workspace autorizado.

Arquivos provaveis:

- `apps/web/src/features/auth/*`
- `apps/web/src/app/router.tsx`
- `tests/scripts/*route-access*.test.mjs`

Aceite:

- admin -> Admin;
- suporte -> Support;
- cliente -> Portal;
- area -> Acionamentos;
- sem acesso -> Access Denied.

Validacao:

- teste unitario de rotas;
- `npm run web:typecheck`;
- `npm run web:build`.

## EPIC B: Knowledge/Public Help

### B1. Modelar Knowledge

Objetivo:

Criar categorias, artigos, revisoes, fontes e views publicas.

Aceite:

- artigo publicado/publico aparece em view publica;
- draft/restricted/internal nao aparece.

Validacao:

- pgTAP de visibilidade;
- typecheck de contratos.

### B2. Importar corpus OctaDesk como rascunho

Objetivo:

Usar `raw_knowledge/octadesk_export/latest` como fonte inicial.

Aceite:

- 58 artigos reconhecidos;
- source path/hash preservados;
- nenhum artigo publicado automaticamente.

Validacao:

- teste de import dry-run;
- relatorio de contagem.

### B3. Criar UI Public Help

Objetivo:

Criar rotas publicas de central, lista, busca e artigo.

Aceite:

- usuario anonimo acessa artigos publicados;
- busca textual funciona;
- artigo ausente mostra estado seguro.

Validacao:

- `npm run web:typecheck`;
- `npm run web:build`;
- QA browser desktop/mobile.

## EPIC C: Portal cliente

### C1. Modelar ticket customer-facing

Objetivo:

Criar tickets, mensagens, eventos e views customer-facing.

Aceite:

- customer_user ve somente tickets permitidos;
- nota interna nao existe no read model customer-facing.

Validacao:

- pgTAP cross-tenant;
- teste anti-leak.

### C2. Criar abertura de demanda

Objetivo:

Cliente abre demanda no portal.

Aceite:

- ticket criado por RPC;
- evento criado;
- suporte consegue ler na fila.

Validacao:

- pgTAP da RPC;
- QA browser.

### C3. Criar detalhe e resposta do cliente

Objetivo:

Cliente acompanha timeline e responde.

Aceite:

- resposta do cliente aparece para suporte;
- ticket fechado bloqueia resposta se regra exigir.

Validacao:

- teste de status;
- `npm run web:build`.

## EPIC D: Support

### D1. Criar fila de suporte

Objetivo:

Suporte ve demandas autorizadas.

Aceite:

- lista filtra por tenant permitido;
- estados vazio/loading/erro existem.

Validacao:

- pgTAP de acesso;
- QA browser.

### D2. Criar workspace do ticket

Objetivo:

Suporte trata uma demanda.

Aceite:

- resposta publica;
- nota interna;
- status;
- atribuicao;
- contexto do cliente.

Validacao:

- typecheck;
- build;
- pgTAP de RPCs;
- QA browser fluxo completo.

### D3. Criar encerramento/reabertura

Objetivo:

Controlar ciclo de vida basico.

Aceite:

- fechamento exige motivo;
- reabertura respeita status permitido;
- cliente ve label segura.

Validacao:

- pgTAP de transicao;
- teste de UI.

## EPIC E: Evidencias

### E1. Criar storage seguro

Objetivo:

Suportar anexos de ticket.

Aceite:

- bucket privado;
- URL temporaria;
- metadata sanitizada.

Validacao:

- teste de policy;
- teste cross-tenant;
- QA upload/download.

## EPIC F: Acionamentos internos

### F1. Criar area e membership

Objetivo:

Permitir fila por area interna.

Aceite:

- usuario ve apenas areas autorizadas;
- admin gerencia membership.

Validacao:

- pgTAP;
- route-access test.

### F2. Criar acionamento a partir do ticket

Objetivo:

Suporte pede ajuda a uma area.

Aceite:

- acionamento vinculado ao ticket;
- area recebe;
- cliente nao ve.

Validacao:

- pgTAP anti-leak;
- QA browser.

### F3. Criar retorno da area

Objetivo:

Area devolve resposta ao suporte.

Aceite:

- suporte ve retorno;
- suporte pode pedir complemento ou fechar;
- retorno nao vira mensagem publica automaticamente.

Validacao:

- pgTAP;
- QA fluxo completo.

## EPIC G: Admin minimo

### G1. Admin clientes

Objetivo:

Gerir clientes B2B.

Aceite:

- criar/editar/arquivar cliente via RPC;
- audit log.

### G2. Admin acessos

Objetivo:

Gerir usuarios e memberships.

Aceite:

- adicionar usuario a cliente;
- adicionar usuario a area;
- bloquear autopromocao indevida.

### G3. Admin Knowledge

Objetivo:

Gerir artigos.

Aceite:

- draft -> review -> published;
- published public aparece na central;
- archive remove da central.

## EPIC H: piloto e continuidade

### H1. Fixture funcional

Objetivo:

Criar massa local idempotente.

Aceite:

- admin, suporte, area e cliente existem;
- fluxo completo pode rodar.

### H2. Smoke ponta a ponta

Objetivo:

Validar MVP real.

Aceite:

- cliente abre;
- suporte responde;
- suporte aciona area;
- area retorna;
- suporte responde cliente;
- cliente confirma.

### H3. Relatorio de ciclo

Objetivo:

Registrar evidencia e proximo passo.

Aceite:

- docs atualizadas;
- validacoes listadas;
- riscos registrados.
