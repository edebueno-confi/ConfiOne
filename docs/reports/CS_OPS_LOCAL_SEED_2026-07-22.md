# Seed local da operação CS Ops — 2026-07-22

## Objetivo

Materializar no banco local a operação descrita na planilha `CS Ops _ Carteiras e Clusters -v2.xlsx`, sem exigir upload pela interface e sem escrever no HubSpot, OMIE ou qualquer ambiente remoto.

## Fonte e transformação

- Arquivo fonte: `C:\Users\edebu\Downloads\CS Ops _ Carteiras e Clusters -v2.xlsx`.
- Aba utilizada: `BD_Clientes`.
- Registros extraídos: 606.
- Foram usados os valores calculados da própria planilha para cluster, carteira, responsável, modelo, frequência, health e prioridade.
- A origem, linha da planilha, identificador do cliente, CNPJ e HubSpot ID ficam preservados no perfil operacional, assinatura, metadata do ticket e ação de CS.
- IDs determinísticos permitem reexecução sem duplicar registros.

## Dados materializados localmente

- 606 clientes/tenants.
- 606 perfis operacionais de cliente.
- 606 atribuições de cluster.
- 606 assinaturas locais do catálogo `after_sale_cs_ops`.
- 575 responsáveis de Customer Success identificados e vinculados.
- 606 tickets internos de acompanhamento.
- 606 ações de CS vinculadas aos tickets.
- Eventos e notas internas de seed para permitir teste de histórico sem simular comunicação externa.

## Execução

```powershell
npm run supabase:qa:local-cs-ops-fixture
```

O script aceita `CS_OPS_WORKBOOK` para apontar outro arquivo local e exige Supabase local com `SERVICE_ROLE_KEY` local. Não deve ser usado contra projeto remoto.

## Limites intencionais

- O seed não cria ou altera tickets no HubSpot.
- O seed não publica dados no OMIE ou HubSpot.
- A planilha é fonte de fixture local e proveniência; não passa a ser fonte operacional permanente.
- O vínculo de responsável é feito em assinatura, ticket e ação de CS. O cliente continua sem obrigação de possuir um único dono global.
- A separação completa entre grupo econômico, entidade legal e negócios HubSpot permanece como próximo contrato de domínio; este seed usa o modelo operacional atual sem cristalizar essa decisão.

## Validação

- Primeira execução concluída com 606/606 em todos os conjuntos principais.
- Segunda execução concluída com as mesmas contagens, confirmando idempotência.
- Nenhuma escrita externa foi executada.
- QA autenticado das telas Clientes B2B, Carteira CS, Tickets e Acionamentos e o proximo passo; a carga foi validada diretamente no banco local.

## Controles tecnicos do lote

- `npm run contracts:typecheck`: aprovado.
- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado no mesmo lote de implementacao.
- `node --check supabase/qa/create-local-cs-ops-fixture.mjs`: aprovado.
- `npm run repository:check-root`: aprovado apos classificar `.gitattributes` como configuracao legitima de raiz.
- `npm run documentation:validate:internal-docs`: concluido sem documentos bloqueados; alertas de token sao preexistentes.
- `npm run supabase:test:db`: 1.217 de 1.219 testes aprovados; duas falhas preexistentes em `004_phase1_2_function_audit.sql` por tres funcoes internas sem ACL explicita. Nenhuma delas e usada pelo seed.
