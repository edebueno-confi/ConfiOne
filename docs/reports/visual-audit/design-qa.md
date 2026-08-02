# Design QA — Dashboard e Integrações — 2026-08-02

## Escopo

- Visão Geral do Dashboard Gerencial: pulso limitado às fontes HubSpot e OMIE, redução de espaçamento vertical e alinhamento dos blocos ao frame das demais abas.
- Configurações > Integrações: campos editáveis de modo, ativação, recurso/escopo e substituição segura de credencial no Vault.
- Configurações > Dashboard e Analytics: uma cadência automática do ciclo completo e ações manuais separadas por fonte.

## Fontes visuais

- Visão Geral fornecida pelo usuário: `C:\Users\edebu\AppData\Local\Temp\codex-clipboard-62ad57f2-0ffb-4e76-ab24-7d64f7467f83.png` — 1899x1124.
- Comercial fornecida pelo usuário: `C:\Users\edebu\AppData\Local\Temp\codex-clipboard-5db65aa5-7820-4958-b15e-92cabfe4fec6.png` — 1904x1037.
- Suporte fornecida pelo usuário: `C:\Users\edebu\AppData\Local\Temp\codex-clipboard-ea734bde-dd93-4edd-983e-0653a7b91f65.png` — 1897x1033.

## Capturas da implementação

- Visão Geral atualizada: `C:\Projetos\GSO-old\docs\reports\visual-audit\screenshots\dashboard-overview-2026-08-02.png` — 1920x975, Chrome autenticado como QA Local Administrador, tema claro, `http://127.0.0.1:4173/admin/analytics?tab=ceo`.
- Integrações atualizada: `C:\Projetos\GSO-old\docs\reports\visual-audit\screenshots\integrations-2026-08-02.png` — 1920x975, Chrome autenticado como QA Local Administrador, tema claro, `http://127.0.0.1:4173/admin/settings?section=analytics`.

## Comparação e achados

- P0: nenhum bloqueio visual observado na Visão Geral ou na tela de Integrações.
- P1: a Visão Geral mantém uma hierarquia executiva própria, mas agora usa a mesma cadência de espaçamento e o mesmo canvas horizontal das abas de domínio.
- P1: o pulso agora apresenta somente HubSpot e OMIE; Customer Success continua disponível como aba de domínio, mas não é apresentado como fonte separada.
- P1: o Customer Success autenticado entrou em estado de erro no ambiente observado porque o RPC `rpc_analytics_customer_success_snapshot` ainda não foi aplicado no banco. Isso é dependência de migração, não evidência de dado ausente ou falha visual.
- P2: a captura da implementação usa viewport 1920x975, diferente das imagens de referência. Não foi afirmada equivalência pixel a pixel.
- P2: os botões de salvar/sincronizar não foram acionados na captura para não criar alteração externa ou substituir credenciais sem uma ação específica de configuração.

## Interações e console

- Navegação autenticada observada em `/admin/analytics?tab=ceo`, `/admin/settings?section=analytics` e `/admin/analytics?tab=customer-success`.
- A tela de Integrações expôs os campos esperados e não exibiu valores de segredos existentes.
- Logs do navegador: nenhum erro ou aviso capturado na janela observada.
- Não houve reset, limpeza do banco, sincronização real, alteração de credencial ou disparo de cron.

## Iteração

1. Removido Customer Success do pulso e reduzida a altura/padding do canvas executivo.
2. Inserida configuração segura HubSpot/OMIE e substituída a cadência dupla por ciclo completo + ações manuais por fonte.
3. Capturadas as superfícies autenticadas e revisado o estado de erro do Customer Success.

final result: blocked

Motivo do bloqueio: a validação visual do estado de dados do Customer Success depende da aplicação da migration forward-only no banco autorizado; dimensões também não são idênticas às referências fornecidas.
