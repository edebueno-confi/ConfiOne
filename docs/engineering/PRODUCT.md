# ConfiOne, regras de produto observáveis

## Regra de leitura

Este documento consolida regras verificáveis em código e documentação. Não converte
todo comportamento atual em decisão de produto. A classificação abaixo separa regra
confirmada, comportamento observado e decisão ainda não documentada.

## Regras confirmadas

| Regra | Evidência principal |
| --- | --- |
| Backend é a fonte da verdade | docs/ARCHITECTURE_RULES.md, contratos, views, RPCs e migrations |
| Dados operacionais respeitam tenant, RLS, autorização e auditoria | docs/AUTH_CONTEXT_STRATEGY.md, docs/AUDIT_LOGGING_STRATEGY.md, migrations e pgTAP |
| O frontend não calcula permissão, SLA, status, prioridade, elegibilidade ou visibilidade | docs/ARCHITECTURE_RULES.md |
| Dados ausentes são exibidos como indisponíveis, nunca simulados | docs/ARCHITECTURE_RULES.md, contratos de read model e testes de qualidade |
| IA é assistente operacional e não fonte decisória | docs/AI_GOVERNANCE.md |
| tenants permanece a conta operacional da Central de Clientes | docs/OPERATIONAL_CONTROL_PLANE_V1.md e contratos de grupos |
| Carteira de Customer Success é separada de grupo de marcas ou grupo econômico | docs/CUSTOMER_OPERATIONS_MIGRATION_DOMAIN_V1.md e migrations correspondentes |
| Escritas relevantes passam por RPCs ou comandos reais e deixam trilha quando aplicável | contratos backend, migrations e estratégias de auditoria |

## Comportamentos observados

- o produto possui superfícies internas, Portal do cliente e release surface
  controlado;
- Analytics, Support, Knowledge, Administração, Central de Clientes, CS,
  integrações e documentos internos coexistem no monorepo;
- o navegador usa o cliente Supabase para consumir views/read models e chamar RPCs
  existentes;
- o domínio Customer Operations V1 prepara fontes, lojas, inventário, projetos,
  elegibilidade, aprovação e validação sem executar migração externa;
- o estado do produto pode conter funcionalidade desenvolvida aguardando UI,
  autorização ou publicação.

Comportamento observado não deve ser promovido a regra de produto sem evidência
adicional ou decisão do proprietário.

## Decisões ainda não documentadas

- critérios operacionais finais para publicar superfícies que permanecem fora do
  release surface;
- prioridade de evolução entre os domínios prontos aguardando UI ou ativação;
- requisitos de negócio ausentes em qualquer tarefa concreta;
- política de release, merge ou deploy além dos gates documentados.

Para cada item sem fonte suficiente, registrar:

UNRESOLVED — requires project owner decision
