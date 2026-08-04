# Lote 2 da dívida de lint: imports mortos removidos e triagem completa

Data: 2026-08-04
Checkout canônico: `C:\Projetos\GSO-old`
Branch: `codex/react-router-v8-migration-20260804`
Lote anterior: `docs/reports/2026-08-04_lint-debt-lote-1-e-higiene-raiz.md`

## Resultado

| Indicador | Antes | Depois |
| --- | --- | --- |
| `npm run lint` | 0 erros, 240 avisos | 0 erros, **216** avisos |
| Specifiers de import mortos | 24 | 0 |

Acumulado das duas rodadas: 256 avisos para 216, sempre com 0 erros, sem afrouxar
regra, sem `eslint-disable` e sem alterar lógica, contrato, rota, permissão,
backend ou dado.

## O que foi feito

Classifiquei os 146 avisos de variável não usada por natureza, usando a saída
JSON do ESLint cruzada com os intervalos reais de cada declaração `import`:

| Natureza | Quantidade | Ação neste lote |
| --- | --- | --- |
| Specifier de import morto | 24 | removido |
| Declaração local morta | 118 | triado, não apagado |
| Prop ou parâmetro não usado | 4 | triado, não apagado |

Só a primeira categoria é mecanicamente segura: remover um nome de import não
altera execução, e a verificação foi feita por typecheck, build e lint. Antes de
aplicar, confirmei que nenhuma declaração `import` ficaria vazia, o que evitaria
remover por acidente um módulo com efeito colateral.

### Arquivos com import morto removido

| Arquivo | Specifiers removidos |
| --- | --- |
| `features/support/SupportWorkspacePage.tsx` | 21 |
| `app/router.tsx` | 1 (`LoadingState`) |
| `features/admin/CustomerPortalAdminPage.tsx` | 1 (`StatusPill`) |
| `features/knowledge/KnowledgePage.tsx` | 1 (`KNOWLEDGE_ARTICLE_REVIEW_STATUSES`) |

O volume em `SupportWorkspacePage.tsx` mostra o rastro de uma refatoração
anterior: componentes como `ContextSubsidebar`, `PageHeader`, `SummaryStrip`,
`WorkspaceSplit`, `QueueTicketItem`, `SupportHelpCenterPanel` e helpers como
`formatSlaDueLabel` continuavam importados sem nenhum uso na página.

## Distribuição atual dos avisos

| Regra | Avisos |
| --- | --- |
| `@typescript-eslint/no-unused-vars` | 121 |
| `react-hooks/rules-of-hooks` | 46 |
| `react-hooks/exhaustive-deps` | 27 |
| `react-refresh/only-export-components` | 19 |
| `jsx-a11y/no-autofocus` | 2 |
| `no-unused-vars` | 1 |
| **total** | **216** |

## Código declarado e nunca usado: triagem por arquivo

Cada item exige decisão explícita: apagar, religar à UI ou manter com justificativa.

### `src/features/knowledge/KnowledgePage.tsx` — 54 item(ns)

| Linha | Símbolo | Natureza |
| --- | --- | --- |
| 204 | `buildArticleForm` | componente ou função |
| 217 | `buildArticleFormFromEditorialDraft` | componente ou função |
| 247 | `toneForSpaceStatus` | componente ou função |
| 275 | `toneForReviewStatus` | componente ou função |
| 319 | `toneForAdvisoryClassification` | componente ou função |
| 337 | `displayAdvisoryClassification` | componente ou função |
| 409 | `displayArticleStatus` | componente ou função |
| 425 | `displayVisibility` | componente ou função |
| 437 | `humanizeRiskFlag` | componente ou função |
| 467 | `articleContributorNameFromDetail` | componente ou função |
| 475 | `formatOptionalDate` | componente ou função |
| 485 | `noticeTone` | componente ou função |
| 547 | `estimateReadingTime` | componente ou função |
| 740 | `setSelectedAuthor` | hook desestruturado |
| 741 | `setSelectedDateWindow` | declaração local |
| 746 | `detailPhase` | hook desestruturado |
| 747 | `detailMessage` | hook desestruturado |
| 749 | `articleAssets` | hook desestruturado |
| 750 | `assetActionSubmitting` | hook desestruturado |
| 752 | `detailTab` | hook desestruturado |
| 753 | `setStatusFilter` | hook desestruturado |
| 755 | `setOriginFilter` | hook desestruturado |
| 756 | `setDuplicateFilter` | hook desestruturado |
| 757 | `setClassificationFilter` | declaração local |
| 774 | `reviewAdvisorySubmitting` | hook desestruturado |
| 775 | `reviewAdvisoryMessage` | hook desestruturado |
| 779 | `selectedArticleSummary` | declaração local |
| 789 | `manualArticlesCount` | declaração local |
| 799 | `reviewedArticlesCount` | declaração local |
| 844 | `articleActionMessage` | declaração local |
| 880 | `publicPreviewHref` | declaração local |
| 884 | `publicPreviewMessage` | declaração local |
| 892 | `editorialPreviewTitle` | declaração local |
| 896 | `editorialPreviewBody` | declaração local |
| 903 | `canSubmitForReview` | declaração local |
| 912 | `canPublishArticle` | declaração local |
| 917 | `canPublishEditorialRevision` | declaração local |
| 925 | `persistedHumanChecklist` | declaração local |
| 926 | `advisoryRiskFlags` | declaração local |
| 927 | `selectedHumanConfirmationsCount` | declaração local |
| 930 | `statusCounts` | declaração local |
| 937 | `visibilityCounts` | declaração local |
| 949 | `visibleCategories` | declaração local |
| 952 | `availableAuthors` | declaração local |
| 1407 | `openEditArticle` | componente ou função |
| 1436 | `updateHumanConfirmation` | componente ou função |
| 1446 | `handleSaveReviewAdvisoryStatus` | prop ou parâmetro |
| 1486 | `handleMarkReviewAdvisoryReviewed` | prop ou parâmetro |
| 1669 | `handleSubmitForReview` | prop ou parâmetro |
| 1714 | `handlePublish` | prop ou parâmetro |
| 1759 | `handleArchive` | prop ou parâmetro |
| 1812 | `handlePublishEditorialRevision` | prop ou parâmetro |
| 1857 | `handleDiscardEditorialRevision` | prop ou parâmetro |
| 1904 | `handleUpdateAssetReview` | prop ou parâmetro |

### `src/features/support/SupportWorkspacePage.tsx` — 33 item(ns)

| Linha | Símbolo | Natureza |
| --- | --- | --- |
| 293 | `toneForSeverity` | componente ou função |
| 305 | `humanizeSlaPolicyScope` | componente ou função |
| 369 | `initialsFromSupportLabel` | componente ou função |
| 718 | `extractPublicArticleBasePath` | componente ou função |
| 906 | `toneForEngineeringWorkItemStatus` | componente ou função |
| 1780 | `SupportCustomerRail` | componente ou função |
| 2043 | `ticketMatchesInboxScope` | componente ou função |
| 2310 | `SupportTicketCustomerSnapshot` | componente ou função |
| 2425 | `SupportAccountContextOverview` | componente ou função |
| 2638 | `customerAccountContext` | declaração local |
| 2642 | `customerRecentEvents` | declaração local |
| 2650 | `attachmentPhase` | hook desestruturado |
| 2651 | `attachmentMessage` | hook desestruturado |
| 2653 | `attachmentDownloadingId` | hook desestruturado |
| 2659 | `engineeringMessage` | hook desestruturado |
| 2686 | `knowledgeMessage` | hook desestruturado |
| 2691 | `agentsPhase` | hook desestruturado |
| 2692 | `agentsMessage` | hook desestruturado |
| 3601 | `openAttachmentPicker` | componente ou função |
| 3606 | `handleDownloadAttachment` | prop ou parâmetro |
| 3795 | `handleOpenKnowledgeArticle` | componente ou função |
| 3808 | `handleUseArticleInReply` | componente ou função |
| 4534 | `handleUpdateClassification` | prop ou parâmetro |
| 4565 | `handleUpdatePrioritySeverity` | prop ou parâmetro |
| 4597 | `handleAssign` | prop ou parâmetro |
| 4657 | `handleClose` | prop ou parâmetro |
| 4687 | `handleReopen` | prop ou parâmetro |
| 4816 | `knowledgeBusy` | declaração local |
| 4975 | `primaryCustomerContact` | declaração local |
| 4981 | `pendingCloseItems` | declaração local |
| 6714 | `selectedRecentEventsWindow` | declaração local |
| 6882 | `totalCustomers` | declaração local |
| 7247 | `didBootstrapRef` | hook desestruturado |

### `src/features/admin/CustomerPortalAdminPage.tsx` — 13 item(ns)

| Linha | Símbolo | Natureza |
| --- | --- | --- |
| 95 | `roleHelper` | componente ou função |
| 149 | `entitlementStatusLabel` | componente ou função |
| 153 | `scopeLabel` | componente ou função |
| 157 | `membershipStatusLabel` | componente ou função |
| 347 | `TenantFilterCard` | componente ou função |
| 417 | `UserTableRow` | componente ou função |
| 566 | `ActionBlock` | componente ou função |
| 722 | `userDetail` | hook desestruturado |
| 986 | `visibleUsers` | hook desestruturado |
| 1247 | `handleUpdateUserRole` | prop ou parâmetro |
| 1265 | `handleUpdateUserStatus` | prop ou parâmetro |
| 1328 | `handleArchiveEntitlement` | prop ou parâmetro |
| 1365 | `handleUnlinkTicketKnowledgeLink` | prop ou parâmetro |

### `src/features/knowledge/KnowledgeArticleEditorPage.tsx` — 9 item(ns)

| Linha | Símbolo | Natureza |
| --- | --- | --- |
| 159 | `formatFileSize` | componente ou função |
| 171 | `visibilityLabel` | componente ou função |
| 303 | `FormFieldLabel` | componente ou função |
| 581 | `calloutLabel` | componente ou função |
| 2577 | `LegacyRichTextArticleEditor` | componente ou função |
| 3757 | `saveButtonLabel` | declaração local |
| 3807 | `publicationChecklistDone` | declaração local |
| 4256 | `handleRemoveAssetReference` | componente ou função |
| 4660 | `handleInsertAsset` | componente ou função |

### `src/features/access/AccessPage.tsx` — 2 item(ns)

| Linha | Símbolo | Natureza |
| --- | --- | --- |
| 161 | `situationLabel` | componente ou função |
| 173 | `toneForSituation` | componente ou função |

### `src/features/access/InternalControlPlanePage.tsx` — 2 item(ns)

| Linha | Símbolo | Natureza |
| --- | --- | --- |
| 221 | `onRefresh` | declaração local |
| 299 | `PermissionsPanel` | componente ou função |

### `src/features/analytics/AnalyticsCommercialPage.tsx` — 1 item(ns)

| Linha | Símbolo | Natureza |
| --- | --- | --- |
| 184 | `CommercialPipelineScopeFilter` | componente ou função |

### `src/features/analytics/AnalyticsCsPage.tsx` — 1 item(ns)

| Linha | Símbolo | Natureza |
| --- | --- | --- |
| 142 | `PipelineScopeFilter` | componente ou função |

### `src/features/analytics/AnalyticsUnavailablePages.tsx` — 1 item(ns)

| Linha | Símbolo | Natureza |
| --- | --- | --- |
| 20 | `_props` | componente ou função |

### `src/features/analytics/analytics-api.ts` — 1 item(ns)

| Linha | Símbolo | Natureza |
| --- | --- | --- |
| 577 | `latestRun` | declaração local |

### `src/features/analytics/analytics-cs-control.mjs` — 1 item(ns)

| Linha | Símbolo | Natureza |
| --- | --- | --- |
| 5 | `latestRun` | componente ou função |

### `src/features/cs/CsPortfolioPage.tsx` — 1 item(ns)

| Linha | Símbolo | Natureza |
| --- | --- | --- |
| 138 | `CustomerListItem` | componente ou função |

### `src/features/customer-portal/CustomerPortalPage.tsx` — 1 item(ns)

| Linha | Símbolo | Natureza |
| --- | --- | --- |
| 1704 | `refresh` | declaração local |

### `src/features/navigation/minimal-navigation.ts` — 1 item(ns)

| Linha | Símbolo | Natureza |
| --- | --- | --- |
| 39 | `hasAnyRole` | componente ou função |

### `src/features/support/components/SupportTicketAdvancedContextPanels.tsx` — 1 item(ns)

| Linha | Símbolo | Natureza |
| --- | --- | --- |
| 841 | `handoffSubmitting` | prop ou parâmetro |

## Leitura da triagem

Três padrões explicam quase todo o resto:

1. **Feature meio ligada.** Setters de estado nunca chamados, como
   `setStatusFilter`, `setOriginFilter`, `setSelectedAuthor` e
   `setDuplicateFilter` em `KnowledgePage.tsx`, indicam filtros que existem em
   estado mas não têm controle na UI. Apagar o setter esconde a lacuna; o certo é
   decidir se o filtro entra ou sai do produto.
2. **Superfície legada preservada.** `LegacyRichTextArticleEditor`,
   `handleInsertAsset` e `handleRemoveAssetReference` no editor de conhecimento,
   `CustomerListItem` em CS e `PermissionsPanel` no Control Plane são blocos
   inteiros sem consumidor. São candidatos a remoção, mas a decisão é de produto.
3. **Helpers de apresentação órfãos.** Labels e funções de tom
   (`toneForSituation`, `displayVisibility`, `noticeTone`, `humanizeRiskFlag`)
   sobraram de telas reescritas. São o subconjunto de remoção mais barata e de
   menor risco para o próximo lote.

## Validações executadas

| Comando | Resultado |
| --- | --- |
| `npm run lint` | 0 erros, 216 avisos |
| `npm run web:typecheck` | pass |
| `npm run web:build` | pass |
| `npm run local:qa:secret-scan` | 1973 arquivos, 0 correspondências |
| `npm run quality:changed` | aprovado, 0 findings |
| `npm run repository:check-root` | OK |

QA no navegador: `4173/login`, `4173/help` e `4174/help/genius/articles`
renderizando sem erro de console. `app/router.tsx` foi alterado neste lote e é o
arquivo que monta todas as rotas, portanto a navegação real cobre a mudança.

## Limitações

- As telas de Suporte, Conhecimento, Admin e Analytics são autenticadas e não
  foram abertas no navegador por ausência de credencial autorizada. Para remoção
  de specifier de import, typecheck e build são cobertura adequada.
- Nenhuma declaração local, prop, componente ou handler foi apagado.
- Nenhum aviso de `react-hooks` foi tocado.
- Banco local preservado. Sem push, merge, reset, clean, rebase ou cherry-pick.
- Nenhum segredo, token, JWT, cookie ou service role key foi lido ou exposto.

## Próximo lote recomendado

1. Remover os helpers de apresentação órfãos, que são o subconjunto de menor
   risco da triagem, arquivo por arquivo com typecheck e build entre cada passo.
2. Decidir produto sobre os filtros meio ligados de `KnowledgePage.tsx`.
3. Decidir produto sobre `LegacyRichTextArticleEditor` e os handlers de anexo do
   editor de conhecimento.
4. Só depois atacar `rules-of-hooks` e `exhaustive-deps`, que exigem QA
   autenticado porque alteram comportamento.
