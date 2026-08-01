# RELEASE-02.6 — Hardening da superfície externa

## Escopo

Hardening direcionado e forward-only para o primeiro deploy. A matriz versionada em `supabase/security/external_surface_contract.json` define as superfícies públicas intencionais e mantém Knowledge, Portal, Analytics, Support e Admin separados por contrato.

## Correções aplicadas

- revogação de `anon` em RPCs administrativas e de suporte identificadas com execução externa indevida;
- revogação de `anon` e `authenticated` em `rls_auto_enable()` quando o objeto existir;
- revogação de `anon` nas cinco tabelas RLS sem policy;
- preservação explícita dos quatro read models autenticados de delivery;
- busca pública, assets aprovados e read models públicos preservados;
- nenhuma conversão em massa de views `SECURITY DEFINER`;
- nenhuma alteração destrutiva, seed, credencial, sincronização ou dado operacional.

## Estado local

- `supabase:db:reset` com todas as migrations: aprovado;
- suíte pgTAP local: aprovada, 82 arquivos e 1.333 testes;
- `npm run contracts:typecheck`: aprovado;
- `npm run web:typecheck`: aprovado;
- `npm run web:build`: aprovado;
- `repository:check-root`: aprovado;
- secret scan: aprovado, sem correspondências.

## Advisories e limites

O advisor ainda pode reportar views `SECURITY DEFINER` e funções autenticadas privilegiadas. Essas ocorrências são classificadas por contrato e não foram convertidas globalmente, pois a Central pública depende de read models owner-controlled e os demais módulos dependem de gates de ator, tenant e papel efetivo.

Proteção de senhas comprometidas do Auth continua sendo configuração de plataforma e não foi alterada neste lote.

## Operações não executadas

Nenhuma sincronização HubSpot/OMIE, nenhum schedule foi ativado, nenhum dado operacional foi fabricado e nenhum secret foi incluído. Deploy e migração remota permanecem sujeitos ao gate de segurança descrito no RELEASE-02.6.
