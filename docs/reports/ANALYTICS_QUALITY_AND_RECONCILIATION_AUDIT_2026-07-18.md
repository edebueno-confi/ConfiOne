# Auditoria de qualidade e reconciliação Analytics — 2026-07-18

## Diagnóstico

- O read model financeiro local contém 3.077 títulos da planilha exportada do
  OMIE.
- As migrations do modelo de risco estavam versionadas, mas ainda não haviam
  sido aplicadas ao banco local. Foram aplicadas sem reset e sem apagar dados.
- O banco agora possui `hubspot_companies`, porém o cache está com zero empresas
  porque o sincronizador HubSpot ainda não concluiu uma execução bem-sucedida.
- Consequentemente, a regra de reconciliação está disponível, mas não há dados
  HubSpot locais para formar os vínculos.

## Fluxo correto

1. sincronizador lê empresas e owners do HubSpot;
2. grava apenas o cache local read-only;
3. títulos OMIE da planilha são relacionados por CNPJ normalizado e, como
   fallback, nome exato normalizado;
4. correspondências ambíguas ou ausentes permanecem sinalizadas;
5. o dashboard lê o resultado do backend.

Nenhuma empresa é criada ou alterada no HubSpot por esse fluxo.

## Qualidade do código revisada

- O Worker `hubspot-sync` possui uma única entrada `Deno.serve` após a correção
  do erro de boot.
- O histórico de sincronização ganhou contagem de empresas e uma aba Logs no
  Dashboard Gerencial.
- A UI não calcula reconciliação, aging ou inadimplência; essas regras ficam no
  RPC executivo.
- RLS, grants e auditoria permanecem no cache de empresas.

## Validação

- `npx supabase migration up`: aplicado sem reset.
- Banco local: 3.077 títulos preservados; `hubspot_companies` criada e vazia.
- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado.
- `npx supabase db lint`: aprovado com warnings preexistentes de `v_actor`.
- `git diff --check`: aprovado nos arquivos do lote.
- O conjunto `npx supabase test db` ainda falha somente no teste 056 porque o
  runner de testes não está materializando as migrations 20260718100000/101000
  no banco de teste; o banco local corrente contém as estruturas. Não foi feito
  reset destrutivo para mascarar essa diferença.

## Pendência operacional

Executar uma sincronização HubSpot bem-sucedida. Depois disso, o mesmo dashboard
financeiro baseado na planilha passará a exibir os títulos vencidos vinculados às
empresas encontradas.
