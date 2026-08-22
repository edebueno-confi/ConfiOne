# R2 Customer Data Foundation Audit

Task: `R2-CUSTOMER-DATA-FOUNDATION-2026-08-21`
Base SHA: `f73be1a3`
Implementation: `UNCOMMITTED_WORKTREE`
Escopo: auditoria local/read-only; a Central de Clientes R2 não foi publicada.

## Resultado executivo

A fundação local possui contratos e salvaguardas suficientes para orientar um
próximo lote, mas a prontidão externa permanece **não comprovada**. O modelo
canônico é `tenants` como conta operacional, com agrupamentos internos
separados e fontes externas registradas em `customer_account_sources`. O
relatório histórico de importação documenta 264 empresas After Sale V1, mas
essa evidência não deve ser tratada como estado atual do HubSpot nem como
equivalência com Genius, grupos econômicos, OMIE ou carteira de CS.

## Matriz factual

| Tema | Evidência local | Classificação | Limitação |
|---|---|---|---|
| Identidade canônica | `tenants`, `tenant_memberships`, `tenant_contacts`, `customer_account_profiles` e `customer_account_sources` | AVAILABLE_LOCALLY | Cobertura atual do portal externo não foi consultada |
| Cliente ativo HubSpot | Importador local filtra `e_cliente_aftersale_ = Sim` e registra `source_system=hubspot`, `source_product=after_sale` | HISTORICAL_LOCAL_EVIDENCE | Não comprova valor atual, cobertura total ou configuração remota |
| Importação segura | RPC administrativo, fonte registrada, IDs externos e ausência de escrita direta nas tabelas | CONTRACTED_LOCALLY | Execução HubSpot atual não foi repetida |
| Idempotência | Contrato/documentação usa `source_system + source_external_id` e snapshots/fingerprints | CONTRACTED_LOCALLY | Não foi feita nova importação nem chamada externa |
| Referências externas | `customer_account_sources`, `customer_account_stores` e `external_id` preservam origem/versionamento | AVAILABLE_LOCALLY | A existência e unicidade atuais fora do banco local não foram verificadas |
| Matching OMIE | Não há evidência local suficiente para equivalência automática entre cliente HubSpot e OMIE | NOT_PROVEN | Requer chave determinística aprovada e validação autorizada; fuzzy matching é proibido |
| Tenant e isolamento | Views/RPCs administrativos, RLS e testes locais; portal usa membership e tenant ativo backend-governed | AVAILABLE_LOCALLY | Não comprova cross-tenant em ambiente real |
| Deduplicação | Relatório histórico informa zero IDs externos duplicados no lote local | HISTORICAL_LOCAL_EVIDENCE | Não é garantia para novas cargas ou fontes diferentes |
| Ambiguidade/ausência | Estados `confirmed`/`inactive`, indisponível e separação de After Sale V1 de Genius | CONTRACTED_LOCALLY | Não inventar confirmação quando fonte estiver ausente ou conflitante |
| Proveniência | `source_system`, `source_product`, `source_version`, snapshot e metadados sem credencial | AVAILABLE_LOCALLY | Proveniência remota atual não validada |

## Salvaguardas

As fontes locais indicam uso de read models e RPCs administrativos, auditoria,
ator ativo, `platform_admin`, RLS e isolamento por tenant. O Portal customer
facing usa views tenant-aware e não deve receber enum técnico, provider,
metadata operacional ou segredo. A Central R2 deve reutilizar essas fontes e
não criar uma identidade, membership, carteira ou regra paralela.

Qualquer importação futura deve ser somente por pacote sanitizado e versionado,
com chave de idempotência, validação de cardinalidade, rejeição explícita de
duplicidade e estado de conflito. Matching com OMIE só pode ocorrer quando
existir chave determinística confirmada; nomes, domínio parcial ou similaridade
não podem produzir vínculo silencioso.

## Dependências e riscos

- Configuração, scopes, dados atuais e cobertura do HubSpot exigem ambiente
  autorizado e não foram acessados.
- A origem OMIE e sua chave de reconciliação não foram comprovadas neste lote.
- O relatório histórico registra apenas After Sale V1 e não autoriza inferir
  Genius, grupo econômico, marca, loja, produto contratado ou carteira CS.
- A criação da Central R2 depende de contrato de workspace separado e não foi
  implementada nesta task.
- O `NO-GO` externo da Release 1 permanece preservado.

## Gates

- `npm run docs:validate`: PASS, 0 documentos bloqueados; alertas históricos
  permaneceram somente como alertas.
- `npm run review:gates`: PASS, 0 regressões bloqueantes e 47 itens baseline
  resolvidos.
- `git diff --check`: PASS.

Nenhuma chamada ou escrita em HubSpot/OMIE, leitura de secrets, alteração de
credenciais, produção ou migration remota foi realizada.
