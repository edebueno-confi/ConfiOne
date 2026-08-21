# Archived Task

## Task ID

COMMERCIAL-RECONCILIATION-2026-08-21

## Título

Reconciliar totais, perdidos e fechados

## Estado final

COMPLETED

## Objetivo

Reconciliar os totais comerciais, os registros perdidos e os registros fechados
no caminho executável atual, mantendo explícitas a fonte, a janela temporal, o
universo, os filtros, os nulos e a diferença entre movimento e estoque.

## Resultado

Sentinel aprovou a correção estrutural da RPC comercial. O snapshot passou a
separar coorte criada, posição atual aberta e coorte encerrada.

## Escopo e guardrails

- Corrigir somente divergências comprovadas no caminho atual.
- Adicionar testes comportamentais e contra-testes sem enfraquecer asserções.
- Preservar tenant isolation, RLS, autorização, auditoria e compatibilidade.
- Não alterar dados históricos para obter números esperados.
- Não alterar release surface, permissões, secrets, produção ou integrações
  remotas.

## Base e autorização

- Base commit SHA: `8d9e7da1c70d1aee8aad21e4e0896c3bf325d2d2`
- Implementation commit SHA: `0f603b7c1d15a5993634f118ab2f94f2574bc60e`
- Branch: `main`
- Approval: `APPROVED`
- Reviewer: Sentinel

## Arquivamento

Arquivado após `APPROVED` e integração local exclusiva. O finding proposto
`P-COMM-001` permanece fora do lote e não foi promovido a bloqueio.
