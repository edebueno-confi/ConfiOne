-- Papel de leitura restrita para o Dashboard Gerencial.

alter type public.platform_role add value if not exists 'dashboard_viewer';
