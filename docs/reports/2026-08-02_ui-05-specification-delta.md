# Relatório Delta — Especificação UI-05

## 1. Resumo executivo

A recomendação anterior foi revisada pelo Product Owner. A direção visual do
`UI-05` foi aprovada conceitualmente, mas o macro-lote combinado não foi
autorizado. Este ciclo corrige o planejamento, separa as frentes e registra a
especificação executável sem alterar produto.

## 2. Correções aplicadas à recomendação anterior

- `UI-05`, `DASHBOARD-05` e `DASHBOARD-06` não serão tratados como um único lote.
- A copy “O Gênio está tecendo a próxima visão” foi substituída pela copy
  aprovada, mais clara e menos figurativa.
- O Dashboard não será bloqueado sempre: com snapshot válido, a atualização é
  compacta e os dados anteriores permanecem visíveis.
- Erro, timeout e abandono encerram a animação; não existe loader infinito.
- A borda e o apoio oval do card serão removidos somente no micro-lote futuro
  autorizado; nenhuma alteração visual foi feita agora.

## 3. Separação de UI-05, DASHBOARD-05 e DASHBOARD-06

| Item | Natureza | Status | Ordem |
| --- | --- | --- | --- |
| `UI-05` | design system, motion, loading e feedback de sistema | aprovado conceitualmente; aguardando discovery e autorização de implementação | primeiro micro-lote visual |
| `DASHBOARD-05` | arquitetura visual, hierarquia executiva e catálogo de métricas | não autorizado | depois do catálogo de métricas e denominadores |
| `DASHBOARD-06` | contrato de dados, OMIE, status, snapshot e read model | backlog técnico | lote próprio de runtime/dados |

## 4. Regras de bloqueio

- Sem snapshot válido: overlay pode bloquear durante ciclo ativo ou publicação.
- Com snapshot válido: não bloquear; manter dados anteriores e status compacto.
- Falha com snapshot: manter dados e data disponíveis, com link para Histórico.
- Falha sem snapshot: encerrar animação e mostrar indisponibilidade honesta.

## 5. Estados

A especificação cobre `preparing`, `syncing_hubspot`, `syncing_omie`,
`publishing`, `succeeded`, `partial`, `failed`, `timed_out`, `abandoned` e
`unavailable`, definindo copy, movimento, interação, bloqueio e comportamento
com ou sem snapshot.

## 6. Copy

Copy aprovada e registrada na especificação:

- geral: **O Gênio está organizando os dados do painel**;
- HubSpot: **O Gênio está atualizando os dados do HubSpot**;
- OMIE: **O Gênio está organizando os dados financeiros do OMIE**;
- publicação: **O Gênio está finalizando a atualização**.

## 7. Motion

Voo discreto, flutuação vertical, pequena inclinação, halo controlado,
partículas moderadas, estrelas e rastro luminoso. Sem borda rígida, sem apoio
oval estático, sem rotação exagerada e preferindo `transform`/`opacity`.

## 8. Reduced motion

Remover voo, órbita e partículas em deslocamento; manter composição estática,
halo discreto e indicador textual equivalente.

## 9. Acessibilidade

O futuro lote deve definir `role`, `aria-live`, `aria-busy`, política de foco,
contraste, teclado e atualização de anúncio somente na mudança de etapa. Frames
e partículas não devem ser anunciados.

## 10. Performance

O futuro lote deve evitar reflow, animar somente propriedades compostas quando
possível, pausar quando a aba não estiver visível, limitar partículas e não
adicionar dependência pesada.

## 11. Backlog atualizado

- `UI-05`: micro-lote isolado, aprovado conceitualmente, aguardando conclusão do
  discovery HubSpot e aprovação visual após implementação piloto.
- `DASHBOARD-05`: não iniciar antes da decisão do denominador de CS e aprovação
  do catálogo de métricas executivas.
- `DASHBOARD-06`: mover para backlog técnico de runtime; não tratar como design.

## 12. Arquivos alterados

- `docs/specs/UI_05_GENIO_EM_ACAO_V1.md`;
- `docs/reports/2026-08-02_ui-05-specification-delta.md`;
- `docs/UI_REFACTOR_BACKLOG.md`;
- `docs/plan.md`;
- `docs/DOCUMENTATION_LEDGER.md`.

## 13. Commit

Será criado no máximo um commit documental local, conforme autorização do
Product Owner, sem `--no-verify` e sem push.

## 14. Estado Git final esperado

Checkout `C:\Projetos\GSO-old`, sem mudanças de produto. Alterações documentais
existentes serão preservadas; nenhuma operação destrutiva será executada.

## 15. Decisões pendentes

- concluir discovery HubSpot;
- decidir denominador de Customer Success;
- aprovar catálogo de métricas executivas;
- autorizar implementação isolada do `UI-05`;
- aprovar visualmente o micro-lote antes de iniciar `DASHBOARD-05`;
- tratar `DASHBOARD-06` em frente própria de runtime/dados.

## Condição de parada

Este ciclo termina na especificação e atualização documental. Não implementar
UI-05, não redesenhar Dashboard, não alterar contratos OMIE, não sincronizar,
não executar build, banco, navegador ou push.
