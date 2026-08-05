# Arquitetura e contratos do Genius Support OS

## Fonte canônica

Comece por `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/ARCHITECTURE_RULES.md`, `docs/VIEW_RPC_CONTRACTS.md`, `docs/AUTH_CONTEXT_STRATEGY.md`, `docs/AI_GOVERNANCE.md`, `docs/VALIDATION_CHECKLIST.md` e `docs/DOCUMENTATION_LEDGER.md`. Para UI, inclua `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`. Se houver conflito, o estado corrente e contratos reais prevalecem sobre histórico.

## Invariantes

- Backend, views/read models e RPCs são source of truth.
- Frontend não cria métricas, regra de negócio, contrato paralelo ou dado simulado.
- Dados ausentes são `Indisponível`/estado equivalente, nunca zero inventado.
- Todo dado operacional tem tenant/escopo explícito, RLS, permissão, auditoria e logs quando aplicável.
- `platform_admin` continua sujeito a auditoria.
- Allowlist/manifests não devem ser duplicados; módulos ocultos permanecem bloqueados.
- Contratos compartilhados prevalecem sobre tipos frontend locais.
- HubSpot/OMIE exigem idempotência, observabilidade e reconciliação.
- `SECURITY DEFINER` usa `set search_path = ''`; não execute `supabase db reset` sem autorização.
- Não exponha credenciais. Teste verde não substitui revisão de comportamento.
- UI pública é clara e institucional; UI interna suporta claro/escuro; alterações visuais exigem screenshot.

## Limites de auditoria

Não inferir RLS a partir de filtro visual. Não inferir contrato a partir de nome de variável. Não tratar seed/fixture como produção. Não abrir `.env` para entender uma integração; registre a ausência de credencial como limitação segura. Não executar integração real, migration remota, sync, deploy ou escrita externa durante auditoria read-only.
