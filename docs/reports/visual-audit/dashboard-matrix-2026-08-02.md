# QA visual do Dashboard e Integrações — 2026-08-02

## Escopo

Captura autenticada local das seis superfícies publicadas em claro e escuro,
nos viewports 1440x900, 1024x768, 768x1024 e 390x844:

- Visão Geral;
- Comercial;
- Customer Success;
- Suporte & Chat;
- Financeiro;
- Configurações > Integrações.

As imagens estão em `docs/reports/visual-audit/screenshots/` com o padrão
`dashboard-{superficie}-{tema}-{viewport}-2026-08-02.png`. O manifesto técnico
da execução está em `dashboard-matrix-2026-08-02.json`.

## Evidência observada

- 48/48 capturas geradas.
- 48/48 capturas sem modal visível do Gênio sobre a superfície auditada.
- 48/48 sem overflow horizontal.
- 48/48 sem erros de console ou `pageerror`.
- 48/48 com o tema esperado aplicado; nos frames compactos o tema foi definido
  no estado inicial local da sessão porque o seletor fica recolhido/oculto.
- A tela de Integrações mostra somente HubSpot e OMIE; as fontes e credenciais
  não expõem valores secretos.

## Limitação técnica

O servidor usado foi o Vite de desenvolvimento isolado em `127.0.0.1:4180`.
O manifesto registrou 24 falhas de requisição para
`/src/features/admin-shell/AdminConsoleShell.tsx`, todas nos ciclos de
viewport `768px`. Como as páginas renderizaram, não houve `console.error` nem
`pageerror`, e a falha ocorre no carregamento de módulo do dev server durante
trocas rápidas de rota, a evidência visual é válida para layout, mas a rede
não deve ser classificada como totalmente validada. A confirmação pendente é
repetir a matriz em `web:preview` ou em um servidor empacotado.

Nenhuma ação de salvar configuração, substituir credencial, diagnóstico,
sincronização real ou scheduler foi disparada.

## Resultado

`partially-validated`

Layout, responsividade, estados visuais e ausência de dados inventados foram
observados. A validação completa do carregamento de módulos em viewport
compacto permanece pendente do servidor empacotado.
