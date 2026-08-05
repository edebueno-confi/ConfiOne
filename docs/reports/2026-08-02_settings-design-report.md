# Design Report — Configurações e fontes do Dashboard

## Executive summary

Direção visual: **console operacional editorial**, com base neutra, azul de
ação e magenta reservado para a segunda fonte. A interface prioriza leitura e
decisão, não ornamentação: cada página tem uma intenção, uma hierarquia e um
conjunto curto de ações.

## Key findings

- O shell anterior carregava decisões de Analytics em Configurações.
- A tela de integração misturava credencial, agenda, pipeline, diagnóstico e
  histórico.
- O usuário precisava reconhecer detalhes técnicos para completar uma tarefa
  administrativa simples.
- O mobile sofria quando controles de fontes eram apresentados em tabelas largas.

## Implications

O design deve separar configuração sensível, proveniência e auditoria. Status
precisa ser factual: “Atualizada”, “Falhou”, “Ainda não atualizada” ou
“Indisponível”, sempre acompanhado de contexto quando possível.

## Direction

- Tipografia de leitura com títulos em escala responsiva.
- Eyebrow curto para orientar, nunca para substituir o título.
- Uma faixa de contexto por página.
- Cards somente quando representam uma fonte ou uma tarefa distinta.
- Bordas discretas, contraste alto, focus ring preservado e sem gradiente
  decorativo.
- Ações primárias com alvo mínimo de 44px e ações secundárias neutras.

## Component decisions

| Componente | Decisão | Motivo |
|---|---|---|
| Menu lateral | Único e controlado pela rota | Mantém orientação |
| Integração | Dois cards, HubSpot e OMIE | Separa fonte e credencial |
| OMIE | APP_KEY e APP_SECRET distintos | Evita erro de formato |
| Catálogo | Lista responsiva | Permite nome oficial, alias e classificação |
| Histórico | Grupo por ciclo/correlação | Evita misturar origens |
| Estado | Badge + texto | Não depende apenas de cor |

## Accessibility and responsive QA

Labels são explícitos, inputs têm descrição, controles usam elementos nativos,
focus-visible é herdado do sistema e a lista reduz para uma coluna em 760px.
QA empacotado cobriu 1440×900, 1024×768, 768×1024 e 390×844 em claro/escuro;
18 capturas e 6 checks adicionais foram aprovados.

## Rejected directions

- Reaproveitar a barra “Dashboard e Analytics”: duplicava informação.
- Mostrar “Modo: API”: controle sem decisão real.
- Manter formulário manual de pipeline como caminho principal: contradiz o
  catálogo descoberto pela API.
- Recriar a Visão Geral neste lote: violaria o escopo autorizado e impediria
  revisão visual incremental.

## Appendix — evidence

- Spec: `docs/spec.md`.
- Plan: `docs/plan.md`.
- QA: `output/settings-control-plane-v2-preview/manifest.json`.
- CSS: `apps/web/src/index.css` sob o namespace `gso-settings-*`.
