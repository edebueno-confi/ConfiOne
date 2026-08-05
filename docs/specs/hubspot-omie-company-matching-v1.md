# Especificação — Matching HubSpot ↔ OMIE V1

Status: análise somente leitura; nenhuma aplicação automática de vínculo ou
merge é autorizada neste lote.

## Mapa do que já existe

| Camada | Evidência no repositório | Papel | Estado |
|---|---|---|---|
| Empresas | `public.hubspot_companies` | catálogo local de Company, nome, trade name, CNPJ e IDs | existente |
| Títulos | `public.analytics_finance_receivables` | fonte financeira; OMIE atual separado de históricos | existente |
| Normalização | `app_private.normalize_company_name(text)` e `regexp_replace(..., '[^0-9]', '', 'g')` | comparar sem alterar fonte | existente |
| Candidatos | `public.rpc_analytics_company_candidates(text,text,text)` | retorna até 10 candidatos por CNPJ/nome | existente, read-only |
| Reconciliação executiva | `rpc_analytics_ceo_reconciliation_quality` e variantes grouped | agregados de vínculo, ambiguidade e grupo | existente |
| Grupo econômico | `analytics_company_group_resolution` + migrations `20260719224000`, `20260719224101`, `20260719224214` | resolução humana de matriz/filial | existente, auditável |
| Fila financeira | `rpc_analytics_finance_unmatched_clients` | títulos sem vínculo / candidatos | existente; fonte OMIE-only no contrato novo |
| UI | fila de qualidade no Dashboard Gerencial | revisão e leitura de qualidade | existente; não aplica match automaticamente |
| Edge/scripts | funções de sync OMIE/HubSpot e scripts analytics | ingestão/normalização server-side | dependente de credencial para carga real |

## Normalização e identidade

1. CNPJ é comparado somente com dígitos; vazio não é chave.
2. CNPJ completo exato é sinal forte de entidade jurídica.
3. Raiz de CNPJ é sinal de possível grupo/filial, nunca identidade suficiente.
4. Nome e nome fantasia usam `normalize_company_name`, comparação por palavras e
   similaridade; são candidatos, não prova de identidade.
5. Fonte, ID externo, valor original, normalizados, método, score, versão,
   `observed_at` e revisão humana devem ser preservados.
6. Nenhum merge, update HubSpot ou vínculo financeiro é feito durante o
   dry-run.

## Hierarquia de sinais e classificação

| Classe | Sinal | Exemplo de `match_method` | Decisão automática |
|---|---|---|---|
| Exato | CNPJ completo igual e Company única no tenant | `cnpj_exato` | somente candidato forte; promoção exige política aprovada |
| Forte | combinação de CNPJ + nome/ID coerente | `cnpj_exato_nome_coerente` | fila de revisão/aceite humano |
| Provável | raiz de CNPJ ou nome normalizado/similaridade alta | `possivel_grupo_filial`, `nome_similar` | nunca escrita automática |
| Ambíguo | dois ou mais candidatos próximos ou CNPJ duplicado | `ambiguous` | fila humana obrigatória |
| Rejeitado | sem identificador, conflito de tenant ou sem evidência mínima | `rejected` | não vincular |

O score é analítico e versionado, não decisão de negócio. Uma implementação
futura deverá publicar `score`, `score_version`, `candidate_rank`, `signal_set`,
`threshold_class`, `reason`, `review_status`, `reviewed_by`, `reviewed_at` e
`rollback_key`. Thresholds só podem ser escolhidos após amostra revisada e
taxa de falso positivo acordada.

## Payload da análise dry-run

Por título, sem expor dados sensíveis no relatório:

`finance_id`, `source_system`, `source_record_id`, `source_client_name` apenas
no ambiente autorizado, `source_tax_id` mascarado na saída, `document_number`
mascarado, `candidate_count`, lista de `{company_id, candidate_name,
match_method, score, normalized_tax_id, normalized_name}`, `classification`,
`match_status`, `quality_status`, `observed_at`, `tenant_id` e `run_id`.

O relatório público desta análise usa apenas agregados: total de títulos,
com/sem CNPJ, candidato único, múltiplos, sem candidato, duplicidade de CNPJ,
valor por classificação e distribuição por fonte.

## Evidência local atual

Em 2026-08-02 havia 10.317 empresas HubSpot, 108 chaves normalizadas de CNPJ
duplicadas e zero linhas OMIE marcadas como atuais. Portanto não é possível
medir precisão/recall, calibrar threshold ou afirmar cobertura com o banco local.
Isso é limitação de evidência, não autorização para preencher vínculos.

## Fila humana e integridade

O registro `analytics_company_group_resolution` é protegido por RLS, leitura
para usuários autorizados e escrita de serviço; a resolução representa grupo
econômico, não substitui o vínculo jurídico. A fila futura precisa de:

- estado `new`, `in_review`, `accepted`, `rejected`, `superseded`;
- motivo obrigatório, evidência e revisão humana append-only;
- separação entre vínculo de título, associação Deal↔Company e grupo
  econômico;
- unicidade por tenant + fonte + ID externo + versão ativa;
- nenhum vínculo ativo para duas Companies sem resolução explícita;
- auditoria, rollback lógico, permissionamento e teste cross-tenant.

## Critérios de promoção

1. carga OMIE atual autorizada e análise agregada sem vazamento;
2. amostra revisada por humano, falsos positivos e thresholds documentados;
3. fila e ledger append-only disponíveis;
4. pgTAP de RLS/tenant/uniqueness e testes de contrato;
5. dry-run repetível e comparação entre execuções;
6. somente depois, migration/command de escrita com autorização explícita.
