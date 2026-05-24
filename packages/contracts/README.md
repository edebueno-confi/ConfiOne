# packages/contracts

Pacote tipado que materializa o contrato público entre backend e futuras camadas consumidoras.

## Regra

- O pacote descreve tipos, payloads, responses e read models.
- O pacote não implementa regra de negócio.
- O banco, as views e as RPCs continuam sendo a fonte da verdade.

## Estado atual

Fase 2.1 entregue:
- contratos de ticketing materializados em TypeScript;
- validação local por `tsc`;
- workflow CI validando `contracts:typecheck` antes da suíte de banco.

Fase 6.1 entregue:
- contratos tipados do Support Workspace materializados sobre os read models de suporte;
- pacote agora cobre fila, detalhe, timeline e customer 360 sem expor tabelas-base;
- authz do workspace ficou explicitamente restrito a `platform_admin`, `support_agent` e `support_manager` com membership ativo no tenant.

Fase P3 entregue:
- contratos tipados da fundacao AI-native operacional;
- tipos de source policies, action policies, readiness e usage audit;
- payloads/responses das RPCs `rpc_ai_validate_context_access`, `rpc_ai_log_usage_event` e `rpc_ai_register_human_review_decision`;
- nenhuma integracao com LLM, provider, embedding ou vector database.

## Estrutura atual

- [package.json](/C:/Trabalho/packages/contracts/package.json)
- [tsconfig.json](/C:/Trabalho/packages/contracts/tsconfig.json)
- [src/index.ts](/C:/Trabalho/packages/contracts/src/index.ts)
- [src/ticketing.ts](/C:/Trabalho/packages/contracts/src/ticketing.ts)

## Exportações de ticketing

Enums/literals:
- `TicketStatus`
- `TicketPriority`
- `TicketSeverity`
- `TicketSource`
- `TicketMessageVisibility`
- `TicketEventType`

Views:
- `TicketListItem`
- `TicketDetail`
- `TicketTimelineItem`
- `SupportTicketQueueItem`
- `SupportTicketDetail`
- `SupportTicketTimelineItem`
- `SupportCustomer360`

RPC payloads e responses:
- `RpcCreateTicketPayload`
- `RpcCreateTicketResponse`
- `RpcUpdateTicketStatusPayload`
- `RpcUpdateTicketStatusResponse`
- `RpcAssignTicketPayload`
- `RpcAssignTicketResponse`
- `RpcAddTicketMessagePayload`
- `RpcAddTicketMessageResponse`
- `RpcAddInternalTicketNotePayload`
- `RpcAddInternalTicketNoteResponse`
- `RpcCloseTicketPayload`
- `RpcCloseTicketResponse`
- `RpcReopenTicketPayload`
- `RpcReopenTicketResponse`

## Validação

```bash
npm run contracts:typecheck
```

## Limites deliberados

- Ainda não existe geração automática a partir do schema do Supabase.
- Ainda não existe pacote compilado para distribuição externa.
- O pacote já cobre contratos de suporte, portal, engenharia, internal actions, customer account, comunicação/delivery/readiness e AI-native readiness; nem todo domínio possui cliente externo publicado.
- Qualquer mudança em view ou RPC deve vir acompanhada de atualização deste pacote e de teste.
