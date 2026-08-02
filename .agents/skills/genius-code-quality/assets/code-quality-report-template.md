# Modelo de saída de auditoria

O formato Markdown segue `references/report-template.md`. A saída JSON opcional deve manter este contrato, sem secrets:

```json
{
  "summary": {
    "mode": "fast",
    "scope": "working tree",
    "risk": "baixo",
    "blockers": 0,
    "verdict": "aprovado com observações"
  },
  "findings": [],
  "findingGroups": [],
  "commands": [],
  "metrics": {
    "filesAnalyzed": 0,
    "totalFindings": 0,
    "displayedFindings": 0,
    "omittedFindings": 0,
    "patternCandidates": 0,
    "probableFindings": 0,
    "confirmedFindings": 0
  },
  "truncation": {
    "total": 0,
    "displayed": 0,
    "omitted": 0,
    "rulesAffected": [],
    "canHideCritical": false
  },
  "git": {
    "branch": "",
    "head": "",
    "dirty": false,
    "baseComparison": "origin/main"
  },
  "verdict": "aprovado com observações"
}
```

Cada finding real deve conter camada, status contextual, aplicabilidade da regra e proveniência. O relatório deve informar limitações e nunca declarar aprovação apenas por gates verdes.
