# Configurações: arquitetura compartilhada e Histórico de sincronizações

Data: 2026-08-05
Branch: `codex/react-router-v8-migration-20260804`
Commit: `9746b24`

## 1. Arquitetura compartilhada

`apps/web/src/features/settings/settings-shell.css` passa a concentrar o que as
seis telas usam em comum:

| Classe | Papel |
| --- | --- |
| `.gso-settings-page` | ritmo vertical da tela |
| `.gso-settings-breadcrumb` | trilha `Configurações / <seção>` |
| `.gso-settings-nav-item` + `.gso-settings-nav-icon` | navegação local com ícone |
| `.gso-settings-metrics` / `.gso-settings-metric` | faixa de indicadores |
| `.gso-settings-toolbar` | barra de filtros |
| `.gso-settings-pagination` | rodapé de paginação |
| `.gso-settings-tone-*` | tons de estado fora do selo |

`SettingsPageHeader` ganhou o breadcrumb e passou a ser o cabeçalho das telas
recompostas. A faixa de indicadores saiu de `settings-integrations.css` para o
arquivo compartilhado, então Integrações e Histórico usam a mesma peça.

Ícones: `settings-nav-icons.tsx` desenha SVG inline (16px, traço 1.6,
`currentColor`), no padrão que a sidebar global já usava. **Nenhuma dependência
nova foi adicionada** — o projeto não tem biblioteca de ícones e não é hora de
introduzir uma.

## 2. Histórico de sincronizações

Antes: uma lista agrupada, sem filtro, sem indicadores e sem paginação.

Agora:

1. cabeçalho com breadcrumb, contagem de execuções carregadas, hora da leitura e
   ação `Atualizar`;
2. quatro filtros — período, fonte, resultado e gatilho — com efeito real;
3. faixa de cinco indicadores que **sempre reflete o recorte visível**;
4. lista agrupada por ciclo, com etapas, duração, registros lidos, mensagem de
   erro e correlação;
5. paginação cliente (10/25/50);
6. estados distintos para "nenhuma execução registrada neste ambiente" e
   "nenhuma execução corresponde aos filtros".

A regra saiu do componente para `history/sync-history-view.mjs` (puro):
`groupHistoryRows`, `resolveGroupStatus`, `statusBucket`, `filterHistoryGroups`,
`summarizeHistoryGroups`, `hasActiveHistoryFilters`, `paginate`.

Decisões de honestidade:

- `statusBucket` reduz os 11 status do backend a cinco baldes; ciclo com etapa
  falhada **nunca** aparece como concluído (`resolveGroupStatus` dá precedência a
  em andamento → falha → parcial).
- Início inválido não passa pelo recorte de período em vez de ser tratado como
  recente.
- O limite de 100 execuções da view fica escrito na tela.
- `Exportar` não foi implementado: não existe handler de exportação no projeto.
- Registros criados/atualizados não existem no read model — a tela mostra apenas
  `processedCount` (registros lidos).
- O instante do recorte é capturado na leitura, não durante o render, para o
  filtro ser estável.

## 3. Validação

| Comando | Resultado |
| --- | --- |
| `npm run web:typecheck` | pass |
| `npm run lint` | 0 erros, 181 avisos (sem regressão) |
| `npm run web:build` | pass |
| `npm run local:qa:secret-scan` | `{"tracked_files_scanned":1999,"matches":0,"secrets":false}` |
| `npm run quality:staged` | aprovado (1 candidato heurístico em doc antigo, não relacionado) |
| `node --test` history + integrations | 17/17 |
| contratos de Configurações/Dashboard/agrupamento | 28/28 |
| `npm run local:qa:smoke` | 5 personas, 0 erro de console, 0 request falho |

Cenário automatizado novo, com prova de que o filtro tem efeito:

```json
{"scenario":"settings-sync-history","viewport":"1920x1080","filters":4,"totalBefore":"29","totalAfterFailedFilter":"9"}
```

Captura: `output/local-qa/browser-platform_admin-settings-sync-history-1920.png`.

## 4. Pendências desta etapa

Telas ainda por recompor: Fontes do Dashboard, Marcas, Central de ajuda, Geral e
Usuários e acesso. Limitações já mapeadas no backend, que vão definir o desenho
de cada uma:

- **Marcas**: `public.brands` tem apenas `key`, `label`, `help_center_slug`,
  `sort_order`, `is_active`. Não existe logo, cor, idioma nem domínio nessa
  tabela, e não existe `updateBrand` — só criar e arquivar. Logo, idioma e
  domínio existem no eixo `knowledge_spaces` / `brand_settings`, sem FK para
  `brands`; contagem de artigos existe por espaço de conhecimento, não por marca.
- **Central de ajuda**: a única escrita disponível é `support_contacts` (cinco
  chaves) via `rpc_admin_update_knowledge_space_support_contacts`. Título,
  descrição, URL, idioma, SEO, busca, comentários e avaliação de artigo **não têm
  RPC de escrita** — `seo_defaults` e `theme_tokens` existem na tabela sem
  caminho de gravação.
- **Geral**: não existem configurações de organização, moeda ou fuso horário. O
  que é real e global: preferência de tema (por usuário), ambiente de runtime e
  os parâmetros operacionais já implementados.
- **Usuários e acesso**: `/admin/access` opera o eixo de tenant e não tem RPC de
  convite, reenvio, remoção de usuário nem auditoria por usuário. O eixo interno
  completo (áreas, funções, perfis, capabilities, overrides e convites com Edge
  Function) existe em `InternalControlPlanePage`, porém a tela está com
  `release_enabled = false` no `internal_screen_catalog` — publicá-la é decisão
  de produto sobre o escopo do release, não de frontend.
