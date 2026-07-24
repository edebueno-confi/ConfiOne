# Implementação da visão CEO — 2026-07-18

## Entregue neste lote

- Criado `hubspot_companies`, cache server-side read-only para empresas,
  incluindo CNPJ, MRR, status de cliente, contrato e CSM.
- O sincronizador HubSpot agora atualiza empresas junto com owners, deals,
  estágios e tickets. O pipeline de Suporte continua somente leitura e não foi
  alterado.
- O RPC `rpc_analytics_ceo_snapshot` agora reconcilia títulos OMIE com empresas
  HubSpot por CNPJ ou nome exato e retorna:
  - alertas financeiros por cliente;
  - saldo, títulos e maior atraso;
  - empresa/CSM/contrato quando encontrados;
  - correspondência, confiança e ambiguidade;
  - cobertura de dados reconciliados e não reconciliados.
- A visão `/admin/analytics` ganhou KPI de clientes com alerta, qualidade da
  reconciliação e tabela de clientes com saldo vencido.
- Os alertas agora mostram o nome do CSM quando o owner está sincronizado e a
  visão executiva informa o horário da última carga financeira e do HubSpot.
- A planilha OMIE permanece compatível como fonte temporária; a API OMIE deverá
  alimentar o mesmo read model quando as credenciais forem configuradas.

## Regra de reconciliação

1. CNPJ normalizado;
2. nome normalizado e exato como fallback;
3. mais de uma candidata é sinalizada como ambígua;
4. ausência de correspondência permanece explícita;
5. nenhum status diferente de recebido é convertido automaticamente em
   inadimplência; cancelados e recebimentos parciais permanecem separados.

## Validação

- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado, com warning conhecido de chunk grande do
  Analytics.
- `npx supabase db lint`: aprovado, somente warnings preexistentes de variáveis
  `v_actor` não lidas.
- `npx supabase test db`: aprovado no estado local aplicado, 58 arquivos e 1.143
  testes.
- O teste de contrato `supabase/tests/056_analytics_ceo_risk_readmodel.sql`
  foi adicionado para a próxima aplicação completa das migrations.
- Segundo lote validado com `npm run web:typecheck`, `npm run web:build` e
  `npx supabase db lint`.
- Os testes Node existentes tiveram 30/31 aprovados; há uma falha preexistente
  em `minimal-navigation.test.mjs` relacionada à navegação `home`/`support-inbox`.

## Próximo passo operacional

Na segunda-feira, cadastrar as credenciais OMIE server-side, executar a primeira
sincronização read-only e comparar a resposta com o XLSX antes de promover a API
como fonte primária. Não versionar nem expor as credenciais.
