# Buildout Status Checkpoint V3

## RELEASE-01 — encerramento do desenvolvimento — 2026-07-24

- concluídos no escopo de desenvolvimento: PILOT da Central, KNOWLEDGE-01, KNOWLEDGE-01.1, TAXONOMY-01, TAXONOMY-01.1, assets, editorial, busca, navegação, responsividade, acessibilidade, CTA `/portal` e preparação técnica da release;
- estado da release: `PR criado — aguardando revisão, merge e deploy`; produção ainda não validada;
- próxima frente: `DASHBOARD-02 — Evolução do Dashboard Gerencial`, sem implementação neste ciclo;
- pendências independentes: KNOWLEDGE-02, restritos, 29 assets, drift de migration, erro UUID/`true`, merge, deploy e smoke de produção.

## Objetivo
Registrar o estado atual do Genius Support OS apos os blocos recentes de tickets, SLA, evidencias, handoff, engenharia, governanca e readiness do portal cliente B2B.

Este checkpoint nao implementa produto novo. Ele organiza o que esta pronto, parcial, bloqueado e os proximos blocos grandes recomendados.

## Pronto
- Intake operacional de tickets por `rpc_create_ticket`.
- Fila de suporte conectada a read models reais.
- Ticket Workspace com timeline, composer, notas internas, status, atribuicao, classificacao, prioridade/severidade e SLA interno.
- Evidencias/anexos com bucket privado, metadata sanitizada, upload governado e download temporario.
- Handoff tecnico real por `engineering_work_items` e `engineering_ticket_links`.
- Engineering Workspace com fila, detalhe, ownership, status tecnico, update estruturado e retorno ao suporte.
- Customer Account Profile operacional como contexto B2B interno.
- Knowledge Admin Governance com gate de publicacao publica e bloqueio de drafts/internos/restritos no Help Center.
- Access/System hardening com read models reais, audit feed sanitizado e checks administrativos.
- Politicas de SLA por tenant com fallback global e calendario MVP como metadata.
- Blueprint do futuro portal cliente B2B, sem UI fake.

## Parcial
- SLA por calendario de negocio: calendario existe como metadata, mas ainda nao calcula horario util/feriado.
- Pausa de SLA: nao implementada por falta de regra objetiva de produto.
- Arquivamento de evidencias: upload/download existem; archive seguro ainda precisa RPC propria.
- Admin UI de SLA policies: RPC/read model existem, mas nao ha UI administrativa dedicada.
- Public Help: funciona para conteudo publico real, mas nao deve usar candidatos documentais pendentes.
- Customer portal: blueprint existe; contratos e UI ainda nao foram criados.
- Suporte operacional: usabilidade foi saneada, mas densidade/rail podem precisar ajuste apos uso real.

## Bloqueado
- Notificacoes externas de SLA ou breach: dependem de produto, canal e contrato real.
- Scan/antivirus de anexos: fora do escopo ate existir decisao tecnica real.
- Omni Inbox: registrado como futuro, nao autorizado para implementacao.
- IA operacional: nao autorizada como source of truth e fora do corte atual.
- Portal cliente B2B funcional: bloqueado ate auth/tenancy customer-facing e contratos `customer_portal_*`.
- Exposicao publica de candidatos da Knowledge: bloqueada ate decisao/validacao governada.

## Proximos 5 blocos grandes recomendados
1. `Customer Portal Contract Foundation V3`: criar auth/tenancy customer-facing, read models customer portal e testes de vazamento antes de qualquer UI.
2. `Ticket Evidence Retention And Archive V3`: arquivamento seguro de evidencias, retencao/expurgo e auditoria sem expor storage path.
3. `Business Calendar SLA Calculation V3`: aplicar horario util/feriados ao calculo backend de SLA, mantendo fallback seguro.
4. `Admin SLA Policy Console V3`: UI administrativa minima para policies/calendarios usando RPCs existentes e auditoria.
5. `Support Operational Regression Pack V3`: consolidar testes E2E/visual de fila, intake, ticket, evidencias, handoff, SLA e engenharia.

## Riscos arquiteturais
- Criar portal cliente antes de auth/RLS customer-facing pode abrir risco cross-tenant.
- Expor SLA ao cliente sem contrato pode transformar governanca interna em promessa publica indevida.
- Reaproveitar views internas no portal pode vazar notas, handoff, auditoria ou contexto sensivel.
- Crescer Engineering Workspace em direcao a Jira fake pode inflar escopo e confundir ownership.
- Implementar IA/Omni Inbox antes dos contratos basicos estabilizados pode deslocar source of truth para camada assistiva.

## Riscos de UX
- Rail do ticket pode ficar sobrecarregado com SLA, anexos, handoff, cliente e Knowledge.
- Mensagens de estado precisam continuar em PT-BR operacional, sem termos de implementacao.
- Fila precisa seguir dominante; atalhos e filtros nao podem roubar espaco da lista.
- Acoes indisponiveis devem continuar explicitas, mas sem parecer erro tecnico.
- Customer portal futuro deve ser simples e seguro, nao uma copia reduzida do cockpit interno.

## Riscos de seguranca
- Storage seguro ainda precisa politica de retencao e archive.
- Signed URLs devem permanecer temporarias e nunca persistidas.
- Audit logs e eventos internos nao podem aparecer no portal cliente.
- Admin actions continuam exigindo audit trail; nenhum bypass de platform admin sem registro.
- Qualquer contrato customer-facing precisa testes de cross-tenant e DML direto bloqueado desde o primeiro corte.

## Pendencias de produto
- Definir se SLA pode ser visto pelo cliente B2B e em qual linguagem.
- Definir papeis customer-facing: solicitante, gestor, viewer, aprovador ou outro.
- Definir regra objetiva de pausa de SLA.
- Definir canais reais de notificacao externa, se existirem.
- Definir politica de retencao/expurgo de evidencias.
- Definir quando retomar publicacao governada dos candidatos de Knowledge.

## Estado final deste checkpoint
O produto esta mais proximo de um cockpit interno utilizavel para suporte/CS/admin tecnico. O proximo salto seguro nao e IA nem Omni Inbox; e fechar a fundacao customer-facing ou hardening operacional complementar com contratos reais.
