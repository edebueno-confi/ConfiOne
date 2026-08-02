# Regras de qualidade contextual

Use como mapa de investigação, não como checklist textual cego.

## SECURITY DEFINER

Aplicável a blocos de função em migrations SQL. Não reportar menções em comentários, testes ou documentação. `set search_path = ''` é conforme. `public`, `pg_temp`, grant amplo e SQL dinâmico exigem contexto; migration histórica corrigida depois deve ser marcada como `historical-fixed` quando comprovado.

## SELECT *

Ignorar pgTAP, fixtures, `exists(select *)`, inspeções e scripts de auditoria. Gerar candidato contextual em views públicas, RPCs, read models e contratos serializados; scripts operacionais recebem apenas sinal informativo quando houver custo potencial.

## Acesso direto a tabelas

- Frontend: candidato quando usa tabela interna sem view/RPC aprovada.
- Edge/backend: não marcar pela existência de `.from()`; exigir evidência adicional de dado sensível, service role e autorização ausente.
- Scripts e testes: classificar pela finalidade, sem tratar como frontend.

## Tipos, React e async

`any`, casts duplos, supressões TypeScript, HTML perigoso e catch vazio permanecem candidatos com camada e confiança. Estados, contratos, consumidores e observabilidade exigem confirmação semântica.

## Segurança e contratos

Auditar tenant scope, RLS, grants, RPCs, SQL dinâmico, service role, idempotência e retorno persistente. Backend/views/read models/RPCs são a fonte da verdade; frontend não inventa regra ou fallback.
