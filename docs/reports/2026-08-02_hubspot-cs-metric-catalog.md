# Catálogo de métricas de CS — estado do discovery

Este catálogo descreve o que pode ser calculado com evidência atual. Ele não é
uma autorização para implementar ou selecionar propriedades.

| Área | Métrica | Fonte candidata | Estado | Bloqueio |
| --- | --- | --- | --- | --- |
| Base | total de Companies | Companies | `AVAILABLE` | não representa CS |
| CS | clientes ativos | marca/status/CSM/MRR | `AVAILABLE_WITH_LIMITATIONS` | denominadores conflitantes |
| CS | cobertura por responsável | CSM owner | `AVAILABLE_WITH_LIMITATIONS` | carteira ainda não definida |
| Comercial | negócios, ganhos e receita | Deals, pipeline, stage, amount | `AVAILABLE_WITH_LIMITATIONS` | pipelines legados e seleção de escopo |
| Suporte | tickets totais/abertos/encerrados | Tickets, pipeline, stage | `AVAILABLE_WITH_LIMITATIONS` | classificação de domínio pendente |
| Suporte | prioridade e SLA | priority e campos SLA | `AVAILABLE_WITH_LIMITATIONS` | estágio/semântica de SLA incompletos |
| Chat | volume de conversas | Conversations/Inbox/Messages | `PRODUCT_NOT_AVAILABLE` no conector atual | `source_type=CHAT` é apenas sinal |
| Feedback | NPS/CSAT/CES | Feedback/Survey ou propriedades Ticket | `AVAILABLE_WITH_LIMITATIONS` | endpoint autoritativo não exposto |
| Retenção | churn e retenção | status/churn/renewal em Companies/Deals | `AVAILABLE_WITH_LIMITATIONS` | definição temporal e denominador |
| Contratos | renovação/MRR | campos Companies/Deals | `AVAILABLE_WITH_LIMITATIONS` | propriedades concorrentes e qualidade |
| Frescor | data do snapshot publicado | read models GSO | `AVAILABLE` | depende de execução registrada |
| Atividades | contatos, tarefas e reuniões | CRM activities | `AVAILABLE_WITH_LIMITATIONS` | associação e atribuição não fechadas |

## Alternativas de denominador para decisão do PO

1. **Cliente marcado:** `e_cliente_aftersale_ = Sim`; 264 Companies.
2. **Cliente por status:** `status_do_cliente___aftersale = Cliente`; 320.
3. **Carteira atribuída:** `csm_owner___aftersale` preenchido; 299.
4. **Cliente com sinal financeiro:** `aftersale___mrr > 0`; 251.
5. **Interseção conservadora:** marca + CSM; 99.
6. **Interseção financeira:** status Cliente + MRR positivo; 205.

As contagens são snapshot de discovery e devem ser recalculadas por read model
quando o contrato for escolhido. Nenhuma alternativa deve ser combinada
silenciosamente.

## Regras de honestidade

- Sem fonte ou sem execução válida, exibir `Indisponível`.
- Não chamar catálogo de Companies de carteira de clientes.
- Não chamar Ticket com `source_type=CHAT` de conversa confirmada.
- Não calcular retenção, churn ou CSAT como fato apenas porque existem campos.
- Persistir origem, timestamp, recorte, denominador e status de frescor junto ao
  read model que alimentar a interface.
