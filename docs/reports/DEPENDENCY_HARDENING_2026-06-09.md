# Dependency Hardening - 2026-06-09

## Escopo

Correcao auditada dos tres advisories npm encontrados apos a recuperacao, sem
`npm audit fix --force` e sem atualizar dependencias fora da cadeia vulneravel.

## Alteracoes

- `react-router-dom`: `7.14.2` para `7.15.0`.
- `react-router`: resolvido em `7.15.0`.
- `@supabase/supabase-js`: `2.105.1` para `2.108.0`.
- A cadeia atual de `@supabase/realtime-js` deixou de instalar `ws@8.20.0`.

## Validacoes

- `npm audit --json`: zero vulnerabilidades.
- `npm run contracts:typecheck`: aprovado.
- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado.

## Limites

Tailwind, Tiptap, React, Vite e TypeScript nao foram atualizados porque nao
participavam dos advisories deste lote.
