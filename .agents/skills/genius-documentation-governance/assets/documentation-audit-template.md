# Modelo de auditoria documental

Use `references/report-template.md` para a leitura humana. A saída JSON mínima é:

```json
{
  "summary": {"mode": "fast", "scope": "repository", "risk": "a avaliar", "blockers": 0},
  "documents": [],
  "conflicts": [],
  "duplicates": [],
  "drift": [],
  "missingDocumentation": [],
  "brokenLinks": [],
  "securityFindings": [],
  "proposedActions": [],
  "git": {"branch": "", "head": "", "dirty": false},
  "verdict": "não conclusivo"
}
```

Não incluir conteúdos secretos, dumps ou valores de tokens; apenas caminho, linha, regra e contagem.
