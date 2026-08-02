# Modelo de saída de auditoria

O formato Markdown segue `references/report-template.md`. A saída JSON opcional deve manter este contrato mínimo, sem secrets:

```json
{
  "summary": {
    "mode": "fast",
    "scope": "working tree",
    "risk": "unknown",
    "blockers": 0
  },
  "findings": [],
  "commands": [],
  "metrics": {
    "filesAnalyzed": 0,
    "patternCandidates": 0
  },
  "git": {
    "branch": "",
    "head": "",
    "dirty": false
  },
  "verdict": "não conclusivo"
}
```

Os valores são amostra. O relatório real deve informar limitações e não deve afirmar aprovação apenas por gates verdes.
