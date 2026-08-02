# Backlog executável — Macro-lote Analytics 0.4+

Este backlog substitui a ideia de expandir o painel por cópia de release. A
fonte de trabalho continua sendo `C:\Projetos\GSO-old`, com alterações pequenas
e commits auditáveis.

## Lote A — fechamento do Dashboard atual

- [x] centralizar ações de sincronização em Configurações;
- [x] retirar o snapshot executivo da aba própria de Customer Success;
- [x] publicar Financeiro somente com OMIE API;
- [ ] executar QA autenticado em 4173 e capturar superfícies reais;
- [ ] revisar o editor legado e remover caminhos não utilizados em lote isolado.

Gate: typecheck, build, suíte de contratos, secret scan, evidência visual
autenticada e status Git limpo ou explicitamente inventariado.

## Lote B — contrato de Customer Success

- [ ] definir fonte canônica de carteira e owner;
- [ ] definir health score, componentes, versão e frescor;
- [ ] criar read model/RPC com tenant/RLS/permissões/auditoria;
- [ ] criar pgTAP e fixture sem usar tickets como proxy;
- [ ] só então substituir o estado indisponível da aba.

## Lote C — conversas de suporte

- [ ] confirmar escopos e produto HubSpot autorizado;
- [ ] mapear inbox/canal/thread/mensagem/ator;
- [ ] definir deduplicação, cursor, retenção e correlação opcional com ticket;
- [ ] implementar ingestão server-side e read model;
- [ ] publicar métricas após QA de isolamento.

## Lote D — Comercial drill-down

- [ ] auditar associações Deal ↔ Company;
- [ ] criar contrato paginado por deal;
- [ ] implementar filtro/ordenação no backend;
- [ ] gerar link contextual validado do portal HubSpot;
- [ ] capturar QA de desktop e viewport estreito.

## Lote E — matching HubSpot ↔ OMIE

- [ ] obter carga OMIE autorizada e executar somente análise agregada;
- [ ] revisar duplicidades e amostra de candidatos;
- [ ] definir limiares e fila humana;
- [ ] alinhar `rpc_analytics_finance_unmatched_clients` ao OMIE-only;
- [ ] criar ledger e rollback lógico antes de qualquer escrita externa.

## Lote F — operação e release

- [ ] validar Edge Functions localmente com processo separado;
- [ ] validar scheduler e secrets somente com autorização;
- [ ] atualizar handoff e ledger;
- [ ] commit separado por domínio;
- [ ] não executar push/deploy sem Product Owner.
