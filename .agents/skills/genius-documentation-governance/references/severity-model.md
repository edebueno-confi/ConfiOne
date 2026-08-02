# Severidade documental

| Nível | Exemplos | Bloqueia |
|---|---|---|
| CRÍTICO | secret exposto, comando destrutivo incorreto, bypass de RLS, doc canônica orientando produção/checkout errado | sim |
| ALTO | fontes canônicas conflitantes, rota/permissão/contrato incorreto, integração declarada pronta sem evidência, comando inválido perigoso | normalmente sim |
| MÉDIO | duplicação relevante, doc stale, link quebrado, spec ausente, relatório sem classificação, falta de owner | depende do domínio |
| BAIXO | título, organização, clareza ou nomenclatura sem impacto | não |
| INFORMATIVO | índice futuro, oportunidade de consolidação ou metadado opcional | não |

Todo achado deve conter categoria, arquivo/linha, evidência, impacto, recomendação, confiança, proveniência, bloqueio de merge/release e falso positivo possível. Heurísticas automáticas são candidatos até revisão semântica.

