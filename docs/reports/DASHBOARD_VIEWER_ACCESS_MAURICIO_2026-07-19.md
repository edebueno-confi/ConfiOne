# Acesso restrito do Dashboard — Mauricio Baum

## Escopo

O papel `dashboard_viewer` pode acessar somente:

- Dashboard operacional/gerencial;
- Configuracao da area do cliente;
- Central de ajuda, incluindo artigos.

O shell oculta as demais opcoes e o backend usa o mesmo papel para liberar a
leitura do read model do Dashboard. A sincronizacao HubSpot permanece
exclusiva de administradores.

## Vinculo por e-mail

O e-mail `mauricio.baum@confi.com.vc` foi registrado como concessao pendente.
Quando o auth user for criado pelo fluxo seguro de convite do ambiente, um
trigger aplica automaticamente `dashboard_viewer` ao perfil ativo.

Nao foi criada senha, token ou conta ficticia localmente. Isso evita credencial
hardcoded e preserva o fluxo de convite/autenticacao do Supabase.

## Validacao local

- O enum `platform_role` contem `dashboard_viewer`.
- A concessao por e-mail esta registrada em `app_private.dashboard_viewer_email_grants`.
- O papel possui acesso de leitura ao RPC do Dashboard.
- A conta autenticada ainda precisa ser criada pelo fluxo de convite.
