# Modelo de severidade

Severidade mede impacto operacional, não quantidade de linhas ou preferência pessoal.

| Severidade | Critério | Bloqueia merge/release |
|---|---|---|
| CRÍTICO | vulnerabilidade, vazamento, perda de dados, bypass de tenant/RLS, operação destrutiva, regra incorreta com impacto real ou escrita no destino errado | sim |
| ALTO | bug provável, contrato inconsistente, autorização incompleta, erro silencioso, race condition relevante, duplicação estrutural perigosa ou módulo inseguro de manter | normalmente sim |
| MÉDIO | complexidade, acoplamento, falta de teste, duplicação localizada, observabilidade insuficiente, documentação divergente ou acessibilidade relevante | depende do caminho afetado |
| BAIXO | legibilidade, nomenclatura, simplificação ou consistência não bloqueante | não |
| INFORMATIVO | oportunidade, recomendação futura, preferência técnica ou hipótese que exige medição | não |

Cada achado também deve registrar:

- confiança: `alta`, `média` ou `baixa`;
- proveniência: `introduzido`, `existente`, `herdado/indeterminado` ou `externo`;
- evidência: fato observável, comando/saída ou trecho preciso;
- falso positivo: `não`, `possível` ou `provável`;
- ação: correção recomendada e evidência que fecharia a incerteza.

Não promova um candidato estático a erro confirmado sem revisar contrato, contexto e consumidor.
