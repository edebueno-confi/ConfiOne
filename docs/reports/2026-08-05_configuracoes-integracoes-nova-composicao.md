# Configurações → Integrações: nova composição

Data: 2026-08-05
Branch: `codex/react-router-v8-migration-20260804`
Escopo: apenas a seção Integrações do domínio de Configurações.

## 1. O que foi implementado

A tela passou de um par de cards soltos para a composição da referência:

1. **Cabeçalho de página** (`SettingsPageHeader`): eyebrow, título, contexto,
   metadado de leitura (última alteração registrada) e a ação `Atualizar estado`.
2. **Resumo** (`IntegrationsSummary`): integrações ativas, credenciais gravadas,
   última execução e estado geral.
3. **Cards por provedor** (`IntegrationProviderCard` + `HubSpotIntegrationForm`
   e `OmieIntegrationForm`): eyebrow de domínio, selo de credencial, formulário e
   metadados (`Credencial atualizada em`, `Última execução`, falha registrada).
4. **Rail de governança** (`IntegrationHealthRail` = `IntegrationSyncStatus` +
   `IntegrationSecuritySummary`).
5. **Faixa inferior** (`SettingsBenefitsFooter`).

A sidebar global (`MinimalAppShell`) e a navegação local de Configurações já
existiam e foram **reutilizadas**, não recriadas. O cabeçalho genérico da seção
deixou de ser renderizado para Integrações, para não duplicar o título.

## 2. Decisões de contrato

### 2.1 "Testar conexão" não existe no backend

Busca por `testConnection|test_connection|rpc_admin_test` no repositório: zero
ocorrências. Não há RPC, Edge Function ou handler de verificação de conexão sob
demanda.

Decisão: **não** inventar o botão e **não** reaproveitar `triggerHubspotSync` /
`triggerOmieSync` como se fosse teste de conexão — disparar uma carga real é uma
ação de outra tela (`Fontes do Dashboard`) e mascararia a diferença entre
"conectou" e "sincronizou". A tela declara a limitação no rail:

> Não existe verificação de conexão sob demanda nesta versão. Enquanto uma nova
> execução não acontece, o estado permanece o da última registrada.

A ação real oferecida é `Atualizar estado`, que relê o read model.

### 2.2 Não existe tela de políticas de segurança

Não há rota nem tela de políticas. O bloco de segurança do rail exibe **apenas
fatos verificáveis** na migration `20260718034735_managed_integrations_v1.sql`:

| Afirmação na tela | Evidência |
| --- | --- |
| A credencial fica em cofre no banco e não retorna para a tela | `vault.create_secret` / `vault.update_secret`; a tabela guarda `credential_secret_id`; a view expõe `credential_secret_id is not null as has_credentials` |
| Campo em branco mantém a credencial atual | `if nullif(trim(coalesce(p_secret, '')), '') is not null then ...` |
| A gravação recusa quem não tem acesso ao Dashboard Gerencial | `if not app_private.can_read_analytics() then raise exception 'Acesso negado.' using errcode = '42501'` |
| A data só avança quando uma nova credencial é gravada | `credential_updated_at` recebe `now()` apenas no ramo com segredo novo |

Nada de AES-256, rotação automática ou monitoramento ativo é afirmado. O rail
declara explicitamente que rotação e monitoramento não fazem parte desta versão.

### 2.3 O rail não vira um segundo histórico

O rail lê o **mesmo** read model dos cards (`vw_admin_managed_integrations`), sem
importar `analytics-api`. Ele aponta para `/admin/settings/sync-history`, que é a
tela dedicada. Isso preserva o contrato já registrado de que Integrações não
mistura fontes nem histórico, e o teste passou a assertar essa separação.

## 3. Segurança da credencial

- Os campos nascem vazios e são `type="password"` com `autoComplete="new-password"`.
- `secret` só entra no payload quando o operador digita algo; caso contrário vai
  `undefined` e o backend preserva o segredo gravado.
- Nenhum `console.*`, `localStorage` ou `sessionStorage` na tela.
- O card não recebe nem exibe valor de credencial — apenas indicadores.
- O contrato de gravação (`rpc_admin_upsert_managed_integration`) não foi alterado:
  OMIE continua `JSON.stringify({ app_key, app_secret })`, HubSpot continua token
  único, e o `config` de cada provedor permanece idêntico.

## 4. Arquivos

Novos:

- `apps/web/src/features/settings/SettingsPageHeader.tsx`
- `apps/web/src/features/settings/settings-page-header.css`
- `apps/web/src/features/settings/integrations/IntegrationsSummary.tsx`
- `apps/web/src/features/settings/integrations/IntegrationProviderCard.tsx`
- `apps/web/src/features/settings/integrations/IntegrationHealthRail.tsx`
- `apps/web/src/features/settings/integrations/IntegrationSyncStatus.tsx`
- `apps/web/src/features/settings/integrations/IntegrationSecuritySummary.tsx`
- `apps/web/src/features/settings/integrations/SettingsBenefitsFooter.tsx`
- `apps/web/src/features/settings/integrations/integration-health.mjs`
- `apps/web/src/features/settings/integrations/integration-health.d.mts`
- `apps/web/src/features/settings/integrations/settings-integrations.css`
- `tests/scripts/settings-integrations-health.test.mjs`

Alterados:

- `apps/web/src/features/settings/SettingsIntegrationsPanel.tsx` (composição)
- `apps/web/src/features/settings/SettingsPage.tsx` (branch própria da seção e
  `onReloadIntegrations`)
- `tests/scripts/settings-sources-v2-contract.test.mjs` (dois contratos novos)
- `scripts/local-qa/browser-smoke.mjs` (cenário `settings-integrations`)

Nenhuma migration, RPC, view ou contrato de dados foi tocado.

## 5. Validação

| Comando | Resultado |
| --- | --- |
| `npm run web:typecheck` | pass |
| `npm run contracts:typecheck` | pass |
| `npm run lint` | 0 erros, 181 avisos (mesmo número de antes) |
| `npm run web:build` | pass |
| `npm run local:qa:secret-scan` | `{"tracked_files_scanned":1986,"matches":0,"secrets":false}` |
| `npm run quality:changed` | aprovado, 0 findings |
| `node --test tests/scripts/settings-integrations-health.test.mjs` | 7/7 |
| contratos de Configurações e Dashboard | 33/33 |
| `npm run local:qa:smoke` | 5 personas, 0 erro de console, 0 request falho |

Cenário automatizado novo:

```json
{"role":"platform_admin","scenario":"settings-integrations","viewport":"1920x1080","credentialFields":3,"credentialsPrefilled":false}
```

Capturas: `output/local-qa/browser-platform_admin-settings-integrations-1920.png`
(1920×1080) e `output/local-qa/browser-platform_admin-admin-settings-desktop.png`
(1440×900, cards empilhados com o rail preservado).

## 6. Limitações e pendências

- Verificação de conexão sob demanda: **indisponível** (não existe backend).
  Se for necessária, exige nova função no servidor — não é decisão de frontend.
- O ambiente local não tem execução registrada, então `Última execução` aparece
  como `Indisponível` e o estado geral como `Aguardando primeira execução`. Isso
  é o comportamento correto do estado vazio, não um dado ausente por falha.
- Restante do domínio de Configurações (Marcas, Central de ajuda, Fontes,
  Histórico) e a revisão da Central Pública seguem para o próximo lote.
