# RELEASE-04 — Validação local do motor HubSpot e Dashboard

## Escopo

Esta frente consolida o runner assíncrono de CS em um orquestrador comum do HubSpot. O mesmo parent run aceita os domínios `commercial` e `cs`, cria work items por objeto e pipeline, mantém checkpoints, leases, retries, staging e promoção somente após cobertura completa. OMIE permanece em função separada e não foi executado.

## Contrato

- `rpc_analytics_hubspot_start_run` inicia carga full ou incremental.
- A janela incremental usa o último sucesso persistido com sobreposição de cinco minutos.
- `rpc_analytics_hubspot_claim_work_item` adquire lease atômico.
- `rpc_analytics_hubspot_checkpoint_work_item` grava cursor, contadores, heartbeat e retry.
- `rpc_analytics_hubspot_finalize_run` promove deals e tickets de staging com upsert por ID HubSpot.
- `rpc_analytics_hubspot_abandon_stale_runs` encerra execução sem heartbeat sem avançar watermark.

## Divergência zero versus 5.829

No banco local reconstruído, as tabelas canônicas `hubspot_tickets` e `hubspot_deals` começam vazias; portanto o zero local é ausência de carga local, não zero operacional do HubSpot. O Dashboard CS lê `hubspot_tickets` através dos RPCs de snapshot e dos pipelines ativos em `analytics_source_config`. O valor 5.829 não está presente no banco local reconstruído e não foi fabricado nem atribuído a staging. A origem remota desse número permanece pendente de uma carga HubSpot autorizada; a arquitetura agora registra fonte, estado, cobertura e watermark para separar ausência, parcialidade e erro.

## Segurança e preservação

- A rota `hubspot-sync` foi reduzida a compatibilidade e somente inicia o orquestrador comum.
- O schedule chama o dispatcher comum para HubSpot; OMIE continua em chamada separada.
- Nenhuma permissão de `dashboard_viewer` ou contrato de ACCESS-01 foi alterado.
- Nenhum token, segredo, payload real ou dado operacional foi adicionado.
- Nenhum write remoto foi executado.

## Interface

O filtro extenso de pipelines foi substituído por um combobox reutilizável para Comercial e CS/Support, com Todos os pipelines, busca, seleção individual, estado visível e persistência somente na sessão por aba. Não houve redesign amplo.

## Limitações locais

Não houve carga real HubSpot, full ou incremental, por ausência de credencial autorizada no ambiente local. `supabase:verify` concluiu reset, pgTAP, import space-aware e lint; interrompeu no fixture autenticado por ausência de `LOCAL_QA_ADMIN_PASSWORD`. O browser smoke autenticado não foi executado pelo mesmo motivo. A validação real de volumes, duração, 5.829 e persistência remota fica para o gate remoto único, sem executar OMIE.
