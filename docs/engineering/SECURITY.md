# ConfiOne, segurança observada

## Autenticação

O produto usa Supabase Auth. O frontend carrega contexto autenticado e aplica gates
de rota e superfície. A sessão visual não é fonte suficiente para autorizar
leituras ou escritas.

## Autorização

Autorização efetiva é composta por contexto de usuário, área, função, perfil,
capabilities, grants de tela, policies, RLS e validações de RPC. O backend deve
revalidar a ação, mesmo quando a interface já ocultou o controle.

## Isolamento de tenant

Dados operacionais devem possuir tenant_id ou equivalente explícito. Policies e
RPCs devem impedir leitura ou escrita cross-tenant. Seleção visual, URL, slug ou
filtro montado no cliente não são controles de segurança.

## RLS e banco

Tabelas expostas ao cliente devem possuir RLS coerente com o contrato. Funções
privilegiadas devem limitar ACL, definir search_path quando security definer e
evitar exposição de dados fora do escopo.

Testes pgTAP são a evidência mínima esperada para autorização, isolamento e regras
de banco introduzidas por um lote. A ausência de um teste não deve ser escondida
por um gate textual.

## Secrets e service roles

- secrets ficam server-side ou em secret store;
- valores não podem aparecer no frontend, PostgREST, logs, Git, fixtures ou
  relatórios;
- service_role não deve ser entregue ao browser;
- interfaces podem mostrar somente estado sanitizado, como configurado ou não
  configurado;
- nenhum agente deve copiar credenciais para documentação.

## Fronteiras cliente e servidor

O browser pode consumir contratos públicos para a sessão autorizada. Ações
privilegiadas, sincronizações e integrações com credencial devem ocorrer em
backend, RPC protegido ou Edge Function apropriada.

## Entrada, Storage e dados sensíveis

Entradas devem ser validadas por contratos e funções backend. Evidências e anexos
operacionais devem respeitar Storage privado, referências sanitizadas e autorização
do tenant. Dados indisponíveis não podem ser fabricados no frontend.

## Operações de risco

Exigem aprovação humana explícita:

- migration remota;
- deploy;
- escrita em massa em integração;
- alteração de secrets;
- reset destrutivo;
- alteração de RLS ou grants com ampliação de acesso;
- operação cross-tenant;
- envio externo ou operação com custo.

UNRESOLVED — requires project owner decision: inventário completo de todos os
ambientes remotos, secret stores e responsáveis operacionais não é determinável
somente pelo checkout local.
